// faq.js — A1 Performance Club Full FAQ (Updated Oct 2025)

const FAQ = [
  // 🏋️ Membership / Pricing
  {
    q: "group classes",
    keywords: ["group", "class", "classes", "group classes"],
    answer: "We offer flexible group class memberships — 1x, 2x, 3x per week, or *unlimited*! 💪 Right now, we’ve got a special promotion for unlimited group classes as part of our 💥 28-Day Transformation — a 4-week challenge built to help you reset your routine, build strength, and feel amazing!\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "membership cost",
    keywords: ["price", "pricing", "membership", "cost", "fee", "how much"],
    answer: "Memberships range from **$140/month – $399.99/month** depending on your plan. Our current promo: **unlimited group classes for $199.99 (28 days)** with the 28-Day Transformation challenge 💪.\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "free trial",
    keywords: ["free", "trial", "first class"],
    answer: "✅ Yes! Your **first class is completely free** — come try us out, no strings attached. Call or text 📞 **905-912-2582** to book your spot.\n\n➡️ Would you like to share your name, email, and phone so we can help you book your free class?"
  },
  {
    q: "drop in or class packs",
    keywords: ["drop in", "class pack", "package"],
    answer: "We don’t offer class packs, but you can **drop in for $35 per class** anytime! 💥\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "discounts",
    keywords: ["discount", "deal", "student", "corporate", "family", "refer"],
    answer: "Right now our 💥 **28-Day Transformation** promo is the best value at **$199.99 for 28 days**. Plus, if you **refer a friend** who signs up, you’ll *both* get **25% off** your next month 🎉.\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "cancellation refund policy",
    keywords: ["cancel", "refund", "policy", "buyout", "terminate"],
    answer: "We don’t offer refunds. For long-term memberships, early cancellation requires a **20% buy-out** of the remaining term.\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },

  // 📍 Location / Logistics
  {
    q: "location",
    keywords: ["where", "location", "address", "map"],
    answer: "📍 We’re located at **875 Main St W, Unit L1-11, Hamilton, Ontario** — just behind the main building. Look for the **A1 Performance Club** signs!\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "parking",
    keywords: ["parking", "car", "lot"],
    answer: "✅ Yes — there’s **tons of free parking** right outside the gym 🚗.\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "bus transit",
    keywords: ["bus", "transit", "public transport", "stop"],
    answer: "🚏 There’s a **bus stop right out front** on Main St W — super convenient if you’re coming by transit.\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "hours",
    keywords: ["hours", "open", "close", "time"],
    answer: "We run **group classes Monday – Sunday**, mornings and evenings 📅. For personal training, sessions are **by appointment** — just call or text 📞 **905-912-2582** to book.\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "amenities",
    keywords: ["showers", "locker", "change room", "washroom", "towel"],
    answer: "We have **lockers and change rooms** available for all members. (Showers coming soon 🚿)\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },

  // 🏃 Classes / Training
  {
    q: "types of classes",
    keywords: ["class type", "training", "program", "sweat", "sculpt"],
    answer: "We run a mix of **strength, conditioning, and sculpt-style group sessions** — designed to burn fat, build lean muscle, and boost performance. Our signature classes include *Sweat & Sculpt*, *Buns & Tums*, and the **28-Day Transformation** 🏋️‍♀️.\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "schedule",
    keywords: ["schedule", "timetable", "when", "class times"],
    answer: "We host **morning and evening group classes Monday – Sunday**, plus mid-day options on select days. Ask anytime and I can share today’s class lineup 📅.\n\n➡️ Would you like to share your name, email, and phone so we can help you book your first class?"
  },
  {
    q: "class size",
    keywords: ["how many", "capacity", "size", "limit", "spots"],
    answer: "We **cap every group class at 8 people** so you always get personalized coaching and space to train 👥.\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "personal training",
    keywords: ["personal training", "1 on 1", "pt", "private training"],
    answer: "Absolutely — 1-on-1 personal training is our **bread and butter** 💪. You’ll work directly with an A1 coach to hit your goals faster and safer.\n\n➡️ Would you like to share your name, email, and phone so we can help you set up a consultation?"
  },
  {
    q: "athletic development",
    keywords: ["athlete", "youth", "sports", "development", "performance"],
    answer: "Yes! We run **youth athletic development** programs focused on **speed, agility, power, and injury prevention** for hockey, football, track, and other athletes ⚡.\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "28 day transformation",
    keywords: ["28 day", "transformation", "challenge"],
    answer: "Our 💥 **28-Day Transformation** includes **unlimited group classes**, a **movement assessment**, and a **personalized macro-based nutrition guide** — all for **$199.99**. It’s the perfect way to build momentum and see real results in 4 weeks!\n\n➡️ Would you like to share your name, email, and phone so we can reserve your spot?"
  },

  // ⚡ Results / Experience
  {
    q: "results timeline",
    keywords: ["results", "progress", "see change", "timeline"],
    answer: "Most members start feeling stronger and more energized within a few weeks 💪. Everyone’s different — call or text 📞 **905-912-2582** and we’ll map out your timeline together.\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "beginner friendly",
    keywords: ["beginner", "new", "first time", "never worked out"],
    answer: "Not at all — **anyone can join!** Our coaches tailor every session so beginners and advanced members train confidently side-by-side 🙌.\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "nutrition",
    keywords: ["nutrition", "diet", "meal", "food", "macro"],
    answer: "Yes 🥗 we include a **macro-based nutrition guide** with all programs and can refer you to our **registered dietitian partner** for extra support.\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  },
  {
    q: "trainers qualifications",
    keywords: ["trainer", "coach", "staff", "who", "qualifications"],
    answer: "Our coaches are **certified movement specialists and strength & conditioning trainers** with years of experience in performance and transformation coaching. Check out our Coaches page or call/text 📞 **905-912-2582** to learn more!\n\n➡️ Would you like to share your name, email, and phone so we can help you get started?"
  }
];

// ✅ Debug helper for logging keyword matches
export function debugFAQMatch(userMessage) {
  const lowerMsg = userMessage.toLowerCase();
  for (const item of FAQ) {
    const matched = item.keywords.filter((kw) => lowerMsg.includes(kw));
    if (matched.length > 0) {
      console.log(`🔎 FAQ Debug → Q: "${item.q}" matched keywords:`, matched);
      return item.answer;
    }
  }
  return null;
}

export default FAQ;
