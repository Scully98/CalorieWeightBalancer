import {
  GOLDEN_DAYS,
  GOLDEN_EXPECTED as EXPECTED,
  GOLDEN_TOLERANCE,
} from '../__fixtures__/golden-30';
import { dayBalances } from '../day-balance';
import { formatKcal, formatSignedKg } from '../format';
import { periodBalance } from '../period-balance';

const LOCALE = 'de-DE';

function golden(tolerance = GOLDEN_TOLERANCE) {
  const days = dayBalances(GOLDEN_DAYS, {
    zeroDaysAsMaintenance: true,
    profile: {},
  });
  return periodBalance(days, tolerance);
}

describe('golden test case', () => {
  it('has the input of the design prompt', () => {
    const balance = golden();
    expect(balance.days).toBe(30);
    expect(balance.foodKcal).toBe(EXPECTED.foodKcal);
    expect(balance.restingKcal + balance.activeKcal).toBe(EXPECTED.burnKcal);
  });

  it('gives the balance, average and theoretical fat', () => {
    const balance = golden();
    expect(balance.kcal).toBe(EXPECTED.kcal);
    expect(balance.avgKcal).toBeCloseTo(EXPECTED.avgKcal);
    expect(balance.fatKg).toBeCloseTo(EXPECTED.fatKg);
    expect(formatKcal(balance.kcal, LOCALE)).toBe(EXPECTED.formatted.kcal);
    expect(formatKcal(Math.round(balance.avgKcal), LOCALE)).toBe(
      EXPECTED.formatted.avgKcal,
    );
    expect(formatSignedKg(balance.fatKg, LOCALE)).toBe(
      EXPECTED.formatted.fatKg,
    );
  });

  it('gives the range with tolerance', () => {
    const { range, fatRange } = golden();
    expect(range.min).toBeCloseTo(EXPECTED.range.min);
    expect(range.max).toBeCloseTo(EXPECTED.range.max);
    expect(formatKcal(Math.round(range.min), LOCALE)).toBe(
      EXPECTED.formatted.range.min,
    );
    expect(formatKcal(Math.round(range.max), LOCALE)).toBe(
      EXPECTED.formatted.range.max,
    );
    expect(formatSignedKg(fatRange.min, LOCALE)).toBe(
      EXPECTED.formatted.fatRange.min,
    );
    expect(formatSignedKg(fatRange.max, LOCALE)).toBe(
      EXPECTED.formatted.fatRange.max,
    );
  });

  it('has 30 of 30 complete days', () => {
    const balance = golden();
    expect(balance.completeDays).toBe(30);
    expect(Object.values(balance.flagCounts)).toEqual([0, 0, 0, 0]);
  });

  it('gives min = max = balance without tolerance', () => {
    const { kcal, range } = golden({ foodPercent: 0, burnPercent: 0 });
    expect(range).toEqual({ min: kcal, max: kcal });
  });
});
