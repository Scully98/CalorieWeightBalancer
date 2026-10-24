// Local calendar day helpers. They move the calendar date instead of adding
// 24 hours, so results stay at local midnight across daylight saving changes.

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

// Whole calendar days from a to b; rounding absorbs daylight saving hours.
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

// ISO 8601 calendar week of the local day: weeks start on Monday, and week 1
// is the one with the year's first Thursday.
export function isoWeek(date: Date): { year: number; week: number } {
  const day = startOfDay(date);
  // Monday = 0 … Sunday = 6.
  const weekday = (day.getDay() + 6) % 7;
  const thursday = addDays(day, 3 - weekday);
  const year = thursday.getFullYear();
  const week = Math.floor(daysBetween(new Date(year, 0, 1), thursday) / 7) + 1;
  return { year, week };
}
