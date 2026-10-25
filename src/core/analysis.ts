import { bodyValues, trendSeries, type BodyKey } from './body';
import type { DayBalance } from './day-balance';
import type { DayRecord } from './day-record';
import { fatKgFromKcal } from './period-balance';

// Energy stored per kg of change (Hall 2008).
export const KCAL_PER_KG_FAT_TISSUE = 9400;
export const KCAL_PER_KG_LEAN = 1800;

// Below this the noise of the scale outweighs the signal.
export const MIN_ANALYSIS_DAYS = 21;
export const MIN_MEASUREMENTS = 6;

// The scale fits the balance within 10 % of it, but at least 400 kcal.
export const FIT_SHARE = 0.1;
export const FIT_MIN_KCAL = 400;

// Above this change in lean mass the card says how the change splits into
// fat and lean mass; also the least fat change that counts as a direction.
export const LEAN_SHARE_KG = 0.05;

export type AnalysisValues = {
  balanceKcal: number;
  balanceFatKg: number;
  fatChangeKg: number;
  leanChangeKg: number;
  // Change of the body fat share in percentage points.
  bodyFatPointsChange: number;
  // E: energy stored according to the scale.
  storedKcal: number;
  // Over counted days; a zero day eats what it burns.
  foodKcal: number;
  burnKcal: number;
  actualBurnPerDay: number;
  trackerBurnPerDay: number;
  // actual − tracker = (balance − E) ÷ days.
  differencePerDay: number;
};

type Counts = { days: number; measurements: number };

// What the balance lets expect: within the fit margin it expects no visible
// change, so the card speaks neutrally.
export type Expected = 'gain' | 'loss' | 'even';

// How the change splits into fat and lean mass.
export type Composition =
  // Same direction, or too little fat change to count: share of lean mass in
  // the change, 0–1; `change` is the direction of the lean mass.
  | { kind: 'share'; change: 'gain' | 'loss'; leanShare: number }
  // Opposite directions, e.g. fat lost and lean mass gained.
  | { kind: 'shift'; fat: 'gain' | 'loss' };

type Verdict = { expected: Expected; composition?: Composition };

export type Analysis =
  | (Counts & { state: 'insufficient'; preview?: AnalysisValues })
  | (Counts & {
      state: 'weightOnly';
      balanceFatKg: number;
      weightChangeKg: number;
      // Days with fat and lean mass in the period, below 6.
      compositionMeasurements: number;
    })
  | (Counts & Verdict & { state: 'ok'; values: AnalysisValues })
  | (Counts &
      Verdict & {
        state: 'deviation';
        values: AnalysisValues;
        // less: the scale shows less energy stored than the balance.
        direction: 'less' | 'more';
      });

export function expectedChange(balanceKcal: number): Expected {
  if (Math.abs(balanceKcal) <= FIT_MIN_KCAL) return 'even';
  return balanceKcal > 0 ? 'gain' : 'loss';
}

// Undefined while the lean mass barely changed.
export function bodyComposition(
  fatChangeKg: number,
  leanChangeKg: number,
): Composition | undefined {
  if (Math.abs(leanChangeKg) <= LEAN_SHARE_KG) return undefined;
  if (
    Math.sign(fatChangeKg) === -Math.sign(leanChangeKg) &&
    Math.abs(fatChangeKg) > LEAN_SHARE_KG
  )
    return { kind: 'shift', fat: fatChangeKg > 0 ? 'gain' : 'loss' };
  return {
    kind: 'share',
    change: leanChangeKg > 0 ? 'gain' : 'loss',
    leanShare:
      Math.abs(leanChangeKg) / (Math.abs(fatChangeKg) + Math.abs(leanChangeKg)),
  };
}

// Start and end of a trend in the period: the first and last value, so a
// trend that only begins within the period starts there.
function trendEnds(
  records: readonly DayRecord[],
  key: BodyKey,
  leadInDays: number,
): { start: number; end: number } | undefined {
  const trend = trendSeries(records, key).slice(leadInDays);
  const start = trend.find((value) => value !== undefined);
  const end = trend[trend.length - 1];
  return start === undefined || end === undefined ? undefined : { start, end };
}

function analysisValues(
  records: readonly DayRecord[],
  days: readonly DayBalance[],
  leadInDays: number,
): AnalysisValues | undefined {
  const weight = trendEnds(records, 'weightKg', leadInDays);
  const fat = trendEnds(records, 'fatKg', leadInDays);
  const lean = trendEnds(records, 'leanKg', leadInDays);
  const counted = days.filter((day) => day.kcal !== undefined);
  if (!weight || !fat || !lean || counted.length === 0) return undefined;

  let balanceKcal = 0;
  let foodKcal = 0;
  let burnKcal = 0;
  for (const day of counted) {
    const burn = day.resting === undefined ? 0 : day.resting + day.active;
    balanceKcal += day.kcal as number;
    foodKcal += day.maintenance ? burn : (day.food ?? 0);
    burnKcal += burn;
  }

  const fatChangeKg = fat.end - fat.start;
  const leanChangeKg = lean.end - lean.start;
  const storedKcal =
    KCAL_PER_KG_FAT_TISSUE * fatChangeKg + KCAL_PER_KG_LEAN * leanChangeKg;
  const actualBurnPerDay = (foodKcal - storedKcal) / counted.length;
  const trackerBurnPerDay = burnKcal / counted.length;

  return {
    balanceKcal,
    balanceFatKg: fatKgFromKcal(balanceKcal),
    fatChangeKg,
    leanChangeKg,
    bodyFatPointsChange:
      (fat.end / weight.end - fat.start / weight.start) * 100,
    storedKcal,
    foodKcal,
    burnKcal,
    actualBurnPerDay,
    trackerBurnPerDay,
    differencePerDay: actualBurnPerDay - trackerBurnPerDay,
  };
}

// Compares the balance with the change the scale measured: E = 9,400 · Δ fat
// + 1,800 · Δ lean, with start and end as 7-day trend. `records` are the
// lead-in days followed by the period days, `days` the balances of the period.
export function analyzeBalance(
  records: readonly DayRecord[],
  days: readonly DayBalance[],
  leadInDays: number,
): Analysis {
  const period = records.slice(leadInDays);
  const counts: Counts = {
    days: days.length,
    measurements: period.filter((record) => record.weightKg !== undefined)
      .length,
  };
  const values = analysisValues(records, days, leadInDays);

  if (counts.days < MIN_ANALYSIS_DAYS || counts.measurements < MIN_MEASUREMENTS)
    return { ...counts, state: 'insufficient', preview: values };

  const compositionMeasurements = period.filter(
    (record) => bodyValues(record).fatKg !== undefined,
  ).length;
  if (!values || compositionMeasurements < MIN_MEASUREMENTS) {
    const weight = trendEnds(records, 'weightKg', leadInDays);
    const balanceKcal = days.reduce((sum, day) => sum + (day.kcal ?? 0), 0);
    return {
      ...counts,
      state: 'weightOnly',
      balanceFatKg: fatKgFromKcal(balanceKcal),
      weightChangeKg: weight ? weight.end - weight.start : 0,
      compositionMeasurements,
    };
  }

  const verdict: Verdict = {
    expected: expectedChange(values.balanceKcal),
    composition: bodyComposition(values.fatChangeKg, values.leanChangeKg),
  };
  const gap = values.storedKcal - values.balanceKcal;
  if (
    Math.abs(gap) <=
    Math.max(FIT_SHARE * Math.abs(values.balanceKcal), FIT_MIN_KCAL)
  )
    return { ...counts, ...verdict, state: 'ok', values };
  return {
    ...counts,
    ...verdict,
    state: 'deviation',
    values,
    direction: gap < 0 ? 'less' : 'more',
  };
}
