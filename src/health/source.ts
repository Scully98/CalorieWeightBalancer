import type { SourceRevision } from '@kingstinct/react-native-healthkit';

import type { HealthProfile } from './scan';
import type { DayRecord } from '@/core/day-record';

export type EnergyKey = 'food' | 'resting' | 'active';

// Everything the data page lists under „Was ankommt“.
export type DataKey = EnergyKey | 'weight' | 'bodyFat';

// Where the app gets Health data from: HealthKit in the app, fixed demo data
// in the development state gallery. Implementations never throw; unreadable
// data comes back as missing values.
export interface HealthSource {
  // One record per local calendar day from `start` (local midnight), `days` long.
  days(start: Date, days: number): Promise<DayRecord[]>;
  // Inputs for the resting energy estimate.
  profile(): Promise<HealthProfile>;
  // Source of the newest sample per type on the data page.
  latestSources(): Promise<Record<DataKey, SourceRevision | undefined>>;
  // First day with food data, for the period "Alles".
  firstDataDate(): Promise<Date | undefined>;
  // Newest weight in kg before `date` (local midnight), for the resting
  // energy estimate on the first days of a period.
  weightBefore(date: Date): Promise<number | undefined>;
  // Start of the newest food sample before `date`, for the empty state.
  foodBefore(date: Date): Promise<Date | undefined>;
}
