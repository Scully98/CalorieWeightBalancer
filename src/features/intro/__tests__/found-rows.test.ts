import type { SourceRevision } from '@kingstinct/react-native-healthkit';
import { createInstance } from 'i18next';

import { buildFoundRows, sourceLabel } from '../found-rows';
import type { HealthScan } from '@/health/scan';
import { de } from '@/i18n/locales/de';

jest.mock('@kingstinct/react-native-healthkit', () => ({}));

const i18n = createInstance();
i18n.init({
  resources: { de: { translation: de } },
  lng: 'de',
  initAsync: false,
});
const t = i18n.t;

const now = new Date(2026, 9, 15, 12);

function source(
  name: string,
  productType?: string,
  bundleIdentifier = `test.${name}`,
): SourceRevision {
  return {
    source: { name, bundleIdentifier },
    operatingSystemVersion: '18.3',
    productType,
  };
}

const empty: HealthScan = {
  food: { hasData: false },
  active: { hasData: false, daysWithData: 0 },
  resting: { hasData: false, daysWithData: 0 },
  weight: { hasData: false, count: 0 },
  bodyFat: { hasData: false, count: 0 },
  profile: { biologicalSex: 0 },
};

function details(scan: HealthScan): Record<string, string> {
  return Object.fromEntries(
    buildFoundRows(scan, now, t, 'de-DE').map((row) => [row.key, row.detail]),
  );
}

describe('sourceLabel', () => {
  it('names Apple devices by type, not by personal name', () => {
    expect(
      sourceLabel(
        source("Julius' iPhone", 'iPhone15,2', 'com.apple.health.9F3A1C2B'),
      ),
    ).toBe('iPhone');
    expect(
      sourceLabel(
        source("Julius' Watch", 'Watch6,1', 'com.apple.health.4D5E6F70'),
      ),
    ).toBe('Apple Watch');
  });

  it('uses the source name for apps and manual entries', () => {
    // Apps run on the iPhone, so their samples carry its product type too.
    expect(sourceLabel(source('YAZIO', 'iPhone15,2'))).toBe('YAZIO');
    expect(sourceLabel(source('Withings', 'iPhone15,2'))).toBe('Withings');
    expect(
      sourceLabel(source('Health', 'iPhone15,2', 'com.apple.Health')),
    ).toBe('Health');
  });
});

describe('buildFoundRows', () => {
  it('keeps the wireframe order and missing texts', () => {
    const rows = buildFoundRows(empty, now, t, 'de-DE');
    expect(rows.map((row) => row.key)).toEqual([
      'food',
      'active',
      'weight',
      'resting',
      'bodyFat',
    ]);
    expect(rows.map((row) => row.detail)).toEqual([
      'fehlt',
      'fehlt',
      'fehlt',
      'fehlt → schätzen',
      'optional',
    ]);
    expect(rows.every((row) => row.status === 'missing')).toBe(true);
  });

  it('shows food since the first entry, with year only for past years', () => {
    expect(
      details({
        ...empty,
        food: {
          hasData: true,
          source: source('Yazio'),
          firstDate: new Date(2026, 2, 3),
        },
      }).food,
    ).toBe('Yazio · seit 3. März');
    expect(
      details({
        ...empty,
        food: {
          hasData: true,
          source: source('Yazio'),
          firstDate: new Date(2025, 10, 20),
        },
      }).food,
    ).toBe('Yazio · seit 20. Nov. 2025');
  });

  it('describes energy as daily, n of 7 days or last date', () => {
    const iPhone = source('iPhone', 'iPhone15,2');
    const active = (daysWithData: number) =>
      details({
        ...empty,
        active: {
          hasData: true,
          source: iPhone,
          daysWithData,
          lastDate: new Date(2026, 8, 1),
        },
      }).active;
    expect(active(7)).toBe('iPhone · täglich');
    expect(active(5)).toBe('iPhone · an 5 von 7 Tagen');
    expect(active(0)).toBe('iPhone · zuletzt am 1. Sept.');
  });

  it('counts measurements with plural', () => {
    const scale = source('Waage');
    expect(
      details({ ...empty, weight: { hasData: true, source: scale, count: 14 } })
        .weight,
    ).toBe('Waage · 14 Messungen');
    expect(
      details({ ...empty, bodyFat: { hasData: true, source: scale, count: 1 } })
        .bodyFat,
    ).toBe('Waage · 1 Messung');
    expect(
      details({
        ...empty,
        weight: { hasData: true, source: scale, count: 100 },
      }).weight,
    ).toBe('Waage · 100+ Messungen');
  });

  it('builds an accessibility label from label, status and detail', () => {
    const [food] = buildFoundRows(
      {
        ...empty,
        food: {
          hasData: true,
          source: source('Yazio'),
          firstDate: new Date(2026, 2, 3),
        },
      },
      now,
      t,
      'de-DE',
    );
    expect(food.accessibilityLabel).toBe(
      'Nahrung, gefunden, Yazio · seit 3. März',
    );
  });
});
