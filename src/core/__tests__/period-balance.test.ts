import type { DayBalance, DayFlag } from '../day-balance';
import {
  fatKgFromKcal,
  periodBalance,
  toleranceRange,
} from '../period-balance';

const OFF = { foodPercent: 0, burnPercent: 0 };

// A counted day with food 2,900, resting 1,800 and active 800 unless given.
function day(overrides: Partial<DayBalance> = {}): DayBalance {
  const base = {
    date: '2026-10-23',
    food: 2900,
    resting: 1800,
    restingSource: 'measured' as const,
    active: 800,
    activeMissing: false,
    maintenance: false,
    flags: [] as DayFlag[],
    ...overrides,
  };
  const kcal =
    'kcal' in overrides
      ? overrides.kcal
      : base.maintenance
        ? 0
        : (base.food ?? 0) - (base.resting + base.active);
  return { ...base, kcal };
}

const zeroDay = () =>
  day({ food: undefined, maintenance: true, flags: ['noFood'] });

describe('periodBalance', () => {
  it('sums the days into parts that add up to the balance', () => {
    const balance = periodBalance([day(), day({ food: 2000 })], OFF);
    expect(balance).toMatchObject({
      days: 2,
      countedDays: 2,
      foodKcal: 4900,
      restingKcal: 3600,
      activeKcal: 1600,
      kcal: -300,
      avgKcal: -150,
    });
    expect(balance.fatKg).toBeCloseTo(-300 / 7700);
  });

  it('gives min = max = balance at 0 % tolerance', () => {
    const balance = periodBalance([day(), day({ food: 1234.5 })], OFF);
    expect(balance.range).toEqual({ min: balance.kcal, max: balance.kcal });
    expect(balance.avgRange).toEqual({
      min: balance.avgKcal,
      max: balance.avgKcal,
    });
    expect(balance.fatRange).toEqual({
      min: balance.fatKg,
      max: balance.fatKg,
    });
  });

  it('applies the food tolerance in both directions', () => {
    // A 2,900, V 2,600.
    const { range } = periodBalance([day()], {
      foodPercent: 10,
      burnPercent: 0,
    });
    expect(range.min).toBeCloseTo(2610 - 2600);
    expect(range.max).toBeCloseTo(3190 - 2600);
  });

  it('corrects the burn only downwards', () => {
    const { range, kcal } = periodBalance([day()], {
      foodPercent: 0,
      burnPercent: 10,
    });
    expect(range.min).toBe(kcal);
    expect(range.max).toBeCloseTo(2900 - 2340);
  });

  it('divides the range per counted day and by 7,700 for fat', () => {
    const { range, avgRange, fatRange } = periodBalance([day(), day()], {
      foodPercent: 5,
      burnPercent: 10,
    });
    expect(avgRange.min).toBeCloseTo(range.min / 2);
    expect(avgRange.max).toBeCloseTo(range.max / 2);
    expect(fatRange.max).toBeCloseTo(fatKgFromKcal(range.max));
  });

  it('keeps zero days out of the sums and the range', () => {
    const tolerance = { foodPercent: 5, burnPercent: 10 };
    const without = periodBalance([day(), day()], tolerance);
    const withZero = periodBalance([day(), zeroDay(), day()], tolerance);
    expect(withZero.kcal).toBe(without.kcal);
    expect(withZero.range).toEqual(without.range);
    expect(withZero.foodKcal).toBe(without.foodKcal);
    expect(withZero.countedDays).toBe(without.countedDays + 1);
    expect(withZero.maintenanceDays).toBe(1);
    // The average spreads over the zero day too.
    expect(withZero.avgKcal).toBeCloseTo(without.kcal / 3);
  });

  it('adds a zero day with the switch off as full deficit', () => {
    const noFood = day({ food: undefined, flags: ['noFood'] });
    const balance = periodBalance([day(), noFood], OFF);
    expect(balance.kcal).toBe(300 - 2600);
    expect(balance.foodKcal).toBe(2900);
    expect(balance.restingKcal + balance.activeKcal).toBe(5200);
  });

  it('leaves out days without resting energy', () => {
    const missing = day({
      resting: undefined,
      restingSource: 'missing',
      kcal: undefined,
      flags: ['noResting'],
    });
    const balance = periodBalance([day(), missing], OFF);
    expect(balance.days).toBe(2);
    expect(balance.countedDays).toBe(1);
    expect(balance.excludedDays).toBe(1);
    expect(balance.kcal).toBe(300);
  });

  it('counts complete days once even with several flags', () => {
    const days = [
      ...Array.from({ length: 23 }, () => day()),
      day({ restingSource: 'formula', flags: ['restingEstimated'] }),
      day({ restingSource: 'formula', flags: ['restingEstimated'] }),
      day({ restingSource: 'formula', flags: ['restingEstimated'] }),
      day({ food: 1000, flags: ['lowFood'] }),
      day({ food: 1000, flags: ['lowFood'] }),
      zeroDay(),
      // One day with two flags.
      day({
        food: 1000,
        restingSource: 'formula',
        flags: ['restingEstimated', 'lowFood'],
      }),
    ];
    const balance = periodBalance(days, OFF);
    expect(balance.days).toBe(30);
    expect(balance.completeDays).toBe(23);
    expect(balance.flagCounts).toEqual({
      restingEstimated: 4,
      noFood: 1,
      lowFood: 3,
      noResting: 0,
    });
    expect(balance.restingEstimatedDays).toBe(4);
  });

  it('counts scaled and active-less days of the sums', () => {
    const balance = periodBalance(
      [
        day({ restingSource: 'scaled' }),
        day({ active: 0, activeMissing: true }),
        day({ ...zeroDay(), active: 0, activeMissing: true }),
      ],
      OFF,
    );
    expect(balance.restingScaledDays).toBe(1);
    expect(balance.daysWithoutActive).toBe(1);
  });

  it('is zero without any counted day', () => {
    const balance = periodBalance([], { foodPercent: 5, burnPercent: 10 });
    expect(balance).toMatchObject({
      days: 0,
      countedDays: 0,
      kcal: 0,
      avgKcal: 0,
      range: { min: 0, max: 0 },
      avgRange: { min: 0, max: 0 },
    });
  });
});

describe('toleranceRange', () => {
  const days = [day(), zeroDay(), day({ food: 2100 }), day({ active: 400 })];

  it.each([
    [0, 0],
    [5, 10],
    [20, 0],
    [0, 30],
  ])('gives the range of periodBalance at %i/%i %%', (food, burn) => {
    const tolerance = { foodPercent: food, burnPercent: burn };
    const balance = periodBalance(days, tolerance);
    const sums = {
      foodKcal: balance.foodKcal,
      burnKcal: balance.restingKcal + balance.activeKcal,
      countedDays: balance.countedDays,
    };
    expect(toleranceRange(sums, tolerance)).toEqual({
      range: balance.range,
      avgRange: balance.avgRange,
      fatRange: balance.fatRange,
    });
  });

  it('lowers only the burn: min keeps the full burn', () => {
    const { range } = toleranceRange(
      { foodKcal: 2000, burnKcal: 2500, countedDays: 1 },
      { foodPercent: 0, burnPercent: 20 },
    );
    expect(range).toEqual({ min: -500, max: 0 });
  });
});
