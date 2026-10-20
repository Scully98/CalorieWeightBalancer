import {
  getMostRecentQuantitySample,
  queryQuantitySamples,
  queryStatisticsCollectionForQuantity,
} from '@kingstinct/react-native-healthkit';

import { fakeBuckets, type Interval } from '../__fixtures__/fake-statistics';
import { QUANTITY } from '../read-types';
import { MAX_COUNTED_SAMPLES, scanHealthData } from '../scan';

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

// Every identifier has energy in every bucket of the queried range, like a
// watch worn day and night.
function energyEveryDay(kcal = 1800) {
  statistics.mockImplementation((async (
    _identifier: string,
    _statistics: unknown,
    _anchor: Date,
    interval: Interval,
    options: Options,
  ) =>
    fakeBuckets(
      options.filter.date.startDate,
      options.filter.date.endDate,
      interval,
      () => (interval.hour ? kcal / 24 : kcal),
    )) as unknown as typeof queryStatisticsCollectionForQuantity);
}

describe('scanHealthData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mostRecent.mockResolvedValue(undefined as never);
    samples.mockResolvedValue([] as never);
  });

  it('counts 7 of 7 days in the week after daylight saving time ends', async () => {
    energyEveryDay();

    const scan = await scanHealthData(new Date(2026, 9, 28, 12));

    expect(scan.active.daysWithData).toBe(7);
    expect(scan.resting.daysWithData).toBe(7);
  });

  it('derives the typical resting energy from fully covered days', async () => {
    energyEveryDay(1750);

    const scan = await scanHealthData(new Date(2026, 9, 20, 12));

    expect(scan.resting.typical).toBeCloseTo(1750);
  });

  it('has no typical resting energy without data', async () => {
    statistics.mockResolvedValue([] as never);

    const scan = await scanHealthData(new Date(2026, 9, 20, 12));

    expect(scan.resting.typical).toBeUndefined();
    expect(scan.resting.daysWithData).toBe(0);
  });

  it('caps the counted measurements', async () => {
    statistics.mockResolvedValue([] as never);
    mostRecent.mockResolvedValue({ quantity: 80 } as never);

    await scanHealthData(new Date(2026, 9, 20, 12));

    expect(samples).toHaveBeenCalledWith(QUANTITY.weight, {
      limit: MAX_COUNTED_SAMPLES,
    });
  });

  it('treats failing queries as missing data', async () => {
    statistics.mockRejectedValue(new Error('denied'));
    mostRecent.mockRejectedValue(new Error('denied'));
    samples.mockRejectedValue(new Error('denied'));

    const scan = await scanHealthData(new Date(2026, 9, 20, 12));

    expect(scan.food.hasData).toBe(false);
    expect(scan.weight).toEqual({ hasData: false, count: 0 });
    expect(scan.resting.typical).toBeUndefined();
  });
});
