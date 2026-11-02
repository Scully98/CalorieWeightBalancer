import { createInstance } from 'i18next';

import { periodSpan, periodSubtitle } from '../period-subtitle';
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

function subtitle(period: Period, { includeToday = false } = {}, t = tDe) {
  const span = periodSpan(period, includeToday, NOW);
  return span && periodSubtitle(span, includeToday, NOW, t);
}

describe('periodSubtitle', () => {
  it('names the days of a preset like the design', () => {
    expect(subtitle(DAYS_30)).toBe('24. Sep – 23. Okt · 30 Tage · ohne heute');
  });

  it('ends with today when today is included', () => {
    expect(subtitle(DAYS_30, { includeToday: true })).toBe(
      '24. Sep – 24. Okt · 31 Tage · inkl. heute',
    );
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
    expect(subtitle(DAYS_30, {}, tEn)).toBe(
      'Sep 24 – Oct 23 · 30 days · excluding today',
    );
  });
});
