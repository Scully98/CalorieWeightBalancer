import type { TFunction } from 'i18next';

import { shortDate } from './period-subtitle';
import type { ChartBucket, DayBucket } from '@/core/chart';
import { formatSigned, formatSignedKg } from '@/core/format';
import type { ChartLines, LinePoint } from '@/core/lines';

// Geometry and labels of the chart from the finished series of the core
// (P3). Nothing here sums, averages or subtracts values: it only places them.
// Coordinates are in the design's viewBox; the canvas scales it to its width.

export const VIEW = { width: 350, height: 232 } as const;
export const PLOT = {
  left: 40,
  right: 316,
  width: 276,
  zeroY: 106,
  half: 92,
} as const;
// Tick labels sit centred on their line; SVG text needs a baseline.
const LABEL_BASELINE = 3.5;
export const AXIS_LABEL = { leftX: 37, rightX: 322, xBaseline: 221 } as const;
export const GUIDE = { top: 0, bottom: 200 } as const;

const TICKS = [1, 0.5, 0, -0.5, -1] as const;
const MAX_BAR_WIDTH = 26;
const DAY_BAR_SHARE = 0.7;
const WEEK_BAR_SHARE = 0.78;
const MIN_BAR_HEIGHT = 1.5;
// The dashed outline of today stays readable on small values.
const MIN_TODAY_HEIGHT = 14;
export const CROSS_SIZE = 7;
const DAY_STEP_KCAL = 500;
const WEEK_STEP_KCAL = 250;
const MIN_KG_SCALE = 0.5;
// Up to this many days each day is labelled by its weekday.
const WEEKDAY_LABEL_DAYS = 10;
const DATE_LABEL_EVERY = 7;
// No date label this close to the end, where „heute“ or the last bar sits.
const DATE_LABEL_END_GAP = 4;
// More weeks than this get every second label.
const WEEK_LABELS_ALL = 9;

export type ChartSeries = 'bars' | 'weight' | 'fat' | 'theoretical';
export type HiddenSeries = Partial<Record<ChartSeries, boolean>>;

export type BarKind = 'full' | 'hatch' | 'stripes' | 'today';

export type ChartSlot = {
  bucket: ChartBucket;
  center: number;
  // Hit area: the full slot.
  left: number;
  width: number;
};

export type ChartBar = {
  slot: number;
  kind: BarKind;
  plus: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ChartTick = {
  y: number;
  baseline: number;
  left: string;
  right: string;
};

export type ChartLabel = { x: number; text: string };

export type LineSeries = Exclude<ChartSeries, 'bars'>;

export type ChartLine = { series: LineSeries; segments: string[] };

export type ChartPoint = { x: number; y: number };

export type LegendHint =
  | 'trend'
  | 'estimated'
  | 'weekIncomplete'
  | 'lowFood'
  | 'noFood'
  | 'todayExcluded'
  | 'todayIncluded';

export type ChartLegend = {
  chips: { series: ChartSeries; visible: boolean }[];
  hints: LegendHint[];
};

export type ChartModel = {
  daily: boolean;
  title: string;
  subtitle: string;
  slots: ChartSlot[];
  bars: ChartBar[];
  // Centres of the ✕ on the zero line.
  crosses: number[];
  ticks: ChartTick[];
  // False without a visible line: no kg labels.
  showRight: boolean;
  xLabels: ChartLabel[];
  lines: ChartLine[];
  points: ChartPoint[];
  legend: ChartLegend;
};

function niceScale(maxAbs: number, step: number): number {
  return Math.max(step, Math.ceil(maxAbs / step) * step);
}

function kgScale(maxAbs: number): number {
  return maxAbs <= MIN_KG_SCALE ? MIN_KG_SCALE : Math.ceil(maxAbs);
}

function bucketKcal(bucket: ChartBucket): number | undefined {
  return bucket.kind === 'week' ? bucket.avgKcal : bucket.kcal;
}

// Pattern of a bar after Key Decisions 6 and 9; undefined: no bar, at most
// a cross (zero day, no resting energy).
function barKind(bucket: ChartBucket): BarKind | undefined {
  if (bucket.kind === 'week') {
    if (bucket.avgKcal === undefined) return undefined;
    return bucket.incompleteDays > 0 ? 'hatch' : 'full';
  }
  if (bucket.today) return bucket.kcal === undefined ? undefined : 'today';
  if (bucket.kcal === undefined || bucket.maintenance) return undefined;
  if (bucket.worst === 'restingEstimated') return 'hatch';
  if (bucket.worst === 'lowFood') return 'stripes';
  return 'full';
}

function hasCross(bucket: ChartBucket): boolean {
  return (
    bucket.kind === 'day' &&
    !bucket.today &&
    (bucket.flags.includes('noFood') || bucket.flags.includes('noResting'))
  );
}

function slotsOf(buckets: readonly ChartBucket[]): {
  slots: ChartSlot[];
  dayWidth: number;
} {
  const days = buckets.reduce(
    (sum, bucket) => sum + (bucket.kind === 'week' ? bucket.days : 1),
    0,
  );
  const dayWidth = PLOT.width / Math.max(1, days);
  let start = 0;
  const slots = buckets.map((bucket) => {
    const span = bucket.kind === 'week' ? bucket.days : 1;
    const slot = {
      bucket,
      center: PLOT.left + (start + span / 2) * dayWidth,
      left: PLOT.left + start * dayWidth,
      width: span * dayWidth,
    };
    start += span;
    return slot;
  });
  return { slots, dayWidth };
}

function barOf(
  slot: ChartSlot,
  index: number,
  daily: boolean,
  kcalScale: number,
): ChartBar | undefined {
  const kind = barKind(slot.bucket);
  const value = bucketKcal(slot.bucket);
  if (!kind || value === undefined) return undefined;
  const width = Math.min(
    MAX_BAR_WIDTH,
    slot.width * (daily ? DAY_BAR_SHARE : WEEK_BAR_SHARE),
  );
  const height = Math.max(
    kind === 'today' ? MIN_TODAY_HEIGHT : MIN_BAR_HEIGHT,
    (Math.abs(value) / kcalScale) * PLOT.half,
  );
  const plus = value >= 0;
  return {
    slot: index,
    kind,
    plus,
    x: slot.center - width / 2,
    y: plus ? PLOT.zeroY - height : PLOT.zeroY,
    width,
    height,
  };
}

// Day of the month and month (1–12) of a YYYY-MM-DD key.
function keyParts(key: string): {
  day: number;
  month: number;
  weekday: number;
} {
  const [year, month, day] = key.split('-').map(Number);
  // Monday first, like the weekday strings.
  const weekday = (new Date(year, month - 1, day).getDay() + 6) % 7;
  return { day, month, weekday };
}

function dayLabels(slots: ChartSlot[], t: TFunction): ChartLabel[] {
  const days = slots.filter(
    (slot) =>
      !(slot.bucket.kind === 'day' && slot.bucket.today?.counted === false),
  ).length;
  const weekdays = t('date.weekdaysAbbr').split(' ');
  const labels: ChartLabel[] = [];
  slots.forEach((slot, index) => {
    const bucket = slot.bucket as DayBucket;
    if (bucket.today) {
      labels.push({ x: slot.center, text: t('chart.today') });
      return;
    }
    const { day, month, weekday } = keyParts(bucket.date);
    if (days <= WEEKDAY_LABEL_DAYS)
      labels.push({ x: slot.center, text: weekdays[weekday] });
    else if (
      index % DATE_LABEL_EVERY === 0 &&
      index <= days - DATE_LABEL_END_GAP
    )
      labels.push({
        x: slot.center,
        text: t('chart.dayMonth', { day, month }),
      });
  });
  return labels;
}

function weekLabels(slots: ChartSlot[], t: TFunction): ChartLabel[] {
  const every = slots.length > WEEK_LABELS_ALL ? 2 : 1;
  return slots.flatMap((slot, index) =>
    slot.bucket.kind === 'week' && (slots.length - 1 - index) % every === 0
      ? [
          {
            x: slot.center,
            text: t('chart.week', { week: slot.bucket.isoWeek }),
          },
        ]
      : [],
  );
}

const LINE_VALUE: Record<LineSeries, (point: LinePoint) => number | undefined> =
  {
    weight: (point) => point.weightTrend,
    fat: (point) => point.fatTrend,
    theoretical: (point) => point.theoreticalFat,
  };

// Drawing order from the design: theoretical below fat below weight.
const LINE_ORDER: readonly LineSeries[] = ['theoretical', 'fat', 'weight'];

function lineAvailable(series: LineSeries, lines: ChartLines): boolean {
  if (series === 'weight') return lines.hasWeight;
  if (series === 'fat') return lines.hasFat;
  return lines.points.length > 0;
}

// Polyline segments over defined values; a gap where a value is missing.
function segments(
  points: readonly LinePoint[],
  value: (point: LinePoint) => number | undefined,
  x: (index: number) => number,
  y: (kg: number) => number,
): string[] {
  const result: string[] = [];
  let current: string[] = [];
  points.forEach((point, index) => {
    const kg = value(point);
    if (kg === undefined) {
      if (current.length > 0) result.push(current.join(' '));
      current = [];
      return;
    }
    current.push(`${x(index)},${y(kg)}`);
  });
  if (current.length > 0) result.push(current.join(' '));
  return result;
}

export function chartModel(
  chart: { buckets: readonly ChartBucket[]; lines: ChartLines },
  hidden: HiddenSeries,
  locale: string,
  t: TFunction,
): ChartModel {
  const { buckets, lines } = chart;
  const daily = buckets.every((bucket) => bucket.kind === 'day');
  const { slots, dayWidth } = slotsOf(buckets);

  const kcalValues = buckets.map((bucket) => Math.abs(bucketKcal(bucket) ?? 0));
  const kcalScale = niceScale(
    Math.max(0, ...kcalValues),
    daily ? DAY_STEP_KCAL : WEEK_STEP_KCAL,
  );

  const visibleLines = LINE_ORDER.filter(
    (series) => lineAvailable(series, lines) && !hidden[series],
  );
  const kgValues = lines.points.flatMap((point) => [
    ...visibleLines.map((series) => LINE_VALUE[series](point)),
    visibleLines.includes('weight') ? point.weightPoint : undefined,
  ]);
  const kgScaleValue = kgScale(
    Math.max(
      0,
      ...kgValues.flatMap((value) =>
        value === undefined ? [] : [Math.abs(value)],
      ),
    ),
  );
  const yKg = (kg: number) => PLOT.zeroY - (kg / kgScaleValue) * PLOT.half;
  const lineX = (index: number) => PLOT.left + (index + 0.5) * dayWidth;

  const bars = hidden.bars
    ? []
    : slots.flatMap((slot, index) => {
        const bar = barOf(slot, index, daily, kcalScale);
        return bar ? [bar] : [];
      });
  const crosses = hidden.bars
    ? []
    : slots.filter((slot) => hasCross(slot.bucket)).map((slot) => slot.center);

  const ticks = TICKS.map((fraction) => {
    const y = PLOT.zeroY - fraction * PLOT.half;
    return {
      y,
      baseline: y + LABEL_BASELINE,
      left: fraction === 0 ? '0' : formatSigned(kcalScale * fraction, locale),
      right:
        fraction === 0 ? '0' : formatSignedKg(kgScaleValue * fraction, locale),
    };
  });

  const firstDate = buckets[0]
    ? buckets[0].kind === 'week'
      ? buckets[0].from
      : buckets[0].date
    : undefined;
  const today = buckets.find(
    (bucket): bucket is DayBucket => bucket.kind === 'day' && !!bucket.today,
  );
  const hasTrend = lines.hasWeight || lines.hasFat;
  const hints: LegendHint[] = [
    ...(hasTrend ? (['trend'] as const) : []),
    ...(daily
      ? ([
          'estimated',
          'lowFood',
          'noFood',
          ...(today
            ? [today.today?.counted ? 'todayIncluded' : 'todayExcluded']
            : []),
        ] as LegendHint[])
      : (['weekIncomplete'] as const)),
  ];
  const chipSeries: ChartSeries[] = [
    'bars',
    ...(lines.hasWeight ? (['weight'] as const) : []),
    ...(lines.hasFat ? (['fat'] as const) : []),
    ...(lines.points.length > 0 ? (['theoretical'] as const) : []),
  ];

  return {
    daily,
    title: t(daily ? 'chart.titleDay' : 'chart.titleWeek'),
    subtitle: firstDate
      ? t(daily ? 'chart.subtitleDay' : 'chart.subtitleWeek', {
          date: shortDate(firstDate, t),
        })
      : '',
    slots,
    bars,
    crosses,
    ticks,
    showRight: visibleLines.length > 0,
    xLabels: daily ? dayLabels(slots, t) : weekLabels(slots, t),
    lines: visibleLines.map((series) => ({
      series,
      segments: segments(lines.points, LINE_VALUE[series], lineX, yKg),
    })),
    points: visibleLines.includes('weight')
      ? lines.points.flatMap((point, index) =>
          point.weightPoint === undefined
            ? []
            : [{ x: lineX(index), y: yKg(point.weightPoint) }],
        )
      : [],
    legend: {
      chips: chipSeries.map((series) => ({
        series,
        visible: !hidden[series],
      })),
      hints,
    },
  };
}

// Index of the slot under x (viewBox units); clamped into the plot while
// dragging, undefined outside it otherwise.
export function slotAt(
  slots: readonly ChartSlot[],
  x: number,
  clamp = false,
): number | undefined {
  if (slots.length === 0) return undefined;
  const index = slots.findIndex(
    (slot) => x >= slot.left && x < slot.left + slot.width,
  );
  if (index >= 0) return index;
  if (!clamp) return undefined;
  return x < slots[0].left ? 0 : slots.length - 1;
}
