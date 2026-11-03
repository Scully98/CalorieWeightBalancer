import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { widgetSnapshot } from './snapshot';
import { syncWidget } from './sync';
import type { BalanceState } from '@/features/balance/use-balance';
import { healthKitSource } from '@/health/healthkit-source';
import { useHealthSource } from '@/health/source-context';
import { formatLocale } from '@/i18n';
import { useSettings } from '@/storage/settings-context';

// Every finished load of the balance page updates the widget. Demo data of
// the development gallery never reaches it, and loading or an error keep
// the last state.
export function useWidgetSync(state: BalanceState): void {
  const source = useHealthSource();
  const { tolerance } = useSettings();
  const { t } = useTranslation();
  // The report is rebuilt on every render; the file is only touched when the
  // texts changed.
  const lastJson = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (source !== healthKitSource) return;
    if (state.status !== 'done' && state.status !== 'empty') return;
    const snapshot = widgetSnapshot(state, tolerance, formatLocale(), t);
    const json = JSON.stringify(snapshot);
    if (json === lastJson.current) return;
    lastJson.current = json;
    syncWidget(snapshot);
  }, [source, state, tolerance, t]);
}
