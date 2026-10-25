import type { BodyValues } from './body';
import { isoWeek } from './dates';
import type { DayBalance, DayFlag } from './day-balance';
import { fromDateKey } from './day-record';
import type { RestingSource } from './resting';

// Up to this many days the chart has one bar per day, beyond one per week.
export const MAX_DAILY_BUCKETS = 31;

// A first calendar week with fewer days joins the next one.
export const MIN_FIRST_WEEK_DAYS = 3;

// Worst first, by how much a flag distorts the balance: low food counts fully
// as deficit, a day without food only as neutral.
export const FLAG_SEVERITY: readonly DayFlag[] = [
  'lowFood',
  'noFood',
  'noResting',
  'restingEstimated',
];

export type DayBucket = {
  kind: 'day';
  date: string;
  // B; undefined when the day doesn't count.
  kcal?: number;
  maintenance: boolean;
  flags: DayFlag[];
  worst?: DayFlag;
  measured: boolean;
  // Values of the day for the tooltip, as in DayBalance.
  food?: number;
  resting?: number;
  restingSource: RestingSource;
  active: number;
  // That day's measurement; only on days with one.
  body?: BodyValues;
  // The running day: counted as the last period day („Heute einrechnen“) or
  // appended after a period ending yesterday, shown but not counted.
  today?: { counted: boolean };
};

export type WeekBucket = {
  kind: 'week';
  isoWeek: number;
  // YYYY-MM-DD, both included.
  from: string;
  to: string;
  days: number;
  // Ø kcal per counted day; undefined without one.
  avgKcal?: number;
  // Per counted day with known burn; a zero day eats what it burns.
  avgFoodKcal?: number;
  avgBurnKcal?: number;
  incompleteDays: number;
  worst?: DayFlag;
  measurements: number;
};

export type ChartBucket = DayBucket | WeekBucket;

export type ChartBucketOptions = {
  // Per day: whether the scale measured weight that day.
  measured?: readonly boolean[];
  // Per day: weight, fat and lean mass of that day's measurement.
  body?: readonly BodyValues[];
  // The running day when the period ends yesterday; day bars only.
  today?: DayBalance;
};

export function worstFlag(flags: readonly DayFlag[]): DayFlag | undefined {
  return FLAG_SEVERITY.find((flag) => flags.includes(flag));
}

function dayBucket(
  day: DayBalance,
  measured: boolean,
  body: BodyValues | undefined,
): DayBucket {
  return {
    kind: 'day',
    date: day.date,
    kcal: day.kcal,
    maintenance: day.maintenance,
    flags: day.flags,
    worst: worstFlag(day.flags),
    measured,
    food: day.food,
    resting: day.resting,
    restingSource: day.restingSource,
    active: day.active,
    ...(body?.weightKg !== undefined && { body }),
    ...(day.running && { today: { counted: true } }),
  };
}

function average(values: number[]): number | undefined {
  return values.length === 0
    ? undefined
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function weekBucket(
  days: readonly DayBalance[],
  measured: readonly boolean[],
): WeekBucket {
  const counted = days.filter((day) => day.kcal !== undefined);
  const withBurn = counted.filter((day) => day.resting !== undefined);
  const burn = (day: DayBalance) => (day.resting as number) + day.active;
  const flags = days.flatMap((day) => day.flags);
  return {
    kind: 'week',
    // A merged short first week carries the number of the full one.
    isoWeek: isoWeek(fromDateKey(days[days.length - 1].date) as Date).week,
    from: days[0].date,
    to: days[days.length - 1].date,
    days: days.length,
    avgKcal: average(counted.map((day) => day.kcal as number)),
    avgFoodKcal: average(
      withBurn.map((day) => (day.maintenance ? burn(day) : (day.food ?? 0))),
    ),
    avgBurnKcal: average(withBurn.map(burn)),
    incompleteDays: days.filter((day) => day.flags.length > 0).length,
    worst: worstFlag(flags),
    measurements: measured.filter(Boolean).length,
  };
}

// Bars of the chart: one per day up to 31 days, else one per ISO calendar
// week as Ø kcal per day, with the worst flag of its days.
export function chartBuckets(
  days: readonly DayBalance[],
  { measured = [], body = [], today }: ChartBucketOptions = {},
): ChartBucket[] {
  const isMeasured = (index: number) => measured[index] ?? false;

  if (days.length <= MAX_DAILY_BUCKETS) {
    const buckets: ChartBucket[] = days.map((day, index) =>
      dayBucket(day, isMeasured(index), body[index]),
    );
    if (today)
      buckets.push({
        ...dayBucket(today, false, undefined),
        today: { counted: false },
      });
    return buckets;
  }

  const weeks: { days: DayBalance[]; measured: boolean[] }[] = [];
  let current: string | undefined;
  days.forEach((day, index) => {
    const { year, week } = isoWeek(fromDateKey(day.date) as Date);
    const key = `${year}-${week}`;
    if (key !== current) {
      weeks.push({ days: [], measured: [] });
      current = key;
    }
    weeks[weeks.length - 1].days.push(day);
    weeks[weeks.length - 1].measured.push(isMeasured(index));
  });
  if (weeks.length > 1 && weeks[0].days.length < MIN_FIRST_WEEK_DAYS) {
    const [first, second] = weeks.splice(0, 2);
    weeks.unshift({
      days: [...first.days, ...second.days],
      measured: [...first.measured, ...second.measured],
    });
  }
  return weeks.map((week) => weekBucket(week.days, week.measured));
}
