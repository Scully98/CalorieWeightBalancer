import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { scanHealthData, type HealthScan } from '@/health/scan';

export type HealthScanState =
  { status: 'loading' } | { status: 'done'; scan: HealthScan };

// Scans on mount and again whenever the app returns to the foreground, e.g.
// after the user changed Health permissions in Settings.
export function useHealthScan(): HealthScanState {
  const [state, setState] = useState<HealthScanState>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;
    const run = () => {
      scanHealthData(new Date()).then((scan) => {
        if (mounted) setState({ status: 'done', scan });
      });
    };

    run();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') run();
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return state;
}
