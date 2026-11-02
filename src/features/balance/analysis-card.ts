import type { TFunction } from 'i18next';

import { spokenSigned } from './hero';
import { shortDate } from './period-subtitle';
import {
  KCAL_PER_KG_FAT_TISSUE,
  KCAL_PER_KG_LEAN,
  MIN_ANALYSIS_DAYS,
  MIN_MEASUREMENTS,
  comparisonBars,
  weightBars,
  type Analysis,
  type AnalysisValues,
  type Composition,
} from '@/core/analysis';
import { TREND_DAYS } from '@/core/body';
import type { DayBalance } from '@/core/day-balance';
import {
  formatKg,
  formatNumber,
  formatSigned,
  formatSignedKg,
  roundKcal,
} from '@/core/format';

// Solid: measured or balance. Hatch: lean mass. Gap: dashed, what is missing.
export type BarSegmentKind = 'solid' | 'hatch' | 'gap';
// Share of the longest bar; signed when the layout is diverging.
export type BarSegment = { kind: BarSegmentKind; share: number };

export type ComparisonRow = {
  label: string;
  value: string;
  // Below the label, e.g. „wenn alles Fett wäre“.
  note?: string;
  segments: BarSegment[];
  spoken: string;
};

// Plain: no mark, for the gap of diverging bars, which only has its number.
export type LegendEntry = { kind: BarSegmentKind | 'plain'; text: string };

export type ComparisonModel = {
  title?: string;
  // „Waage zeigt 61 % der Bilanz“; none while insufficient and weight only.
  summary?: string;
  layout: 'aligned' | 'diverging';
  balance: ComparisonRow;
  scale: ComparisonRow;
  legend: LegendEntry[];
};

export type BurnPoint = { label: string; value: string; actual: boolean };

export type BurnDifference =
  // Lower value on the left; the line has a fixed length.
  | { kind: 'line'; difference: string; lower: BurnPoint; upper: BurnPoint }
  | { kind: 'match'; tracker: string };

export type AnalysisCardModel = {
  title: string;
  subtitle: string;
  headerLabel: string;
  // Only while insufficient: the dashed hint above the dimmed body.
  locked?: { hint: string; soFar: string };
  dimmed: boolean;
  body:
    | {
        kind: 'composition';
        burn: {
          value: string;
          unit: string;
          difference: BurnDifference;
          spoken: string;
        };
        comparison: ComparisonModel;
        disclosure: {
          // The short sentence, or the question while insufficient.
          toggle: string;
          // Verdict, cause and composition; none while insufficient.
          verdict?: string;
          text: string;
          formula: string;
        };
      }
    | {
        kind: 'weightOnly';
        comparison: ComparisonModel;
        note: string;
      };
};

const NONE = '–';

// The scale's stored energy is coarse: shown to 100 kcal (design).
const roundStored = (value: number) => Math.round(value / 100) * 100;

// Lean share in steps of 10 %; below 10 % to the whole percent, at least 1.
function sharePercent(share: number): number {
  const percent = share * 100;
  return percent >= 10
    ? Math.round(percent / 10) * 10
    : Math.max(1, Math.round(percent));
}

function verdictText(
  analysis: Extract<Analysis, { state: 'ok' | 'deviation' }>,
  locale: string,
  t: TFunction,
): string {
  const { expected } = analysis;
  const parts =
    analysis.state === 'ok'
      ? [t(`analysis.verdict.${expected}.ok`)]
      : [
          t(`analysis.verdict.${expected}.${analysis.direction}`),
          t(`analysis.verdict.cause.${analysis.direction}`),
        ];
  const composition = compositionText(analysis, locale, t);
  return [...parts, ...(composition ? [composition] : [])].join(' ');
}

function compositionText(
  {
    composition,
    values,
  }: { composition?: Composition; values: AnalysisValues },
  locale: string,
  t: TFunction,
): string | undefined {
  if (!composition) return undefined;
  if (composition.kind === 'share')
    return t(
      composition.change === 'gain'
        ? 'analysis.composition.shareGain'
        : 'analysis.composition.shareLoss',
      { percent: sharePercent(composition.leanShare) },
    );
  return t(
    composition.fat === 'loss'
      ? 'analysis.composition.fatLossLeanGain'
      : 'analysis.composition.fatGainLeanLoss',
    {
      fat: formatKg(Math.abs(values.fatChangeKg), locale),
      lean: formatKg(Math.abs(values.leanChangeKg), locale),
    },
  );
}

function weightOnlyNote(
  analysis: Extract<Analysis, { state: 'weightOnly' }>,
  t: TFunction,
): string {
  if (analysis.compositionMeasurements === 0)
    return t('analysis.weightOnly.none');
  if (analysis.compositionMeasurements < MIN_MEASUREMENTS)
    return t('analysis.weightOnly.few', {
      count: analysis.compositionMeasurements,
      min: MIN_MEASUREMENTS,
    });
  return t('analysis.weightOnly.short', {
    days: t('analysis.days', { count: analysis.compositionSpanDays }),
    min: MIN_ANALYSIS_DAYS,
  });
}

function lockedSoFar(
  analysis: Extract<Analysis, { state: 'insufficient' }>,
  measurements: string,
  t: TFunction,
): string {
  if (analysis.days < MIN_ANALYSIS_DAYS)
    return t('analysis.locked.soFarDays', {
      days: t('analysis.days', { count: analysis.days }),
      measurements,
    });
  if (analysis.measurements < MIN_MEASUREMENTS)
    return t('analysis.locked.soFar', { measurements });
  return t('analysis.locked.soFarSpan', {
    measurements,
    days: t('analysis.days', { count: analysis.spanDays }),
  });
}

// The line beside „Bilanz vs. Waage“: a share only says something with the
// same sign and a balance well away from zero.
function comparisonSummary(
  analysis: Extract<Analysis, { state: 'ok' | 'deviation' }>,
  opposite: boolean,
  t: TFunction,
): string {
  if (analysis.state === 'ok') return t('analysis.compare.equal');
  if (opposite) return t('analysis.compare.opposite');
  if (analysis.expected === 'even')
    return t(`analysis.compare.${analysis.direction}`);
  return t('analysis.compare.share', {
    percent: Math.round(
      (analysis.values.storedKcal / analysis.values.balanceKcal) * 100,
    ),
  });
}

function shortSentence(
  analysis: Extract<Analysis, { state: 'ok' | 'deviation' }>,
  t: TFunction,
): string {
  return t(
    analysis.state === 'ok'
      ? 'analysis.short.ok'
      : `analysis.short.${analysis.direction}`,
  );
}

// Actual burn, the tracker and the line of the difference between them.
function burnDifference(
  actual: number | undefined,
  tracker: number | undefined,
  locale: string,
  t: TFunction,
): BurnDifference {
  const number = (value: number | undefined) =>
    value === undefined ? NONE : formatNumber(value, locale);
  if (actual !== undefined && actual === tracker)
    return {
      kind: 'match',
      tracker: t('analysis.burn.matchTracker', { value: number(tracker) }),
    };
  const actualPoint: BurnPoint = {
    label: t('analysis.burn.actual'),
    value: number(actual),
    actual: true,
  };
  const trackerPoint: BurnPoint = {
    label: t('analysis.burn.tracker'),
    value: number(tracker),
    actual: false,
  };
  const lowerActual =
    actual !== undefined && tracker !== undefined && actual < tracker;
  return {
    kind: 'line',
    difference: t('analysis.burn.difference', {
      value:
        actual === undefined || tracker === undefined
          ? NONE
          : formatSigned(actual - tracker, locale),
    }),
    lower: lowerActual ? actualPoint : trackerPoint,
    upper: lowerActual ? trackerPoint : actualPoint,
  };
}

// „Dein tatsächlicher Verbrauch“: texts and numbers of the card from the core's
// analysis. The words are chosen here from the state, never in the core.
export function analysisCardModel(
  analysis: Analysis,
  days: readonly DayBalance[],
  locale: string,
  t: TFunction,
): AnalysisCardModel {
  const kg = (value: number) => formatSignedKg(value, locale);
  const burn = (value: number) => formatNumber(roundKcal(value), locale);
  const spoken = (value: number, digits = 0) =>
    spokenSigned(value, locale, digits, t);
  const measurements = t('analysis.measurements', {
    count: analysis.measurements,
  });
  // The days compared, which can be fewer than the period; the period while
  // locked.
  const compared =
    analysis.state === 'insufficient' ? undefined : analysis.compared;
  const first = compared?.from ?? days[0]?.date;
  const last = compared?.to ?? days.at(-1)?.date;
  const from = first ? shortDate(first, t) : NONE;
  const to = last ? shortDate(last, t) : NONE;
  const dayCount = t('analysis.days', {
    count: compared?.days ?? analysis.days,
  });
  const header = (title: string) => ({
    title,
    subtitle: t('analysis.subtitle', {
      from,
      to,
      days: dayCount,
      measurements,
    }),
    headerLabel: t('a11y.analysisHeader', {
      title,
      from,
      to,
      days: dayCount,
      measurements,
    }),
  });
  const labels = {
    balance: t('analysis.balance'),
    scale: t('analysis.scale'),
  };

  if (analysis.state === 'weightOnly') {
    const trend = t('analysis.weightOnly.trend', { trend: TREND_DAYS });
    const bars = weightBars(analysis.balanceFatKg, analysis.weightChangeKg);
    return {
      ...header(t('analysis.titleWeightOnly')),
      dimmed: false,
      body: {
        kind: 'weightOnly',
        comparison: {
          layout: bars.layout,
          balance: {
            label: labels.balance,
            value: t('analysis.weightOnly.balanceFat', {
              value: kg(analysis.balanceFatKg),
            }),
            note: t('analysis.weightOnly.allFat'),
            segments: [{ kind: 'solid', share: bars.balance }],
            spoken: t('a11y.analysisBalanceWeightOnly', {
              fat: spoken(analysis.balanceFatKg, 1),
            }),
          },
          scale: {
            label: labels.scale,
            value: t('analysis.weightOnly.weight', {
              value: kg(analysis.weightChangeKg),
            }),
            note: trend,
            segments: [{ kind: 'solid', share: bars.scale }],
            spoken: t('a11y.analysisScaleWeightOnly', {
              weight: spoken(analysis.weightChangeKg, 1),
              trend,
            }),
          },
          legend: [],
        },
        note: weightOnlyNote(analysis, t),
      },
    };
  }

  const values =
    analysis.state === 'insufficient' ? analysis.preview : analysis.values;
  const unknown = (label: string) => t('a11y.todayUnknown', { label });
  const title = t('analysis.title');
  const actual = values && roundKcal(values.actualBurnPerDay);
  const tracker = values && roundKcal(values.trackerBurnPerDay);
  const balanceKcal = values && roundKcal(values.balanceKcal);
  const storedKcal = values && roundStored(values.storedKcal);
  const bars = values && comparisonBars(values);
  const aligned = bars?.layout !== 'diverging';

  const locked =
    analysis.state === 'insufficient'
      ? {
          hint: t('analysis.locked.hint', {
            days: MIN_ANALYSIS_DAYS,
            measurements: MIN_MEASUREMENTS,
          }),
          soFar: lockedSoFar(analysis, measurements, t),
        }
      : undefined;

  return {
    ...header(title),
    locked,
    dimmed: locked !== undefined,
    body: {
      kind: 'composition',
      burn: {
        value: actual === undefined ? NONE : formatNumber(actual, locale),
        unit: t('analysis.burn.unit'),
        difference: burnDifference(actual, tracker, locale, t),
        spoken:
          actual === undefined || tracker === undefined
            ? unknown(title)
            : t('a11y.analysisBurn', {
                actual: burn(actual),
                tracker: burn(tracker),
                difference: spoken(actual - tracker),
              }),
      },
      comparison: {
        title: t('analysis.compare.title'),
        summary:
          analysis.state === 'insufficient' || !bars
            ? undefined
            : comparisonSummary(analysis, bars.opposite, t),
        layout: bars?.layout ?? 'aligned',
        balance: {
          label: labels.balance,
          value: t('analysis.kcal', {
            value:
              balanceKcal === undefined
                ? NONE
                : formatSigned(balanceKcal, locale),
          }),
          segments: bars
            ? [
                { kind: 'solid', share: bars.balance },
                { kind: 'gap', share: bars.gapOnBalance },
              ]
            : [],
          spoken:
            balanceKcal === undefined
              ? unknown(labels.balance)
              : t('a11y.analysisBalance', { kcal: spoken(balanceKcal) }),
        },
        scale: {
          label: labels.scale,
          value: t('analysis.approxKcal', {
            value:
              storedKcal === undefined
                ? NONE
                : formatSigned(storedKcal, locale),
          }),
          segments: bars
            ? [
                { kind: 'solid', share: bars.fat },
                { kind: 'hatch', share: bars.lean },
                { kind: 'gap', share: bars.gapOnScale },
              ]
            : [],
          spoken:
            values === undefined || storedKcal === undefined
              ? unknown(labels.scale)
              : t('a11y.analysisScale', {
                  kcal: spoken(storedKcal),
                  fat: spoken(values.fatChangeKg, 1),
                  lean: spoken(values.leanChangeKg, 1),
                }),
        },
        legend: [
          {
            kind: 'solid',
            text: t('analysis.legend.fat', {
              value: values ? kg(values.fatChangeKg) : NONE,
            }),
          },
          {
            kind: 'hatch',
            text: t('analysis.legend.lean', {
              value: values ? kg(values.leanChangeKg) : NONE,
            }),
          },
          {
            kind: aligned ? 'gap' : 'plain',
            text: t('analysis.legend.gap', {
              value:
                balanceKcal === undefined || storedKcal === undefined
                  ? NONE
                  : formatNumber(Math.abs(balanceKcal - storedKcal), locale),
            }),
          },
        ],
      },
      disclosure: {
        toggle:
          analysis.state === 'insufficient'
            ? t('analysis.explanation.toggle')
            : shortSentence(analysis, t),
        verdict:
          analysis.state === 'insufficient'
            ? undefined
            : verdictText(analysis, locale, t),
        text: t('analysis.explanation.text'),
        formula: t('analysis.explanation.formula', {
          fat: formatNumber(KCAL_PER_KG_FAT_TISSUE, locale),
          lean: formatNumber(KCAL_PER_KG_LEAN, locale),
          trend: TREND_DAYS,
        }),
      },
    },
  };
}
