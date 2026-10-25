import { chartBuckets, worstFlag, type WeekBucket } from '../chart';
import { addDays } from '../dates';
import type { DayBalance, DayFlag } from '../day-balance';
import { toDateKey } from '../day-record';

// A counted day: food 2,900, resting 1,800, active 800 → B = +300.
function day(date: Date, overrides: Partial<DayBalance> = {}): DayBalance {
  return {
    date: toDateKey(date),
    food: 2900,
    resting: 1800,
    restingSource: 'measured',
    active: 800,
    activeMissing: false,
    kcal: 300,
    maintenance: false,
    flags: [],
    ...overrides,
  };
}

// `count` days ending with `last`.
function period(count: number, last = new Date(2026, 9, 23)): DayBalance[] {
  return Array.from({ length: count }, (_, i) =>
    day(addDays(last, i - count + 1)),
  );
}

const weeks = (buckets: ReturnType<typeof chartBuckets>) =>
  buckets.filter((bucket): bucket is WeekBucket => bucket.kind === 'week');

describe('chartBuckets', () => {
  it.each([7, 30, 31])('has one day bar per day for %i days', (count) => {
    const buckets = chartBuckets(period(count));
    expect(buckets).toHaveLength(count);
    expect(buckets.every((bucket) => bucket.kind === 'day')).toBe(true);
  });

  it('switches to week bars from 32 days', () => {
    expect(
      chartBuckets(period(32)).every((bucket) => bucket.kind === 'week'),
    ).toBe(true);
  });

  it.each([0, 1, 2, 3, 4, 5, 6])(
    'has 13 or 14 week bars for 90 days ending %i days later',
    (shift) => {
      const buckets = chartBuckets(
        period(90, addDays(new Date(2026, 9, 19), shift)),
      );
      expect([13, 14]).toContain(buckets.length);
      expect(weeks(buckets)).toHaveLength(buckets.length);
      expect(buckets.reduce((sum, b) => sum + (b as WeekBucket).days, 0)).toBe(
        90,
      );
    },
  );

  it('joins a first week of one or two days to the next', () => {
    // Starts on Sunday 20 Sep 2026: one day of week 38.
    const sunday = weeks(chartBuckets(period(32, new Date(2026, 9, 21))));
    expect(sunday[0]).toMatchObject({
      from: '2026-09-20',
      to: '2026-09-27',
      days: 8,
      isoWeek: 39,
    });
    // Starts on Saturday: two days.
    const saturday = weeks(chartBuckets(period(33, new Date(2026, 9, 21))));
    expect(saturday[0].days).toBe(9);
    // Starts on Friday: three days stay a week of their own.
    const friday = weeks(chartBuckets(period(34, new Date(2026, 9, 21))));
    expect(friday[0]).toMatchObject({ days: 3, isoWeek: 38 });
  });

  it('averages the counted days of a week', () => {
    // Mon 5 – Sun 11 Oct 2026 as the second full week.
    const days = period(35, new Date(2026, 9, 25));
    const monday = days.findIndex((d) => d.date === '2026-10-05');
    days[monday] = day(new Date(2026, 9, 5), {
      food: undefined,
      kcal: 0,
      maintenance: true,
      flags: ['noFood'],
    });
    days[monday + 1] = day(new Date(2026, 9, 6), {
      resting: undefined,
      restingSource: 'missing',
      kcal: undefined,
      flags: ['noResting'],
    });
    days[monday + 2] = day(new Date(2026, 9, 7), {
      food: 1000,
      restingSource: 'formula',
      kcal: -1600,
      flags: ['restingEstimated', 'lowFood'],
    });
    const week = weeks(chartBuckets(days)).find((w) => w.from === '2026-10-05');
    expect(week).toMatchObject({
      days: 7,
      // (0 − 1,600 + 4 × 300) ÷ 6 counted days.
      avgKcal: expect.closeTo(-400 / 6),
      incompleteDays: 3,
      worst: 'lowFood',
    });
    // Zero day eats what it burns: (2,600 + 1,000 + 4 × 2,900) ÷ 6.
    expect(week?.avgFoodKcal).toBeCloseTo(15200 / 6);
    expect(week?.avgBurnKcal).toBeCloseTo(2600);
  });

  it('has no average for a week without counted days', () => {
    const days = period(32).map((d) => ({
      ...d,
      kcal: undefined,
      resting: undefined,
      flags: ['noResting'] as DayFlag[],
    }));
    expect(weeks(chartBuckets(days))[0].avgKcal).toBeUndefined();
  });

  it('counts measurements per week and marks measured days', () => {
    const days = period(32);
    const measured = days.map((_, i) => i % 2 === 0);
    const total = weeks(chartBuckets(days, { measured })).reduce(
      (sum, w) => sum + w.measurements,
      0,
    );
    expect(total).toBe(16);
    const daily = chartBuckets(period(7), { measured: [true] });
    expect(daily.map((b) => b.kind === 'day' && b.measured)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('appends the running day to day bars only, not counted', () => {
    const today = day(new Date(2026, 9, 24), { kcal: 40, running: true });
    const daily = chartBuckets(period(7), { today });
    expect(daily).toHaveLength(8);
    expect(daily[7]).toMatchObject({
      kind: 'day',
      today: { counted: false },
      kcal: 40,
    });
    expect(chartBuckets(period(60), { today }).some((b) => 'today' in b)).toBe(
      false,
    );
  });

  it('marks a counted running day as today', () => {
    const days = period(7);
    days[6] = { ...days[6], kcal: 40, running: true };
    const buckets = chartBuckets(days);
    expect(buckets[6]).toMatchObject({ today: { counted: true }, kcal: 40 });
    expect(buckets.slice(0, 6).some((b) => 'today' in b)).toBe(false);
  });

  it('carries the values of the day for the tooltip', () => {
    const days = period(2);
    days[1] = {
      ...days[1],
      resting: 1750,
      restingSource: 'formula',
      flags: ['restingEstimated'],
    };
    const [measured, estimated] = chartBuckets(days, {
      measured: [true, false],
      body: [{ weightKg: 82.1, fatKg: 17.8, leanKg: 64.3 }, {}],
    });
    expect(measured).toMatchObject({
      food: 2900,
      resting: 1800,
      restingSource: 'measured',
      active: 800,
      body: { weightKg: 82.1, fatKg: 17.8 },
    });
    expect(estimated).toMatchObject({
      resting: 1750,
      restingSource: 'formula',
      worst: 'restingEstimated',
    });
    expect('body' in estimated).toBe(false);
  });
});

describe('worstFlag', () => {
  it('ranks low food over no food over no resting over estimated', () => {
    expect(worstFlag(['restingEstimated', 'noResting'])).toBe('noResting');
    expect(worstFlag(['noResting', 'noFood'])).toBe('noFood');
    expect(worstFlag(['noFood', 'lowFood'])).toBe('lowFood');
    expect(worstFlag(['restingEstimated'])).toBe('restingEstimated');
    expect(worstFlag([])).toBeUndefined();
  });
});
