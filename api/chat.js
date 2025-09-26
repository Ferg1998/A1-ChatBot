// api/chat.js
import OpenAI from "openai";
import { google } from "googleapis";
import { Resend } from "resend";
import A1_SCHEDULE from "./schedule.js";
import FAQ, { debugFAQMatch } from "./faq.js";

// Memory for conversations
let conversationHistory = {};

// ✅ Setup Google Sheets
async function appendToSheet(values) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:F", // ⚠️ change if your tab is not "Sheet1"
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
    console.log("✅ Lead saved to Google Sheet:", values);
  } catch (err) {
    console.error("❌ Google Sheets error:", err);
    throw err;
  }
}

// ✅ Setup Email
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
    throw err;
  }
}

// ✅ AI-powered lead parser
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

// ✅ Helper: format full weekly schedule
function formatFullSchedule(schedule) {
  let reply = "📅 Weekly Class Schedule:\n";
  for (const [day, classes] of Object.entries(schedule)) {
    const dayName = day.charAt(0).toUpperCase() + day.slice(1);
    reply += `\n${dayName}:\n`;
    classes.forEach(c => {
      reply += `• ${c.name} — ${c.time} (${c.length})\n`;
    });
  }
  reply += "\n➡️ Text 905-912-2582 to reserve your spot.\n\nDid I answer your question? (Yes/No)";
  return reply;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, sessionId = "default" } = req.body || {};
  if (!message) return res.status(400).json({ error: "Missing 'message'" });

  console.log("💬 Incoming message:", message);

  // ✅ Initialize memory
  if (!conversationHistory[sessionId]) conversationHistory[sessionId] = [];
  conversationHistory[sessionId].push({ role: "user", content: message });

  // ✅ Lead intent detection
  if (/sign up|free trial|join|membership|personal training/i.test(message)) {
    console.log("📝 Lead intent detected");
    const reply = "Awesome! Can I get your **name, email, and phone number** so we can reserve your spot?";
    conversationHistory[sessionId].push({ role: "assistant", content: reply });
    return res.status(200).json({ reply });
  }

  // ✅ If user provides details
  if (/\S+@\S+/.test(message) && /\d{7,}/.test(message)) {
    console.log("📩 Lead details detected in message");

    try {
      // Use AI parser
      const { name, email, phone } = await extractLeadDetails(message);
      console.log("👉 Parsed Lead:", { name, email, phone });

      await appendToSheet([new Date().toISOString(), name, email, phone, "Lead from chatbot", "Chatbot"]);
      await sendLeadEmail(name, email, phone, "Lead from chatbot");

      const reply = `✅ Got it! Thanks${name ? " " + name : ""} — our team will reach out shortly. 🎉`;
      conversationHistory[sessionId].push({ role: "assistant", content: reply });
      return res.status(200).json({ reply });
    } catch (err) {
      console.error("❌ Lead capture error:", err);
      return res.status(500).json({ error: "Lead capture failed" });
    }
  }

  // ✅ Weekly schedule
  if (/schedule/i.test(message)) {
    const reply = formatFullSchedule(A1_SCHEDULE);
    conversationHistory[sessionId].push({ role: "assistant", content: reply });
    return res.status(200).json({ reply });
  }

  // ✅ FAQ check
  const faqAnswer = debugFAQMatch(message);
  if (faqAnswer) {
    const reply = `${faqAnswer}\n\n➡️ Text 905-912-2582 to reserve.\n\nDid I answer your question? (Yes/No)`;
    conversationHistory[sessionId].push({ role: "assistant", content: reply });
    return res.status(200).json({ reply });
  }

  // ✅ AI fallback
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const instructions = `
You are A1 Performance Club's Assistant.
Use ONLY the provided schedule and FAQ.
Never invent info.
Keep answers <120 words.
Always end with: "➡️ Text 905-912-2582 to reserve.\n\nDid I answer your question? (Yes/No)".
`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: instructions },
        ...conversationHistory[sessionId],
        { role: "user", content: message },
      ],
    });
    const reply = completion.choices[0].message.content;
    conversationHistory[sessionId].push({ role: "assistant", content: reply });
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ OpenAI API error:", err);
    return res.status(500).json({ error: "AI request failed" });
  }
}
