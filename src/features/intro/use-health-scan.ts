import { scanHealthData, type HealthScan } from '@/health/scan';
import {
  useForegroundRefresh,
  type LoadState,
} from '@/hooks/use-foreground-refresh';

export type HealthScanState = LoadState<HealthScan>;

const scanNow = () => scanHealthData(new Date());

// Scans again when the app returns to the foreground, e.g. after the user
// changed Health permissions in Settings.
export function useHealthScan(): HealthScanState {
  return useForegroundRefresh(scanNow);
}
