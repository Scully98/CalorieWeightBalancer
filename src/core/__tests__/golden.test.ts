import {
  GOLDEN_BODY_DAYS,
  GOLDEN_DAYS,
  GOLDEN_DELTA,
  GOLDEN_EXPECTED as EXPECTED,
  GOLDEN_LEAD_IN,
  GOLDEN_TOLERANCE,
} from '../__fixtures__/golden-30';
import { analyzeBalance } from '../analysis';
import { dayBalances } from '../day-balance';
import { formatKcal, formatNumber, formatSignedKg } from '../format';
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

describe('golden test case: balance against the scale', () => {
  const days = dayBalances(GOLDEN_BODY_DAYS.slice(GOLDEN_LEAD_IN), {
    zeroDaysAsMaintenance: true,
    profile: {},
  });
  const analysis = analyzeBalance(GOLDEN_BODY_DAYS, days, GOLDEN_LEAD_IN);
  const round = (value: number, to: number) => Math.round(value / to) * to;

  it('shows less gain on the scale than in the balance', () => {
    expect(analysis).toMatchObject({
      state: 'deviation',
      direction: 'less',
      leanShare: true,
      days: 30,
      measurements: 15,
    });
  });

  it('stores ≈ +4,300 kcal and gives 2,760 against 2,670 kcal a day', () => {
    if (analysis.state !== 'deviation') throw new Error(analysis.state);
    const { values } = analysis;
    const expected = EXPECTED.analysis;
    expect(values.fatChangeKg).toBeCloseTo(GOLDEN_DELTA.fatKg);
    expect(values.leanChangeKg).toBeCloseTo(GOLDEN_DELTA.leanKg);
    expect(values.storedKcal).toBeCloseTo(expected.storedKcal);
    expect(values.actualBurnPerDay).toBeCloseTo(expected.actualBurnRaw);
    expect(values.trackerBurnPerDay).toBeCloseTo(expected.trackerBurnRaw);
    expect(values.differencePerDay).toBeCloseTo(expected.differencePerDay);

    // Shown like the design: E to 100, burn to 10, difference of the two.
    const actual = round(values.actualBurnPerDay, 10);
    const tracker = round(values.trackerBurnPerDay, 10);
    expect(formatKcal(round(values.storedKcal, 100), LOCALE)).toBe(
      expected.formatted.storedKcal,
    );
    expect(formatNumber(actual, LOCALE)).toBe(
      expected.formatted.actualBurnPerDay,
    );
    expect(formatNumber(tracker, LOCALE)).toBe(
      expected.formatted.trackerBurnPerDay,
    );
    expect(formatKcal(actual - tracker, LOCALE)).toBe(
      expected.formatted.differencePerDay,
    );
  });
});
