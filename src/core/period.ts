import { addDays, daysBetween, startOfDay } from './dates';
import { fromDateKey, toDateKey } from './day-record';

export type PresetDays = 7 | 30 | 60 | 90;

export type Period =
  | { kind: 'days'; days: PresetDays }
  // Local calendar days, YYYY-MM-DD, both included.
  | { kind: 'custom'; from: string; to: string };

export type PeriodSegment = PresetDays | 'custom';

// The segments on the home screen, in order.
export const PERIOD_PRESETS: readonly PeriodSegment[] = [
  7,
  30,
  60,
  90,
  'custom',
];

export type PeriodOptions = {
  // Today is still running and left out unless switched on.
  includeToday?: boolean;
};

export type ResolvedPeriod = {
  // Local midnight of the first day.
  start: Date;
  days: number;
};

// Calendar days of a period. A preset is the given days up to yesterday; with
// `includeToday` today counts on top, so "30 days" then has 31. A custom period
// that ends yesterday or later does the same; one that ends earlier stays as
// it is.
export function resolvePeriod(
  period: Period,
  today: Date,
  { includeToday = false }: PeriodOptions = {},
): ResolvedPeriod {
  const midnight = startOfDay(today);
  const end = addDays(midnight, includeToday ? 1 : 0);
  const empty = { start: end, days: 0 };

  switch (period.kind) {
    case 'days': {
      const start = addDays(midnight, -period.days);
      return { start, days: daysBetween(start, end) };
    }
    case 'custom': {
      const from = fromDateKey(period.from);
      const to = fromDateKey(period.to);
      if (!from || !to) return empty;
      const [first, last] = from <= to ? [from, to] : [to, from];
      const stop = last >= addDays(midnight, -1) ? end : addDays(last, 1);
      return first < stop
        ? { start: first, days: daysBetween(first, stop) }
        : empty;
    }
  }
}

// One local date key per day of the period, oldest first. Steps by calendar
// day, so a 23- or 25-hour day never skips or repeats a key.
export function periodDateKeys({ start, days }: ResolvedPeriod): string[] {
  return Array.from({ length: days }, (_, offset) =>
    toDateKey(addDays(start, offset)),
  );
}
