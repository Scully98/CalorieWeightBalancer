import { fatKgFromKcal, periodBalance } from '../balance';

describe('periodBalance', () => {
  it('sums food minus resting and active energy per day', () => {
    const result = periodBalance([
      { food: 2500, resting: 1800, active: 400 },
      { food: 1600, resting: 1800, active: 600 },
    ]);
    expect(result).toEqual({ kcal: -500, daysWithoutFood: 0, days: 2 });
  });

  it('counts days without food entry as maintenance', () => {
    const result = periodBalance([
      { food: 2000, resting: 1800, active: 0 },
      { resting: 1800, active: 500 },
    ]);
    expect(result).toEqual({ kcal: 200, daysWithoutFood: 1, days: 2 });
  });

  it('uses the fallback when resting energy is missing', () => {
    expect(periodBalance([{ food: 2000, active: 300 }], 1800).kcal).toBe(-100);
  });

  it('treats missing active energy as zero', () => {
    expect(periodBalance([{ food: 2000, resting: 1800 }]).kcal).toBe(200);
  });
});

describe('fatKgFromKcal', () => {
  it('divides by 7,700 kcal per kg', () => {
    expect(fatKgFromKcal(-7700)).toBe(-1);
    expect(fatKgFromKcal(3850)).toBe(0.5);
  });
});
