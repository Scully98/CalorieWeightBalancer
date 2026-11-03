import type { WidgetSnapshot } from '../snapshot';
import { createMemoryWidgetStore, syncWidget, type WidgetStore } from '../sync';
import golden from '../__fixtures__/snapshot-golden.json';

const SNAPSHOT = golden as WidgetSnapshot;

// The same numbers, loaded again later the same day.
const LATER: WidgetSnapshot = {
  ...SNAPSHOT,
  loadedAt: '2026-10-24T10:30:00.000Z',
  stale: 'Stand 24. Okt, 12:30',
  staleLabel: 'Stand 24. Oktober, 12:30 Uhr',
};

describe('syncWidget', () => {
  it('writes the first snapshot and reloads the widget', () => {
    const store = createMemoryWidgetStore();
    expect(syncWidget(SNAPSHOT, store)).toBe(true);
    expect(JSON.parse(store.read() as string)).toEqual(SNAPSHOT);
    expect(store.reloads).toBe(1);
  });

  it('skips a later load with the same numbers on the same day', () => {
    const store = createMemoryWidgetStore(JSON.stringify(SNAPSHOT));
    expect(syncWidget(LATER, store)).toBe(false);
    expect(store.writes).toBe(0);
    expect(store.reloads).toBe(0);
  });

  it('writes the same numbers again on a new day', () => {
    const store = createMemoryWidgetStore(JSON.stringify(SNAPSHOT));
    const nextDay = { ...LATER, staleAfter: '2026-10-25T22:00:00.000Z' };
    expect(syncWidget(nextDay, store)).toBe(true);
    expect(store.reloads).toBe(1);
  });

  it('writes when a setting changes the texts', () => {
    const store = createMemoryWidgetStore(JSON.stringify(SNAPSHOT));
    const content = { ...SNAPSHOT.content, range: null };
    expect(syncWidget({ ...SNAPSHOT, content } as WidgetSnapshot, store)).toBe(
      true,
    );
  });

  it('replaces an unreadable file', () => {
    const store = createMemoryWidgetStore('{broken');
    expect(syncWidget(SNAPSHOT, store)).toBe(true);
  });

  it('does not reload when nothing could be written', () => {
    const store: WidgetStore & { reloads: number } = {
      reloads: 0,
      read: () => null,
      write: () => false,
      reload() {
        this.reloads += 1;
      },
    };
    expect(syncWidget(SNAPSHOT, store)).toBe(false);
    expect(store.reloads).toBe(0);
  });
});
