// api/chat.js
import OpenAI from "openai";
import A1_SCHEDULE from "./schedule.js";
import FAQ, { debugFAQMatch } from "./faq.js";

// ✅ Helper: format full weekly schedule
function formatFullSchedule(schedule) {
  let reply = "Weekly Class Schedule:\n";
  for (const [day, classes] of Object.entries(schedule)) {
    const dayName = day.charAt(0).toUpperCase() + day.slice(1);
    reply += `\n${dayName}:\n`;
    classes.forEach(c => {
      reply += `• ${c.name} — ${c.time} (${c.length})\n`;
    });
  }
  return reply;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.error("❌ Invalid request method:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body || {};
  if (!message) {
    console.error("⚠️ Missing 'message' in request body:", req.body);
    return res.status(400).json({ error: "Missing 'message'" });
  }

  // ✅ Catch "weekly schedule" requests
  if (
    /schedule/i.test(message) &&
    !/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(message)
  ) {
    console.log("📅 Weekly schedule requested");
    return res.status(200).json({ reply: formatFullSchedule(A1_SCHEDULE) });
  }

  // ✅ Check FAQ first (with debug logging)
  const faqAnswer = debugFAQMatch(message);
  if (faqAnswer) {
    console.log("❓ FAQ response returned");
    const reply = `${faqAnswer}\n\nDid I answer your question?`;
    return res.status(200).json({ reply });
  }

  // ✅ Otherwise: Ask OpenAI, but inject rules + data
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const instructions = `
You are A1 Performance Club's assistant. Use ONLY the data provided.

SCHEDULE:
${JSON.stringify(A1_SCHEDULE, null, 2)}

FAQ:
${FAQ.map(f => `Q: ${f.q}\nA: ${f.answer}`).join("\n\n")}

Rules:
- If user asks "What’s on [day]?", list classes for that day like:
  [Day] Classes:
  • [Class] — [Time] ([Length])
- If they ask about "schedule" with no day, reply with the full weekly schedule above.
- Always check FAQ first for pricing, booking, cancellations, etc.
- Never invent info. If not in schedule/FAQ, reply: “Please text/call 905-912-2582 for details.”
- Keep answers under 120 words, friendly, and specific.
- If replying from FAQ or schedule, you may follow with: "Did I answer your question?"
`;

  try {
    console.log("🤖 Sending request to OpenAI with message:", message);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices[0].message.content;
    console.log("✅ OpenAI reply:", reply);

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("❌ OpenAI API error:", {
      message: error.message,
      stack: error.stack,
      status: error.status,
      response: error.response?.data
    });

    return res.status(500).json({
      error: "AI request failed",
      details: error.message
    });
  }
}
