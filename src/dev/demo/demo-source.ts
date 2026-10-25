import { BiologicalSex } from '@kingstinct/react-native-healthkit';

import { SERIES_DAYS } from './generate';
import { buildScenario, type DemoValues, type ScenarioId } from './scenarios';
import { addDays, daysBetween, startOfDay } from '@/core/dates';
import { toDateKey } from '@/core/day-record';
import type { HealthProfile } from '@/health/scan';
import type { DataKey, HealthSource } from '@/health/source';

// Searched for in the release bundle; it must never show up there.
export const DEMO_BUNDLE_MARKER = 'kcalwaage-demo-data';

// Today so far, as „Heute bisher“ in the design.
const TODAY_SO_FAR: DemoValues = { food: 1420, resting: 1090, active: 290 };

const yazio = {
  source: { name: 'Yazio', bundleIdentifier: 'com.yazio.ios' },
  operatingSystemVersion: '26.0',
  productType: 'iPhone17,1',
};

const scale = {
  source: { name: 'Withings', bundleIdentifier: 'com.withings.wiScaleNG' },
  operatingSystemVersion: '26.0',
  productType: 'iPhone17,1',
};

const watch = {
  source: {
    name: 'Apple Watch',
    bundleIdentifier: 'com.apple.health.4D5E6F70',
  },
  operatingSystemVersion: '26.0',
  productType: 'Watch7,1',
};

const SOURCES = {
  food: yazio,
  resting: watch,
  active: watch,
  weight: scale,
  bodyFat: scale,
};

// Whether a day has a value of the type, as on the data page.
const HAS: Record<DataKey, (values: DemoValues) => boolean> = {
  food: (values) => values.food !== undefined,
  resting: (values) => values.resting !== undefined,
  active: (values) => values.active !== undefined,
  weight: (values) => values.weightKg !== undefined,
  bodyFat: (values) =>
    values.bodyFatFraction !== undefined || values.leanMassKg !== undefined,
};

// Fixed demo data for the development state gallery. The series ends
// yesterday, so dates follow the calendar while the numbers stay the same.
export function createDemoSource(id: ScenarioId, now: Date): HealthSource {
  const scenario = buildScenario(id);
  const today = startOfDay(now);
  // Series index SERIES_DAYS is today.
  const all = [...scenario.series, scenario.today ?? TODAY_SO_FAR];
  const indexOf = (date: Date) => SERIES_DAYS + daysBetween(today, date);
  const dateOf = (index: number) => addDays(today, index - SERIES_DAYS);

  return {
    async days(start, count) {
      return Array.from({ length: count }, (_, offset) => {
        const day = addDays(start, offset);
        return { date: toDateKey(day), ...(all[indexOf(day)] ?? {}) };
      });
    },

    async profile(): Promise<HealthProfile> {
      switch (scenario.profile ?? 'full') {
        case 'none':
          return { biologicalSex: BiologicalSex.notSet };
        case 'noBody':
          return { weightKg: 82.4, biologicalSex: BiologicalSex.notSet };
        case 'full':
          return {
            weightKg: 82.4,
            heightCm: 182,
            dateOfBirth: new Date(now.getFullYear() - 34, 2, 14),
            biologicalSex: BiologicalSex.male,
          };
      }
    },

    // The source of every type with any value.
    async latestSources() {
      return Object.fromEntries(
        (Object.keys(SOURCES) as DataKey[]).map((key) => [
          key,
          all.some(HAS[key]) ? SOURCES[key] : undefined,
        ]),
      ) as Record<DataKey, (typeof SOURCES)[DataKey] | undefined>;
    },

    async firstDataDate() {
      const index = all.findIndex(HAS.food);
      return index < 0 ? undefined : dateOf(index);
    },

    async weightBefore(date) {
      // Series index of the day before `date`, clamped to the series.
      const last = Math.min(indexOf(date), SERIES_DAYS);
      for (let index = last - 1; index >= 0; index--) {
        const weightKg = all[index]?.weightKg;
        if (weightKg !== undefined) return weightKg;
      }
      return undefined;
    },

    async foodBefore(date) {
      const last = Math.min(indexOf(date), all.length);
      for (let index = last - 1; index >= 0; index--)
        if (HAS.food(all[index])) return dateOf(index);
      return undefined;
    },
  };
}
