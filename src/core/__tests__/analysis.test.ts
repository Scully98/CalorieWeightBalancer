import {
  analyzeBalance,
  bodyComposition,
  comparisonBars,
  expectedChange,
  weightBars,
  type AnalysisValues,
} from '../analysis';
import { addDays } from '../dates';
import type { DayBalance } from '../day-balance';
import { toDateKey, type DayRecord } from '../day-record';

const START = new Date(2026, 8, 1);

type Options = {
  days: number;
  // Days with a weighing; default every other day.
  measured?: (i: number) => boolean;
  withBodyFat?: (i: number) => boolean;
  // Fat and lean mass on day i.
  fat?: (i: number) => number;
  lean?: (i: number) => number;
  // B per day; food 2,900, resting 1,800, active 800 − (300 − kcal).
  kcal?: number;
};

function scenario({
  days: count,
  measured = (i) => i % 2 === 0,
  withBodyFat = () => true,
  fat = () => 18,
  lean = () => 64,
  kcal = 300,
}: Options): { records: DayRecord[]; days: DayBalance[] } {
  const records = Array.from({ length: count }, (_, i): DayRecord => {
    const date = toDateKey(addDays(START, i));
    if (!measured(i)) return { date };
    const weightKg = fat(i) + lean(i);
    return withBodyFat(i)
      ? { date, weightKg, bodyFatFraction: fat(i) / weightKg }
      : { date, weightKg };
  });
  const days = records.map((record): DayBalance => ({
    date: record.date,
    food: 2900,
    resting: 1800,
    restingSource: 'measured',
    active: 1100 - kcal,
    activeMissing: false,
    kcal,
    maintenance: false,
    flags: [],
  }));
  return { records, days };
}

function analyze(options: Options) {
  const { records, days } = scenario(options);
  return analyzeBalance(records, days, 0);
}

// Fat gain spread over the period so that the trend at the end is `gain`
// above the start (constant first and last week).
const ramp = (from: number, gain: number, count: number) => (i: number) =>
  from + gain * Math.min(1, Math.max(0, (i - 6) / (count - 13)));

describe('analyzeBalance', () => {
  it('is insufficient for 7 days, with the measurements so far', () => {
    expect(analyze({ days: 7 })).toMatchObject({
      state: 'insufficient',
      days: 7,
      measurements: 4,
    });
    expect(analyze({ days: 7, measured: () => true })).toMatchObject({
      state: 'insufficient',
      measurements: 7,
    });
  });

  it('needs 21 days and 6 measurements', () => {
    const five = (i: number) => i < 10 && i % 2 === 0;
    expect(analyze({ days: 21, measured: five }).state).toBe('insufficient');
    const six = (i: number) => i % 4 === 0;
    expect(analyze({ days: 21, measured: six }).state).not.toBe('insufficient');
    expect(analyze({ days: 20, measured: () => true }).state).toBe(
      'insufficient',
    );
  });

  it('keeps a preview of the values while insufficient', () => {
    const analysis = analyze({ days: 14 });
    expect(analysis.state === 'insufficient' && analysis.preview).toMatchObject(
      { balanceKcal: 4200 },
    );
  });

  describe('with measurements in only part of the period', () => {
    // 80 kg at the start, +0.04 kg per day, body fat 20 %.
    const fat = (i: number) => (80 + i * 0.04) * 0.2;
    const lean = (i: number) => (80 + i * 0.04) * 0.8;

    it('locks without a preview for two measurements at the end', () => {
      const analysis = analyze({
        days: 30,
        measured: (i) => i >= 28,
        fat,
        lean,
      });
      expect(analysis).toMatchObject({
        state: 'insufficient',
        measurements: 2,
        spanDays: 2,
      });
      expect(
        analysis.state === 'insufficient' && analysis.preview,
      ).toBeUndefined();
    });

    it('locks when six measurements only cover the last days', () => {
      expect(
        analyze({ days: 30, measured: (i) => i >= 24, fat, lean }),
      ).toMatchObject({ state: 'insufficient', measurements: 6, spanDays: 6 });
    });

    it('locks when six measurements only cover the first days', () => {
      expect(
        analyze({ days: 30, measured: (i) => i < 6, fat, lean }),
      ).toMatchObject({ state: 'insufficient', measurements: 6, spanDays: 6 });
    });

    it('locks when the end has no trend at all', () => {
      expect(
        analyze({ days: 90, measured: (i) => i < 10, fat, lean }),
      ).toMatchObject({ state: 'insufficient', spanDays: 10 });
    });

    it('sums the balance only over the measured days', () => {
      const analysis = analyze({
        days: 60,
        measured: (i) => i >= 30,
        fat,
        lean,
      });
      if (analysis.state !== 'deviation' && analysis.state !== 'ok')
        throw new Error(analysis.state);
      expect(analysis.values.balanceKcal).toBe(30 * 300);
      expect(analysis.values.foodKcal).toBe(30 * 2900);
      expect(analysis.compared.to).toBe(toDateKey(addDays(START, 59)));
      expect(analysis.compared.from).toBe(toDateKey(addDays(START, 30)));
    });

    it('stops at the last measurement when it is older than a trend window', () => {
      const analysis = analyze({
        days: 40,
        measured: (i) => i < 25,
        fat,
        lean,
      });
      if (analysis.state !== 'deviation' && analysis.state !== 'ok')
        throw new Error(analysis.state);
      expect(analysis.values.balanceKcal).toBe(25 * 300);
      expect(analysis.compared.to).toBe(toDateKey(addDays(START, 24)));
    });

    it('still counts the whole period with a recent last measurement', () => {
      const analysis = analyze({
        days: 30,
        measured: (i) => i <= 23,
        fat,
        lean,
      });
      if (analysis.state !== 'deviation' && analysis.state !== 'ok')
        throw new Error(analysis.state);
      expect(analysis.values.balanceKcal).toBe(30 * 300);
    });

    it('starts on day one with a measurement in its trend window', () => {
      const count = 30;
      const leadIn = 6;
      const { records, days } = scenario({ days: leadIn + count, fat, lean });
      const analysis = analyzeBalance(records, days.slice(leadIn), leadIn);
      if (analysis.state !== 'deviation' && analysis.state !== 'ok')
        throw new Error(analysis.state);
      expect(analysis.compared.from).toBe(days[leadIn].date);
    });

    it('compares the weight only while body fat covers too few days', () => {
      expect(
        analyze({
          days: 30,
          withBodyFat: (i) => i < 12,
          fat,
          lean,
        }),
      ).toMatchObject({
        state: 'weightOnly',
        compositionMeasurements: 6,
        compositionSpanDays: 11,
      });
    });

    it('fits the same weight gain whatever the days around it', () => {
      const all = analyze({ days: 30, measured: () => true, fat, lean });
      const later = analyze({
        days: 60,
        measured: (i) => i >= 30,
        fat: (i) => fat(i - 30),
        lean: (i) => lean(i - 30),
      });
      if (
        (all.state !== 'deviation' && all.state !== 'ok') ||
        (later.state !== 'deviation' && later.state !== 'ok')
      )
        throw new Error('expected values');
      expect(later.values.balanceKcal).toBe(all.values.balanceKcal);
      expect(later.values.storedKcal).toBeCloseTo(all.values.storedKcal);
    });
  });

  it('compares the weight only without body fat', () => {
    const analysis = analyze({
      days: 30,
      withBodyFat: () => false,
      lean: ramp(64, 0.5, 30),
      kcal: 77,
    });
    expect(analysis).toMatchObject({
      state: 'weightOnly',
      measurements: 15,
      // 30 × 77 ÷ 7,700.
      balanceFatKg: expect.closeTo(0.3),
      weightChangeKg: expect.closeTo(0.5),
    });
  });

  it('compares the weight only with fewer than 6 body fat measurements', () => {
    const analysis = analyze({ days: 30, withBodyFat: (i) => i < 10 });
    expect(analysis).toMatchObject({
      state: 'weightOnly',
      compositionMeasurements: 5,
    });
    expect(analyze({ days: 30, withBodyFat: () => false })).toMatchObject({
      compositionMeasurements: 0,
    });
  });

  it('fits within 400 kcal or 10 % of the balance', () => {
    // B = 30 × 100 = 3,000; E = 9,400 × 0.3 = 2,820: 180 apart.
    const fit = analyze({ days: 30, kcal: 100, fat: ramp(18, 0.3, 30) });
    expect(fit.state).toBe('ok');
    // B = 3,000; E = 9,400 × 0.25 = 2,350: 650 apart.
    const less = analyze({ days: 30, kcal: 100, fat: ramp(18, 0.25, 30) });
    expect(less).toMatchObject({ state: 'deviation', direction: 'less' });
    // B = 3,000; E = 9,400 × 0.4 = 3,760: 760 apart.
    const more = analyze({ days: 30, kcal: 100, fat: ramp(18, 0.4, 30) });
    expect(more).toMatchObject({ state: 'deviation', direction: 'more' });
  });

  it('puts the limit at 400 kcal for a small balance', () => {
    // B = 30 × 100 = 3,000 (10 % = 300); E = 3,000 − 399 or − 401.
    const gap = (kcal: number) =>
      analyze({ days: 30, kcal: 100, fat: ramp(18, (3000 - kcal) / 9400, 30) })
        .state;
    expect(gap(399)).toBe('ok');
    expect(gap(401)).toBe('deviation');
  });

  it('takes 10 % of a large balance as the limit', () => {
    // B = 30 × 1,000 = 30,000; E = 9,400 × 3 = 28,200: within 3,000.
    expect(analyze({ days: 30, kcal: 1000, fat: ramp(18, 3, 30) }).state).toBe(
      'ok',
    );
  });

  it('describes the composition above 0.05 kg of lean mass', () => {
    const lean = (gain: number) =>
      analyze({ days: 30, kcal: 100, lean: ramp(64, gain, 30) });
    expect(lean(0.06)).toMatchObject({
      composition: { kind: 'share', change: 'gain', leanShare: 1 },
    });
    expect(lean(0.05)).toMatchObject({ composition: undefined });
  });

  it('tells which change the balance lets expect', () => {
    // B = 30 × 300 = 9,000.
    expect(analyze({ days: 30 })).toMatchObject({ expected: 'gain' });
    // B = 30 × 13 = 390: within the fit margin.
    expect(analyze({ days: 30, kcal: 13 })).toMatchObject({
      expected: 'even',
    });
  });

  it('keeps E on the side of the direction when it expects no change', () => {
    // B = 390; the scale stores clearly less or more.
    let deviations = 0;
    for (const fatGain of [-0.2, -0.05, 0.1, 0.2]) {
      const analysis = analyze({
        days: 30,
        kcal: 13,
        fat: ramp(18, fatGain, 30),
      });
      if (analysis.state !== 'deviation') continue;
      expect(analysis.expected).toBe('even');
      expect(Math.sign(analysis.values.storedKcal)).toBe(
        analysis.direction === 'less' ? -1 : 1,
      );
      deviations++;
    }
    expect(deviations).toBeGreaterThanOrEqual(2);
  });

  it('counts a zero day as eating what it burns', () => {
    const { records, days } = scenario({ days: 30, fat: ramp(18, 0.2, 30) });
    days[3] = { ...days[3], food: undefined, kcal: 0, maintenance: true };
    const analysis = analyzeBalance(records, days, 0);
    if (analysis.state !== 'deviation' && analysis.state !== 'ok')
      throw new Error(analysis.state);
    const { values } = analysis;
    expect(values.balanceKcal).toBe(29 * 300);
    expect(values.differencePerDay).toBeCloseTo(
      (values.balanceKcal - values.storedKcal) / 30,
    );
  });

  it('measures the body fat share in percentage points', () => {
    const analysis = analyze({ days: 30, kcal: 400, fat: ramp(18, 1, 30) });
    if (analysis.state !== 'deviation' && analysis.state !== 'ok')
      throw new Error(analysis.state);
    // 18 / 82 → 19 / 83.
    expect(analysis.values.bodyFatPointsChange).toBeCloseTo(
      (19 / 83 - 18 / 82) * 100,
    );
  });
});

describe('expectedChange', () => {
  it('is even within 400 kcal of zero', () => {
    expect(expectedChange(399)).toBe('even');
    expect(expectedChange(-399)).toBe('even');
    expect(expectedChange(0)).toBe('even');
    expect(expectedChange(401)).toBe('gain');
    expect(expectedChange(-401)).toBe('loss');
  });
});

describe('bodyComposition', () => {
  it('shifts when fat and lean mass move apart', () => {
    // Weight up, fat down, muscles up.
    expect(bodyComposition(-0.3, 0.8)).toEqual({ kind: 'shift', fat: 'loss' });
    expect(bodyComposition(0.3, -0.8)).toEqual({ kind: 'shift', fat: 'gain' });
  });

  it('gives the lean share of a change in one direction', () => {
    expect(bodyComposition(0.4, 0.3)).toEqual({
      kind: 'share',
      change: 'gain',
      leanShare: expect.closeTo(3 / 7),
    });
    expect(bodyComposition(-0.6, -0.2)).toEqual({
      kind: 'share',
      change: 'loss',
      leanShare: expect.closeTo(0.25),
    });
  });

  it('counts a tiny fat change as no direction', () => {
    expect(bodyComposition(0.02, -0.3)).toEqual({
      kind: 'share',
      change: 'loss',
      leanShare: expect.closeTo(0.3 / 0.32),
    });
  });

  it('says nothing up to 0.05 kg of lean mass', () => {
    expect(bodyComposition(0.4, 0.05)).toBeUndefined();
    expect(bodyComposition(0.4, -0.05)).toBeUndefined();
  });
});

describe('comparisonBars', () => {
  const values = (
    balanceKcal: number,
    fatChangeKg: number,
    leanChangeKg: number,
  ) =>
    ({
      balanceKcal,
      fatChangeKg,
      leanChangeKg,
      storedKcal: 9400 * fatChangeKg + 1800 * leanChangeKg,
    }) as AnalysisValues;

  it('splits the golden case by energy, with the gap on the scale', () => {
    const bars = comparisonBars(values(7000, 0.4, 0.3));
    expect(bars).toMatchObject({
      layout: 'aligned',
      opposite: false,
      balance: 1,
      gapOnBalance: 0,
    });
    expect(bars.fat).toBeCloseTo(3760 / 7000);
    expect(bars.lean).toBeCloseTo(540 / 7000);
    expect(bars.gapOnScale).toBeCloseTo(2700 / 7000);
    expect(bars.fat + bars.lean + bars.gapOnScale).toBeCloseTo(1);
  });

  it('puts the gap on the balance when the scale is longer', () => {
    const bars = comparisonBars(values(2150, 0.4, 0.3));
    expect(bars.balance).toBeCloseTo(0.5);
    expect(bars.fat + bars.lean).toBeCloseTo(1);
    expect(bars.gapOnBalance).toBeCloseTo(0.5);
    expect(bars.gapOnScale).toBe(0);
  });

  it('shows a loss on both sides by magnitude from the left', () => {
    const bars = comparisonBars(values(-7000, -0.4, -0.3));
    expect(bars.layout).toBe('aligned');
    expect(bars.balance).toBe(1);
    expect(bars.fat).toBeCloseTo(3760 / 7000);
    expect(bars.lean).toBeCloseTo(540 / 7000);
  });

  it('diverges when balance and scale go in opposite directions', () => {
    const bars = comparisonBars(values(2000, -0.1, -0.1));
    expect(bars).toMatchObject({
      layout: 'diverging',
      opposite: true,
      balance: 1,
      gapOnBalance: 0,
      gapOnScale: 0,
    });
    expect(bars.fat).toBeCloseTo(-940 / 2000);
    expect(bars.lean).toBeCloseTo(-180 / 2000);
  });

  it('diverges when fat and lean mass go in opposite directions', () => {
    const bars = comparisonBars(values(-500, -0.3, 0.8));
    expect(bars.layout).toBe('diverging');
    expect(bars.opposite).toBe(false);
    expect(bars.fat).toBe(-1);
    expect(bars.lean).toBeCloseTo(1440 / 2820);
    expect(bars.balance).toBeCloseTo(-500 / 2820);
  });

  it('leaves out a tiny part against the direction of the whole', () => {
    const lean = comparisonBars(values(7000, 0.4, -0.04));
    expect(lean.layout).toBe('aligned');
    expect(lean.lean).toBe(0);
    expect(lean.fat).toBeCloseTo((3760 - 72) / 7000);
    const fat = comparisonBars(values(7000, -0.04, 0.8));
    expect(fat.layout).toBe('aligned');
    expect(fat.fat).toBe(0);
    expect(fat.lean).toBeCloseTo((1440 - 376) / 7000);
  });

  it('has empty bars when nothing changed', () => {
    expect(comparisonBars(values(0, 0, 0))).toEqual({
      layout: 'aligned',
      opposite: false,
      balance: 0,
      fat: 0,
      lean: 0,
      gapOnBalance: 0,
      gapOnScale: 0,
    });
  });

  it('shows a balance of zero as a gap', () => {
    const bars = comparisonBars(values(0, 0.1, 0));
    expect(bars).toMatchObject({ balance: 0, fat: 1, gapOnBalance: 1 });
  });
});

describe('weightBars', () => {
  it('compares magnitudes in the same direction', () => {
    expect(weightBars(0.9, 0.45)).toEqual({
      layout: 'aligned',
      opposite: false,
      balance: 1,
      scale: 0.5,
    });
    expect(weightBars(-0.9, -0.45)).toMatchObject({ balance: 1, scale: 0.5 });
  });

  it('diverges in opposite directions', () => {
    expect(weightBars(0.9, -0.45)).toEqual({
      layout: 'diverging',
      opposite: true,
      balance: 1,
      scale: -0.5,
    });
  });

  it('has empty bars without any change', () => {
    expect(weightBars(0, 0)).toMatchObject({ balance: 0, scale: 0 });
  });
});
