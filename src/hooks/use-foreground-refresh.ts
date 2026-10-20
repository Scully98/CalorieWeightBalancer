import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export type LoadState<T> =
  { status: 'loading' } | { status: 'done'; value: T } | { status: 'error' };

// Runs `load` on every call but only reports the newest run, so a slow older
// run can't overwrite a newer result. Nothing is reported after cancel().
export function latestOnly<T>(
  load: () => Promise<T>,
  report: (state: LoadState<T>) => void,
): { run: () => void; cancel: () => void } {
  let latest = 0;
  return {
    run() {
      const id = ++latest;
      load().then(
        (value) => {
          if (id === latest) report({ status: 'done', value });
        },
        () => {
          if (id === latest) report({ status: 'error' });
        },
      );
    },
    cancel() {
      latest = -1;
    },
  };
}

// Loads on mount and again whenever the app returns to the foreground, e.g.
// after new entries were synced to Health or permissions changed.
export function useForegroundRefresh<T>(load: () => Promise<T>): LoadState<T> {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });

  useEffect(() => {
    const loader = latestOnly(load, setState);
    loader.run();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') loader.run();
    });
    return () => {
      loader.cancel();
      subscription.remove();
    };
  }, [load]);

  return state;
}
