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

// Above this gain in lean mass the card says part of it is lean mass.
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

export type Analysis =
  | (Counts & { state: 'insufficient'; preview?: AnalysisValues })
  | (Counts & {
      state: 'weightOnly';
      balanceFatKg: number;
      weightChangeKg: number;
    })
  | (Counts & { state: 'ok'; values: AnalysisValues })
  | (Counts & {
      state: 'deviation';
      values: AnalysisValues;
      // less: the scale shows less gain than the balance.
      direction: 'less' | 'more';
      // Part of the change is lean mass (muscle or water).
      leanShare: boolean;
    });

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
    };
  }

  const gap = values.storedKcal - values.balanceKcal;
  if (
    Math.abs(gap) <=
    Math.max(FIT_SHARE * Math.abs(values.balanceKcal), FIT_MIN_KCAL)
  )
    return { ...counts, state: 'ok', values };
  return {
    ...counts,
    state: 'deviation',
    values,
    direction: gap < 0 ? 'less' : 'more',
    leanShare: values.leanChangeKg > LEAN_SHARE_KG,
  };
}
