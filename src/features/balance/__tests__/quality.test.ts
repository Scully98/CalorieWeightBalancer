import { createInstance } from 'i18next';

import { dayLabel, incompleteDays, qualityRow } from '../quality';
import { addDays } from '@/core/dates';
import { dayBalances, type DayBalanceOptions } from '@/core/day-balance';
import { toDateKey, type DayRecord } from '@/core/day-record';
import { periodBalance } from '@/core/period-balance';
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

// 82.4 kg, 182 cm, 34 years, male → 1,796.5 kcal.
const PROFILE: RestingProfile = {
  heightCm: 182,
  sex: 'male',
  ageYears: 34,
  weightKg: 82.4,
};
const ON: DayBalanceOptions = { zeroDaysAsMaintenance: true, profile: PROFILE };
const OFF: DayBalanceOptions = { ...ON, zeroDaysAsMaintenance: false };

// 30 days ending Sat 24 Oct 2026 like the design: estimated on days 4
// (formula), 11 and 19 (source), without food on day 15, little food on 8
// and 24; every other day +200.
function records(): DayRecord[] {
  return Array.from({ length: 30 }, (_, index) => {
    const date = toDateKey(addDays(new Date(2026, 8, 25), index));
    if (index === 4) return { date, food: 2900, active: 870 };
    if (index === 11 || index === 19)
      return {
        date,
        food: 2900,
        resting: 1750,
        restingEstimated: true,
        active: 870,
      };
    if (index === 15) return { date, resting: 1800, active: 850 };
    if (index === 8 || index === 24)
      return { date, food: 1060, resting: 1800, active: 850 };
    return { date, food: 2500, resting: 1800, active: 500 };
  });
}

const days = (options = ON) => dayBalances(records(), options);
const balance = (options = ON) =>
  periodBalance(days(options), { foodPercent: 0, burnPercent: 0 });

describe('qualityRow', () => {
  it('counts complete days and lists the flags that occur', () => {
    expect(qualityRow(balance(), tDe)).toEqual({
      title: '24 von 30 Tagen vollständig',
      entries: [
        { flag: 'restingEstimated', text: '3 Grundumsatz geschätzt' },
        { flag: 'noFood', text: '1 ohne Nahrung' },
        { flag: 'lowFood', text: '2 auffällig wenig Nahrung' },
      ],
      tappable: true,
      spokenEntries:
        '3 Grundumsatz geschätzt, 1 ohne Nahrung, 2 auffällig wenig Nahrung',
    });
  });

  it('has nothing to open when every day is complete', () => {
    const complete = periodBalance(
      dayBalances(
        records().map((record) => ({
          date: record.date,
          food: 2500,
          resting: 1800,
          active: 500,
        })),
        ON,
      ),
      { foodPercent: 0, burnPercent: 0 },
    );
    expect(qualityRow(complete, tDe)).toMatchObject({
      title: '30 von 30 Tagen vollständig',
      entries: [],
      tappable: false,
    });
  });

  it('speaks English', () => {
    expect(qualityRow(balance(), tEn).title).toBe('24 of 30 days complete');
  });
});

describe('dayLabel', () => {
  it('writes weekday, day and month', () => {
    expect(dayLabel('2026-10-12', tDe)).toBe('Mo, 12. Okt');
    expect(dayLabel('2026-10-12', tEn)).toBe('Mon, Oct 12');
    expect(dayLabel('2026-10-18', tDe)).toBe('So, 18. Okt');
  });
});

describe('incompleteDays', () => {
  it('groups the days by flag in the app order', () => {
    const sheet = incompleteDays(
      days(),
      { zeroDaysAsMaintenance: true },
      'de-DE',
      tDe,
    );
    expect(sheet.subtitle).toBe('6 von 30 Tagen · 25. Sep – 24. Okt');
    expect(sheet.groups.map((group) => [group.flag, group.count])).toEqual([
      ['restingEstimated', 3],
      ['noFood', 1],
      ['lowFood', 2],
    ]);
  });

  it('writes the rows like the design', () => {
    const [estimated, noFood, lowFood] = incompleteDays(
      days(),
      { zeroDaysAsMaintenance: true },
      'de-DE',
      tDe,
    ).groups;
    expect(estimated.rows[0]).toEqual({
      date: '2026-09-29',
      label: 'Di, 29. Sep',
      detail: 'Ruhe 1.800 (Formel) · Aktiv 870 · Bilanz +230',
    });
    expect(estimated.rows[1].detail).toBe(
      'Ruhe 1.750 (geschätzt) · Aktiv 870 · Bilanz +280',
    );
    expect(noFood.description).toBe(
      'Nichts eingetragen. Zählt als Erhaltungstag mit Bilanz 0.',
    );
    expect(noFood.rows[0]).toMatchObject({
      label: 'Sa, 10. Okt',
      detail: 'Gegessen – · Verbraucht 2.650 · zählt als 0',
    });
    expect(lowFood.description).toBe(
      'Unter 50 % des Verbrauchs, vermutlich nicht vollständig getrackt.',
    );
    expect(lowFood.rows[0].detail).toBe(
      'Gegessen 1.060 von 2.650 verbraucht (40 %) · Bilanz −1.590',
    );
    expect(lowFood.spokenTitle).toBe('Auffällig wenig Nahrung, 2 Tage');
  });

  it('follows the zero day switch', () => {
    const noFood = incompleteDays(
      days(OFF),
      { zeroDaysAsMaintenance: false },
      'de-DE',
      tDe,
    ).groups[1];
    expect(noFood.description).toBe(
      'Nichts eingetragen. Zählt mit vollem Defizit, weil „Null-Tage = Erhaltung“ aus ist.',
    );
    expect(noFood.rows[0].detail).toBe(
      'Gegessen – · Verbraucht 2.650 · Bilanz −2.650',
    );
  });

  it('lists a day with two flags in both groups', () => {
    // Day 4 without food and without resting energy: estimated and no food.
    const both = records();
    both[4] = { date: both[4].date, active: 870 };
    const groups = incompleteDays(
      dayBalances(both, ON),
      { zeroDaysAsMaintenance: true },
      'de-DE',
      tDe,
    ).groups;
    expect(groups[0].rows[0].date).toBe('2026-09-29');
    expect(groups[1].rows.map((row) => row.date)).toContain('2026-09-29');
  });

  it('puts days without resting energy last', () => {
    const groups = incompleteDays(
      dayBalances(records(), { ...ON, profile: {} }),
      { zeroDaysAsMaintenance: true },
      'de-DE',
      tDe,
    ).groups;
    const last = groups.at(-1);
    expect(last?.flag).toBe('noResting');
    expect(last?.rows[0].detail).toBe(
      'Gegessen 2.900 · Aktiv 870 · zählt nicht',
    );
  });

  it('speaks English', () => {
    const sheet = incompleteDays(
      days(),
      { zeroDaysAsMaintenance: true },
      'en-US',
      tEn,
    );
    expect(sheet.subtitle).toBe('6 of 30 days · Sep 25 – Oct 24');
    expect(sheet.groups[1].rows[0].detail).toBe(
      'Eaten – · Burned 2,650 · counts as 0',
    );
  });
});
