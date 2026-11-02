import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  appSettingsStore,
  type SettingsStore,
  type StoredProfile,
} from './settings-store';
import type { Settings } from '@/core/settings';

// The App Group unless a screen provides another store, e.g. a memory store
// per entry in the development state gallery.
const SettingsStoreContext = createContext<SettingsStore>(appSettingsStore);

export function SettingsStoreProvider({
  store,
  children,
}: {
  store: SettingsStore;
  children: ReactNode;
}) {
  return (
    <SettingsStoreContext.Provider value={store}>
      {children}
    </SettingsStoreContext.Provider>
  );
}

export function useSettingsStore(): SettingsStore {
  return useContext(SettingsStoreContext);
}

export function useSettings(): Settings {
  const store = useSettingsStore();
  return useSyncExternalStore(store.subscribe, store.getSettings);
}

export function useIntroCompleted(): boolean {
  const store = useSettingsStore();
  return useSyncExternalStore(store.subscribe, store.isIntroCompleted);
}

export function useStoredProfile(): StoredProfile {
  const store = useSettingsStore();
  return useSyncExternalStore(store.subscribe, store.getProfile);
}
