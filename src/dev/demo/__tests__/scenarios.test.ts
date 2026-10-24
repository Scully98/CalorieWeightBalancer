import { createDemoSource } from '../demo-source';
import { buildScenario, SCENARIO_IDS } from '../scenarios';
import { dayBalances } from '@/core/day-balance';
import type { DayRecord } from '@/core/day-record';
import { resolvePeriod } from '@/core/period';
import { periodBalance } from '@/core/period-balance';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  BiologicalSex: { notSet: 0, female: 1, male: 2, other: 3 },
}));

const NOW = new Date(2026, 9, 24, 14, 32);

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
