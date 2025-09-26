// api/schedule.js

// ✅ Full Weekly Schedule
const A1_SCHEDULE = {
  monday: [
    { name: "Sweat & Sculpt", time: "7:00 AM", length: 45 },
    { name: "Sweat & Sculpt", time: "5:00 PM", length: 45 },
  ],
  tuesday: [
    { name: "Sweat & Sculpt", time: "5:30 PM", length: 45 },
    { name: "Sweat & Sculpt", time: "6:30 PM", length: 45 },
  ],
  wednesday: [
    { name: "Sweat & Sculpt", time: "7:00 AM", length: 45 },
    { name: "Sweat & Sculpt", time: "12:00 PM", length: 45 },
  ],
  thursday: [
    { name: "Sweat & Sculpt", time: "5:30 PM", length: 45 },
    { name: "Sweat & Sculpt", time: "6:30 PM", length: 45 },
  ],
  friday: [
    { name: "Sweat & Sculpt", time: "5:00 AM", length: 45 },
  ],
  saturday: [
    { name: "Sweat & Sculpt", time: "9:00 AM", length: 45 },
    { name: "Sweat & Sculpt", time: "10:00 AM", length: 45 },
  ],
  sunday: [
    { name: "Sweat & Sculpt", time: "12:00 PM", length: 45 },
  ],
};

// ✅ List classes for a given day
export function listDay(day) {
  const d = day.toLowerCase();
  if (!A1_SCHEDULE[d]) return `No classes scheduled on ${day}.`;

  return `📅 ${d.charAt(0).toUpperCase() + d.slice(1)}:\n` +
    A1_SCHEDULE[d]
      .map(c => `• ${c.time} — ${c.name} (${c.length} min)`)
      .join("\n");
}

// ✅ List full week
export function listWeek() {
  return Object.entries(A1_SCHEDULE)
    .map(([day, classes]) =>
      `${day.charAt(0).toUpperCase() + day.slice(1)}:\n` +
      classes.map(c => `  • ${c.time} — ${c.name} (${c.length} min)`).join("\n")
    )
    .join("\n\n");
}

// ✅ Detect schedule intent from user message
export function detectScheduleIntent(msg) {
  msg = msg.toLowerCase();

  // Weekly schedule
  if (msg.includes("week")) {
    return { kind: "weekly" };
  }

  // Day-specific schedule
  for (const day of Object.keys(A1_SCHEDULE)) {
    if (msg.includes(day)) {
      return { kind: "day", day };
    }
  }

  return { kind: "none" };
}

export { A1_SCHEDULE };
export default A1_SCHEDULE;
