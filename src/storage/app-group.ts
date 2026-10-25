import { ExtensionStorage } from '@bacons/apple-targets';

import type { KeyValueStore } from './key-value-store';

// Shared with the widget extension (step 9); needs the App Group entitlement.
export const APP_GROUP = 'group.com.scully98.calorieweightbalancer';

const storage = new ExtensionStorage(APP_GROUP);

// UserDefaults of the App Group. Without the native module (Jest) `get`
// returns undefined, which counts as a missing key.
export const appGroupStore: KeyValueStore = {
  get: (key) => storage.get(key) ?? null,
  set: (key, value) => storage.set(key, value),
  remove: (key) => storage.remove(key),
};
