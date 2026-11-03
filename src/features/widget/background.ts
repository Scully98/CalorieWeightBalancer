import type { TFunction } from 'i18next';

import { widgetSnapshot } from './snapshot';
import { appWidgetStore, syncWidget, type WidgetStore } from './sync';
import {
  buildReport,
  loadPeriodData,
  toBalanceState,
} from '@/features/balance/use-balance';
import {
  enableBackgroundUpdates,
  subscribeToHealthChanges,
} from '@/health/background';
import { healthKitSource } from '@/health/healthkit-source';
import type { HealthSource } from '@/health/source';
import { formatLocale, i18n } from '@/i18n';
import { isProtectedDataAvailable } from '@/storage/app-group';
import { appSettingsStore, type SettingsStore } from '@/storage/settings-store';

// Events within this window give one load: HealthKit often reports food,
// resting and active energy together.
export const DEBOUNCE_MS = 2000;

export type BackgroundDeps = {
  settings: SettingsStore;
  source: HealthSource;
  widget: WidgetStore;
  isUnlocked: () => Promise<boolean>;
  enable: () => Promise<boolean>;
  subscribe: (onChange: () => void) => () => void;
  now: () => Date;
  locale: () => string;
  t: TFunction;
};

const appDeps: BackgroundDeps = {
  settings: appSettingsStore,
  source: healthKitSource,
  widget: appWidgetStore,
  isUnlocked: isProtectedDataAvailable,
  enable: enableBackgroundUpdates,
  subscribe: subscribeToHealthChanges,
  now: () => new Date(),
  locale: formatLocale,
  t: i18n.t.bind(i18n),
};

export type RefreshResult = 'noIntro' | 'locked' | 'error' | 'same' | 'written';

// One load as on the balance page, then the widget. Nothing is written while
// the device is locked (HealthKit is encrypted and every query would look
// like missing data) or when the load fails; the widget keeps its state.
export async function refreshWidgetInBackground(
  deps: BackgroundDeps = appDeps,
): Promise<RefreshResult> {
  const { settings: store } = deps;
  if (!store.isIntroCompleted()) return 'noIntro';
  if (!(await deps.isUnlocked())) return 'locked';
  const started = Date.now();
  try {
    const settings = store.getSettings();
    const data = await loadPeriodData(deps.source, settings, deps.now());
    const state = toBalanceState({
      status: 'done',
      value: buildReport(data, settings, store.getProfile()),
    });
    if (state.status !== 'done' && state.status !== 'empty') return 'error';
    const wrote = syncWidget(
      widgetSnapshot(state, settings.tolerance, deps.locale(), deps.t),
      deps.widget,
    );
    // Visible in Console.app, to check the time against the 25 s window.
    console.log(
      `[widget] background refresh in ${Date.now() - started} ms, ${wrote ? 'written' : 'unchanged'}`,
    );
    return wrote ? 'written' : 'same';
  } catch {
    return 'error';
  }
}

// Called once when the root layout loads, also on a launch in the background
// by HealthKit, so queued events reach JS. Subscribes only after the intro,
// which asked for read access; until then it waits for the intro to end.
export function startWidgetBackground(
  deps: BackgroundDeps = appDeps,
): () => void {
  let unsubscribe: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      void refreshWidgetInBackground(deps);
    }, DEBOUNCE_MS);
  };
  const start = () => {
    if (unsubscribe || !deps.settings.isIntroCompleted()) return;
    void deps.enable();
    unsubscribe = deps.subscribe(schedule);
  };

  start();
  const stopWaiting = deps.settings.subscribe(start);
  return () => {
    stopWaiting();
    unsubscribe?.();
    if (timer !== undefined) clearTimeout(timer);
  };
}
