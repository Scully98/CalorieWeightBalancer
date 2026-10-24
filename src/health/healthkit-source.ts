import { queryQuantitySamples } from '@kingstinct/react-native-healthkit';

import { queryDailyEnergy } from './daily-energy';
import { QUANTITY } from './read-types';
import { safe } from './safe';
import { latest, readHealthProfile } from './scan';
import type { HealthSource } from './source';

// Energy per day from HealthKit statistics queries. Weight, body fat and lean
// mass per day follow with the analysis screen and stay undefined until then;
// only the weight before a period is read for the resting estimate. Must
// only run after requestReadAccess().
export const healthKitSource: HealthSource = {
  days: queryDailyEnergy,

  profile: readHealthProfile,

  async latestSources() {
    const [food, resting, active] = await Promise.all([
      latest(QUANTITY.food),
      latest(QUANTITY.resting),
      latest(QUANTITY.active),
    ]);
    return {
      food: food.source,
      resting: resting.source,
      active: active.source,
    };
  },

  async firstDataDate() {
    const [first] = await safe(
      () =>
        queryQuantitySamples(QUANTITY.food, {
          limit: 1,
          ascending: true,
          unit: 'kcal',
        }),
      [],
    );
    return first?.startDate;
  },

  async weightBefore(date) {
    const [last] = await safe(
      () =>
        queryQuantitySamples(QUANTITY.weight, {
          limit: 1,
          ascending: false,
          unit: 'kg',
          filter: { date: { endDate: date, strictEndDate: true } },
        }),
      [],
    );
    return last?.quantity;
  },
};
