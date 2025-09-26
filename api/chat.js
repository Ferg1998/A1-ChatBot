import OpenAI from "openai";
import A1_SCHEDULE from "./schedule.js";
import FAQ from "./faq.js";
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "Missing 'message'" });
    }

    const instructions = `
You are A1 Performance Club's website assistant.

Here is the official schedule and FAQs you must always use when answering:

SCHEDULE:
${JSON.stringify(A1_SCHEDULE, null, 2)}

FAQ:
${FAQ.map(f => `Q: ${f.q}\nA: ${f.answer}`).join("\n\n")}

Rules:
- When asked "What’s on [day]?", reply ONLY with the exact classes from the schedule.
- Format schedule answers like this:
  [Day] Classes:
  • [Class Name] — [Time] ([Length])
  • [Class Name] — [Time] ([Length])
- Never invent classes or times.
- Always use the FAQ answers for pricing, booking, policies, etc.
- If info isn’t in the schedule/FAQ, reply: “Please text/call 905-912-2582 for details.”
- Keep answers short, under 120 words, friendly, and specific.
`;
    const r = await client.responses.create({
      model: "gpt-4o-mini",
      instructions,
      input: [{ role: "user", content: message }]
    });

    // The OpenAI Node SDK returns `output_text` for quick access
    const reply = r.output_text ?? "Sorry, I didn’t catch that.";

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ reply });
  } catch (e) {
    console.error("API error:", e);
    res.status(500).json({ error: "AI request failed" });
  }
}
