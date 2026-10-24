import { appGroupStorage } from '../app-group';
import {
  completeIntro,
  getProfile,
  isIntroCompleted,
  resetIntro,
  subscribeToSettings,
} from '../settings';

jest.mock('@bacons/apple-targets', () => {
  const store = new Map<string, string>();
  return {
    ExtensionStorage: class {
      set(key: string, value: string) {
        store.set(key, value);
      }
      get(key: string) {
        return store.get(key) ?? null;
      }
      remove(key: string) {
        store.delete(key);
      }
    },
  };
});

describe('settings', () => {
  beforeEach(() => resetIntro());

  it('starts without a completed intro and an empty profile', () => {
    expect(isIntroCompleted()).toBe(false);
    expect(getProfile()).toEqual({});
  });

  it('stores only defined profile fields and the intro flag', () => {
    completeIntro({ heightCm: 182, sex: 'male', weightKg: undefined });
    expect(isIntroCompleted()).toBe(true);
    expect(getProfile()).toEqual({ heightCm: 182, sex: 'male' });
    expect(appGroupStorage.get('profile.v1')).toBe(
      '{"heightCm":182,"sex":"male"}',
    );
  });

  it('returns an empty profile for invalid JSON', () => {
    appGroupStorage.set('profile.v1', '{not json');
    expect(getProfile()).toEqual({});
    appGroupStorage.set('profile.v1', '[1,2]');
    expect(getProfile()).toEqual({});
  });

  it('drops fields with a wrong type or out of range', () => {
    appGroupStorage.set(
      'profile.v1',
      JSON.stringify({
        heightCm: '182',
        sex: 'divers',
        weightKg: 82.4,
        weightRecordedOn: '15.10.2026',
        ageYears: 7,
        ageRecordedOn: '2026-10-15',
      }),
    );
    expect(getProfile()).toEqual({
      weightKg: 82.4,
      ageRecordedOn: '2026-10-15',
    });
  });

  it('clears both keys on reset', () => {
    completeIntro({ heightCm: 170 });
    resetIntro();
    expect(isIntroCompleted()).toBe(false);
    expect(appGroupStorage.get('profile.v1')).toBeNull();
  });

  it('notifies subscribers on complete and reset', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToSettings(listener);
    completeIntro({});
    resetIntro();
    unsubscribe();
    completeIntro({});
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
