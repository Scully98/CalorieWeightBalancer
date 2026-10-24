import { appGroupStore } from './app-group';
import type { KeyValueStore } from './key-value-store';
import {
  parseProfile,
  parseSettings,
  profileToJson,
  type StoredProfile,
} from './parse';
import type { Settings } from '@/core/settings';

export type { StoredProfile } from './parse';

// Every key the store writes. Only settings and values the user entered,
// never Health values.
export const STORE_KEYS = {
  introCompleted: 'introCompleted',
  profile: 'profile.v1',
  settings: 'settings.v1',
} as const;

export type SettingsStore = {
  getSettings(): Settings;
  updateSettings(patch: Partial<Settings>): void;
  isIntroCompleted(): boolean;
  completeIntro(profile: StoredProfile): void;
  // Development only: shows the intro again on the next render.
  resetIntro(): void;
  getProfile(): StoredProfile;
  setProfile(profile: StoredProfile): void;
  subscribe(listener: () => void): () => void;
};

type Snapshot = {
  settings: Settings;
  introCompleted: boolean;
  profile: StoredProfile;
};

export function createSettingsStore(kv: KeyValueStore): SettingsStore {
  const listeners = new Set<() => void>();
  // Read once and kept until the next write, so React gets the same objects
  // between changes (useSyncExternalStore).
  let snapshot: Snapshot | undefined;

  function read(): Snapshot {
    snapshot ??= {
      settings: parseSettings(kv.get(STORE_KEYS.settings)),
      introCompleted: kv.get(STORE_KEYS.introCompleted) === '1',
      profile: parseProfile(kv.get(STORE_KEYS.profile)),
    };
    return snapshot;
  }

  function changed() {
    snapshot = undefined;
    listeners.forEach((listener) => listener());
  }

  return {
    getSettings: () => read().settings,
    updateSettings(patch) {
      kv.set(
        STORE_KEYS.settings,
        JSON.stringify({ ...read().settings, ...patch }),
      );
      changed();
    },
    isIntroCompleted: () => read().introCompleted,
    completeIntro(profile) {
      kv.set(STORE_KEYS.profile, profileToJson(profile));
      kv.set(STORE_KEYS.introCompleted, '1');
      changed();
    },
    resetIntro() {
      kv.remove(STORE_KEYS.profile);
      kv.remove(STORE_KEYS.introCompleted);
      changed();
    },
    getProfile: () => read().profile,
    setProfile(profile) {
      kv.set(STORE_KEYS.profile, profileToJson(profile));
      changed();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const appSettingsStore = createSettingsStore(appGroupStore);
