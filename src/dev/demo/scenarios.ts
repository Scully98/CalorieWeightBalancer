import { generateSeries, SERIES_DAYS, type DemoDay } from './generate';
import type { DayRecord } from '@/core/day-record';
import type { Period } from '@/core/period';

export type ScenarioId =
  | 'normal30'
  | 'long90'
  | 'short7'
  | 'gaps30'
  | 'noBodyFat30'
  | 'goodFit30'
  | 'empty';

// Values of one series day; the date is added relative to today.
export type DemoValues = Omit<DayRecord, 'date'>;

export type Scenario = {
  id: ScenarioId;
  name: string;
  period: Period;
  // Oldest first; the last entry is yesterday.
  series: DemoValues[];
};

// Position in the last 30 days (0 = oldest, 29 = yesterday) → series index.
const W = (position: number) => SERIES_DAYS - 30 + position;

function toValues(day: DemoDay): DemoValues {
  const values: DemoValues = {
    food: day.noFood ? undefined : day.food,
    resting: day.resting,
    active: day.active,
  };
  if (day.estimated) values.restingEstimated = true;
  if (day.weightKg !== undefined && day.fatKg !== undefined) {
    values.weightKg = day.weightKg;
    values.bodyFatFraction = day.fatKg / day.weightKg;
    values.leanMassKg = day.weightKg - day.fatKg;
  }
  return values;
}

function baseSeries(): DemoValues[] {
  return generateSeries().map(toValues);
}

const BODY_KEYS = ['weightKg', 'bodyFatFraction', 'leanMassKg'] as const;

// Holes the design doesn't show yet: a holiday without any values, days
// without active energy, a week without weighing, partly worn watch.
function withGaps(series: DemoValues[]): DemoValues[] {
  const result = series.map((values) => ({ ...values }));
  for (const position of [12, 13, 14]) result[W(position)] = {};
  for (const position of [6, 21, 27]) delete result[W(position)].active;
  for (let position = 16; position <= 22; position++)
    for (const key of BODY_KEYS) delete result[W(position)][key];
  for (const position of [2, 26]) {
    const day = result[W(position)];
    day.resting = Math.round((day.resting as number) / 2);
    day.restingCoverage = 0.5;
  }
  return result;
}

function withoutBodyFat(series: DemoValues[]): DemoValues[] {
  return series.map(({ bodyFatFraction, leanMassKg, ...rest }) => rest);
}

const days = (count: 7 | 30 | 90): Period => ({ kind: 'days', days: count });

export function buildScenario(id: ScenarioId): Scenario {
  switch (id) {
    case 'normal30':
      return {
        id,
        name: '30 T normal',
        period: days(30),
        series: baseSeries(),
      };
    case 'long90':
      return { id, name: '90 T', period: days(90), series: baseSeries() };
    case 'short7':
      return { id, name: '7 T', period: days(7), series: baseSeries() };
    case 'gaps30':
      return {
        id,
        name: 'Lücken',
        period: days(30),
        series: withGaps(baseSeries()),
      };
    case 'noBodyFat30':
      return {
        id,
        name: 'Keine KFA-Daten',
        period: days(30),
        series: withoutBodyFat(baseSeries()),
      };
    case 'goodFit30':
      return {
        id,
        name: 'Passt gut',
        period: days(30),
        series: generateSeries({ fatPer30Days: 0.72, leanPer30Days: 0.1 }).map(
          toValues,
        ),
      };
    case 'empty':
      return {
        id,
        name: 'Leer',
        period: days(30),
        series: Array.from({ length: SERIES_DAYS }, () => ({})),
      };
  }
}

export const SCENARIO_IDS: readonly ScenarioId[] = [
  'normal30',
  'long90',
  'short7',
  'gaps30',
  'noBodyFat30',
  'goodFit30',
  'empty',
];
