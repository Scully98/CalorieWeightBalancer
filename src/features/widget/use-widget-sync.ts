import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import { widgetSnapshot } from './snapshot';
import { syncWidget } from './sync';
import type { BalanceState } from '@/features/balance/use-balance';
import { healthKitSource } from '@/health/healthkit-source';
import { useHealthSource } from '@/health/source-context';
import { formatLocale } from '@/i18n';
import { useSettings } from '@/storage/settings-context';

// Every finished load of the balance page updates the widget. Demo data of
// the development gallery never reaches it, and loading or an error keep
// the last state. Only while the app is active: on a launch in the
// background (HealthKit, src/features/widget/background.ts) the page loads
// too, and with the device locked its load looks like missing data.
export function useWidgetSync(state: BalanceState): void {
  const source = useHealthSource();
  const { tolerance } = useSettings();
  const { t } = useTranslation();
  // The report is rebuilt on every render; the file is only touched when the
  // texts changed.
  const lastJson = useRef<string | undefined>(undefined);
  // The first load can finish before iOS reports the app as active; then no
  // render follows that would write it.
  const [active, setActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) =>
      setActive(next === 'active'),
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (source !== healthKitSource) return;
    if (state.status !== 'done' && state.status !== 'empty') return;
    if (!active) return;
    const snapshot = widgetSnapshot(state, tolerance, formatLocale(), t);
    const json = JSON.stringify(snapshot);
    if (json === lastJson.current) return;
    lastJson.current = json;
    syncWidget(snapshot);
  }, [source, state, tolerance, t, active]);
}
