import { createMemoryStore } from '../key-value-store';
import { parseSettings } from '../parse';
import { createSettingsStore, STORE_KEYS } from '../settings-store';
import { DEFAULT_SETTINGS, type Settings } from '@/core/settings';

const CHANGED: Settings = {
  period: { kind: 'custom', from: '2026-09-01', to: '2026-09-30' },
  zeroDaysAsMaintenance: false,
  includeToday: true,
  tolerance: { foodPercent: 5, burnPercent: 10 },
};

describe('createSettingsStore', () => {
  it('starts with defaults, no intro and an empty profile', () => {
    const store = createSettingsStore(createMemoryStore());
    expect(store.getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(store.isIntroCompleted()).toBe(false);
    expect(store.getProfile()).toEqual({});
  });

  it('keeps every value across a restart', () => {
    const kv = createMemoryStore();
    const before = createSettingsStore(kv);
    before.completeIntro({ heightCm: 182 });
    before.updateSettings(CHANGED);
    before.setProfile({ heightCm: 180, sex: 'female', ageYears: 34 });

    // A new store over the same storage, as after an app restart.
    const after = createSettingsStore(kv);
    expect(after.getSettings()).toEqual(CHANGED);
    expect(after.isIntroCompleted()).toBe(true);
    expect(after.getProfile()).toEqual({
      heightCm: 180,
      sex: 'female',
      ageYears: 34,
    });
  });

  it('stores only settings and entered values, no Health values', () => {
    const kv = createMemoryStore();
    const store = createSettingsStore(kv);
    store.completeIntro({ weightKg: 82.4, weightRecordedOn: '2026-10-24' });
    store.updateSettings(CHANGED);
    expect(kv.keys().sort()).toEqual(Object.values(STORE_KEYS).sort());
    const stored = JSON.parse(kv.get(STORE_KEYS.settings) ?? '{}');
    expect(Object.keys(stored).sort()).toEqual([
      'includeToday',
      'period',
      'tolerance',
      'zeroDaysAsMaintenance',
    ]);
  });

  it('changes only the given settings', () => {
    const store = createSettingsStore(createMemoryStore());
    store.updateSettings({ includeToday: true });
    expect(store.getSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      includeToday: true,
    });
  });

  it('returns the same settings object until the next write', () => {
    const store = createSettingsStore(createMemoryStore());
    const first = store.getSettings();
    expect(store.getSettings()).toBe(first);
    store.updateSettings({ zeroDaysAsMaintenance: false });
    expect(store.getSettings()).not.toBe(first);
  });

  it('notifies subscribers on every write until unsubscribed', () => {
    const store = createSettingsStore(createMemoryStore());
    let calls = 0;
    const unsubscribe = store.subscribe(() => calls++);
    store.updateSettings({ includeToday: true });
    store.completeIntro({});
    store.setProfile({});
    store.resetIntro();
    unsubscribe();
    store.updateSettings({ includeToday: false });
    expect(calls).toBe(4);
  });

  it('clears intro and profile on reset but keeps the settings', () => {
    const kv = createMemoryStore();
    const store = createSettingsStore(kv);
    store.completeIntro({ heightCm: 170 });
    store.updateSettings({ includeToday: true });
    store.resetIntro();
    expect(store.isIntroCompleted()).toBe(false);
    expect(kv.get(STORE_KEYS.profile)).toBeNull();
    expect(store.getSettings().includeToday).toBe(true);
  });
});

describe('profile', () => {
  it('stores only defined fields', () => {
    const kv = createMemoryStore();
    createSettingsStore(kv).completeIntro({
      heightCm: 182,
      sex: 'male',
      weightKg: undefined,
    });
    expect(kv.get(STORE_KEYS.profile)).toBe('{"heightCm":182,"sex":"male"}');
  });

  it('is empty for invalid JSON or an array', () => {
    for (const raw of ['{not json', '[1,2]']) {
      const store = createSettingsStore(
        createMemoryStore({ [STORE_KEYS.profile]: raw }),
      );
      expect(store.getProfile()).toEqual({});
    }
  });

  it('drops fields with a wrong type or out of range', () => {
    const store = createSettingsStore(
      createMemoryStore({
        [STORE_KEYS.profile]: JSON.stringify({
          heightCm: '182',
          sex: 'divers',
          weightKg: 82.4,
          weightRecordedOn: '15.10.2026',
          ageYears: 7,
          ageRecordedOn: '2026-10-15',
        }),
      }),
    );
    expect(store.getProfile()).toEqual({
      weightKg: 82.4,
      ageRecordedOn: '2026-10-15',
    });
  });
});

describe('parseSettings', () => {
  it('gives the defaults without a valid entry', () => {
    for (const raw of [null, '', '{not json', '[1,2]', '42']) {
      expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
    }
  });

  it('falls back per field', () => {
    const parsed = parseSettings(
      JSON.stringify({
        period: { kind: 'days', days: 45 },
        zeroDaysAsMaintenance: 'no',
        includeToday: true,
        tolerance: { foodPercent: 25, burnPercent: 7.5 },
      }),
    );
    expect(parsed).toEqual({ ...DEFAULT_SETTINGS, includeToday: true });
    expect(
      parseSettings(JSON.stringify({ tolerance: { foodPercent: -1 } }))
        .tolerance,
    ).toEqual(DEFAULT_SETTINGS.tolerance);
  });

  it('checks the dates of a custom period', () => {
    const custom = (from: string) =>
      parseSettings(
        JSON.stringify({ period: { kind: 'custom', from, to: '2026-10-15' } }),
      ).period;
    expect(custom('15.10.2026')).toEqual(DEFAULT_SETTINGS.period);
    expect(custom('2026-10-01')).toEqual({
      kind: 'custom',
      from: '2026-10-01',
      to: '2026-10-15',
    });
  });

  it('keeps every preset, "all" and the slider ends', () => {
    const periodOf = (period: unknown) =>
      parseSettings(JSON.stringify({ period })).period;
    for (const days of [7, 30, 60, 90]) {
      expect(periodOf({ kind: 'days', days })).toEqual({ kind: 'days', days });
    }
    expect(periodOf({ kind: 'all' })).toEqual({ kind: 'all' });
    expect(periodOf({ kind: 'week' })).toEqual(DEFAULT_SETTINGS.period);
    expect(
      parseSettings(
        JSON.stringify({ tolerance: { foodPercent: 20, burnPercent: 30 } }),
      ).tolerance,
    ).toEqual({ foodPercent: 20, burnPercent: 30 });
  });
});
