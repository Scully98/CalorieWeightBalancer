import { BiologicalSex } from '@kingstinct/react-native-healthkit';

import { SERIES_DAYS } from './generate';
import { buildScenario, type DemoValues, type ScenarioId } from './scenarios';
import { addDays, daysBetween, startOfDay } from '@/core/dates';
import { toDateKey } from '@/core/day-record';
import type { HealthSource } from '@/health/source';

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

// Fixed demo data for the development state gallery. The series ends
// yesterday, so dates follow the calendar while the numbers stay the same.
export function createDemoSource(id: ScenarioId, now: Date): HealthSource {
  const scenario = buildScenario(id);
  const today = startOfDay(now);
  const empty = id === 'empty';

  return {
    async days(start, count) {
      return Array.from({ length: count }, (_, offset) => {
        const day = addDays(start, offset);
        // Series index of this day: SERIES_DAYS − 1 is yesterday.
        const index = SERIES_DAYS + daysBetween(today, day);
        const values =
          index === SERIES_DAYS
            ? empty
              ? {}
              : TODAY_SO_FAR
            : (scenario.series[index] ?? {});
        return { date: toDateKey(day), ...values };
      });
    },

    async profile() {
      if (empty) return { biologicalSex: BiologicalSex.notSet };
      return {
        weightKg: 82.4,
        heightCm: 182,
        dateOfBirth: new Date(now.getFullYear() - 34, 2, 14),
        biologicalSex: BiologicalSex.male,
      };
    },

    async latestSources() {
      if (empty)
        return {
          food: undefined,
          resting: undefined,
          active: undefined,
          weight: undefined,
          bodyFat: undefined,
        };
      return {
        food: yazio,
        resting: watch,
        active: watch,
        weight: scale,
        bodyFat: id === 'noBodyFat30' ? undefined : scale,
      };
    },

    async firstDataDate() {
      return empty ? undefined : addDays(today, -SERIES_DAYS);
    },

    async weightBefore(date) {
      // Series index of the day before `date`, clamped to the series.
      const last = Math.min(
        SERIES_DAYS + daysBetween(today, date),
        SERIES_DAYS,
      );
      for (let index = last - 1; index >= 0; index--) {
        const weightKg = scenario.series[index]?.weightKg;
        if (weightKg !== undefined) return weightKg;
      }
      return undefined;
    },
  };
}
