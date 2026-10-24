import {
  dayResting,
  dayRestingKind,
  fatKgFromKcal,
  periodBalance,
  periodBreakdown,
  typicalResting,
  type DayEnergy,
} from '../balance';

describe('periodBalance', () => {
  it('sums food minus resting and active energy per day', () => {
    const result = periodBalance([
      { food: 2500, resting: 1800, active: 400 },
      { food: 1600, resting: 1800, active: 600 },
    ]);
    expect(result).toEqual({
      kcal: -500,
      daysWithoutFood: 0,
      daysWithoutResting: 0,
      days: 2,
    });
  });

  it('counts days without food entry as maintenance', () => {
    const result = periodBalance([
      { food: 2000, resting: 1800, active: 0 },
      { resting: 1800, active: 500 },
    ]);
    expect(result).toEqual({
      kcal: 200,
      daysWithoutFood: 1,
      daysWithoutResting: 0,
      days: 2,
    });
  });

  it('uses the fallback when resting energy is missing', () => {
    expect(periodBalance([{ food: 2000, active: 300 }], 1800).kcal).toBe(-100);
  });

  it('leaves out and counts days without resting energy or fallback', () => {
    const result = periodBalance([
      { food: 2000, active: 300 },
      { food: 2000, resting: 1800, active: 300 },
    ]);
    expect(result).toEqual({
      kcal: -100,
      daysWithoutFood: 0,
      daysWithoutResting: 1,
      days: 2,
    });
  });

  it('treats missing active energy as zero', () => {
    expect(periodBalance([{ food: 2000, resting: 1800 }]).kcal).toBe(200);
  });
});

describe('periodBreakdown', () => {
  const days: DayEnergy[] = [
    { food: 2500, resting: 1800, active: 400, restingCoverage: 1 },
    { food: 2000, resting: 900, active: 300, restingCoverage: 0.5 },
    { food: 1800, active: 200 },
    { food: 2100, resting: 1700, restingCoverage: 1 },
    { resting: 1800, active: 500, restingCoverage: 1 },
  ];

  it('splits the balance into parts that add up to it', () => {
    const result = periodBreakdown(days, 1750);
    expect(result).toMatchObject({
      foodKcal: 8400,
      restingKcal: 1800 + 1800 + 1750 + 1700,
      activeKcal: 900,
      countedDays: 4,
      daysWithoutFood: 1,
      days: 5,
    });
    expect(result.kcal).toBe(
      result.foodKcal - result.restingKcal - result.activeKcal,
    );
    expect(result.kcal).toBe(periodBalance(days, 1750).kcal);
  });

  it('counts scaled, fallback and active-less days', () => {
    expect(periodBreakdown(days, 1750)).toMatchObject({
      restingScaledDays: 1,
      restingFallbackDays: 1,
      daysWithoutActive: 1,
      daysWithoutResting: 0,
    });
  });

  it('leaves days without resting energy out of every sum', () => {
    expect(periodBreakdown(days)).toMatchObject({
      foodKcal: 6600,
      activeKcal: 700,
      countedDays: 3,
      restingFallbackDays: 0,
      daysWithoutResting: 1,
    });
  });
});

describe('dayRestingKind', () => {
  it('names where the resting energy comes from', () => {
    expect(dayRestingKind({ resting: 1500, restingCoverage: 1 }, 1800)).toBe(
      'measured',
    );
    expect(dayRestingKind({ resting: 900, restingCoverage: 0.5 }, 1800)).toBe(
      'scaled',
    );
    expect(dayRestingKind({}, 1800)).toBe('fallback');
    expect(
      dayRestingKind({ resting: 100, restingCoverage: 1 / 24 }, undefined),
    ).toBe('missing');
  });
});

describe('dayResting', () => {
  it('keeps fully covered days as measured', () => {
    expect(dayResting({ resting: 1500, restingCoverage: 1 }, 1800)).toBe(1500);
    expect(dayResting({ resting: 1600, restingCoverage: 20 / 24 }, 1800)).toBe(
      1600,
    );
  });

  it('keeps days without coverage information as measured', () => {
    expect(dayResting({ resting: 1500 }, 1800)).toBe(1500);
  });

  it('scales partial days up to 24 hours', () => {
    expect(dayResting({ resting: 900, restingCoverage: 0.5 }, 1700)).toBe(1800);
  });

  it('uses the fallback without measured resting energy', () => {
    expect(dayResting({}, 1700)).toBe(1700);
    expect(dayResting({ resting: 0, restingCoverage: 0 }, 1700)).toBe(1700);
    expect(dayResting({}, undefined)).toBeUndefined();
  });

  it('uses the fallback below six hours instead of scaling up', () => {
    expect(dayResting({ resting: 1700, restingCoverage: 1 / 24 }, 1800)).toBe(
      1800,
    );
    expect(dayResting({ resting: 450, restingCoverage: 6 / 24 }, 1700)).toBe(
      1800,
    );
    expect(
      dayResting({ resting: 1700, restingCoverage: 1 / 24 }, undefined),
    ).toBeUndefined();
  });
});

describe('typicalResting', () => {
  const full = (resting: number): DayEnergy => ({
    resting,
    restingCoverage: 1,
  });

  it('is the median of full days', () => {
    const days = [1700, 1800, 1750, 1900, 1650, 1820, 1780].map(full);
    expect(typicalResting(days)).toBe(1780);
    expect(typicalResting([...days, full(1790)])).toBe(1785);
  });

  it('ignores partial days and days without data', () => {
    const days = [
      ...[1800, 1800, 1800, 1800, 1800, 1800, 1800].map(full),
      { resting: 400, restingCoverage: 0.2 },
      {},
    ];
    expect(typicalResting(days)).toBe(1800);
  });

  it('needs at least seven full days', () => {
    expect(
      typicalResting([1800, 1800, 1800, 1800, 1800, 1800].map(full)),
    ).toBeUndefined();
  });
});

describe('fatKgFromKcal', () => {
  it('divides by 7,700 kcal per kg', () => {
    expect(fatKgFromKcal(-7700)).toBe(-1);
    expect(fatKgFromKcal(3850)).toBe(0.5);
  });
});
