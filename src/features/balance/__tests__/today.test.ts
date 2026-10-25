import { createInstance } from 'i18next';

import { formatTime, todayCard } from '../today';
import { dayBalances, type DayBalanceOptions } from '@/core/day-balance';
import type { DayRecord } from '@/core/day-record';
import type { RestingProfile } from '@/core/resting';
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

const LOADED = new Date(2026, 9, 23, 14, 32);
const PROFILE: RestingProfile = {
  heightCm: 182,
  sex: 'male',
  ageYears: 34,
  weightKg: 82.4,
};
const ON: DayBalanceOptions = {
  zeroDaysAsMaintenance: true,
  profile: PROFILE,
  runningDay: {
    date: '2026-10-23',
    elapsedHours: 14 + 32 / 60,
    hoursInDay: 24,
  },
};

function running(record: Omit<DayRecord, 'date'>, options = ON) {
  return dayBalances([{ date: '2026-10-23', ...record }], options)[0];
}

const DESIGN = { food: 1420, resting: 1090, active: 290 };

describe('formatTime', () => {
  it('writes hours and minutes per language', () => {
    expect(formatTime(LOADED, 'de-DE')).toBe('14:32');
    // ICU puts a narrow no-break space before PM.
    expect(formatTime(LOADED, 'en-US')).toMatch(/^2:32\sPM$/);
    expect(formatTime(new Date(2026, 9, 23, 8, 5), 'de-DE')).toBe('08:05');
  });
});

describe('todayCard', () => {
  it('shows the design numbers', () => {
    const card = todayCard(
      { day: running(DESIGN), placement: 'excluded' },
      LOADED,
      'de-DE',
      tDe,
    );
    expect(card).toEqual({
      asOf: 'Stand 14:32',
      balance: '+40',
      balanceUnit: 'kcal',
      food: '1.420',
      burn: '1.380',
      burnDetail: 'Ruhe 1.090 + Aktiv 290',
      note: 'Tag läuft noch, Verbrauch steigt bis Mitternacht. Zählt nicht zur Bilanz oben.',
      labels: {
        header: 'Heute bisher, Stand 14:32',
        balance: 'Bilanz plus 40 Kilokalorien',
        food: 'Gegessen 1.420 Kilokalorien',
        burn: 'Verbraucht 1.380 Kilokalorien, Ruhe 1.090 plus Aktiv 290',
      },
    });
  });

  it('says whether today counts', () => {
    const day = running(DESIGN);
    const note = (placement: 'included' | 'outside') =>
      todayCard({ day, placement }, LOADED, 'de-DE', tDe).note;
    expect(note('included')).toBe(
      'Tag läuft noch, Verbrauch steigt bis Mitternacht. Zählt zur Bilanz oben mit.',
    );
    expect(note('outside')).toBe(
      'Tag läuft noch, Verbrauch steigt bis Mitternacht. Nicht im gewählten Zeitraum.',
    );
  });

  it('marks estimated resting energy', () => {
    const formula = todayCard(
      { day: running({ food: 1420, active: 290 }), placement: 'excluded' },
      LOADED,
      'de-DE',
      tDe,
    );
    // 1,796.5 × 14.53 / 24 ≈ 1,088.
    expect(formula.burnDetail).toBe('Ruhe 1.090 (Formel) + Aktiv 290');

    const partial = todayCard(
      {
        day: running({
          food: 1420,
          resting: 150,
          restingCoverage: 2 / 24,
          active: 290,
        }),
        placement: 'excluded',
      },
      LOADED,
      'de-DE',
      tDe,
    );
    expect(partial.burnDetail).toMatch(/\(teils Formel\)/);
  });

  it('shows dashes without values', () => {
    const card = todayCard(
      {
        day: running({}, { ...ON, profile: {}, zeroDaysAsMaintenance: false }),
        placement: 'excluded',
      },
      LOADED,
      'de-DE',
      tDe,
    );
    expect(card).toMatchObject({
      balance: '–',
      food: '–',
      burn: '–',
      burnDetail: undefined,
    });
    expect(card.labels.burn).toBe('Verbraucht unbekannt');
  });

  it('counts a day without food as maintenance with the switch on', () => {
    const card = todayCard(
      { day: running({ resting: 1090, active: 290 }), placement: 'included' },
      LOADED,
      'de-DE',
      tDe,
    );
    expect(card.balance).toBe('±0');
    expect(card.balanceUnit).toBe('kcal · als Erhaltung');
  });

  it('speaks English', () => {
    const card = todayCard(
      { day: running(DESIGN), placement: 'excluded' },
      LOADED,
      'en-US',
      tEn,
    );
    expect(card.asOf).toMatch(/^As of 2:32\sPM$/);
    expect(card.food).toBe('1,420');
    expect(card.labels.balance).toBe('Balance plus 40 kilocalories');
  });
});
