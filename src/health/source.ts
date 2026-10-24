import type { SourceRevision } from '@kingstinct/react-native-healthkit';

import type { HealthProfile } from './scan';
import type { DayRecord } from '@/core/day-record';

export type EnergyKey = 'food' | 'resting' | 'active';

// Where the app gets Health data from: HealthKit in the app, fixed demo data
// in the development state gallery. Implementations never throw; unreadable
// data comes back as missing values.
export interface HealthSource {
  // One record per local calendar day from `start` (local midnight), `days` long.
  days(start: Date, days: number): Promise<DayRecord[]>;
  // Inputs for the resting energy estimate.
  profile(): Promise<HealthProfile>;
  // Source of the newest sample per energy type (data page).
  latestSources(): Promise<Record<EnergyKey, SourceRevision | undefined>>;
  // First day with food data, for the period "Alles".
  firstDataDate(): Promise<Date | undefined>;
  // Newest weight in kg before `date` (local midnight), for the resting
  // energy estimate on the first days of a period.
  weightBefore(date: Date): Promise<number | undefined>;
}
