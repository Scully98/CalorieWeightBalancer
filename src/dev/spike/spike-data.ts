import type { ChartBucket } from '@/core/chart';
import type { ChartLines } from '@/core/lines';

// Spike only (P8 M1): the same flat series for all three chart candidates.
// The real chart model follows in M3.

export type SpikeBarKind = 'full' | 'hatch' | 'stripes' | 'today';

export type SpikeBar = {
  // Slot centre and width in day units (0 = left edge of the first day).
  center: number;
  span: number;
  value?: number;
  kind?: SpikeBarKind;
  // ✕ on the zero line.
  cross: boolean;
  label: string;
};

export type SpikeLinePoint = {
  // Day centre in day units.
  center: number;
  weight?: number;
  weightPoint?: number;
  fat?: number;
  theoretical: number;
};

export type SpikeData = {
  daily: boolean;
  // Width of the x domain in day units (period days plus a today slot).
  slots: number;
  bars: SpikeBar[];
  points: SpikeLinePoint[];
  kcalMax: number;
  kgMax: number;
};

function barKind(bucket: ChartBucket): SpikeBarKind | undefined {
  if (bucket.kind === 'week')
    return bucket.avgKcal === undefined
      ? undefined
      : bucket.incompleteDays > 0
        ? 'hatch'
        : 'full';
  if (bucket.today) return 'today';
  if (bucket.kcal === undefined) return undefined;
  if (bucket.worst === 'restingEstimated') return 'hatch';
  if (bucket.worst === 'lowFood') return 'stripes';
  if (bucket.worst === 'noFood' && bucket.maintenance) return undefined;
  return 'full';
}

export function spikeData(
  buckets: readonly ChartBucket[],
  lines: ChartLines,
): SpikeData {
  const daily = buckets.every((bucket) => bucket.kind === 'day');
  let start = 0;
  const bars = buckets.map((bucket) => {
    const span = bucket.kind === 'week' ? bucket.days : 1;
    const bar: SpikeBar = {
      center: start + span / 2,
      span,
      value: bucket.kind === 'week' ? bucket.avgKcal : bucket.kcal,
      kind: barKind(bucket),
      cross:
        bucket.kind === 'day' &&
        (bucket.flags.includes('noFood') || bucket.flags.includes('noResting')),
      label:
        bucket.kind === 'week'
          ? `KW ${bucket.isoWeek}`
          : bucket.today
            ? 'heute'
            : `${Number(bucket.date.slice(8))}.${Number(bucket.date.slice(5, 7))}.`,
    };
    start += span;
    return bar;
  });
  const points = lines.points.map((point, index) => ({
    center: index + 0.5,
    weight: point.weightTrend,
    weightPoint: point.weightPoint,
    fat: point.fatTrend,
    theoretical: point.theoreticalFat,
  }));
  const step = daily ? 500 : 250;
  const maxKcal = Math.max(0, ...bars.map((bar) => Math.abs(bar.value ?? 0)));
  const maxKg = Math.max(
    0.01,
    ...points.flatMap((point) =>
      [point.weight, point.weightPoint, point.fat, point.theoretical].map(
        (value) => Math.abs(value ?? 0),
      ),
    ),
  );
  return {
    daily,
    slots: start,
    bars,
    points,
    kcalMax: Math.max(step, Math.ceil(maxKcal / step) * step),
    kgMax: maxKg <= 0.5 ? 0.5 : Math.ceil(maxKg),
  };
}

// Index of the bar under x (in day units).
export function barAt(data: SpikeData, x: number): number | undefined {
  const index = data.bars.findIndex(
    (bar) => x >= bar.center - bar.span / 2 && x < bar.center + bar.span / 2,
  );
  return index < 0 ? undefined : index;
}

export function tooltipText(data: SpikeData, index: number): string {
  const bar = data.bars[index];
  const value = bar.value === undefined ? '–' : `${Math.round(bar.value)} kcal`;
  return `${bar.label} · ${value}${bar.kind && bar.kind !== 'full' ? ` · ${bar.kind}` : ''}`;
}
