import { createDemoSource } from '../demo-source';
import { buildScenario, SCENARIO_IDS } from '../scenarios';
import { periodBreakdown } from '@/core/balance';
import type { DayRecord } from '@/core/day-record';
import { resolvePeriod } from '@/core/period';

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

    const balance = periodBreakdown(days);
    expect(balance.kcal).toBe(7000);
    expect(balance.restingFallbackDays).toBe(3);
    expect(balance.daysWithoutFood).toBe(1);
    const lowFood = days.filter(
      (day) =>
        day.food !== undefined &&
        day.food < 0.5 * ((day.resting ?? 0) + (day.active ?? 0)),
    );
    expect(lowFood).toHaveLength(2);
  });
});
