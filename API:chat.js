import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing 'message'" });

    // Instruction so the bot stays on topic (tweak for your gym)
    const instructions = `
You are A1 Performance Club's website concierge. 
Answer only questions about classes, prices (speak in ranges), trials, schedule, location, and booking.
If off-topic, say: "I can help with A1 questions—want to book a trial?"
Keep answers under 120 words.`;

    const r = await client.responses.create({
      model: "gpt-4o-mini",        // great quality/cost balance
      instructions,
      input: [{ role: "user", content: message }]
    });

    // Unified text output helper
    const reply = r.output_text ?? "Sorry, I didn’t catch that—try again?";
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI request failed" });
  }
}
