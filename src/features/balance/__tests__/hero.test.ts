import { createInstance } from 'i18next';

import { balanceWords, heroModel, toleranceSummary } from '../hero';
import { GOLDEN_DAYS, GOLDEN_TOLERANCE } from '@/core/__fixtures__/golden-30';
import { dayBalances } from '@/core/day-balance';
import { periodBalance, type PeriodBalance } from '@/core/period-balance';
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

const OFF = { foodPercent: 0, burnPercent: 0 };

const golden = periodBalance(
  dayBalances(GOLDEN_DAYS, { zeroDaysAsMaintenance: true, profile: {} }),
  OFF,
);

// Only the fields the hero reads: sums for the range, results for one value.
function balance(foodKcal: number, burnKcal: number, days = 30) {
  const kcal = foodKcal - burnKcal;
  return {
    ...golden,
    foodKcal,
    restingKcal: burnKcal,
    activeKcal: 0,
    countedDays: days,
    kcal,
    avgKcal: kcal / days,
    fatKg: kcal / 7700,
  } satisfies PeriodBalance;
}

describe('balanceWords', () => {
  it('follows the sign of one value', () => {
    expect(balanceWords(10)).toBe('more');
    expect(balanceWords(-10)).toBe('less');
    expect(balanceWords(0)).toBe('even');
  });

  it('says more or less only when both ends agree', () => {
    expect(balanceWords(0, 1200)).toBe('more');
    expect(balanceWords(-1200, -50)).toBe('less');
    expect(balanceWords(-800, 1200)).toBe('either');
  });
});

describe('heroModel', () => {
  it('shows the golden balance with words, average and fat', () => {
    expect(heroModel(golden, OFF, 'de-DE', tDe)).toEqual({
      kind: 'single',
      kcal: ['+7.000'],
      words: 'mehr gegessen als verbraucht',
      avg: 'Ø +233 kcal pro Tag',
      fat: '≈ +0,9 kg Körperfett',
      fatNote: '(theoretisch, 7.700 kcal/kg)',
      label: 'plus 7.000 Kilokalorien, mehr gegessen als verbraucht',
      avgLabel: 'Durchschnitt plus 233 Kilokalorien pro Tag',
      fatLabel: 'etwa plus 0,9 Kilogramm Körperfett, theoretisch',
    });
  });

  it('reads the golden balance in English', () => {
    const model = heroModel(golden, OFF, 'en-US', tEn);
    expect(model.kcal).toEqual(['+7,000']);
    expect(model.label).toBe(
      'plus 7,000 kilocalories, ate more than you burned',
    );
  });

  it('shows the golden range with 5/10 %', () => {
    expect(heroModel(golden, GOLDEN_TOLERANCE, 'de-DE', tDe)).toEqual({
      kind: 'range',
      kcal: ['+2.650', '+19.350'],
      words: 'mehr gegessen als verbraucht',
      avg: 'Ø +88 bis +645 kcal pro Tag',
      fat: '≈ +0,3 bis +2,5 kg Fett',
      fatNote: '(theoretisch)',
      label:
        'plus 2.650 bis plus 19.350 Kilokalorien, mehr gegessen als verbraucht',
      avgLabel: 'Durchschnitt plus 88 bis plus 645 Kilokalorien pro Tag',
      fatLabel: 'etwa plus 0,3 bis plus 2,5 Kilogramm Fett, theoretisch',
    });
  });

  it('shows ±0 and „so viel“ for a balance that rounds to zero', () => {
    const model = heroModel(balance(60004, 60000), OFF, 'de-DE', tDe);
    expect(model.kcal).toEqual(['±0']);
    expect(model.words).toBe('so viel gegessen wie verbraucht');
    expect(model.avg).toBe('Ø ±0 kcal pro Tag');
    expect(model.fat).toBe('≈ ±0,0 kg Körperfett');
    expect(model.label).toBe(
      'plus minus 0 Kilokalorien, so viel gegessen wie verbraucht',
    );
  });

  it('shows a deficit with minus', () => {
    const model = heroModel(balance(60000, 61250), OFF, 'de-DE', tDe);
    expect(model.kcal).toEqual(['−1.250']);
    expect(model.words).toBe('weniger gegessen als verbraucht');
    expect(model.label).toBe(
      'minus 1.250 Kilokalorien, weniger gegessen als verbraucht',
    );
  });

  it('says plus or minus for a range across zero', () => {
    // A 10,000, V 10,500: min −1,000, max 10,500 − 8,400 = +2,100.
    const model = heroModel(
      balance(10000, 10500, 5),
      { foodPercent: 5, burnPercent: 20 },
      'de-DE',
      tDe,
    );
    expect(model.kcal).toEqual(['−1.000', '+2.100']);
    expect(model.words).toBe('je nach Messfehler Plus oder Minus');
  });

  it('gives the same hero for a draft as for the stored tolerance', () => {
    const stored = periodBalance(
      dayBalances(GOLDEN_DAYS, { zeroDaysAsMaintenance: true, profile: {} }),
      GOLDEN_TOLERANCE,
    );
    expect(heroModel(golden, GOLDEN_TOLERANCE, 'de-DE', tDe)).toEqual(
      heroModel(stored, GOLDEN_TOLERANCE, 'de-DE', tDe),
    );
  });
});

describe('toleranceSummary', () => {
  it('says „aus“ or names the sides that are on', () => {
    const summary = (foodPercent: number, burnPercent: number) =>
      toleranceSummary({ foodPercent, burnPercent }, tDe).text;
    expect(summary(0, 0)).toBe('aus');
    expect(summary(5, 10)).toBe('Nahrung ±5 % · Verbrauch −10 %');
    expect(summary(5, 0)).toBe('Nahrung ±5 %');
    expect(summary(0, 10)).toBe('Verbrauch −10 %');
  });

  it('spells the signs for VoiceOver', () => {
    expect(
      toleranceSummary({ foodPercent: 5, burnPercent: 10 }, tDe).spoken,
    ).toBe('Nahrung plus minus 5 Prozent, Verbrauch minus 10 Prozent');
  });
});
