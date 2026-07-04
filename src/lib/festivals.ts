/**
 * Static Indian festival calendar with approximate windows.
 * Dates are illustrative — real production would sync a lunar calendar.
 */
export type Festival = {
  slug: string;
  name: string;
  emoji: string;
  /** Month-day window (MM-DD) — the AI treats anything within `windowDays` before start as "upcoming". */
  start: string;
  end: string;
  occasionSlug?: "birthday" | "anniversary" | "wedding" | "rakhi" | "diwali" | "corporate";
  keywords: string[];
};

export const festivals: Festival[] = [
  { slug: "new-year",       name: "New Year",         emoji: "🎉", start: "12-26", end: "01-02", keywords: ["new year", "celebration"] },
  { slug: "valentines-day", name: "Valentine's Day",  emoji: "💝", start: "02-07", end: "02-14", keywords: ["romantic", "couple", "her", "him"] },
  { slug: "womens-day",     name: "Women's Day",      emoji: "🌸", start: "03-03", end: "03-08", keywords: ["her", "women"] },
  { slug: "mothers-day",    name: "Mother's Day",     emoji: "🌷", start: "05-05", end: "05-12", keywords: ["mother", "parents", "her"] },
  { slug: "fathers-day",    name: "Father's Day",     emoji: "🎩", start: "06-14", end: "06-21", keywords: ["father", "parents", "him"] },
  { slug: "friendship-day", name: "Friendship Day",   emoji: "🤝", start: "07-30", end: "08-06", keywords: ["friend"] },
  { slug: "rakhi",          name: "Raksha Bandhan",   emoji: "🪢", start: "08-08", end: "08-19", occasionSlug: "rakhi", keywords: ["rakhi", "brother", "sister"] },
  { slug: "teachers-day",   name: "Teacher's Day",    emoji: "🎓", start: "08-30", end: "09-05", keywords: ["teacher"] },
  { slug: "diwali",         name: "Diwali",           emoji: "🪔", start: "10-20", end: "11-05", occasionSlug: "diwali", keywords: ["diwali", "festival", "sweets"] },
  { slug: "christmas",      name: "Christmas",        emoji: "🎄", start: "12-18", end: "12-25", keywords: ["christmas"] },
];

function toDate(mmdd: string, year: number): Date {
  const [m, d] = mmdd.split("-").map(Number);
  return new Date(year, m - 1, d);
}

export function upcomingFestival(now = new Date(), windowDays = 30): Festival | null {
  const year = now.getFullYear();
  for (const f of festivals) {
    let start = toDate(f.start, year);
    let end = toDate(f.end, year);
    // Handle wrap (e.g. New Year 12-26 -> 01-02)
    if (end < start) end = toDate(f.end, year + 1);
    if (now > end) continue;
    const daysUntilStart = (start.getTime() - now.getTime()) / 86_400_000;
    if (daysUntilStart <= windowDays) return f;
  }
  // Also check next year's first festival within window
  const first = festivals[0];
  const nextStart = toDate(first.start, year + 1);
  const days = (nextStart.getTime() - now.getTime()) / 86_400_000;
  if (days <= windowDays) return first;
  return null;
}

export function currentSeason(now = new Date()): "spring" | "summer" | "monsoon" | "autumn" | "winter" {
  const m = now.getMonth() + 1;
  if (m >= 3 && m <= 5) return "summer";
  if (m >= 6 && m <= 9) return "monsoon";
  if (m === 10 || m === 11) return "autumn";
  return "winter";
}
