import OpenAI from "openai";

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
Answer only about classes, schedule, trials, pricing ranges, and booking steps.
If off-topic, redirect back to A1 info. Keep answers under 120 words.`;

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
