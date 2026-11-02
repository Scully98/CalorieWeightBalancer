import { bodyValues, TREND_DAYS, trendSeries, type BodyKey } from './body';
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

// The days the comparison covers, both included (YYYY-MM-DD).
export type ComparedDays = { from: string; to: string };

export type Analysis =
  | (Counts & {
      state: 'insufficient';
      // Days the weight measurements cover.
      spanDays: number;
      // Only when the measurements cover the whole period.
      preview?: AnalysisValues;
    })
  | (Counts & {
      state: 'weightOnly';
      compared: ComparedDays;
      balanceFatKg: number;
      weightChangeKg: number;
      // Days with fat and lean mass in the period, and the days they cover;
      // one of them is below its minimum.
      compositionMeasurements: number;
      compositionSpanDays: number;
    })
  | (Counts &
      Verdict & { state: 'ok'; compared: ComparedDays; values: AnalysisValues })
  | (Counts &
      Verdict & {
        state: 'deviation';
        compared: ComparedDays;
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

// Period days the scale can speak for, as indices of the period. It starts on
// day 0 with a measurement in that day's trend window, else at the first
// measurement. It runs to the last day with a measurement in that day's window,
// else only to the last measurement: older values would stand in for days the
// scale has not seen.
type Span = { start: number; end: number };

function measuredSpan(
  records: readonly DayRecord[],
  key: BodyKey,
  leadInDays: number,
): Span | undefined {
  const measured = records.flatMap((record, index) =>
    bodyValues(record)[key] === undefined ? [] : [index - leadInDays],
  );
  const inPeriod = measured.filter((index) => index >= 0);
  if (inPeriod.length === 0) return undefined;
  const lastDay = records.length - leadInDays - 1;
  const lastMeasured = inPeriod[inPeriod.length - 1];
  return {
    start: measured.some((index) => index < 0 && index > -TREND_DAYS)
      ? 0
      : inPeriod[0],
    end: lastDay - lastMeasured < TREND_DAYS ? lastDay : lastMeasured,
  };
}

function spanDays(span: Span | undefined): number {
  return span ? span.end - span.start + 1 : 0;
}

function comparedDays(
  days: readonly DayBalance[],
  { start, end }: Span,
): ComparedDays {
  return { from: days[start].date, to: days[end].date };
}

function trendEnds(
  records: readonly DayRecord[],
  key: BodyKey,
  leadInDays: number,
  span: Span,
): { start: number; end: number } | undefined {
  const trend = trendSeries(records, key).slice(leadInDays);
  const start = trend[span.start];
  const end = trend[span.end];
  return start === undefined || end === undefined ? undefined : { start, end };
}

function analysisValues(
  records: readonly DayRecord[],
  days: readonly DayBalance[],
  leadInDays: number,
  span: Span,
): AnalysisValues | undefined {
  const weight = trendEnds(records, 'weightKg', leadInDays, span);
  const fat = trendEnds(records, 'fatKg', leadInDays, span);
  const lean = trendEnds(records, 'leanKg', leadInDays, span);
  const counted = days
    .slice(span.start, span.end + 1)
    .filter((day) => day.kcal !== undefined);
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
// + 1,800 · Δ lean, with start and end as 7-day trend. Both sides cover the
// same days, see measuredSpan. `records` are the lead-in days followed by the
// period days, `days` the balances of the period.
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
  const weightSpan = measuredSpan(records, 'weightKg', leadInDays);
  const fatSpan = measuredSpan(records, 'fatKg', leadInDays);

  if (
    !weightSpan ||
    counts.days < MIN_ANALYSIS_DAYS ||
    counts.measurements < MIN_MEASUREMENTS ||
    spanDays(weightSpan) < MIN_ANALYSIS_DAYS
  )
    return {
      ...counts,
      state: 'insufficient',
      spanDays: spanDays(weightSpan),
      preview:
        fatSpan && spanDays(fatSpan) === counts.days
          ? analysisValues(records, days, leadInDays, fatSpan)
          : undefined,
    };

  const compositionMeasurements = period.filter(
    (record) => bodyValues(record).fatKg !== undefined,
  ).length;
  if (
    !fatSpan ||
    compositionMeasurements < MIN_MEASUREMENTS ||
    spanDays(fatSpan) < MIN_ANALYSIS_DAYS
  ) {
    const weight = trendEnds(records, 'weightKg', leadInDays, weightSpan);
    const balanceKcal = days
      .slice(weightSpan.start, weightSpan.end + 1)
      .reduce((sum, day) => sum + (day.kcal ?? 0), 0);
    return {
      ...counts,
      state: 'weightOnly',
      compared: comparedDays(days, weightSpan),
      balanceFatKg: fatKgFromKcal(balanceKcal),
      weightChangeKg: weight ? weight.end - weight.start : 0,
      compositionMeasurements,
      compositionSpanDays: spanDays(fatSpan),
    };
  }

  const values = analysisValues(records, days, leadInDays, fatSpan);
  // No day of the span has a balance.
  if (!values)
    return { ...counts, state: 'insufficient', spanDays: spanDays(weightSpan) };

  const compared = comparedDays(days, fatSpan);
  const verdict: Verdict = {
    expected: expectedChange(values.balanceKcal),
    composition: bodyComposition(values.fatChangeKg, values.leanChangeKg),
  };
  const gap = values.storedKcal - values.balanceKcal;
  if (
    Math.abs(gap) <=
    Math.max(FIT_SHARE * Math.abs(values.balanceKcal), FIT_MIN_KCAL)
  )
    return { ...counts, ...verdict, state: 'ok', compared, values };
  return {
    ...counts,
    ...verdict,
    state: 'deviation',
    compared,
    values,
    direction: gap < 0 ? 'less' : 'more',
  };
}
