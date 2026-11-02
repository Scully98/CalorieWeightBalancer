import { createInstance } from 'i18next';

import { periodSpan, periodSubtitle } from '../period-subtitle';
import type { DayBalance } from '@/core/day-balance';
import type { Period } from '@/core/period';
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

const NOW = new Date(2026, 9, 24, 14, 32);
const DAYS_30: Period = { kind: 'days', days: 30 };

function subtitle(
  period: Period,
  { includeToday = false, loaded = undefined as DayBalance[] | undefined } = {},
  t = tDe,
  locale = 'de-DE',
) {
  const span = periodSpan(period, includeToday, NOW, loaded);
  return span && periodSubtitle(period, span, includeToday, NOW, locale, t);
}

const day = (date: string) => ({ date }) as DayBalance;

describe('periodSubtitle', () => {
  it('names the days of a preset like the design', () => {
    expect(subtitle(DAYS_30)).toBe('24. Sep – 23. Okt · 30 Tage · ohne heute');
  });

  it('ends with today when today is included', () => {
    expect(subtitle(DAYS_30, { includeToday: true })).toBe(
      '25. Sep – 24. Okt · 30 Tage · inkl. heute',
    );
  });

  it('starts "all" at the first data point of the loaded days', () => {
    // Only the first and last day matter.
    const loaded = Array.from({ length: 120 }, () => day('2026-08-01'));
    loaded[0] = day('2026-06-26');
    loaded[119] = day('2026-10-23');
    expect(subtitle({ kind: 'all' }, { loaded })).toBe(
      'seit erstem Datenpunkt 26.06.2026 · 120 Tage · ohne heute',
    );
    expect(subtitle({ kind: 'all' })).toBeUndefined();
  });

  it('leaves out „ohne heute“ for a custom period that ends earlier', () => {
    const period: Period = {
      kind: 'custom',
      from: '2026-10-06',
      to: '2026-10-20',
    };
    expect(subtitle(period)).toBe('6. Okt – 20. Okt · 15 Tage');
  });

  it('shows one day without a range', () => {
    const period: Period = {
      kind: 'custom',
      from: '2026-10-20',
      to: '2026-10-20',
    };
    expect(subtitle(period)).toBe('20. Okt · 1 Tag');
  });

  it('adds the years when the period crosses a year', () => {
    const period: Period = {
      kind: 'custom',
      from: '2025-12-28',
      to: '2026-01-03',
    };
    expect(subtitle(period)).toBe('28. Dez 2025 – 3. Jan 2026 · 7 Tage');
  });

  it('reads like the design in English', () => {
    expect(subtitle(DAYS_30, {}, tEn, 'en-US')).toBe(
      'Sep 24 – Oct 23 · 30 days · excluding today',
    );
    const loaded = [day('2026-06-26'), day('2026-10-23')];
    expect(subtitle({ kind: 'all' }, { loaded }, tEn, 'en-US')).toBe(
      'since first data point 06/26/2026 · 2 days · excluding today',
    );
  });
});
