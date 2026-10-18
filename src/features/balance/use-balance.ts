import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { restingFallback } from './resting-fallback';
import { periodBalance, type PeriodBalance } from '@/core/balance';
import { queryDailyEnergy } from '@/health/daily-energy';
import { readHealthProfile } from '@/health/scan';
import { getProfile } from '@/storage/settings';

export const BALANCE_DAYS = 30;

export type BalanceState =
  { status: 'loading' } | { status: 'done'; balance: PeriodBalance };

// The last BALANCE_DAYS complete days; today is still running and left out.
async function loadBalance(now: Date): Promise<PeriodBalance> {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - BALANCE_DAYS,
  );
  const [days, profile] = await Promise.all([
    queryDailyEnergy(start, BALANCE_DAYS),
    readHealthProfile(),
  ]);
  return periodBalance(days, restingFallback(profile, getProfile(), now));
}

// Loads on mount and again whenever the app returns to the foreground, e.g.
// after new entries were synced to Health.
export function useBalance(): BalanceState {
  const [state, setState] = useState<BalanceState>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;
    const run = () => {
      loadBalance(new Date()).then((balance) => {
        if (mounted) setState({ status: 'done', balance });
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
