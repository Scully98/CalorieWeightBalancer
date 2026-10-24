import {
  getMostRecentQuantitySample,
  queryQuantitySamples,
  queryStatisticsCollectionForQuantity,
} from '@kingstinct/react-native-healthkit';

import { fakeBuckets, type Interval } from '../__fixtures__/fake-statistics';
import { healthKitSource } from '../healthkit-source';
import { QUANTITY } from '../read-types';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  BiologicalSex: { notSet: 0, female: 1, male: 2, other: 3 },
  getBiologicalSexAsync: jest.fn(async () => 0),
  getDateOfBirthAsync: jest.fn(async () => undefined),
  getMostRecentQuantitySample: jest.fn(),
  queryQuantitySamples: jest.fn(),
  queryStatisticsCollectionForQuantity: jest.fn(),
}));

const statistics = jest.mocked(queryStatisticsCollectionForQuantity);
const mostRecent = jest.mocked(getMostRecentQuantitySample);
const samples = jest.mocked(queryQuantitySamples);

type Options = { filter: { date: { startDate: Date; endDate: Date } } };

const watch = {
  source: { name: 'Watch', bundleIdentifier: 'com.apple.health' },
  productType: 'Watch7,1',
};

beforeEach(() => {
  statistics.mockReset();
  mostRecent.mockReset();
  samples.mockReset();
});

describe('healthKitSource.days', () => {
  it('returns one dated record per local day with energy values', async () => {
    statistics.mockImplementation((async (
      identifier: string,
      _statistics: unknown,
      _anchor: Date,
      interval: Interval,
      options: Options,
    ) =>
      fakeBuckets(
        options.filter.date.startDate,
        options.filter.date.endDate,
        interval,
        (start) => {
          if (interval.hour) return start.getHours() < 12 ? 75 : undefined;
          if (identifier === QUANTITY.food)
            return start.getDate() === 2 ? undefined : 2100;
          return identifier === QUANTITY.resting ? 900 : 350;
        },
      )) as unknown as typeof queryStatisticsCollectionForQuantity);

    const days = await healthKitSource.days(new Date(2026, 2, 1), 2);

    expect(days).toEqual([
      {
        date: '2026-03-01',
        food: 2100,
        resting: 900,
        active: 350,
        restingCoverage: 0.5,
      },
      {
        date: '2026-03-02',
        food: undefined,
        resting: 900,
        active: 350,
        restingCoverage: 0.5,
      },
    ]);
    expect(days[0].weightKg).toBeUndefined();
  });
});

describe('healthKitSource.latestSources', () => {
  it('returns the source of the newest sample per energy type', async () => {
    mostRecent.mockImplementation((async (identifier: string) =>
      identifier === QUANTITY.food
        ? undefined
        : {
            quantity: 1,
            startDate: new Date(2026, 2, 1),
            sourceRevision: watch,
          }) as unknown as typeof getMostRecentQuantitySample);

    expect(await healthKitSource.latestSources()).toEqual({
      food: undefined,
      resting: watch,
      active: watch,
    });
  });
});

describe('healthKitSource.firstDataDate', () => {
  it('returns the date of the oldest food sample', async () => {
    samples.mockResolvedValue([
      { startDate: new Date(2026, 0, 3, 8) },
    ] as unknown as Awaited<ReturnType<typeof queryQuantitySamples>>);

    expect(await healthKitSource.firstDataDate()).toEqual(
      new Date(2026, 0, 3, 8),
    );
    expect(samples).toHaveBeenCalledWith(
      QUANTITY.food,
      expect.objectContaining({ limit: 1, ascending: true }),
    );
  });

  it('returns undefined when the query fails or finds nothing', async () => {
    samples.mockRejectedValueOnce(new Error('denied'));
    expect(await healthKitSource.firstDataDate()).toBeUndefined();
    samples.mockResolvedValueOnce([]);
    expect(await healthKitSource.firstDataDate()).toBeUndefined();
  });
});
