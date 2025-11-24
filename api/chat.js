// api/chat.js — Minimal stable version (FAQ + schedule only, with CORS)

import A1_SCHEDULE from "./schedule.js";
import FAQ from "./faq.js";

export default async function handler(req, res) {
  // 🔥 CORS (needed for Squarespace widget)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const message = (body.message || "").toString();

  if (!message) {
    return res.status(400).json({ error: "Missing 'message'" });
  }

  try {
    const lower = message.toLowerCase();

    // 1️⃣ FAQ keyword match
    const faqMatch = FAQ.find((f) =>
      f.keywords.some((kw) => lower.includes(kw))
    );

    if (faqMatch) {
      return res.status(200).json({
        reply: faqMatch.answer,
      });
    }

    // 2️⃣ Schedule-related fallback
    if (lower.includes("schedule") || lower.includes("class")) {
      return res.status(200).json({
        reply:
          `Here’s our schedule 📅:\n\n${A1_SCHEDULE}\n\nWould you like to share your name, email, and phone so we can get you booked in?`,
      });
    }

    // 3️⃣ Default friendly greeting
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
