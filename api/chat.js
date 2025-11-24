// api/chat.js — A1 Chatbot with Memory + Lead Capture (no external APIs)

import A1_SCHEDULE from "./schedule.js";
import FAQ from "./faq.js";

// 🧠 In-memory sessions (per session_id)
const sessions = {};

// Simple lead extractor using regex + phrases
function extractLeadFromText(message) {
  const text = message.toLowerCase();

  // Email pattern
  const emailMatch = message.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );
  const email = emailMatch ? emailMatch[0] : null;

  // Phone pattern (very loose, but good enough)
  const phoneMatch = message.match(/(\+?\d[\d\s\-]{7,}\d)/);
  const phone = phoneMatch ? phoneMatch[0] : null;

  // Name pattern: "my name is X", "i'm X", "i am X"
  let name = null;
  const namePatterns = [
    /my name is\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
    /\bi'm\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
    /\bi am\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
  ];
  for (const re of namePatterns) {
    const m = message.match(re);
    if (m && m[1]) {
      name = m[1].trim();
      break;
    }
  }

  return { name, email, phone };
}

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
  const sessionId = (body.session_id || "anon").toString();

  if (!message) {
    return res.status(400).json({ error: "Missing 'message'" });
  }

  try {
    // 🧠 Get or create session
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        history: [],
        lead: { name: null, email: null, phone: null },
      };
    }
    const session = sessions[sessionId];

    // Save message in history
    session.history.push({
      role: "user",
      content: message,
      ts: Date.now(),
    });

    const lower = message.toLowerCase();

    // 1️⃣ Try to extract / update lead info from this message
    const found = extractLeadFromText(message);
    let leadUpdated = false;

    if (found.name && !session.lead.name) {
      session.lead.name = found.name;
      leadUpdated = true;
    }
    if (found.email && !session.lead.email) {
      session.lead.email = found.email;
      leadUpdated = true;
    }
    if (found.phone && !session.lead.phone) {
      session.lead.phone = found.phone;
      leadUpdated = true;
    }

    // If we have enough lead info, confirm capture
    if (leadUpdated && (session.lead.email || session.lead.phone)) {
      const name = session.lead.name || "there";
      const email = session.lead.email || "N/A";
      const phone = session.lead.phone || "N/A";

      // (Later we can add Google Sheet or email send here again)
      return res.status(200).json({
        reply: `Thanks ${name}! I’ve saved your info: ${email}, ${phone}. We’ll reach out to help you get started 💪`,
      });
    }

    // 2️⃣ FAQ keyword match
    const faqMatch = FAQ.find((f) =>
      f.keywords.some((kw) => lower.includes(kw))
    );

    if (faqMatch) {
      // Save assistant reply to memory as well
      session.history.push({
        role: "assistant",
        content: faqMatch.answer,
        ts: Date.now(),
      });

      return res.status(200).json({
        reply: faqMatch.answer,
      });
    }

    // 3️⃣ Schedule-related fallback
    if (lower.includes("schedule") || lower.includes("class")) {
      const reply =
        `Here’s our schedule 📅:\n\n${A1_SCHEDULE}\n\nWould you like to share your name, email, and phone so we can get you booked in?`;

      session.history.push({ role: "assistant", content: reply, ts: Date.now() });

      return res.status(200).json({ reply });
    }

    // 4️⃣ If they mention name/email/phone but not enough to save yet, prompt for rest
    if (
      lower.includes("name") ||
      lower.includes("email") ||
      lower.includes("phone")
    ) {
      const reply =
        "No problem! You can share your details like this:\n\n\"My name is Sarah, my email is sarah@example.com, and my phone is 289-555-1234\"";

      session.history.push({ role: "assistant", content: reply, ts: Date.now() });

      return res.status(200).json({ reply });
    }

    // 5️⃣ Default friendly greeting
    const greetings = [
      "Hey 👋 welcome to A1 Performance Club! Ask me about memberships, classes, or the 28-Day Transformation — or share your name, email, and phone so we can help you get started.",
      "Hi there 🙌 I can help with pricing, schedules, and our 28-Day Transformation. You can also send your name, email, and phone and we’ll follow up.",
      "Welcome to A1 Performance Club 💪 Ask me anything about group training or personal training — or drop your name, email, and phone to get started.",
    ];
    const reply = greetings[Math.floor(Math.random() * greetings.length)];

    session.history.push({ role: "assistant", content: reply, ts: Date.now() });

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ Chat handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
