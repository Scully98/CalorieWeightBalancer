import {
  configureBackgroundTypes,
  subscribeToChanges,
  UpdateFrequency,
} from '@kingstinct/react-native-healthkit';

import { QUANTITY } from './read-types';

// New samples of these change the balance or its resting energy estimate
// (weight for Mifflin-St Jeor); body fat does not.
export const BACKGROUND_TYPES = [
  QUANTITY.food,
  QUANTITY.resting,
  QUANTITY.active,
  QUANTITY.weight,
] as const;

// Stored natively, so HealthKit wakes the app for these types even after it
// was terminated; at most hourly, to spare the battery. Must only run after
// requestReadAccess().
export async function enableBackgroundUpdates(): Promise<boolean> {
  try {
    return await configureBackgroundTypes(
      [...BACKGROUND_TYPES],
      UpdateFrequency.hourly,
    );
  } catch {
    return false;
  }
}

// Calls back for new samples of the background types, also for events
// queued while the app launched in the background. Must only run after
// requestReadAccess(), HealthKit crashes otherwise.
export function subscribeToHealthChanges(onChange: () => void): () => void {
  const subscriptions = BACKGROUND_TYPES.map((type) =>
    subscribeToChanges(type, ({ errorMessage }) => {
      if (errorMessage === undefined) onChange();
    }),
  );
  return () => subscriptions.forEach((subscription) => subscription.remove());
}
