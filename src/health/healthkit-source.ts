import { queryQuantitySamples } from '@kingstinct/react-native-healthkit';

import { queryDailyBody } from './daily-body';
import { queryDailyEnergy } from './daily-energy';
import { QUANTITY } from './read-types';
import { safe } from './safe';
import { latest, readHealthProfile } from './scan';
import type { HealthSource } from './source';

// Energy sums and the last weight, body fat and lean mass per day from
// HealthKit statistics queries. Must only run after requestReadAccess().
export const healthKitSource: HealthSource = {
  async days(start, count) {
    const [energy, body] = await Promise.all([
      queryDailyEnergy(start, count),
      queryDailyBody(start, count),
    ]);
    return energy.map((day, index) => {
      const values = Object.entries(body[index]).filter(
        ([, value]) => value !== undefined,
      );
      return { ...day, ...Object.fromEntries(values) };
    });
  },

  profile: readHealthProfile,

  async latestSources() {
    const [food, resting, active, weight, bodyFat, leanMass] =
      await Promise.all([
        latest(QUANTITY.food),
        latest(QUANTITY.resting),
        latest(QUANTITY.active),
        latest(QUANTITY.weight),
        latest(QUANTITY.bodyFat),
        latest(QUANTITY.leanMass),
      ]);
    return {
      food: food.source,
      resting: resting.source,
      active: active.source,
      weight: weight.source,
      // Some scales only write lean mass; it counts for body fat too.
      bodyFat: bodyFat.source ?? leanMass.source,
    };
  },

  // Raw samples are fine in the next three: one entry each (limit 1), nothing
  // is summed.
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

  async foodBefore(date) {
    const [last] = await safe(
      () =>
        queryQuantitySamples(QUANTITY.food, {
          limit: 1,
          ascending: false,
          unit: 'kcal',
          filter: { date: { endDate: date, strictEndDate: true } },
        }),
      [],
    );
    return last?.startDate;
  },
};
