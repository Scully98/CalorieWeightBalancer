import { fromDateKey } from './day-record';

export type PresetDays = 7 | 30 | 60 | 90;

export type Period =
  | { kind: 'days'; days: PresetDays }
  | { kind: 'all' }
  // Local calendar days, YYYY-MM-DD, both included.
  | { kind: 'custom'; from: string; to: string };

export type PeriodSegment = PresetDays | 'all' | 'custom';

// The segments on the home screen, in order.
export const PERIOD_PRESETS: readonly PeriodSegment[] = [
  7,
  30,
  60,
  90,
  'all',
  'custom',
];

export type PeriodOptions = {
  // Today is still running and left out unless switched on.
  includeToday?: boolean;
  // First day with Health data, for "all".
  firstDataDate?: Date;
};

export type ResolvedPeriod = {
  // Local midnight of the first day.
  start: Date;
  days: number;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

// Whole calendar days from a to b; rounding absorbs daylight saving hours.
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

// Calendar days of a period. Every period ends with yesterday, or with today
// when `includeToday` is on; "30 days" then means the 30 days up to today.
export function resolvePeriod(
  period: Period,
  today: Date,
  { includeToday = false, firstDataDate }: PeriodOptions = {},
): ResolvedPeriod {
  const end = addDays(startOfDay(today), includeToday ? 1 : 0);
  const empty = { start: end, days: 0 };

  switch (period.kind) {
    case 'days':
      return { start: addDays(end, -period.days), days: period.days };
    case 'all': {
      if (!firstDataDate) return empty;
      const start = startOfDay(firstDataDate);
      return start < end ? { start, days: daysBetween(start, end) } : empty;
    }
    case 'custom': {
      const from = fromDateKey(period.from);
      const to = fromDateKey(period.to);
      if (!from || !to) return empty;
      const [first, last] = from <= to ? [from, to] : [to, from];
      const stop = addDays(last, 1) < end ? addDays(last, 1) : end;
      return first < stop
        ? { start: first, days: daysBetween(first, stop) }
        : empty;
    }
  }
}
