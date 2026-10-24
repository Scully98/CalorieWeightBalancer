import { createInstance } from 'i18next';

import {
  buildCalcLines,
  buildCalcNotes,
  buildDataRows,
  buildEstimateLines,
} from '../data-rows';
import type { BalanceReport } from '../use-balance';
import { periodBreakdown } from '@/core/balance';
import { de } from '@/i18n/locales/de';

jest.mock('@kingstinct/react-native-healthkit', () => ({}));
jest.mock('@/storage/settings', () => ({}));
jest.mock('@/health/daily-energy', () => ({}));

const i18n = createInstance();
i18n.init({
  resources: { de: { translation: de } },
  lng: 'de',
  initAsync: false,
});
const t = i18n.t;

const watch = {
  source: { name: "Julius' Watch", bundleIdentifier: 'com.apple.health' },
  operatingSystemVersion: '11.0',
  productType: 'Watch6,1',
};

function report(overrides: Partial<BalanceReport> = {}): BalanceReport {
  return {
    balance: periodBreakdown([
      { food: 2504, resting: 1800, active: 400 },
      { food: 2000, resting: 1800 },
      { resting: 1800, active: 300 },
    ]),
    daysWithData: { food: 2, resting: 3, active: 2 },
    sources: { food: undefined, resting: watch, active: watch },
    ...overrides,
  };
}

function values(r: BalanceReport) {
  return Object.fromEntries(
    buildCalcLines(r.balance, r.fallback, t, 'de-DE').map((line) => [
      line.key,
      [line.value, line.detail],
    ]),
  );
}

describe('buildCalcLines', () => {
  it('shows each part and the same rounded total as the balance page', () => {
    expect(values(report())).toEqual({
      food: ['4.500 kcal', 'Ø 2.250 kcal an 2 Tagen'],
      resting: ['3.600 kcal', 'Ø 1.800 kcal pro Tag'],
      active: [
        '400 kcal',
        'Ø 200 kcal pro Tag · an 1 Tag ohne Wert, mit 0 gerechnet',
      ],
      total: ['+500 kcal', undefined],
    });
  });

  it('names switched-off active energy', () => {
    const r = report({
      balance: periodBreakdown([{ food: 2000, resting: 1800 }]),
    });
    expect(values(r).active).toEqual(['0 kcal', 'fehlt, mit 0 gerechnet']);
  });

  it('says how missing resting energy was filled in', () => {
    const days = [
      { food: 2000, active: 100 },
      { food: 2000, resting: 900, restingCoverage: 0.5 },
    ];
    const estimate = report({
      balance: periodBreakdown(days, 1700),
      fallback: {
        kind: 'estimate',
        kcal: 1700,
        inputs: undefined as never,
      },
    });
    expect(values(estimate).resting[1]).toBe(
      'Ø 1.750 kcal pro Tag · an 1 Tag geschätzt · 1 Teiltag hochgerechnet',
    );
    const typical = report({
      balance: periodBreakdown(days, 1700),
      fallback: { kind: 'typical', kcal: 1700 },
    });
    expect(values(typical).resting[1]).toContain(
      'an 1 Tag mit deinem Median ergänzt',
    );
  });
});

describe('buildCalcNotes', () => {
  it('lists neutral and left-out days before the rounding note', () => {
    expect(buildCalcNotes(report().balance, t)).toEqual([
      '1 Tag ohne Eintrag als neutral gezählt',
      'Gerundet auf 10 kcal',
    ]);
  });
});

describe('buildDataRows', () => {
  it('shows source and days with data, or what is missing', () => {
    const rows = buildDataRows(
      report({ daysWithData: { food: 2, resting: 3, active: 0 } }),
      t,
    );
    expect(rows.map((row) => [row.key, row.status, row.detail])).toEqual([
      ['food', 'found', '2 von 3 Tagen'],
      ['resting', 'found', 'Apple Watch · 3 von 3 Tagen'],
      ['active', 'missing', 'keine Daten · Zugriff prüfen'],
    ]);
  });

  it('says when missing resting energy is estimated', () => {
    const rows = buildDataRows(
      report({
        daysWithData: { food: 2, resting: 0, active: 2 },
        fallback: { kind: 'estimate', kcal: 1700, inputs: undefined as never },
      }),
      t,
    );
    expect(rows[1].detail).toBe('keine Daten → geschätzt');
  });
});

describe('buildEstimateLines', () => {
  it('marks Health values and own entries', () => {
    const lines = buildEstimateLines(
      {
        weightKg: { value: 82.4, fromHealth: true },
        heightCm: { value: 182, fromHealth: false },
        ageYears: { value: 34, fromHealth: false },
        sex: { value: 'male', fromHealth: true, shown: 'male' },
      },
      t,
      'de-DE',
    );
    expect(lines.map((line) => line.detail)).toEqual([
      '82,4 kg · Health',
      '182 cm · deine Angabe',
      '34 Jahre · deine Angabe',
      'männlich · Health',
    ]);
  });
});
