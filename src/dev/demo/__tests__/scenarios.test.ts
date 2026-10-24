import { createDemoSource } from '../demo-source';
import { buildScenario, SCENARIO_IDS, type ScenarioId } from '../scenarios';
import { dayBalances } from '@/core/day-balance';
import type { DayRecord } from '@/core/day-record';
import { resolvePeriod } from '@/core/period';
import { periodBalance } from '@/core/period-balance';
import { DEFAULT_SETTINGS } from '@/core/settings';
import { loadBalance } from '@/features/balance/use-balance';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  BiologicalSex: { notSet: 0, female: 1, male: 2, other: 3 },
}));

jest.mock('@/storage/settings', () => ({ getProfile: () => ({}) }));

const NOW = new Date(2026, 9, 24, 14, 32);

// E of the design data, rounded to 100 as on the card.
const STORED_NORMAL30 = 4200;

async function periodDays(id: (typeof SCENARIO_IDS)[number], now = NOW) {
  const source = createDemoSource(id, now);
  const { start, days } = resolvePeriod(buildScenario(id).period, now);
  return source.days(start, days);
}

const withoutDates = (days: DayRecord[]) =>
  days.map(({ date, ...values }) => values);

describe('demo scenarios', () => {
  it('give the same numbers on any day, only the dates move', async () => {
    for (const id of SCENARIO_IDS) {
      const today = await periodDays(id, NOW);
      const later = await periodDays(id, new Date(2027, 1, 3, 9));
      expect(withoutDates(later)).toEqual(withoutDates(today));
      expect(later[later.length - 1].date).toBe('2027-02-02');
    }
  });

  it('match the design key figures for 30 days', async () => {
    const days = await periodDays('normal30');
    expect(days).toHaveLength(30);
    expect(days[29].date).toBe('2026-10-23');
    const burn = days.reduce(
      (sum, day) => sum + (day.resting ?? 0) + (day.active ?? 0),
      0,
    );
    expect(burn).toBe(80100);

    const daily = dayBalances(days, {
      zeroDaysAsMaintenance: true,
      profile: {},
    });
    const balance = periodBalance(daily, { foodPercent: 0, burnPercent: 0 });
    expect(balance.kcal).toBe(7000);
    expect(balance.completeDays).toBe(24);
    expect(balance.flagCounts).toEqual({
      restingEstimated: 3,
      noFood: 1,
      lowFood: 2,
      noResting: 0,
    });

    // Tolerance 1c: the zero day stays out of the sums, so the range is
    // narrower than in the hi-fi (+2,645 to +19,365).
    const { range } = periodBalance(daily, { foodPercent: 5, burnPercent: 10 });
    expect(range.min).toBeCloseTo(2771.4);
    expect(range.max).toBeCloseTo(18985.8);
  });

  it('give the last weight before a date', async () => {
    const source = createDemoSource('normal30', NOW);
    const days = await periodDays('normal30');
    const first = days.findIndex((day) => day.weightKg !== undefined);
    const weightBefore = await source.weightBefore(
      new Date(2026, 8, 24 + first + 1),
    );
    expect(weightBefore).toBe(days[first].weightKg);
    expect(
      await createDemoSource('empty', NOW).weightBefore(NOW),
    ).toBeUndefined();
  });
});

describe('demo scenarios through the balance load', () => {
  const load = (id: ScenarioId, now = NOW) =>
    loadBalance(
      createDemoSource(id, now),
      { ...DEFAULT_SETTINGS, period: buildScenario(id).period },
      now,
    );

  it('keep 7 days insufficient, with the measurements so far', async () => {
    const { analysis } = await load('short7');
    expect(analysis).toMatchObject({
      state: 'insufficient',
      days: 7,
      measurements: 4,
    });
  });

  it('give 13 or 14 week bars for 90 days on any weekday', async () => {
    for (let shift = 0; shift < 7; shift++) {
      const now = new Date(2026, 9, 24 + shift, 14);
      const { buckets } = (await load('long90', now)).chart;
      expect([13, 14]).toContain(buckets.length);
      expect(buckets.every((bucket) => bucket.kind === 'week')).toBe(true);
    }
  });

  it('show day bars with the running day for 30 days', async () => {
    const { buckets, lines } = (await load('normal30')).chart;
    expect(buckets).toHaveLength(31);
    expect(buckets[30]).toMatchObject({ kind: 'day', today: true });
    expect(lines.points).toHaveLength(30);
    expect(lines.points.every((point) => point.weightTrend !== undefined)).toBe(
      true,
    );
  });

  it('compare the weight only without body fat data', async () => {
    expect((await load('noBodyFat30')).analysis.state).toBe('weightOnly');
  });

  it('fit for the good-fit scenario and deviate for the design data', async () => {
    expect((await load('goodFit30')).analysis.state).toBe('ok');
    const { analysis } = await load('normal30');
    expect(analysis).toMatchObject({ state: 'deviation', direction: 'less' });
    if (analysis.state !== 'deviation') throw new Error(analysis.state);
    expect(Math.round(analysis.values.storedKcal / 100) * 100).toBe(
      STORED_NORMAL30,
    );
  });

  it('list weight and body fat under arriving data', async () => {
    const normal = await load('normal30');
    expect(normal.daysWithData.weight).toBeGreaterThan(0);
    expect(normal.daysWithData.bodyFat).toBe(normal.daysWithData.weight);
    expect(normal.sources.weight?.source.name).toBe('Withings');

    const noBodyFat = await load('noBodyFat30');
    expect(noBodyFat.daysWithData.weight).toBeGreaterThan(0);
    expect(noBodyFat.daysWithData.bodyFat).toBe(0);
    expect(noBodyFat.sources.bodyFat).toBeUndefined();
  });
});
