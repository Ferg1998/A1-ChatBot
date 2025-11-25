// api/chat.js — A1 Chatbot (Upgraded)
// Memory + Smart Lead Capture + Goals & Times + Google Sheets + Email + OpenAI Fallback

import { google } from "googleapis";
import { Resend } from "resend";
import A1_SCHEDULE from "./schedule.js";
import FAQ from "./faq.js";

// 🧠 In-memory sessions (per session_id)
const sessions = {};

// ✅ Google Sheets helper
async function appendToSheet(values) {
  try {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!serviceAccountJson || !sheetId) {
      console.warn(
        "⚠️ GOOGLE_SERVICE_ACCOUNT or GOOGLE_SHEET_ID missing. Skipping appendToSheet."
      );
      return;
    }

    const credentials = JSON.parse(serviceAccountJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Sheet1!A:H", // Timestamp, Name, Email, Phone, Goal, Preferred Time, Alt Time, Status
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });

    console.log("✅ Lead saved to Google Sheet:", values);
  } catch (err) {
    console.error("❌ Google Sheets error:", err);
    // never crash the function because of Sheets
  }
}

// ✅ Email helper (Resend)
async function sendLeadEmail(lead, sessionId) {
  try {
    const apiKey = process.env.EMAIL_API_KEY;
    const from = process.env.EMAIL_FROM;
    const to = process.env.EMAIL_TO;

    if (!apiKey || !from || !to) {
      console.warn(
        "⚠️ EMAIL_API_KEY, EMAIL_FROM, or EMAIL_TO missing. Skipping sendLeadEmail."
      );
      return;
    }

    const resend = new Resend(apiKey);
    const { name, email, phone, goal, preferredTime, altTime } = lead;

    await resend.emails.send({
      from,
      to,
      subject: "🔥 New Lead from A1 Chatbot",
      html: `
        <h2>New Lead Captured from A1 Chatbot</h2>
        <p><b>Name:</b> ${name || "N/A"}</p>
        <p><b>Email:</b> ${email || "N/A"}</p>
        <p><b>Phone:</b> ${phone || "N/A"}</p>
        <p><b>Goal:</b> ${goal || "N/A"}</p>
        <p><b>Preferred Time:</b> ${preferredTime || "N/A"}</p>
        <p><b>Alt Time:</b> ${altTime || "N/A"}</p>
        <p><b>Session ID:</b> ${sessionId || "N/A"}</p>
      `,
    });

    console.log("✅ Lead email sent:", { name, email, phone });
  } catch (err) {
    console.error("❌ Email error:", err);
    // keep bot alive even if email fails
  }
}

// 🔎 Smart lead extractor (handles messy one-line inputs)
function extractLeadFromText(message) {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const phoneRegex = /(\+?\d[\d\s\-\(\)]{7,}\d)/;

  const emailMatch = message.match(emailRegex);
  const phoneMatch = message.match(phoneRegex);

  const email = emailMatch ? emailMatch[0].trim() : null;
  // strip spaces/dashes/brackets but keep leading +
  const phone = phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, "") : null;

  // 1) Try phrase-based name first ("my name is", "I'm", "I am")
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

  // 2) If no name yet, infer from text before email / phone
  if (!name) {
    let before = "";

    if (emailMatch) {
      before = message.slice(0, emailMatch.index).trim();
    } else if (phoneMatch) {
      before = message.slice(0, phoneMatch.index).trim();
    }

    if (before) {
      // collapse multiple spaces and remove commas/pipes
      before = before.replace(/\s+/g, " ").replace(/[|,]/g, " ");
      const parts = before
        .split(" ")
        .filter((w) => /^[A-Za-z]+$/.test(w)); // only letter words

      if (parts.length >= 1) {
        // take first 1–2 words as name (e.g. "Sarah McKay")
        name = parts.slice(0, 2).join(" ");
      }
    }
  }

  // Clean up common junk like "my"
  if (name) {
    name = name
      .replace(/\b(my|email|is|name|phone)\b/gi, "")
      .trim()
      .replace(/\s+/g, " ");
    if (!name) name = null;
  }

  return { name, email, phone };
}

// 🧠 Helper: initialize session
function getOrCreateSession(sessionId) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      history: [],
      stage: "collect_contact", // collect_contact → ask_goal → ask_preferred_time → ask_alt_time → complete
      lead: {
        name: null,
        email: null,
        phone: null,
        goal: null,
        preferredTime: null,
        altTime: null,
      },
    };
  }
  return sessions[sessionId];
}

// 🤖 OpenAI fallback helper
const A1_SYSTEM_PROMPT = `
You are the friendly front-desk chatbot for A1 Performance Club, a small-group personal training gym in Hamilton, Ontario.

Your job:
- Greet visitors warmly and make them feel welcome.
- Help them understand what A1 does (small-group training, personal training, 28-Day Transformation, athlete development).
- Ask good questions to learn about their goals, training history, injuries, and schedule.
- Encourage them to share their name, email, and phone so a coach can follow up.
- Ask what time of day they prefer to train (mornings, evenings, or weekends) when relevant.
- Always keep answers short, clear, and conversational.

Tone:
- Friendly, human, and down-to-earth.
- No corporate speak.
- Use emojis lightly (1–2 per message max).

If the person is clearly just asking a factual question (e.g., "What is the 28-Day Transformation?"), answer that question clearly, then gently mention that they can share their name, email, and phone to get started if they want.
`.trim();

async function generateOpenAIReply(session, userMessage) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Missing OPENAI_API_KEY, skipping OpenAI fallback.");
    return null;
  }

  try {
    // Build short history for context
    const recentHistory = (session.history || [])
      .slice(-6)
      .map((h) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.content,
      }));

    const lead = session.lead || {};
    const stage = session.stage || "unknown";

    const contextSummary = `
Current stage: ${stage}
Lead so far:
- Name: ${lead.name || "unknown"}
- Email: ${lead.email || "unknown"}
- Phone: ${lead.phone || "unknown"}
- Goal: ${lead.goal || "unknown"}
- Preferred time: ${lead.preferredTime || "unknown"}
- Alt time: ${lead.altTime || "unknown"}
`.trim();

    const input = [
      { role: "system", content: A1_SYSTEM_PROMPT },
      { role: "system", content: contextSummary },
      ...recentHistory,
      { role: "user", content: userMessage },
    ];

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("❌ OpenAI error:", data);
      return null;
    }

    // Responses API output parsing
    let text = "";

    if (Array.isArray(data.output) && data.output.length > 0) {
      const first = data.output[0];
      if (first && Array.isArray(first.content)) {
        text = first.content
          .map((part) => (part?.text?.value ?? ""))
          .join("");
      }
    }

    if (!text && typeof data.output_text === "string") {
      text = data.output_text;
    }

    if (!text) {
      // If we truly got nothing, let outer code fall back to canned message
      return null;
    }

    return text.trim();
  } catch (err) {
    console.error("❌ OpenAI fallback error:", err);
    return null;
  }
}

// Rough check for “looks like a time/day”
// Used so we don't close the lead on questions like "what's the schedule?"
function looksLikeTimeOrDay(str) {
  const lower = str.toLowerCase();
  const timePattern =
    /\b(mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?|sun(day)?|\d{1,2}(:\d{2})?\s*(am|pm)?|morning|evening|afternoon|noon|night)\b/;
  return timePattern.test(lower);
}

export default async function handler(req, res) {
  // 🌐 CORS (for Squarespace widget)
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
    const session = getOrCreateSession(sessionId);

    // Save user message in history
    session.history.push({
      role: "user",
      content: message,
      ts: Date.now(),
    });

    const lower = message.toLowerCase();

    // 🔁 1) CONTACT COLLECTION STAGE
    if (session.stage === "collect_contact") {
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

      if (leadUpdated && (session.lead.email || session.lead.phone)) {
        // We have enough contact info → move to goals
        session.stage = "ask_goal";
        const nameForPrompt = session.lead.name || "there";
        const reply =
          `Thanks ${nameForPrompt}! Before we book you in, what’s your main goal right now?\n\n` +
          `1️⃣ Lose weight\n2️⃣ Build strength\n3️⃣ Improve energy & fitness\n4️⃣ Sports performance`;

        session.history.push({ role: "assistant", content: reply, ts: Date.now() });
        return res.status(200).json({ reply });
      }
    }

    // 🔁 2) GOAL STAGE
    if (session.stage === "ask_goal") {
      let goalText;
      const t = lower.trim();

      if (t.startsWith("1") || t.includes("lose")) {
        goalText = "Lose weight";
      } else if (t.startsWith("2") || t.includes("strength")) {
        goalText = "Build strength";
      } else if (t.startsWith("3") || t.includes("energy") || t.includes("fitness")) {
        goalText = "Improve energy & fitness";
      } else if (t.startsWith("4") || t.includes("sport")) {
        goalText = "Sports performance";
      } else {
        // fallback: just use their raw answer
        goalText = message.trim();
      }

      session.lead.goal = goalText;
      session.stage = "ask_preferred_time";

      const reply =
        `Awesome — ${goalText} 💪\n\n` +
        `What time of day usually works best for you: mornings, evenings, or weekends?`;

      session.history.push({ role: "assistant", content: reply, ts: Date.now() });
      return res.status(200).json({ reply });
    }

    // 🔁 3) PREFERRED TIME STAGE
    if (session.stage === "ask_preferred_time") {
      let pref = "Anytime";
      if (lower.includes("morn")) pref = "Morning";
      else if (lower.includes("even")) pref = "Evening";
      else if (lower.includes("weekend") || lower.includes("sat") || lower.includes("sun")) {
        pref = "Weekend";
      } else {
        pref = message.trim();
      }

      session.lead.preferredTime = pref;
      session.stage = "ask_alt_time";

      const reply =
        `Sweet! Is there a specific day/time this week that works best? ` +
        `For example: "Wed 7am" or "Sun 12pm".`;

      session.history.push({ role: "assistant", content: reply, ts: Date.now() });
      return res.status(200).json({ reply });
    }

    // 🔁 4) ALT TIME STAGE (FINALIZE LEAD)
    if (session.stage === "ask_alt_time") {
      // If they ask a question instead of giving a time, keep stage and clarify
      if (!looksLikeTimeOrDay(message)) {
        const clarify =
          `Totally get it! To lock you in, can you give me a specific day & time, like ` +
          `"Wed 7am" or "Sun 12pm"?`;
        session.history.push({ role: "assistant", content: clarify, ts: Date.now() });
        return res.status(200).json({ reply: clarify });
      }

      session.lead.altTime = message.trim();
      session.stage = "complete";

      const { name, email, phone, goal, preferredTime, altTime } = session.lead;
      const safeName = name || "there";

      // Write full lead row to Google Sheets
      await appendToSheet([
        new Date().toISOString(),
        name || "",
        email || "",
        phone || "",
        goal || "",
        preferredTime || "",
        altTime || "",
        "New Lead",
      ]);

      // Send email notification
      await sendLeadEmail(session.lead, sessionId);

      const reply =
        `Amazing, you’re all set ${safeName}! I’ll follow up to confirm your spot and next steps 💪`;

      session.history.push({ role: "assistant", content: reply, ts: Date.now() });
      return res.status(200).json({ reply });
    }

    // 🔁 From here on, either:
    // - stage is still "collect_contact" but no contact yet
    // - or stage is "complete" (lead already captured)
    // → normal FAQ + schedule behavior

    // 5️⃣ FAQ keyword match (add stronger schedule hooks)
    const augmentedFAQ = [
      ...FAQ,
      {
        keywords: ["evening class", "evening classes", "night classes"],
        answer:
          "Yes, we run evening group classes on multiple weeknights at A1 Performance Club. Most people train after work — if you tell me which days you’re free, I can help you pick the best times.",
      },
    ];

    const faqMatch = augmentedFAQ.find((f) =>
      f.keywords.some((kw) => lower.includes(kw))
    );

    if (faqMatch) {
      session.history.push({
        role: "assistant",
        content: faqMatch.answer,
        ts: Date.now(),
      });

      return res.status(200).json({
        reply: faqMatch.answer,
      });
    }

    // 6️⃣ Schedule-related fallback
    if (lower.includes("schedule") || lower.includes("class")) {
      const reply =
        `Here’s our schedule 📅:\n\n${A1_SCHEDULE}\n\n` +
        `If you’d like, you can also send your name, email, and phone and I’ll help you pick the best class.`;

