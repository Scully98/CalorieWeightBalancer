import { createInstance } from 'i18next';

import {
  DEBOUNCE_MS,
  refreshWidgetInBackground,
  startWidgetBackground,
  type BackgroundDeps,
} from '../background';
import { createMemoryWidgetStore } from '../sync';
import { GOLDEN_DAYS } from '@/core/__fixtures__/golden-30';
import { addDays } from '@/core/dates';
import { toDateKey, type DayRecord } from '@/core/day-record';
import type { HealthSource } from '@/health/source';
import { de } from '@/i18n/locales/de';
import { createMemoryStore } from '@/storage/key-value-store';
import { createSettingsStore } from '@/storage/settings-store';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  BiologicalSex: { notSet: 0, female: 1, male: 2, other: 3 },
  UpdateFrequency: { immediate: 1, hourly: 2, daily: 3, weekly: 4 },
}));

const i18n = createInstance();
i18n.init({
  resources: { de: { translation: de } },
  lng: 'de',
  initAsync: false,
  interpolation: { escapeValue: false },
});

const NOW = new Date(2026, 9, 24, 8, 14);

function source(records: DayRecord[]): HealthSource & { loads: number } {
  const byDate = new Map(records.map((record) => [record.date, record]));
  const health = {
    loads: 0,
    async days(start: Date, count: number) {
      health.loads += 1;
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
      return undefined;
    },
    async weightBefore() {
      return undefined;
    },
    async foodBefore() {
      return undefined;
    },
  };
  return health;
}

function deps(overrides: Partial<BackgroundDeps> = {}) {
  const settings = createSettingsStore(createMemoryStore());
  settings.completeIntro({});
  const widget = createMemoryWidgetStore();
  const health = source(GOLDEN_DAYS);
  let onChange: (() => void) | undefined;
  const value: BackgroundDeps = {
    settings,
    source: health,
    widget,
    isUnlocked: async () => true,
    enable: jest.fn(async () => true),
    subscribe: jest.fn((callback: () => void) => {
      onChange = callback;
      return jest.fn();
    }),
    now: () => NOW,
    locale: () => 'de-DE',
    t: i18n.getFixedT('de'),
    ...overrides,
  };
  return { value, widget, health, fire: () => onChange?.() };
}

describe('refreshWidgetInBackground', () => {
  it('writes the golden balance', async () => {
    const { value, widget } = deps();
    expect(await refreshWidgetInBackground(value)).toBe('written');
    expect(JSON.parse(widget.read() as string).content.kcal).toBe('+7.000');
    expect(widget.reloads).toBe(1);
  });

  it('writes nothing new for the same numbers', async () => {
    const { value, widget } = deps();
    await refreshWidgetInBackground(value);
    expect(await refreshWidgetInBackground(value)).toBe('same');
    expect(widget.writes).toBe(1);
  });

  it('does not load while the device is locked', async () => {
    const { value, widget, health } = deps({ isUnlocked: async () => false });
    expect(await refreshWidgetInBackground(value)).toBe('locked');
    expect(health.loads).toBe(0);
    expect(widget.writes).toBe(0);
  });

  it('does nothing before the intro', async () => {
    const settings = createSettingsStore(createMemoryStore());
    const { value, health } = deps({ settings });
    expect(await refreshWidgetInBackground(value)).toBe('noIntro');
    expect(health.loads).toBe(0);
  });

  it('keeps the last state when the load fails', async () => {
    const failing: HealthSource = {
      ...source([]),
      days: async () => {
        throw new Error('database inaccessible');
      },
    };
    const { value, widget } = deps({ source: failing });
    expect(await refreshWidgetInBackground(value)).toBe('error');
    expect(widget.writes).toBe(0);
  });
});

describe('startWidgetBackground', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('subscribes once after the intro and loads once per burst', async () => {
    const { value, health, fire } = deps();
    const stop = startWidgetBackground(value);
    expect(value.enable).toHaveBeenCalledTimes(1);
    expect(value.subscribe).toHaveBeenCalledTimes(1);

    fire();
    fire();
    fire();
    await jest.advanceTimersByTimeAsync(DEBOUNCE_MS - 1);
    expect(health.loads).toBe(0);
    await jest.advanceTimersByTimeAsync(1);
    // loadPeriodData asks for the period once.
    expect(health.loads).toBe(1);
    stop();
  });

  it('waits for the intro before subscribing', () => {
    const settings = createSettingsStore(createMemoryStore());
    const { value } = deps({ settings });
    const stop = startWidgetBackground(value);
    expect(value.subscribe).not.toHaveBeenCalled();
    settings.completeIntro({});
    expect(value.enable).toHaveBeenCalledTimes(1);
    expect(value.subscribe).toHaveBeenCalledTimes(1);
    settings.updateSettings({ includeToday: true });
    expect(value.subscribe).toHaveBeenCalledTimes(1);
    stop();
  });
});
