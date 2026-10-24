import { bodyValues, trendSeries } from '../body';
import type { DayRecord } from '../day-record';

// One record per day; `weights[i]` is the weight on day i, if any.
function days(weights: (number | undefined)[]): DayRecord[] {
  return weights.map((weightKg, i) => ({
    date: `day-${i}`,
    ...(weightKg === undefined ? {} : { weightKg }),
  }));
}

describe('bodyValues', () => {
  it('splits weight by body fat', () => {
    expect(
      bodyValues({ date: 'd', weightKg: 80, bodyFatFraction: 0.25 }),
    ).toEqual({ weightKg: 80, fatKg: 20, leanKg: 60 });
  });

  it('prefers measured lean mass', () => {
    expect(
      bodyValues({
        date: 'd',
        weightKg: 80,
        bodyFatFraction: 0.25,
        leanMassKg: 61,
      }),
    ).toEqual({ weightKg: 80, fatKg: 20, leanKg: 61 });
  });

  it('derives fat from weight and lean mass without body fat', () => {
    expect(bodyValues({ date: 'd', weightKg: 80, leanMassKg: 62 })).toEqual({
      weightKg: 80,
      fatKg: 18,
      leanKg: 62,
    });
  });

  it('has nothing without weight', () => {
    expect(bodyValues({ date: 'd', bodyFatFraction: 0.25 })).toEqual({});
    expect(bodyValues({ date: 'd', weightKg: 80 })).toEqual({ weightKg: 80 });
  });
});

describe('trendSeries', () => {
  it('averages the day and the six before it', () => {
    const trend = trendSeries(
      days([80, 81, 82, 83, 84, 85, 86, 87]),
      'weightKg',
    );
    expect(trend[6]).toBeCloseTo(83);
    // Day 0 drops out of the window on day 7.
    expect(trend[7]).toBeCloseTo(84);
  });

  it('fills days without measurement from the window', () => {
    const trend = trendSeries(
      days([80, undefined, 82, undefined, 84]),
      'weightKg',
    );
    expect(trend).toEqual([80, 80, 81, 81, 82]);
  });

  it('widens the window a week at a time', () => {
    const lonely = (gap: number) => [80, ...Array(gap).fill(undefined)];
    // 13 days back.
    expect(trendSeries(days(lonely(13)), 'weightKg').at(-1)).toBe(80);
    // 34 days back is the limit.
    expect(trendSeries(days(lonely(34)), 'weightKg').at(-1)).toBe(80);
    expect(trendSeries(days(lonely(35)), 'weightKg').at(-1)).toBeUndefined();
  });

  it('follows fat and lean mass of days with body fat', () => {
    const records: DayRecord[] = [
      { date: 'a', weightKg: 80, bodyFatFraction: 0.2 },
      { date: 'b', weightKg: 80 },
      { date: 'c', weightKg: 82, bodyFatFraction: 0.25 },
    ];
    // Day c: 82 × 0.25 = 20.5 fat, 61.5 lean.
    expect(trendSeries(records, 'fatKg')).toEqual([
      expect.closeTo(16),
      expect.closeTo(16),
      expect.closeTo(18.25),
    ]);
    expect(trendSeries(records, 'leanKg')).toEqual([
      expect.closeTo(64),
      expect.closeTo(64),
      expect.closeTo(62.75),
    ]);
  });
});
