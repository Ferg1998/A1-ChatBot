// faq.js

const FAQ = [
  {
    q: "What classes do you offer?",
    keywords: ["classes", "class types", "offer"],
    answer:
      "We offer Sweat & Sculpt classes designed to build lean muscle, lose body fat, and gain strength. Classes use barbells, dumbbells, kettlebells, and cables."
  },
  {
    q: "Class length",
    keywords: ["how long", "duration", "length"],
    answer: "All classes are 45 minutes, including warm-up and cool-down."
  },
  {
    q: "Capacity / booking",
    keywords: ["capacity", "how many", "book", "reserve", "spots"],
    answer:
      "Each class is capped at 8 people with at least 2 coaches. Booking is required."
  },
  {
    q: "How to book",
    keywords: ["book", "sign up", "reserve", "schedule", "register"],
    answer:
      "For your first class, call or text 905-912-2582. After that, use our booking system."
  },
  {
    q: "Free trial",
    keywords: ["free", "trial", "first class"],
    answer:
      "Yes — your first class is free! Just call/text 905-912-2582 to reserve."
  },
  {
    q: "Pricing",
    keywords: ["price", "pricing", "cost", "membership", "drop-in", "fee"],
    answer:
      "Drop-in classes are $35. Membership ranges from $139.99–$399.99/month depending on frequency. Current deal: unlimited classes, 50% off for 4 weeks ($199.99 total)."
  },
  {
    q: "Cancellation policy",
    keywords: ["cancel", "cancellation", "late", "no show", "policy"],
    answer:
      "There is a $35 fee for late cancels/no-shows. Cancel at least 12 hours before class to avoid charges."
  },
  {
    q: "Location & parking",
    keywords: ["where", "location", "address", "parking", "map"],
    answer:
      "We’re located at 875 Main St W, Hamilton. Lots of free on-site parking available."
  },
  {
    q: "Contact",
    keywords: ["contact", "phone", "email", "number"],
    answer:
      "Call/text us at 905-912-2582. IG: @a1performanceclub."
  },
  {
    q: "Age limits / waivers",
    keywords: ["age", "waiver", "consent", "minimum"],
    answer:
      "We welcome all adults with no recent medical incidents. Waivers must be signed before participation."
  },
  {
    q: "Late policy",
    keywords: ["late", "cut off", "grace period"],
    answer:
      "Cancel within 12 hours to avoid charges. Booking closes 30 minutes before class starts."
  },
  {
    q: "Personal training",
    keywords: ["personal training", "pt", "1:1", "trainer"],
    answer:
      "We offer personal training at $60–$115/session depending on trainer and frequency. Book a consult for details."
  },
  {
    q: "Semi-private training",
    keywords: ["semi private", "small group", "partner training"],
    answer:
      "Available case-by-case. Call/text 905-912-2582 for details."
  },
  {
    q: "Amenities",
    keywords: ["amenities", "showers", "lockers", "towels", "change room"],
    answer:
      "We have lockers and washrooms/changerooms. No towel service provided."
  },
  {
    q: "Accessibility",
    keywords: ["stairs", "elevator", "wheelchair", "accessible", "ramp"],
    answer:
      "Accessibility details vary — contact us directly for assistance."
  },
  {
    q: "What to bring",
    keywords: ["bring", "wear", "gear", "equipment"],
    answer:
      "Bring indoor shoes, a towel, water, and arrive 15 minutes early."
  },
  {
    q: "Holidays/closures",
    keywords: ["holiday", "closed", "closure", "hours"],
    answer:
      "We’re open daily, based on class schedule and appointments."
  },
  {
    q: "Discounts",
    keywords: ["discount", "student", "military", "corporate", "deal"],
    answer:
      "Currently, no discounts are offered."
  },
  {
    q: "Waitlist",
    keywords: ["waitlist", "full class", "standby"],
    answer:
      "If a class is full, please contact us to be added to a waitlist."
  },
  {
    q: "Intro packs",
    keywords: ["intro", "first month", "deal", "starter"],
    answer:
      "We often run intro offers like our current unlimited group class deal. Contact us to check availability."
  }
];

// ✅ Debug helper for logging keyword matches
export function debugFAQMatch(userMessage) {
  const lowerMsg = userMessage.toLowerCase();
  for (const item of FAQ) {
    const matched = item.keywords.filter(kw => lowerMsg.includes(kw));
    if (matched.length > 0) {
      console.log(`🔎 FAQ Debug → Q: "${item.q}" matched keywords:`, matched);
      return item.answer;
    }
  }
  return null;
}

export default FAQ;
