import { createDemoSource } from '../demo-source';
import { SERIES_DAYS } from '../generate';
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
  it('give the same numbers on every build', () => {
    for (const id of SCENARIO_IDS)
      expect(buildScenario(id)).toEqual(buildScenario(id));
  });

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

  it('has 4 weighings in 7 days', async () => {
    const days = await periodDays('short7');
    expect(days).toHaveLength(7);
    expect(days.filter((day) => day.weightKg !== undefined)).toHaveLength(4);
  });

  it('keeps weight but drops body fat and lean mass without body fat data', async () => {
    const days = await periodDays('noBodyFat30');
    expect(days.some((day) => day.weightKg !== undefined)).toBe(true);
    expect(days.every((day) => day.bodyFatFraction === undefined)).toBe(true);
    expect(days.every((day) => day.leanMassKg === undefined)).toBe(true);
  });

  it('adds holes for the gaps scenario', async () => {
    const days = await periodDays('gaps30');
    expect(withoutDates(days.slice(12, 15))).toEqual([{}, {}, {}]);
    expect([6, 21, 27].map((p) => days[p].active)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
    expect(days.slice(16, 23).every((day) => day.weightKg === undefined)).toBe(
      true,
    );
    expect([2, 26].map((p) => days[p].restingCoverage)).toEqual([0.5, 0.5]);
  });

  it('has no values at all when empty', async () => {
    const source = createDemoSource('empty', NOW);
    const days = await source.days(new Date(2026, 9, 1), 24);
    expect(days.every((day) => Object.keys(day).length === 1)).toBe(true);
    expect(await source.firstDataDate()).toBeUndefined();
  });

  it('returns today so far when the range includes today', async () => {
    const [today] = await createDemoSource('normal30', NOW).days(
      new Date(2026, 9, 24),
      1,
    );
    expect(today).toEqual({
      date: '2026-10-24',
      food: 1420,
      resting: 1090,
      active: 290,
    });
  });

  it('starts "all" at the first day of the series', async () => {
    const first = await createDemoSource('normal30', NOW).firstDataDate();
    const { days } = resolvePeriod({ kind: 'all' }, NOW, {
      firstDataDate: first,
    });
    expect(days).toBe(SERIES_DAYS);
  });

  // One line per day: food resting(e = estimated) active coverage
  // weight body fat lean mass; "-" = missing.
  it('keeps all values unchanged (snapshot)', () => {
    const show = (value: number | undefined, digits = 0) =>
      value === undefined ? '-' : value.toFixed(digits);
    const values = Object.fromEntries(
      SCENARIO_IDS.map((id) => [
        id,
        buildScenario(id).series.map((day) =>
          [
            show(day.food),
            show(day.resting) + (day.restingEstimated ? 'e' : ''),
            show(day.active),
            show(day.restingCoverage, 2),
            show(day.weightKg, 3),
            show(day.bodyFatFraction, 4),
            show(day.leanMassKg, 3),
          ].join(' '),
        ),
      ]),
    );
    expect(values).toMatchSnapshot();
  });
});
