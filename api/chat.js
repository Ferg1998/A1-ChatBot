// api/chat.js
import OpenAI from "openai";
import { google } from "googleapis";
import Resend from "resend";
import { A1_SCHEDULE, listDay, listWeek, detectScheduleIntent } from "./schedule.js";
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
      range: "Sheet1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
    console.log("✅ Lead saved to Google Sheet");
  } catch (err) {
    console.error("❌ Google Sheets error:", err);
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
        <p><b>Name:</b> ${name || "-"}</p>
        <p><b>Email:</b> ${email || "-"}</p>
        <p><b>Phone:</b> ${phone || "-"}</p>
        <p><b>Message:</b> ${message || "-"}</p>
      `,
    });
    console.log("✅ Lead email sent");
  } catch (err) {
    console.error("❌ Email error:", err);
  }
}

// ✅ Helper: format full weekly schedule
function formatFullSchedule(schedule) {
  let reply = "📅 Weekly Class Schedule:\n";
  for (const [day, classes] of Object.entries(schedule)) {
    reply += `\n${day}:\n`;
    classes.forEach(c => {
      reply += `• ${c.time} (${c.length} min)\n`;
    });
  }
  reply += "\n➡️ Text 905-912-2582 to reserve your spot.\n\nDid I answer your question? (Yes/No)";
  return reply;
}

// ✅ Helper: parse messy input for contact info
function extractContactDetails(text) {
  const result = {};

  // Email
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) result.email = emailMatch[0];

  // Phone (7–15 digits, may include spaces, dashes, parentheses)
  const phoneMatch = text.match(/(\+?\d[\d\s().-]{7,}\d)/);
  if (phoneMatch) result.phone = phoneMatch[0];

  // Name (basic: looks for “I’m NAME” or “My name is NAME” or “This is NAME”)
  const nameMatch = text.match(/(?:i[' ]?m|my name is|this is)\s+([a-z][a-z\s'-]{1,40})/i);
  if (nameMatch) result.name = nameMatch[1].trim();

  return result;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, sessionId = "default" } = req.body || {};
  if (!message) return res.status(400).json({ error: "Missing 'message'" });

  // ✅ Initialize memory
  if (!conversationHistory[sessionId]) conversationHistory[sessionId] = [];
  conversationHistory[sessionId].push({ role: "user", content: message });

  // ✅ Lead capture detection
  if (/sign up|free trial|join|membership|personal training/i.test(message)) {
    console.log("📝 Lead intent detected");
    const reply = "Awesome! Can I get your **name, email, and phone number** so we can reserve your spot?";
    conversationHistory[sessionId].push({ role: "assistant", content: reply });
    return res.status(200).json({ reply });
  }

  // ✅ Try to extract lead details from messy text
  const contact = extractContactDetails(message);
  if (contact.email || contact.phone || contact.name) {
    console.log("📩 Lead details detected:", contact);

    const values = [
      new Date().toISOString(),
      contact.name || "Unknown",
      contact.email || "",
      contact.phone || "",
      "Lead via chatbot",
      message,
    ];

    // Save to Google Sheets
    await appendToSheet(values);

    // Send email
    await sendLeadEmail(contact.name, contact.email, contact.phone, message);

    const reply = "✅ Got it! Thanks — our team will reach out shortly. 🎉";
    conversationHistory[sessionId].push({ role: "assistant", content: reply });
    return res.status(200).json({ reply });
  }

  // ✅ Schedule (weekly or day-specific)
  const intent = detectScheduleIntent(message);
  if (intent.kind === "weekly") {
    const reply = formatFullSchedule(A1_SCHEDULE);
    conversationHistory[sessionId].push({ role: "assistant", content: reply });
    return res.status(200).json({ reply });
  }
  if (intent.kind === "day") {
    const reply = listDay(intent.day);
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
