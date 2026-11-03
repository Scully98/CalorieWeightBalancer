import { ExtensionStorage } from '@bacons/apple-targets';

import type { KeyValueStore } from './key-value-store';
import { WidgetFile } from '../../modules/widget-file';

// Shared with the widget extension (targets/widget); needs the App Group
// entitlement.
export const APP_GROUP = 'group.com.scully98.calorieweightbalancer';

const storage = new ExtensionStorage(APP_GROUP);

// UserDefaults of the App Group. Without the native module (Jest) `get`
// returns undefined, which counts as a missing key.
export const appGroupStore: KeyValueStore = {
  get: (key) => storage.get(key) ?? null,
  set: (key, value) => storage.set(key, value),
  remove: (key) => storage.remove(key),
};

// Files in the App Group container, excluded from backup and readable on the
// lock screen (modules/widget-file). Without the native module or the
// entitlement nothing is written.
export type AppGroupFile = {
  read(path: string): string | null;
  // false when nothing was written.
  write(path: string, contents: string): boolean;
  remove(path: string): void;
};

export const appGroupFile: AppGroupFile = {
  read: (path) => WidgetFile?.read(APP_GROUP, path) ?? null,
  write: (path, contents) =>
    WidgetFile?.write(APP_GROUP, path, contents) ?? false,
  remove: (path) => WidgetFile?.remove(APP_GROUP, path),
};

// WidgetCenter.reloadAllTimelines().
export function reloadWidgets(): void {
  ExtensionStorage.reloadWidget();
}

// false while the device is locked: HealthKit is encrypted then, and a load
// would look like missing data. True without the native module.
export async function isProtectedDataAvailable(): Promise<boolean> {
  return (await WidgetFile?.isProtectedDataAvailable()) ?? true;
}
