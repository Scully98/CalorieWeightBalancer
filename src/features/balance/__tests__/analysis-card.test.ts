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

const ok = (expected: Expected, composition?: Composition): Analysis => ({
  ...COUNTS,
  state: 'ok',
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
  composition(analysisCardModel(analysis, DAYS, 'de-DE', t)).verdict;

describe('analysisCardModel', () => {
  it('shows the golden case like the design', () => {
    const days = dayBalances(GOLDEN_BODY_DAYS.slice(GOLDEN_LEAD_IN), {
      zeroDaysAsMaintenance: true,
      profile: {},
    });
    const analysis = analyzeBalance(GOLDEN_BODY_DAYS, days, GOLDEN_LEAD_IN);
    const model = analysisCardModel(analysis, days, 'de-DE', tDe);
    const body = composition(model);

    expect(model.title).toBe('Passt die Bilanz zur Waage?');
    expect(model.subtitle).toMatch(/ – .* · 15 Messungen$/);
    expect(model.locked).toBeUndefined();
    expect(model.dimmed).toBe(false);
    expect(body.balance.value).toBe('+7.000 kcal');
    expect(body.balance.lines[0].text).toBe('≈ +0,9 kg Fett');
    expect(body.scale.value).toBe('≈ +4.300 kcal');
    expect(body.scale.lines.map((line) => line.text)).toEqual([
      'gespeichert',
      'Fett +0,4 kg',
      'Magermasse +0,3 kg',
    ]);
    expect(body.burn.value).toBe('2.760');
    expect(body.burn.unit).toBe('kcal/Tag');
    expect(body.burn.detail).toBe('Tracker: 2.670 kcal/Tag · Differenz +90');
    expect(body.verdict).toBe(
      'Die Waage zeigt weniger Zuwachs als die Bilanz. Wahrscheinlich verbrauchst du etwas mehr, als der Tracker misst, oder hast weniger gegessen als eingetragen. Etwa 40 % des Zuwachses sind Magermasse (z. B. Muskeln oder Wasser).',
    );
    expect(body.explanation.formula).toBe(
      '(Nahrung − 9.400 × Δ Fett − 1.800 × Δ Magermasse) ÷ Tage. Start und Ende als 7-Tage-Trend.',
    );
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
      { days: 7, measurements: 4, state: 'insufficient', preview: VALUES },
      DAYS,
      'de-DE',
      tDe,
    );
    const body = composition(model);
    expect(model.dimmed).toBe(true);
    expect(model.locked).toEqual({
      hint: 'Für den Abgleich brauchst du mindestens 21 Tage und 6 Messungen.',
      soFar: 'Bisher: 7 Tage, 4 Messungen.',
    });
    expect(body.verdict).toBeUndefined();
    expect(body.balance.value).toBe('+7.000 kcal');
    expect(body.burn.value).toBe('2.760');
  });

  it('shows dashes without a preview', () => {
    const body = composition(
      analysisCardModel(
        { days: 7, measurements: 1, state: 'insufficient' },
        DAYS,
        'de-DE',
        tDe,
      ),
    );
    expect(body.balance.value).toBe('– kcal');
    expect(body.scale.value).toBe('≈ – kcal');
    expect(body.burn.value).toBe('–');
    expect(body.burn.detail).toBe('Tracker: – kcal/Tag · Differenz –');
    expect(body.burn.spoken).toBe(
      'Geschätzter tatsächlicher Verbrauch unbekannt',
    );
  });

  it('names only the measurements from 21 days on', () => {
    const model = (days: number, measurements: number) =>
      analysisCardModel(
        { days, measurements, state: 'insufficient' },
        DAYS,
        'de-DE',
        tDe,
      );
    expect(model(30, 4).locked?.soFar).toBe('Bisher: 4 Messungen.');
    expect(model(1, 1).locked?.soFar).toBe('Bisher: 1 Tag, 1 Messung.');
    expect(model(30, 1).subtitle).toMatch(/· 1 Messung$/);
  });

  it('compares the weight only, with a note by body fat days', () => {
    const weightOnly = (compositionMeasurements: number): Analysis => ({
      ...COUNTS,
      state: 'weightOnly',
      balanceFatKg: 0.9,
      weightChangeKg: 0.7,
      compositionMeasurements,
    });
    const none = analysisCardModel(weightOnly(0), DAYS, 'de-DE', tDe);
    if (none.body.kind !== 'weightOnly') throw new Error(none.body.kind);
    expect(none.dimmed).toBe(false);
    expect(none.body.balance.value).toBe('≈ +0,9 kg');
    expect(none.body.balance.lines[0]).toEqual({
      text: 'wenn alles Fett wäre',
      small: true,
    });
    expect(none.body.scale.value).toBe('+0,7 kg');
    expect(none.body.scale.lines[0].text).toBe('Gewicht, 7-Tage-Trend');
    expect(none.body.note).toMatch(/^Keine Körperfett-Daten in Health\./);

    const few = analysisCardModel(weightOnly(3), DAYS, 'de-DE', tDe);
    if (few.body.kind !== 'weightOnly') throw new Error(few.body.kind);
    expect(few.body.note).toMatch(
      /^Zu wenige Körperfett-Messungen \(3 von 6\)\. Verglichen wird nur das Gewicht\./,
    );
  });

  it('shows ±0 when actual and tracker burn round alike', () => {
    const values = {
      ...VALUES,
      actualBurnPerDay: 2668,
      trackerBurnPerDay: 2666.7,
    };
    const body = composition(
      analysisCardModel(
        deviation('less', 'gain', undefined, values),
        DAYS,
        'de-DE',
        tDe,
      ),
    );
    expect(body.burn.detail).toBe('Tracker: 2.670 kcal/Tag · Differenz ±0');
  });

  it('labels the card for VoiceOver', () => {
    const model = analysisCardModel(ok('gain'), DAYS, 'de-DE', tDe);
    const body = composition(model);
    expect(model.headerLabel).toBe(
      'Passt die Bilanz zur Waage? 24. Sep bis 23. Okt, 18 Messungen',
    );
    expect(body.balance.spoken).toBe(
      'Laut Bilanz: plus 7.000 Kilokalorien, etwa plus 0,9 Kilogramm Fett',
    );
    expect(body.scale.spoken).toBe(
      'Laut Waage: etwa plus 4.300 Kilokalorien gespeichert. Fett plus 0,4 Kilogramm, Körperfett plus 0,3 Prozentpunkte. Magermasse plus 0,3 Kilogramm.',
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
    expect(model.title).toBe('Does the balance match the scale?');
    expect(body.burn.value).toBe('2,760');
    expect(body.verdict).toBe(
      'The scale shows less loss than the balance. You probably burn less than the tracker measures, or ate more than you logged. You gained 0.4 kg of fat and lost 0.3 kg of lean mass (e.g. muscle or water).',
    );
  });
});
