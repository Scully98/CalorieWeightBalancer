import { trendSeries } from './body';
import type { DayBalance } from './day-balance';
import type { DayRecord } from './day-record';
import { fatKgFromKcal } from './period-balance';

export type LinePoint = {
  date: string;
  // Δ kg since period start.
  weightTrend?: number;
  // Only on days with a weight measurement.
  weightPoint?: number;
  fatTrend?: number;
  // Cumulative balance ÷ 7,700.
  theoreticalFat: number;
};

export type ChartLines = {
  points: LinePoint[];
  hasWeight: boolean;
  hasFat: boolean;
};

// Change since the first period day, or since the first trend value when the
// measurements only start within the period; undefined before it.
function deltas(
  trend: readonly (number | undefined)[],
): (number | undefined)[] {
  const baseline = trend.find((value) => value !== undefined);
  return trend.map((value) =>
    value === undefined || baseline === undefined
      ? undefined
      : value - baseline,
  );
}

// Lines of the chart per period day. `records` are the lead-in days followed
// by the period days, `days` the balances of the period.
export function chartLines(
  records: readonly DayRecord[],
  days: readonly DayBalance[],
  leadInDays: number,
): ChartLines {
  const inPeriod = <T>(series: T[]) => series.slice(leadInDays);
  const weightTrend = inPeriod(trendSeries(records, 'weightKg'));
  const weight = deltas(weightTrend);
  const fat = deltas(inPeriod(trendSeries(records, 'fatKg')));
  const baseline = weightTrend.find((value) => value !== undefined);
  const periodRecords = records.slice(leadInDays);

  let cumulative = 0;
  const points = days.map((day, index) => {
    cumulative += day.kcal ?? 0;
    const measured = periodRecords[index]?.weightKg;
    return {
      date: day.date,
      weightTrend: weight[index],
      weightPoint:
        measured === undefined || baseline === undefined
          ? undefined
          : measured - baseline,
      fatTrend: fat[index],
      theoreticalFat: fatKgFromKcal(cumulative),
    };
  });

  return {
    points,
    hasWeight: weight.some((value) => value !== undefined),
    hasFat: fat.some((value) => value !== undefined),
  };
}
