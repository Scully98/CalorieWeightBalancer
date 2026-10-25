import type { TFunction } from 'i18next';

import type { ChartModel } from './chart-model';
import { spokenDate } from './date-range';
import { spokenSigned } from './hero';
import { shortDate } from './period-subtitle';
import { dayLabel } from './quality';
import { formatTime } from './today';
import type { ChartBucket, DayBucket, WeekBucket } from '@/core/chart';
import type { DayFlag } from '@/core/day-balance';
import { formatKg, formatNumber, formatSigned, roundKcal } from '@/core/format';
import type { ChartLines } from '@/core/lines';
import type { RestingSource } from '@/core/resting';

// Content of the chart tooltip and what VoiceOver reads for a bar. Values
// come from the bucket as the core computed them; only rounding for display
// happens here.

export type TooltipRow = {
  label: string;
  value: string;
  // VoiceOver text of the value, when it differs (signs, units).
  spoken?: string;
  strong?: boolean;
};

export type TooltipModel = {
  title: string;
  badge?: string;
  rows: TooltipRow[];
  footer: string;
  // The whole tooltip as one sentence for VoiceOver.
  spoken: string;
};

const NONE = '–';

const FLAG_BADGE = {
  restingEstimated: 'incomplete.restingEstimated.title',
  lowFood: 'incomplete.lowFood.title',
  noFood: 'incomplete.noFood.title',
  noResting: 'incomplete.noResting.title',
} as const satisfies Record<DayFlag, string>;

function restingMark(source: RestingSource, t: TFunction): string | undefined {
  if (source === 'formula') return t('incomplete.mark.formula');
  if (source === 'source') return t('incomplete.mark.source');
  if (source === 'partial') return t('incomplete.mark.partial');
  return undefined;
}

function spokenModel(
  title: string,
  badge: string | undefined,
  rows: TooltipRow[],
  footer: string,
): string {
  return [
    title,
    badge,
    rows.map((row) => `${row.label} ${row.spoken ?? row.value}`).join(', '),
    footer,
  ]
    .filter(Boolean)
    .join('. ');
}

function dayModel(
  bucket: DayBucket,
  loadedAt: Date,
  locale: string,
  t: TFunction,
): TooltipModel {
  const kcal = (value: number) => formatNumber(roundKcal(value), locale);
  const mark = restingMark(bucket.restingSource, t);
  const balance =
    bucket.kcal === undefined
      ? { value: t('chart.tooltip.notCounted') }
      : bucket.maintenance && !bucket.today
        ? { value: t('chart.tooltip.maintenance') }
        : {
            value: t('chart.tooltip.kcal', {
              value: formatSigned(roundKcal(bucket.kcal), locale),
            }),
            spoken: t('chart.a11y.kcal', {
              value: spokenSigned(roundKcal(bucket.kcal), locale, 0, t),
            }),
          };
  const rows: TooltipRow[] = [
    {
      label: t('chart.tooltip.food'),
      value: bucket.food === undefined ? NONE : kcal(bucket.food),
    },
    {
      label: t('chart.tooltip.resting'),
      value:
        bucket.resting === undefined
          ? NONE
          : [kcal(bucket.resting), mark].filter(Boolean).join(' '),
    },
    { label: t('chart.tooltip.active'), value: kcal(bucket.active) },
    { label: t('chart.tooltip.balance'), strong: true, ...balance },
  ];

  if (bucket.today) {
    const title = t('chart.tooltip.todayTitle', {
      time: formatTime(loadedAt, locale),
    });
    const badge = t(
      bucket.today.counted
        ? 'chart.tooltip.counted'
        : 'chart.tooltip.notCountedBadge',
    );
    const footer = t('chart.tooltip.running');
    return {
      title,
      badge,
      rows,
      footer,
      spoken: spokenModel(title, badge, rows, footer),
    };
  }

  const badge = bucket.worst ? t(FLAG_BADGE[bucket.worst]) : undefined;
  const { weightKg, fatKg } = bucket.body ?? {};
  const footer =
    weightKg === undefined
      ? t('chart.tooltip.noMeasurement')
      : fatKg === undefined
        ? t('chart.tooltip.weight', { weight: formatKg(weightKg, locale) })
        : t('chart.tooltip.weightFat', {
            weight: formatKg(weightKg, locale),
            fat: formatKg(fatKg, locale),
          });
  return {
    title: dayLabel(bucket.date, t),
    badge,
    rows,
    footer,
    spoken: spokenModel(spokenDate(bucket.date, t), badge, rows, footer),
  };
}

function weekRange(bucket: WeekBucket, t: TFunction): string {
  const [, fromMonth, fromDay] = bucket.from.split('-').map(Number);
  const [, toMonth, toDay] = bucket.to.split('-').map(Number);
  if (fromMonth === toMonth)
    return t('chart.tooltip.rangeSameMonth', {
      fromDay,
      toDay,
      to: shortDate(bucket.to, t),
      month: t('date.monthsShort').split(' ')[toMonth - 1],
    });
  return t('chart.tooltip.range', {
    from: shortDate(bucket.from, t),
    to: shortDate(bucket.to, t),
  });
}

function weekModel(
  bucket: WeekBucket,
  locale: string,
  t: TFunction,
): TooltipModel {
  // Ø per day on whole kcal (CLAUDE.md).
  const whole = (value: number | undefined) =>
    value === undefined ? NONE : formatNumber(Math.round(value), locale);
  const title = t('chart.tooltip.weekTitle', {
    week: bucket.isoWeek,
    range: weekRange(bucket, t),
  });
  const badge =
    bucket.incompleteDays > 0
      ? t('chart.tooltip.incomplete', { count: bucket.incompleteDays })
      : undefined;
  const avg =
    bucket.avgKcal === undefined ? undefined : Math.round(bucket.avgKcal);
  const rows: TooltipRow[] = [
    { label: t('chart.tooltip.avgFood'), value: whole(bucket.avgFoodKcal) },
    { label: t('chart.tooltip.avgBurn'), value: whole(bucket.avgBurnKcal) },
    {
      label: t('chart.tooltip.avgBalance'),
      strong: true,
      value:
        avg === undefined
          ? NONE
          : t('chart.tooltip.kcal', { value: formatSigned(avg, locale) }),
      spoken:
        avg === undefined
          ? undefined
          : t('chart.a11y.kcal', { value: spokenSigned(avg, locale, 0, t) }),
    },
  ];
  const footer = t('chart.tooltip.weekFooter', {
    days: bucket.days,
    count: bucket.measurements,
  });
  return {
    title,
    badge,
    rows,
    footer,
    spoken: spokenModel(title, badge, rows, footer),
  };
}

export function tooltipModel(
  bucket: ChartBucket,
  loadedAt: Date,
  locale: string,
  t: TFunction,
): TooltipModel {
  return bucket.kind === 'week'
    ? weekModel(bucket, locale, t)
    : dayModel(bucket, loadedAt, locale, t);
}

// VoiceOver label of the chart: kind and number of bars, and the weight
// change at the end of the period when the scale measured.
export function chartSummary(
  model: Pick<ChartModel, 'daily' | 'slots'>,
  lines: ChartLines,
  locale: string,
  t: TFunction,
): string {
  const bars = t(
    model.daily ? 'chart.a11y.summaryDay' : 'chart.a11y.summaryWeek',
    {
      count: model.slots.length,
    },
  );
  const lastWeight = lines.points.findLast(
    (point) => point.weightTrend !== undefined,
  )?.weightTrend;
  const first = lines.points[0]?.date;
  if (lastWeight === undefined || first === undefined) return bars;
  // „plus 0,7“, one decimal like the hero.
  const value = spokenSigned(lastWeight, locale, 1, t);
  return `${bars} ${t('chart.a11y.weight', { value, date: shortDate(first, t) })}`;
}
