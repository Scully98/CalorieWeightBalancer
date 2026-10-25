import { addDays } from '../dates';
import type { DayBalance } from '../day-balance';
import { toDateKey, type DayRecord } from '../day-record';
import { chartLines } from '../lines';

const START = new Date(2026, 8, 24);

// `count` records from `start`; `weight(i)` gives the weight on day i.
function records(
  count: number,
  weight: (i: number) => number | undefined,
  start = START,
): DayRecord[] {
  return Array.from({ length: count }, (_, i) => {
    const weightKg = weight(i);
    return {
      date: toDateKey(addDays(start, i)),
      ...(weightKg === undefined ? {} : { weightKg, bodyFatFraction: 0.2 }),
    };
  });
}

function balances(list: readonly DayRecord[], kcal = 300): DayBalance[] {
  return list.map((record) => ({
    date: record.date,
    restingSource: 'measured',
    active: 0,
    activeMissing: false,
    kcal,
    maintenance: false,
    flags: [],
  }));
}

describe('chartLines', () => {
  it('has no gap in the trend but points only on measured days', () => {
    const period = records(30, (i) => (i % 2 === 0 ? 80 + i * 0.1 : undefined));
    const { points } = chartLines(period, balances(period), 0);
    expect(points.every((point) => point.weightTrend !== undefined)).toBe(true);
    expect(points.every((point) => point.fatTrend !== undefined)).toBe(true);
    expect(points.map((point) => point.weightPoint !== undefined)).toEqual(
      period.map((_, i) => i % 2 === 0),
    );
    expect(points[0].weightTrend).toBe(0);
  });

  it('measures the change from the trend on the first day', () => {
    // Lead-in measurement 5 days before the period: 81 kg.
    const all = records(
      10,
      (i) => (i === 0 ? 81 : i === 6 ? 80 : undefined),
      addDays(START, -5),
    );
    const period = all.slice(5);
    const { points } = chartLines(all, balances(period), 5);
    // Day 0 of the period: only the lead-in value in the window.
    expect(points[0].weightTrend).toBe(0);
    // Day 1: mean of 81 and 80, minus 81.
    expect(points[1].weightTrend).toBeCloseTo(-0.5);
    expect(points[1].weightPoint).toBeCloseTo(-1);
    // Day 2: the lead-in value is 7 days back and leaves the window.
    expect(points[2].weightTrend).toBeCloseTo(-1);
  });

  it('starts the line at the first measurement within the period', () => {
    const period = records(20, (i) =>
      i === 10 ? 80 : i === 12 ? 81 : undefined,
    );
    const { points, hasWeight } = chartLines(period, balances(period), 0);
    expect(hasWeight).toBe(true);
    expect(points.slice(0, 10).every((p) => p.weightTrend === undefined)).toBe(
      true,
    );
    expect(points[10].weightTrend).toBe(0);
    expect(points[12].weightTrend).toBeCloseTo(0.5);
    expect(points[12].weightPoint).toBeCloseTo(1);
  });

  it('hides weight and fat without measurements but keeps theoretical fat', () => {
    const period = records(10, () => undefined);
    const lines = chartLines(period, balances(period, 770), 0);
    expect(lines.hasWeight).toBe(false);
    expect(lines.hasFat).toBe(false);
    expect(lines.points.every((p) => p.weightTrend === undefined)).toBe(true);
    // 10 × 770 = 7,700 kcal → 1 kg.
    expect(lines.points[9].theoreticalFat).toBeCloseTo(1);
  });

  it('keeps theoretical fat on days without balance', () => {
    const period = records(3, () => undefined);
    const days = balances(period, 770);
    days[1] = { ...days[1], kcal: undefined };
    const { points } = chartLines(period, days, 0);
    expect(points.map((p) => p.theoreticalFat)).toEqual([0.1, 0.1, 0.2]);
  });
});
