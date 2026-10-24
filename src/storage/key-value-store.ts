// Where the settings live: the App Group in the app, a Map in tests and in
// the development state gallery.
export type KeyValueStore = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
};

export type MemoryStore = KeyValueStore & {
  // Keys written so far, for tests that check what is stored.
  keys(): string[];
};

export function createMemoryStore(
  initial: Record<string, string> = {},
): MemoryStore {
  const values = new Map(Object.entries(initial));
  return {
    get: (key) => values.get(key) ?? null,
    set: (key, value) => {
      values.set(key, value);
    },
    remove: (key) => {
      values.delete(key);
    },
    keys: () => [...values.keys()],
  };
}
