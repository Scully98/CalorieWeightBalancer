import type { WidgetSnapshot } from './snapshot';
import { appGroupFile, reloadWidgets } from '@/storage/app-group';

// In the App Group container; targets/widget reads the same path.
export const SNAPSHOT_PATH = 'widget/snapshot.v1.json';

// Where the snapshot goes: the App Group file in the app, memory in tests.
export type WidgetStore = {
  read(): string | null;
  // false when nothing was written, e.g. without the App Group.
  write(json: string): boolean;
  // WidgetCenter.reloadAllTimelines().
  reload(): void;
};

export const appWidgetStore: WidgetStore = {
  read: () => appGroupFile.read(SNAPSHOT_PATH),
  write: (json) => appGroupFile.write(SNAPSHOT_PATH, json),
  reload: reloadWidgets,
};

export function createMemoryWidgetStore(
  initial: string | null = null,
): WidgetStore & { reloads: number; writes: number } {
  let stored = initial;
  const store = {
    reloads: 0,
    writes: 0,
    read: () => stored,
    write: (json: string) => {
      stored = json;
      store.writes += 1;
      return true;
    },
    reload: () => {
      store.reloads += 1;
    },
  };
  return store;
}

// What decides whether the widget must change: everything but the time of
// the load. `staleAfter` stays in, so a new day is written even with the
// same numbers.
function comparable(snapshot: WidgetSnapshot): string {
  const {
    loadedAt: _loadedAt,
    stale: _stale,
    staleLabel: _label,
    ...rest
  } = snapshot;
  return JSON.stringify(rest);
}

function storedComparable(json: string | null): string | undefined {
  if (json === null) return undefined;
  try {
    return comparable(JSON.parse(json) as WidgetSnapshot);
  } catch {
    return undefined;
  }
}

// Writes and reloads the widget only when it would show something else, to
// spare its reload budget. Returns whether it wrote.
export function syncWidget(
  snapshot: WidgetSnapshot,
  store: WidgetStore = appWidgetStore,
): boolean {
  if (storedComparable(store.read()) === comparable(snapshot)) return false;
  if (!store.write(JSON.stringify(snapshot))) return false;
  store.reload();
  return true;
}
