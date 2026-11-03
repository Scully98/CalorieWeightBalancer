import { createInstance } from 'i18next';

import golden from '../__fixtures__/snapshot-golden.json';
import {
  SNAPSHOT_VERSION,
  widgetSnapshot,
  type WidgetSnapshot,
} from '../snapshot';
import {
  loadBalance,
  toBalanceState,
  type BalanceState,
} from '@/features/balance/use-balance';
import { GOLDEN_DAYS, GOLDEN_TOLERANCE } from '@/core/__fixtures__/golden-30';
import { addDays } from '@/core/dates';
import { toDateKey, type DayRecord } from '@/core/day-record';
import { DEFAULT_SETTINGS, type Settings } from '@/core/settings';
import type { HealthSource } from '@/health/source';
import { de } from '@/i18n/locales/de';
import { en } from '@/i18n/locales/en';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  BiologicalSex: { notSet: 0, female: 1, male: 2, other: 3 },
}));

const i18n = createInstance();
i18n.init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: 'de',
  initAsync: false,
  interpolation: { escapeValue: false },
});
const tDe = i18n.getFixedT('de');
const tEn = i18n.getFixedT('en');

// The morning after the golden period (24 Sep – 23 Oct).
const NOW = new Date(2026, 9, 24, 8, 14);
const OFF = { foodPercent: 0, burnPercent: 0 };

// Health with the given days by date; every other day is empty.
function source(records: DayRecord[], firstDataDate?: Date): HealthSource {
  const byDate = new Map(records.map((record) => [record.date, record]));
  return {
    async days(start, count) {
      return Array.from({ length: count }, (_, i) => {
        const date = toDateKey(addDays(start, i));
        return byDate.get(date) ?? { date };
      });
    },
    async profile() {
      return { biologicalSex: 0 };
    },
    async latestSources() {
      return {
        food: undefined,
        resting: undefined,
        active: undefined,
        weight: undefined,
        bodyFat: undefined,
      };
    },
    async firstDataDate() {
      return firstDataDate;
    },
    async weightBefore() {
      return undefined;
    },
    async foodBefore() {
      return undefined;
    },
  };
}

type Finished = Extract<BalanceState, { status: 'done' | 'empty' }>;

async function state(
  health: HealthSource,
  settings: Partial<Settings> = {},
  now = NOW,
): Promise<Finished> {
  const value = await loadBalance(
    health,
    { ...DEFAULT_SETTINGS, ...settings },
    now,
  );
  return toBalanceState({ status: 'done', value }) as Finished;
}

function balanceContent(snapshot: WidgetSnapshot) {
  if (snapshot.content.kind !== 'balance') throw new Error('not a balance');
  return snapshot.content;
}

// One day of the golden period with the given balance, for sign tests.
function dayWith(date: Date, kcal: number): DayRecord {
  return { date: toDateKey(date), food: 2000 + kcal, resting: 2000 };
}

describe('widgetSnapshot', () => {
  it('shows the golden case like the picture', async () => {
    const snapshot = widgetSnapshot(
      await state(source(GOLDEN_DAYS)),
      OFF,
      'de-DE',
      tDe,
    );
    expect(snapshot.version).toBe(SNAPSHOT_VERSION);
    expect(snapshot.title).toBe('30 Tage');
    expect(snapshot.dates).toBe('24. Sep – 23. Okt');
    const content = balanceContent(snapshot);
    expect(content.kcal).toBe('+7.000');
    expect(content.unit).toBe('kcal');
    expect(content.range).toBeNull();
    expect(content.fat).toBe('ca. +0,9 kg Körperfett');
    expect(content.lockFat).toBe('ca. +0,9 kg Fett');
    expect(content.inline).toBe('+7.000 kcal · 30 T');
    expect(content.label).toBe(
      '30 Tage, 24. September bis 23. Oktober. plus 7.000 Kilokalorien, mehr gegessen als verbraucht. etwa plus 0,9 Kilogramm Körperfett, berechnet',
    );
    expect(content.lockLabel).toBe(
      '30 Tage. plus 7.000 Kilokalorien, mehr gegessen als verbraucht. etwa plus 0,9 Kilogramm Körperfett, berechnet',
    );
  });

  it('keeps the single value and adds the range with a tolerance', async () => {
    const snapshot = widgetSnapshot(
      await state(source(GOLDEN_DAYS), { tolerance: GOLDEN_TOLERANCE }),
      GOLDEN_TOLERANCE,
      'de-DE',
      tDe,
    );
    const content = balanceContent(snapshot);
    expect(content.kcal).toBe('+7.000');
    expect(content.range).toBe('+2.650 bis +19.350');
    expect(content.fat).toBe('ca. +0,3 bis +2,5 kg Körperfett');
    expect(content.lockFat).toBe('ca. +0,9 kg Fett');
    expect(content.inline).toBe('+7.000 kcal · 30 T');
    expect(content.label).toContain(
      'Mit Messfehler plus 2.650 bis plus 19.350 Kilokalorien, mehr gegessen als verbraucht',
    );
    expect(content.lockLabel).not.toContain('Messfehler');
  });

  // The Swift previews use the same values. After an intended change, copy
  // the received object from the failure into the fixture.
  it('matches the checked-in fixture for the Swift previews', async () => {
    const snapshot = widgetSnapshot(
      await state(source(GOLDEN_DAYS), { tolerance: GOLDEN_TOLERANCE }),
      GOLDEN_TOLERANCE,
      'de-DE',
      tDe,
    );
    expect(snapshot).toEqual(golden);
  });

  it('writes the sign at zero and a real minus', async () => {
    const yesterday = addDays(NOW, -1);
    const zero = balanceContent(
      widgetSnapshot(
        await state(source([dayWith(yesterday, 0)])),
        OFF,
        'de-DE',
        tDe,
      ),
    );
    expect(zero.kcal).toBe('±0');
    const minus = balanceContent(
      widgetSnapshot(
        await state(source([dayWith(yesterday, -1250)])),
        OFF,
        'de-DE',
        tDe,
      ),
    );
    expect(minus.kcal).toBe('−1.250');
    expect(minus.lockFat).toBe('ca. −0,2 kg Fett');
  });

  it('counts today on top in the title', async () => {
    const snapshot = widgetSnapshot(
      await state(source(GOLDEN_DAYS), { includeToday: true }),
      OFF,
      'de-DE',
      tDe,
    );
    expect(snapshot.title).toBe('31 Tage');
    expect(snapshot.dates).toBe('24. Sep – 24. Okt');
    expect(balanceContent(snapshot).inline).toContain('31 T');
  });

  it('names the counted days of a custom period', async () => {
    const snapshot = widgetSnapshot(
      await state(source(GOLDEN_DAYS), {
        period: { kind: 'custom', from: '2026-10-01', to: '2026-10-15' },
      }),
      OFF,
      'de-DE',
      tDe,
    );
    expect(snapshot.title).toBe('15 Tage');
    expect(snapshot.dates).toBe('1. Okt – 15. Okt');
  });

  it('adds the year across a year change', async () => {
    const snapshot = widgetSnapshot(
      await state(
        source([dayWith(new Date(2026, 0, 2), 100)]),
        { period: { kind: 'days', days: 7 } },
        new Date(2026, 0, 5, 9, 0),
      ),
      OFF,
      'de-DE',
      tDe,
    );
    expect(snapshot.dates).toBe('29. Dez 2025 – 4. Jan 2026');
  });

  it('goes stale at the next midnight for a period that moves along', async () => {
    const snapshot = widgetSnapshot(
      await state(source(GOLDEN_DAYS)),
      OFF,
      'de-DE',
      tDe,
    );
    expect(snapshot.loadedAt).toBe(NOW.toISOString());
    expect(snapshot.staleAfter).toBe(new Date(2026, 9, 25).toISOString());
    expect(snapshot.stale).toBe('Stand 24. Okt, 08:14');
    expect(snapshot.staleLabel).toBe('Stand 24. Oktober, 08:14 Uhr');
  });

  it('crosses the daylight saving change at local midnight', async () => {
    // 25 Oct 2026 has 25 hours in Berlin.
    const now = new Date(2026, 9, 25, 12, 0);
    const snapshot = widgetSnapshot(
      await state(source(GOLDEN_DAYS), {}, now),
      OFF,
      'de-DE',
      tDe,
    );
    expect(snapshot.staleAfter).toBe(new Date(2026, 9, 26).toISOString());
  });

  it('never goes stale for a custom period in the past', async () => {
    const snapshot = widgetSnapshot(
      await state(source(GOLDEN_DAYS), {
        period: { kind: 'custom', from: '2026-09-24', to: '2026-10-10' },
      }),
      OFF,
      'de-DE',
      tDe,
    );
    expect(snapshot.staleAfter).toBeNull();
  });

  it('shows the sentences of the empty balance page', async () => {
    const noData = widgetSnapshot(await state(source([])), OFF, 'de-DE', tDe);
    expect(noData.content).toEqual({
      kind: 'empty',
      message: 'Noch keine Daten.',
      inline: 'Bilanz: noch keine Daten',
      label: '30 Tage, 24. September bis 23. Oktober. Noch keine Daten.',
    });

    const inPeriod = await state(source([], new Date(2026, 5, 1)));
    expect(widgetSnapshot(inPeriod, OFF, 'de-DE', tDe).content).toMatchObject({
      message: 'Keine Nahrung in diesem Zeitraum.',
    });

    const firstDay = await state(source([], NOW));
    expect(widgetSnapshot(firstDay, OFF, 'de-DE', tDe).content).toMatchObject({
      message: 'Deine Bilanz beginnt morgen.',
    });
  });

  it('writes English texts', async () => {
    const snapshot = widgetSnapshot(
      await state(source(GOLDEN_DAYS), { tolerance: GOLDEN_TOLERANCE }),
      GOLDEN_TOLERANCE,
      'en-US',
      tEn,
    );
    expect(snapshot.title).toBe('30 days');
    expect(snapshot.dates).toBe('Sep 24 – Oct 23');
    expect(snapshot.stale).toBe('As of Oct 24, 8:14 AM');
    const content = balanceContent(snapshot);
    expect(content.kcal).toBe('+7,000');
    expect(content.range).toBe('+2,650 to +19,350');
    expect(content.lockFat).toBe('approx. +0.9 kg fat');
    expect(content.inline).toBe('+7,000 kcal · 30 d');
  });
});
