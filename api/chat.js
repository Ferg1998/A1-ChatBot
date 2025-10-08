// api/chat.js — Final A1 Chatbot Version

import OpenAI from "openai";
import { google } from "googleapis";
import { Resend } from "resend";
import A1_SCHEDULE from "./schedule.js";
import FAQ from "./faq.js";

// ✅ Google Sheets setup
async function appendToSheet(values) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
    console.log("✅ Lead saved to Google Sheet:", values);
  } catch (err) {
    console.error("❌ Google Sheets error:", err);
  }
}

// ✅ Email setup (Resend)
const resend = new Resend(process.env.EMAIL_API_KEY);

async function sendLeadEmail(name, email, phone, message) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: "🔥 New Lead from A1 Chatbot",
      html: `
        <h2>New Lead Captured</h2>
        <p><b>Name:</b> ${name || "N/A"}</p>
        <p><b>Email:</b> ${email || "N/A"}</p>
        <p><b>Phone:</b> ${phone || "N/A"}</p>
        <p><b>Message:</b> ${message}</p>
      `,
    });
    console.log("✅ Lead email sent:", { name, email, phone });
  } catch (err) {
    console.error("❌ Email error:", err);
  }
}

// ✅ AI-powered lead extractor
async function extractLeadDetails(message) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
  Extract the person's full name, email, and phone number from this text.
  Return only valid JSON in the format:
  {"name": "...", "email": "...", "phone": "..."}
  If any field is missing, use null.
  Text: """${message}"""
  `;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content);
    return {
      name: parsed.name || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
    };
  } catch (err) {
    console.error("❌ Failed to parse AI response:", err);
    return { name: null, email: null, phone: null };
  }
}

// ✅ Main handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing 'message'" });
  }

  try {
    const lower = message.toLowerCase();

    // 1️⃣ Extract lead info (AI)
    const { name, email, phone } = await extractLeadDetails(message);
    console.log("📌 Parsed Lead:", { name, email, phone });

    // 2️⃣ If lead info found → save lead
    if (name || email || phone) {
      await appendToSheet([new Date().toISOString(), name, email, phone, message]);
      await sendLeadEmail(name, email, phone, message);

      return res.status(200).json({
        reply: `Thanks ${name || "there"}! I’ve saved your info: ${email || "N/A"}, ${phone || "N/A"}`,
      });
    }

    // 3️⃣ Try matching FAQ (using keyword search)
    const faqAnswer = FAQ.find((f) =>
      f.keywords.some((kw) => lower.includes(kw))
    );

    if (faqAnswer) {
      return res.status(200).json({
        reply: faqAnswer.answer,
      });
    }

    // 4️⃣ Schedule-related fallback
    if (lower.includes("schedule") || lower.includes("class")) {
      return res.status(200).json({
        reply: `Here’s our schedule 📅:\n\n${A1_SCHEDULE}\n\nWould you like to share your name, email, and phone so we can book you into a trial class?`,
      });
    }

    // 5️⃣ Default friendly greeting fallback
    const greetings = [
      "Hey 👋 welcome to A1 Performance Club! Can I grab your name, email, and phone to get you started?",
      "Hi there 🙌 we’d love to help you out! What’s your name, email, and phone so we can connect?",
      "Welcome to A1 Performance Club 💪 Drop your name, email, and phone number to get started!",
    ];
    const reply = greetings[Math.floor(Math.random() * greetings.length)];

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("❌ Chat handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
