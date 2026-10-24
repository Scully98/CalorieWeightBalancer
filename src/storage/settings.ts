import { useSyncExternalStore } from 'react';

import { appSettingsStore } from './settings-store';

export type { StoredProfile } from './settings-store';

// Until the callers read the store through its context (P5 M2).
const store = appSettingsStore;

export const subscribeToSettings = store.subscribe;
export const isIntroCompleted = store.isIntroCompleted;
export const completeIntro = store.completeIntro;
export const getProfile = store.getProfile;
export const resetIntro = store.resetIntro;

export function useIntroCompleted(): boolean {
  return useSyncExternalStore(store.subscribe, store.isIntroCompleted);
}
