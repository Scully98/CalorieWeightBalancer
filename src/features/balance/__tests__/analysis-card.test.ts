import { createInstance, type TFunction } from 'i18next';

import { analysisCardModel, type AnalysisCardModel } from '../analysis-card';
import {
  GOLDEN_BODY_DAYS,
  GOLDEN_LEAD_IN,
} from '@/core/__fixtures__/golden-30';
import {
  analyzeBalance,
  type Analysis,
  type AnalysisValues,
  type Composition,
  type Expected,
} from '@/core/analysis';
import { dayBalances, type DayBalance } from '@/core/day-balance';
import { de } from '@/i18n/locales/de';
import { en } from '@/i18n/locales/en';

const i18n = createInstance();
i18n.init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: 'de',
  initAsync: false,
  interpolation: { escapeValue: false },
});
const tDe = i18n.getFixedT('de');
const tEn = i18n.getFixedT('en');
// Returns the key, so a test sees which text the model picked.
const tKey = ((key: string) => key) as unknown as TFunction;

const DAYS = [
  { date: '2026-09-24' },
  { date: '2026-10-23' },
] as unknown as DayBalance[];

const VALUES: AnalysisValues = {
  balanceKcal: 7000,
  balanceFatKg: 7000 / 7700,
  fatChangeKg: 0.4,
  leanChangeKg: 0.3,
  bodyFatPointsChange: 0.32,
  storedKcal: 4300,
  foodKcal: 87000,
  burnKcal: 80000,
  actualBurnPerDay: 2756.7,
  trackerBurnPerDay: 2666.7,
  differencePerDay: 90,
};
const COUNTS = { days: 30, measurements: 18 };
const COMPARED = { from: '2026-09-24', to: '2026-10-23', days: 30 };

const ok = (expected: Expected, composition?: Composition): Analysis => ({
  ...COUNTS,
  state: 'ok',
  compared: COMPARED,
  values: VALUES,
  expected,
  composition,
});
const deviation = (
  direction: 'less' | 'more',
  expected: Expected,
  composition?: Composition,
  values = VALUES,
): Analysis => ({
  ...COUNTS,
  state: 'deviation',
  compared: COMPARED,
  values,
  direction,
  expected,
  composition,
});

function composition(model: AnalysisCardModel) {
  if (model.body.kind !== 'composition') throw new Error(model.body.kind);
  return model.body;
}
const verdictOf = (analysis: Analysis, t = tKey) =>
  composition(analysisCardModel(analysis, DAYS, 'de-DE', t)).disclosure.verdict;
const bodyOf = (analysis: Analysis, t = tDe) =>
  composition(analysisCardModel(analysis, DAYS, 'de-DE', t));
const summaryOf = (analysis: Analysis) => bodyOf(analysis).comparison.summary;

describe('analysisCardModel', () => {
  it('shows the golden case like the design', () => {
    const days = dayBalances(GOLDEN_BODY_DAYS.slice(GOLDEN_LEAD_IN), {
      zeroDaysAsMaintenance: true,
      profile: {},
    });
    const analysis = analyzeBalance(GOLDEN_BODY_DAYS, days, GOLDEN_LEAD_IN);
    const model = analysisCardModel(analysis, days, 'de-DE', tDe);
    const body = composition(model);

    expect(model.title).toBe('Dein tatsächlicher Verbrauch');
    expect(model.subtitle).toMatch(
      /^aus Bilanz und Waage · .* – .* · 30 Tage · 15 Messungen$/,
    );
    expect(model.locked).toBeUndefined();
    expect(model.dimmed).toBe(false);
    expect(body.burn.value).toBe('2.760');
    expect(body.burn.unit).toBe('kcal/Tag');
    expect(body.burn.difference).toEqual({
      kind: 'line',
      difference: '+90 kcal/Tag',
      lower: { label: 'Tracker', value: '2.670', actual: false },
      upper: { label: 'tatsächlich', value: '2.760', actual: true },
    });
    const { comparison } = body;
    expect(comparison.title).toBe('Bilanz vs. Waage');
    expect(comparison.summary).toBe('Waage zeigt 61 % der Bilanz');
    expect(comparison.layout).toBe('aligned');
    expect(comparison.balance.value).toBe('+7.000 kcal');
    expect(comparison.balance.segments[0]).toEqual({
      kind: 'solid',
      share: 1,
    });
    expect(comparison.scale.value).toBe('≈ +4.300 kcal');
    expect(comparison.scale.segments.map(({ kind }) => kind)).toEqual([
      'solid',
      'hatch',
      'gap',
    ]);
    expect(comparison.legend).toEqual([
      { kind: 'solid', text: 'Fett +0,4 kg' },
      { kind: 'hatch', text: 'Magermasse +0,3 kg' },
      { kind: 'gap', text: 'Lücke 2.700 kcal' },
    ]);
    expect(body.disclosure.toggle).toBe(
      'Du verbrauchst etwas mehr, als dein Tracker misst.',
    );
    expect(body.disclosure.verdict).toBe(
      'Die Waage zeigt weniger Zuwachs als die Bilanz. Wahrscheinlich verbrauchst du etwas mehr, als der Tracker misst, oder hast weniger gegessen als eingetragen. Etwa 40 % des Zuwachses sind Magermasse (z. B. Muskeln oder Wasser).',
    );
    expect(body.disclosure.formula).toBe(
      '(Nahrung − 9.400 × Δ Fett − 1.800 × Δ Magermasse) ÷ Tage. Start und Ende als 7-Tage-Trend.',
    );
  });

  it('shows a target and „ungefähr gleich“ when balance and scale fit', () => {
    const values = {
      ...VALUES,
      fatChangeKg: 0.7,
      leanChangeKg: 0.1,
      storedKcal: 6900,
      actualBurnPerDay: 2670,
      trackerBurnPerDay: 2666.7,
    };
    const body = bodyOf({
      ...COUNTS,
      state: 'ok',
      compared: COMPARED,
      values,
      expected: 'gain',
    });
    expect(body.burn.difference).toEqual({
      kind: 'match',
      tracker: 'Tracker 2.670 kcal',
    });
    expect(body.comparison.summary).toBe('ungefähr gleich');
    expect(body.comparison.legend[2].text).toBe('Lücke 100 kcal');
    expect(body.disclosure.toggle).toBe(
      'Bilanz und Waage passen gut zusammen.',
    );
  });

  it('keeps the line when an ok state differs from the tracker', () => {
    expect(bodyOf(ok('gain')).burn.difference.kind).toBe('line');
  });

  it('puts the actual burn on the left when it is the lower value', () => {
    const values = {
      ...VALUES,
      actualBurnPerDay: 2500,
      trackerBurnPerDay: 2666.7,
    };
    const { difference } = bodyOf(
      deviation('more', 'gain', undefined, values),
    ).burn;
    expect(difference).toMatchObject({
      difference: '−170 kcal/Tag',
      lower: { label: 'tatsächlich', value: '2.500' },
      upper: { label: 'Tracker', value: '2.670' },
    });
  });

  it('picks the short sentence by direction', () => {
    const toggle = (analysis: Analysis) =>
      bodyOf(analysis, tKey).disclosure.toggle;
    expect(toggle(ok('gain'))).toBe('analysis.short.ok');
    expect(toggle(deviation('less', 'gain'))).toBe('analysis.short.less');
    expect(toggle(deviation('more', 'loss'))).toBe('analysis.short.more');
  });

  it('says a share only with the same sign and a balance away from zero', () => {
    expect(summaryOf(deviation('less', 'gain'))).toBe(
      'Waage zeigt 61 % der Bilanz',
    );
    expect(summaryOf(deviation('less', 'even'))).toBe('Waage zeigt weniger');
    expect(summaryOf(deviation('more', 'even'))).toBe('Waage zeigt mehr');
    const opposite = { ...VALUES, storedKcal: -1000, fatChangeKg: -0.1 };
    expect(summaryOf(deviation('less', 'gain', undefined, opposite))).toBe(
      'Waage zeigt in die andere Richtung',
    );
  });

  it('draws opposite directions from the center, the gap only as a number', () => {
    const values = {
      ...VALUES,
      balanceKcal: 2000,
      storedKcal: -1380,
      fatChangeKg: -0.3,
      leanChangeKg: 0.8,
    };
    const { comparison } = bodyOf(deviation('less', 'gain', undefined, values));
    expect(comparison.layout).toBe('diverging');
    expect(comparison.scale.segments[0]).toEqual({ kind: 'solid', share: -1 });
    expect(comparison.legend[2]).toEqual({
      kind: 'plain',
      text: 'Lücke 3.400 kcal',
    });
  });

  it('picks the verdict by state, direction and expected change', () => {
    for (const expected of ['gain', 'loss', 'even'] as const) {
      expect(verdictOf(ok(expected))).toBe(`analysis.verdict.${expected}.ok`);
      for (const direction of ['less', 'more'] as const)
        expect(verdictOf(deviation(direction, expected))).toBe(
          `analysis.verdict.${expected}.${direction} analysis.verdict.cause.${direction}`,
        );
    }
  });

  it('describes the composition after the verdict', () => {
    const share = (change: 'gain' | 'loss'): Composition => ({
      kind: 'share',
      change,
      leanShare: 0.43,
    });
    expect(verdictOf(ok('gain', share('gain')))).toBe(
      'analysis.verdict.gain.ok analysis.composition.shareGain',
    );
    expect(verdictOf(deviation('more', 'loss', share('loss')))).toBe(
      'analysis.verdict.loss.more analysis.verdict.cause.more analysis.composition.shareLoss',
    );
    expect(
      verdictOf(deviation('less', 'even', { kind: 'shift', fat: 'loss' })),
    ).toMatch(/ analysis\.composition\.fatLossLeanGain$/);
    expect(verdictOf(ok('gain', { kind: 'shift', fat: 'gain' }))).toMatch(
      / analysis\.composition\.fatGainLeanLoss$/,
    );
  });

  it('writes fat and lean mass of a shift without signs', () => {
    // Weight up, fat down, muscles up.
    const values = { ...VALUES, fatChangeKg: -0.3, leanChangeKg: 0.8 };
    const analysis = deviation(
      'less',
      'gain',
      { kind: 'shift', fat: 'loss' },
      values,
    );
    expect(verdictOf(analysis, tDe)).toMatch(
      / Dabei hast du 0,3 kg Fett abgebaut und 0,8 kg Magermasse aufgebaut \(z\. B\. Muskeln oder Wasser\)\.$/,
    );
  });

  it('rounds the lean share to 10 %, below 10 % to the whole percent', () => {
    const percent = (leanShare: number) =>
      verdictOf(
        ok('gain', { kind: 'share', change: 'gain', leanShare }),
        tDe,
      )?.match(/Etwa (\d+) %/)?.[1];
    expect(percent(3 / 7)).toBe('40');
    expect(percent(0.96)).toBe('100');
    expect(percent(0.064)).toBe('6');
    expect(percent(0.002)).toBe('1');
  });

  it('dims a preview without a verdict while insufficient', () => {
    const model = analysisCardModel(
      {
        days: 7,
        measurements: 4,
        state: 'insufficient',
        spanDays: 7,
        preview: VALUES,
      },
      DAYS,
      'de-DE',
      tDe,
    );
    const body = composition(model);
    expect(model.title).toBe('Dein tatsächlicher Verbrauch');
    expect(model.subtitle).toMatch(/ · 7 Tage · 4 Messungen$/);
    expect(model.dimmed).toBe(true);
    expect(model.locked).toEqual({
      hint: 'Für den Abgleich brauchst du mindestens 21 Tage und 6 Messungen.',
      soFar: 'Bisher: 7 Tage, 4 Messungen.',
    });
    expect(body.disclosure.verdict).toBeUndefined();
    expect(body.disclosure.toggle).toBe('Wie wird das berechnet?');
    expect(body.comparison.summary).toBeUndefined();
    expect(body.comparison.balance.value).toBe('+7.000 kcal');
    expect(body.burn.value).toBe('2.760');
  });

  it('shows dashes without a preview', () => {
    const body = composition(
      analysisCardModel(
        { days: 7, measurements: 1, state: 'insufficient', spanDays: 1 },
        DAYS,
        'de-DE',
        tDe,
      ),
    );
    expect(body.comparison.balance.value).toBe('– kcal');
    expect(body.comparison.balance.segments).toEqual([]);
    expect(body.comparison.scale.value).toBe('≈ – kcal');
    expect(body.comparison.legend[2].text).toBe('Lücke – kcal');
    expect(body.burn.value).toBe('–');
    expect(body.burn.difference).toMatchObject({
      difference: '– kcal/Tag',
      lower: { value: '–' },
      upper: { value: '–' },
    });
    expect(body.burn.spoken).toBe('Dein tatsächlicher Verbrauch unbekannt');
  });

  it('names only the measurements from 21 days on', () => {
    const model = (days: number, measurements: number, spanDays = 6) =>
      analysisCardModel(
        { days, measurements, state: 'insufficient', spanDays },
        DAYS,
        'de-DE',
        tDe,
      );
    expect(model(30, 4).locked?.soFar).toBe('Bisher: 4 Messungen.');
    expect(model(1, 1).locked?.soFar).toBe('Bisher: 1 Tag, 1 Messung.');
    expect(model(30, 1).subtitle).toMatch(/· 30 Tage · 1 Messung$/);
    expect(model(30, 6, 6).locked?.soFar).toBe(
      'Bisher: 6 Messungen, die 6 Tage abdecken.',
    );
  });

  it('names the days compared, not the whole period', () => {
    const model = analysisCardModel(
      {
        ...COUNTS,
        state: 'ok',
        expected: 'gain',
        values: VALUES,
        compared: { from: '2026-10-01', to: '2026-10-23', days: 23 },
      },
      DAYS,
      'de-DE',
      tDe,
    );
    expect(model.subtitle).toBe(
      'aus Bilanz und Waage · 1. Okt – 23. Okt · 23 Tage · 18 Messungen',
    );
  });

  it('compares the weight only, with a note by body fat days', () => {
    const weightOnly = (
      compositionMeasurements: number,
      compositionSpanDays = 0,
    ): Analysis => ({
      ...COUNTS,
      state: 'weightOnly',
      compared: COMPARED,
      balanceFatKg: 0.9,
      weightChangeKg: 0.7,
      compositionMeasurements,
      compositionSpanDays,
    });
    const short = analysisCardModel(weightOnly(10, 10), DAYS, 'de-DE', tDe);
    if (short.body.kind !== 'weightOnly') throw new Error(short.body.kind);
    expect(short.body.note).toMatch(
      /^Die Körperfett-Messungen decken erst 10 Tage ab, nötig sind 21\./,
    );
    const none = analysisCardModel(weightOnly(0), DAYS, 'de-DE', tDe);
    if (none.body.kind !== 'weightOnly') throw new Error(none.body.kind);
    expect(none.title).toBe('Bilanz vs. Waage');
    expect(none.dimmed).toBe(false);
    const { comparison } = none.body;
    expect(comparison.title).toBeUndefined();
    expect(comparison.legend).toEqual([]);
    expect(comparison.balance).toMatchObject({
      value: '≈ +0,9 kg',
      note: 'wenn alles Fett wäre',
    });
    expect(comparison.scale).toMatchObject({
      value: '+0,7 kg',
      note: 'Gewicht, 7-Tage-Trend',
    });
    expect(comparison.scale.segments[0].share).toBeCloseTo(0.7 / 0.9);
    expect(none.body.note).toMatch(/^Keine Körperfett-Daten in Health\./);

    const few = analysisCardModel(weightOnly(3), DAYS, 'de-DE', tDe);
    if (few.body.kind !== 'weightOnly') throw new Error(few.body.kind);
    expect(few.body.note).toMatch(
      /^Zu wenige Körperfett-Messungen \(3 von 6\)\. Verglichen wird nur das Gewicht\./,
    );
  });

  it('labels the card for VoiceOver', () => {
    const model = analysisCardModel(ok('gain'), DAYS, 'de-DE', tDe);
    const body = composition(model);
    expect(model.headerLabel).toBe(
      'Dein tatsächlicher Verbrauch 24. Sep bis 23. Okt, 30 Tage, 18 Messungen',
    );
    expect(body.comparison.balance.spoken).toBe(
      'Bilanz: plus 7.000 Kilokalorien',
    );
    expect(body.comparison.scale.spoken).toBe(
      'Waage: etwa plus 4.300 Kilokalorien. Fett plus 0,4 Kilogramm, Magermasse plus 0,3 Kilogramm.',
    );
    expect(body.burn.spoken).toBe(
      'Geschätzter tatsächlicher Verbrauch 2.760 Kilokalorien pro Tag. Tracker 2.670, Differenz plus 90.',
    );
  });

  it('speaks English with the same keys', () => {
    const model = analysisCardModel(
      deviation('more', 'loss', { kind: 'shift', fat: 'gain' }),
      DAYS,
      'en-US',
      tEn,
    );
    const body = composition(model);
    expect(model.title).toBe('Your actual burn');
    expect(body.burn.value).toBe('2,760');
    expect(body.disclosure.toggle).toBe(
      'You burn a bit less than your tracker measures.',
    );
    expect(body.disclosure.verdict).toBe(
      'The scale shows less loss than the balance. You probably burn less than the tracker measures, or ate more than you logged. You gained 0.4 kg of fat and lost 0.3 kg of lean mass (e.g. muscle or water).',
    );
  });
});
