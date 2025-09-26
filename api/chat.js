// api/chat.js
import OpenAI from "openai";
import A1_SCHEDULE from "./schedule.js";
import FAQ from "./faq.js";

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

// ✅ Helper: check for FAQ match
function findFAQAnswer(message) {
  const lowerMsg = message.toLowerCase();
  for (const item of FAQ) {
    if (item.keywords.some(kw => lowerMsg.includes(kw))) {
      return item.answer;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "Missing 'message'" });
  }

  // ✅ Catch "weekly schedule" requests
  if (
    /schedule/i.test(message) &&
    !/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(message)
  ) {
    return res.status(200).json({ reply: formatFullSchedule(A1_SCHEDULE) });
  }

  // ✅ Check FAQ first
  const faqAnswer = findFAQAnswer(message);
  if (faqAnswer) {
    return res.status(200).json({ reply: faqAnswer });
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
`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices[0].message.content;
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: "AI request failed" });
  }
}
