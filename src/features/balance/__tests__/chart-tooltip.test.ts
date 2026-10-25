import { createInstance } from 'i18next';

import { chartModel } from '../chart-model';
import { chartSummary, tooltipModel } from '../chart-tooltip';
import type { DayBucket, WeekBucket } from '@/core/chart';
import type { ChartLines } from '@/core/lines';
import { de } from '@/i18n/locales/de';
import { en } from '@/i18n/locales/en';

const i18n = createInstance();
i18n.init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: 'de',
  initAsync: false,
  interpolation: { escapeValue: false },
});
const t = i18n.getFixedT('de');
const tEn = i18n.getFixedT('en');

const LOADED = new Date(2026, 9, 24, 14, 32);

function dayBucket(overrides: Partial<DayBucket> = {}): DayBucket {
  return {
    kind: 'day',
    date: '2026-10-15',
    kcal: 304,
    maintenance: false,
    flags: [],
    measured: false,
    food: 2904,
    resting: 1797,
    restingSource: 'measured',
    active: 803,
    ...overrides,
  };
}

function weekBucket(overrides: Partial<WeekBucket> = {}): WeekBucket {
  return {
    kind: 'week',
    isoWeek: 42,
    from: '2026-10-12',
    to: '2026-10-18',
    days: 7,
    avgKcal: 233.4,
    avgFoodKcal: 2899.6,
    avgBurnKcal: 2666.2,
    incompleteDays: 0,
    measurements: 3,
    ...overrides,
  };
}

const values = (rows: { label: string; value: string }[]) =>
  rows.map((row) => [row.label, row.value]);

describe('tooltipModel for a day', () => {
  it('shows the values rounded to 10 kcal and the measurement', () => {
    const model = tooltipModel(
      dayBucket({ body: { weightKg: 82.14, fatKg: 17.76 } }),
      LOADED,
      'de-DE',
      t,
    );
    expect(model.title).toBe('Do, 15. Okt');
    expect(model.badge).toBeUndefined();
    expect(values(model.rows)).toEqual([
      ['Gegessen', '2.900'],
      ['Ruhe', '1.800'],
      ['Aktiv', '800'],
      ['Bilanz', '+300 kcal'],
    ]);
    expect(model.rows[3].strong).toBe(true);
    expect(model.footer).toBe('Gewicht 82,1 kg · Fett 17,8 kg');
    expect(model.spoken).toBe(
      'Donnerstag, 15. Oktober 2026. Gegessen 2.900, Ruhe 1.800, Aktiv 800, Bilanz plus 300 Kilokalorien. Gewicht 82,1 kg · Fett 17,8 kg',
    );
  });

  it('marks estimated resting energy and names the worst flag', () => {
    const model = tooltipModel(
      dayBucket({
        restingSource: 'formula',
        flags: ['restingEstimated'],
        worst: 'restingEstimated',
      }),
      LOADED,
      'de-DE',
      t,
    );
    expect(model.badge).toBe('Grundumsatz geschätzt');
    expect(model.rows[1].value).toBe('1.800 (Formel)');
    expect(model.footer).toBe('Keine Waage-Messung');
    const source = tooltipModel(
      dayBucket({ restingSource: 'source' }),
      LOADED,
      'de-DE',
      t,
    );
    expect(source.rows[1].value).toBe('1.800 (geschätzt)');
  });

  it('shows a zero day as maintenance', () => {
    const model = tooltipModel(
      dayBucket({
        food: undefined,
        kcal: 0,
        maintenance: true,
        flags: ['noFood'],
        worst: 'noFood',
        body: { weightKg: 82.1 },
      }),
      LOADED,
      'de-DE',
      t,
    );
    expect(model.badge).toBe('Ohne Nahrung');
    expect(values(model.rows)[0]).toEqual(['Gegessen', '–']);
    expect(model.rows[3].value).toBe('0 (Erhaltung)');
    expect(model.footer).toBe('Gewicht 82,1 kg');
  });

  it('shows a no-food day with the switch off as full deficit', () => {
    const model = tooltipModel(
      dayBucket({
        food: undefined,
        kcal: -2600,
        flags: ['noFood'],
        worst: 'noFood',
      }),
      LOADED,
      'de-DE',
      t,
    );
    expect(model.rows[3].value).toBe('−2.600 kcal');
  });

  it('says a day without resting energy does not count', () => {
    const model = tooltipModel(
      dayBucket({
        resting: undefined,
        restingSource: 'missing',
        kcal: undefined,
        flags: ['noResting'],
        worst: 'noResting',
      }),
      LOADED,
      'de-DE',
      t,
    );
    expect(model.badge).toBe('Ohne Grundumsatz');
    expect(values(model.rows).slice(1)).toEqual([
      ['Ruhe', '–'],
      ['Aktiv', '800'],
      ['Bilanz', 'zählt nicht'],
    ]);
  });

  it('writes ±0 for a balance that rounds to zero', () => {
    const model = tooltipModel(dayBucket({ kcal: 3 }), LOADED, 'de-DE', t);
    expect(model.rows[3].value).toBe('±0 kcal');
  });
});

describe('tooltipModel for today', () => {
  it('shows the time and whether today counts', () => {
    const today = dayBucket({
      date: '2026-10-24',
      food: 1420,
      resting: 1090,
      restingSource: 'partial',
      active: 290,
      kcal: 40,
      today: { counted: false },
    });
    const model = tooltipModel(today, LOADED, 'de-DE', t);
    expect(model.title).toBe('Heute · bis 14:32');
    expect(model.badge).toBe('Zählt nicht mit');
    expect(values(model.rows)).toEqual([
      ['Gegessen', '1.420'],
      ['Ruhe', '1.090 (teils Formel)'],
      ['Aktiv', '290'],
      ['Bilanz', '+40 kcal'],
    ]);
    expect(model.footer).toBe('Tag läuft noch');
    const counted = tooltipModel(
      { ...today, today: { counted: true } },
      LOADED,
      'de-DE',
      t,
    );
    expect(counted.badge).toBe('Zählt mit');
  });
});

describe('tooltipModel for a week', () => {
  it('shows averages on whole kcal', () => {
    const model = tooltipModel(weekBucket(), LOADED, 'de-DE', t);
    expect(model.title).toBe('KW 42 · 12.–18. Okt');
    expect(model.badge).toBeUndefined();
    expect(values(model.rows)).toEqual([
      ['Ø Gegessen', '2.900'],
      ['Ø Verbrauch', '2.666'],
      ['Ø Bilanz / Tag', '+233 kcal'],
    ]);
    expect(model.footer).toBe('7 Tage · 3 Messungen');
  });

  it('spans months and counts incomplete days', () => {
    const model = tooltipModel(
      weekBucket({
        isoWeek: 40,
        from: '2026-09-28',
        to: '2026-10-04',
        incompleteDays: 1,
        measurements: 1,
      }),
      LOADED,
      'de-DE',
      t,
    );
    expect(model.title).toBe('KW 40 · 28. Sep – 4. Okt');
    expect(model.badge).toBe('1 Tag unvollständig');
    expect(model.footer).toBe('7 Tage · 1 Messung');
  });

  it('shows a dash without counted days', () => {
    const model = tooltipModel(
      weekBucket({
        avgKcal: undefined,
        avgFoodKcal: undefined,
        avgBurnKcal: undefined,
      }),
      LOADED,
      'de-DE',
      t,
    );
    expect(model.rows.map((row) => row.value)).toEqual(['–', '–', '–']);
  });

  it('speaks English', () => {
    const model = tooltipModel(weekBucket(), LOADED, 'en-US', tEn);
    expect(model.title).toBe('W42 · Oct 12–18');
    expect(values(model.rows)[2]).toEqual(['Avg balance / day', '+233 kcal']);
    expect(model.footer).toBe('7 days · 3 measurements');
  });
});

describe('chartSummary', () => {
  const lines: ChartLines = {
    points: [
      { date: '2026-09-25', weightTrend: 0, theoreticalFat: 0 },
      { date: '2026-09-26', weightTrend: 0.72, theoreticalFat: 0.1 },
      { date: '2026-09-27', theoreticalFat: 0.2 },
    ],
    hasWeight: true,
    hasFat: false,
  };
  const model = chartModel(
    { buckets: [dayBucket(), dayBucket(), dayBucket()], lines },
    {},
    'de-DE',
    t,
  );

  it('names the bars and the last weight change', () => {
    expect(chartSummary(model, lines, 'de-DE', t)).toBe(
      'Bilanz pro Tag, 3 Balken. Gewicht plus 0,7 Kilogramm seit 25. Sep.',
    );
  });

  it('leaves the weight out without measurements', () => {
    expect(
      chartSummary(
        model,
        {
          ...lines,
          points: lines.points.map(({ date }) => ({ date, theoreticalFat: 0 })),
          hasWeight: false,
        },
        'de-DE',
        t,
      ),
    ).toBe('Bilanz pro Tag, 3 Balken.');
  });
});
