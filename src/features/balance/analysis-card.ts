import type { TFunction } from 'i18next';

import { spokenSigned } from './hero';
import { shortDate } from './period-subtitle';
import {
  KCAL_PER_KG_FAT_TISSUE,
  KCAL_PER_KG_LEAN,
  MIN_ANALYSIS_DAYS,
  MIN_MEASUREMENTS,
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

// A line below a column value; small lines are the muted footnotes.
export type AnalysisLine = { text: string; note?: string; small?: boolean };

export type AnalysisColumn = {
  label: string;
  value: string;
  lines: AnalysisLine[];
  spoken: string;
};

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
        balance: AnalysisColumn;
        scale: AnalysisColumn;
        // Verdict, cause and composition; none while insufficient.
        verdict?: string;
        burn: {
          label: string;
          value: string;
          unit: string;
          detail: string;
          spoken: string;
        };
        explanation: { toggle: string; text: string; formula: string };
      }
    | {
        kind: 'weightOnly';
        balance: AnalysisColumn;
        scale: AnalysisColumn;
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

// „Passt die Bilanz zur Waage?“: texts and numbers of the card from the core's
// analysis. The words are chosen here from the state, never in the core.
export function analysisCardModel(
  analysis: Analysis,
  days: readonly DayBalance[],
  locale: string,
  t: TFunction,
): AnalysisCardModel {
  const kcal = (value: number) => formatSigned(roundKcal(value), locale);
  const kg = (value: number) => formatSignedKg(value, locale);
  const burn = (value: number) => formatNumber(roundKcal(value), locale);
  const spoken = (value: number, digits = 0) =>
    spokenSigned(value, locale, digits, t);
  const measurements = t('analysis.measurements', {
    count: analysis.measurements,
  });
  const first = days[0]?.date;
  const last = days.at(-1)?.date;
  const from = first ? shortDate(first, t) : NONE;
  const to = last ? shortDate(last, t) : NONE;
  const title = t('analysis.title');
  const header = {
    title,
    subtitle: t('analysis.subtitle', { from, to, measurements }),
    headerLabel: t('a11y.analysisHeader', { title, from, to, measurements }),
  };
  const columnLabels = {
    balance: t('analysis.balance'),
    scale: t('analysis.scale'),
  };

  if (analysis.state === 'weightOnly') {
    const trend = t('analysis.weightOnly.trend', { trend: TREND_DAYS });
    return {
      ...header,
      dimmed: false,
      body: {
        kind: 'weightOnly',
        balance: {
          label: columnLabels.balance,
          value: t('analysis.weightOnly.balanceFat', {
            value: kg(analysis.balanceFatKg),
          }),
          lines: [{ text: t('analysis.weightOnly.allFat'), small: true }],
          spoken: t('a11y.analysisBalanceWeightOnly', {
            fat: spoken(analysis.balanceFatKg, 1),
          }),
        },
        scale: {
          label: columnLabels.scale,
          value: t('analysis.weightOnly.weight', {
            value: kg(analysis.weightChangeKg),
          }),
          lines: [{ text: trend, small: true }],
          spoken: t('a11y.analysisScaleWeightOnly', {
            weight: spoken(analysis.weightChangeKg, 1),
            trend,
          }),
        },
        note:
          analysis.compositionMeasurements === 0
            ? t('analysis.weightOnly.none')
            : t('analysis.weightOnly.few', {
                count: analysis.compositionMeasurements,
                min: MIN_MEASUREMENTS,
              }),
      },
    };
  }

  const values =
    analysis.state === 'insufficient' ? analysis.preview : analysis.values;
  const unknown = (label: string) => t('a11y.todayUnknown', { label });
  const burnLabel = t('analysis.burn.label');
  const actual = values && roundKcal(values.actualBurnPerDay);
  const tracker = values && roundKcal(values.trackerBurnPerDay);

  const locked =
    analysis.state === 'insufficient'
      ? {
          hint: t('analysis.locked.hint', {
            days: MIN_ANALYSIS_DAYS,
            measurements: MIN_MEASUREMENTS,
          }),
          soFar:
            analysis.days < MIN_ANALYSIS_DAYS
              ? t('analysis.locked.soFarDays', {
                  days: t('analysis.days', { count: analysis.days }),
                  measurements,
                })
              : t('analysis.locked.soFar', { measurements }),
        }
      : undefined;

  return {
    ...header,
    locked,
    dimmed: locked !== undefined,
    body: {
      kind: 'composition',
      balance: {
        label: columnLabels.balance,
        value: t('analysis.kcal', {
          value: values ? kcal(values.balanceKcal) : NONE,
        }),
        lines: [
          {
            text: t('analysis.balanceFat', {
              value: values ? kg(values.balanceFatKg) : NONE,
            }),
          },
        ],
        spoken: values
          ? t('a11y.analysisBalance', {
              kcal: spoken(roundKcal(values.balanceKcal)),
              fat: spoken(values.balanceFatKg, 1),
            })
          : unknown(columnLabels.balance),
      },
      scale: {
        label: columnLabels.scale,
        value: t('analysis.approxKcal', {
          value: values
            ? formatSigned(roundStored(values.storedKcal), locale)
            : NONE,
        }),
        lines: [
          { text: t('analysis.stored'), small: true },
          {
            text: t('analysis.fat', {
              value: values ? kg(values.fatChangeKg) : NONE,
            }),
            note: t('analysis.fatPoints', {
              value: values
                ? formatSigned(values.bodyFatPointsChange, locale, 1)
                : NONE,
            }),
          },
          {
            text: t('analysis.lean', {
              value: values ? kg(values.leanChangeKg) : NONE,
            }),
          },
        ],
        spoken: values
          ? t('a11y.analysisScale', {
              kcal: spoken(roundStored(values.storedKcal)),
              fat: spoken(values.fatChangeKg, 1),
              points: spoken(values.bodyFatPointsChange, 1),
              lean: spoken(values.leanChangeKg, 1),
            })
          : unknown(columnLabels.scale),
      },
      verdict:
        analysis.state === 'insufficient'
          ? undefined
          : verdictText(analysis, locale, t),
      burn: {
        label: burnLabel,
        value: actual === undefined ? NONE : formatNumber(actual, locale),
        unit: t('analysis.burn.unit'),
        detail: t('analysis.burn.detail', {
          tracker: tracker === undefined ? NONE : formatNumber(tracker, locale),
          difference:
            actual === undefined || tracker === undefined
              ? NONE
              : formatSigned(actual - tracker, locale),
        }),
        spoken:
          actual === undefined || tracker === undefined
            ? unknown(burnLabel)
            : t('a11y.analysisBurn', {
                actual: burn(actual),
                tracker: burn(tracker),
                difference: spoken(actual - tracker),
              }),
      },
      explanation: {
        toggle: t('analysis.explanation.toggle'),
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
