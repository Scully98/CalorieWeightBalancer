import { createInstance } from 'i18next';

import {
  buildCalcLines,
  buildCalcNotes,
  buildDataRows,
  buildEstimateLines,
} from '../data-rows';
import type { BalanceReport } from '../use-balance';
import { dayBalances } from '@/core/day-balance';
import type { DayRecord } from '@/core/day-record';
import { periodBalance } from '@/core/period-balance';
import type { RestingProfile } from '@/core/resting';
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

// Resting energy after Mifflin-St Jeor: 10 × 70 + 6.25 × 160 − 5 × 40 + 5
// = 1,505 kcal.
const PROFILE: RestingProfile = {
  heightCm: 160,
  sex: 'male',
  ageYears: 40,
  weightKg: 70,
};

function balance(
  records: Omit<DayRecord, 'date'>[],
  profile: RestingProfile = {},
) {
  const days = dayBalances(
    records.map((record, i) => ({ date: `2026-10-0${i + 1}`, ...record })),
    { zeroDaysAsMaintenance: true, profile },
  );
  return periodBalance(days, { foodPercent: 0, burnPercent: 0 });
}

function report(overrides: Partial<BalanceReport> = {}): BalanceReport {
  return {
    balance: balance([
      { food: 2504, resting: 1800, active: 400 },
      { food: 2000, resting: 1800 },
      { resting: 1800, active: 300 },
    ]),
    days: [],
    daysWithData: { food: 2, resting: 3, active: 2 },
    sources: { food: undefined, resting: watch, active: watch },
    ...overrides,
  };
}

function values(r: BalanceReport) {
  return Object.fromEntries(
    buildCalcLines(r.balance, t, 'de-DE').map((line) => [
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
      balance: balance([{ food: 2000, resting: 1800 }]),
    });
    expect(values(r).active).toEqual(['0 kcal', 'fehlt, mit 0 gerechnet']);
  });

  it('says how missing resting energy was filled in', () => {
    const r = report({
      balance: balance(
        [
          { food: 2000, active: 100 },
          { food: 2000, resting: 1047.5, restingCoverage: 0.5 },
        ],
        PROFILE,
      ),
    });
    // (1,505 + 2,095) ÷ 2.
    expect(values(r).resting[1]).toBe(
      'Ø 1.800 kcal pro Tag · an 1 Tag geschätzt · 1 Teiltag hochgerechnet',
    );
  });
});

describe('buildCalcNotes', () => {
  it('lists neutral and left-out days before the rounding note', () => {
    expect(buildCalcNotes(report().balance, t)).toEqual([
      '1 Tag ohne Eintrag als neutral gezählt',
      'Gerundet auf 10 kcal',
    ]);
    const leftOut = balance([{ food: 2000, resting: 1800 }, { food: 2000 }]);
    expect(buildCalcNotes(leftOut, t)).toEqual([
      '1 Tag ohne Grundumsatz nicht mitgerechnet',
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
        estimate: { days: 1, avgKcal: 1505 } as BalanceReport['estimate'],
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
        sex: { value: 'male', fromHealth: true },
        days: 3,
        avgKcal: 1796.5,
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
