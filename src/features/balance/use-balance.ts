import { restingFallback } from './resting-fallback';
import {
  periodBalance,
  typicalResting,
  type PeriodBalance,
} from '@/core/balance';
import { queryDailyEnergy } from '@/health/daily-energy';
import { readHealthProfile } from '@/health/scan';
import {
  useForegroundRefresh,
  type LoadState,
} from '@/hooks/use-foreground-refresh';
import { getProfile } from '@/storage/settings';

export const BALANCE_DAYS = 30;

export type BalanceState = LoadState<PeriodBalance>;

// The last BALANCE_DAYS complete days; today is still running and left out.
// Days without resting energy use the typical measured value, else the
// estimate from the profile.
async function loadBalance(): Promise<PeriodBalance> {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - BALANCE_DAYS,
  );
  const [days, profile] = await Promise.all([
    queryDailyEnergy(start, BALANCE_DAYS),
    readHealthProfile(),
  ]);
  const fallback =
    typicalResting(days) ?? restingFallback(profile, getProfile(), now);
  return periodBalance(days, fallback);
}

export function useBalance(): BalanceState {
  return useForegroundRefresh(loadBalance);
}
