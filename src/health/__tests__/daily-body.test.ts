import { queryStatisticsCollectionForQuantity } from '@kingstinct/react-native-healthkit';

import { queryDailyBody } from '../daily-body';
import { healthKitSource } from '../healthkit-source';
import { QUANTITY } from '../read-types';
import { fakeBuckets, type Interval } from '../__fixtures__/fake-statistics';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  queryStatisticsCollectionForQuantity: jest.fn(),
}));

const query = jest.mocked(queryStatisticsCollectionForQuantity);

type Options = { filter: { date: { startDate: Date; endDate: Date } } };

// Value per identifier for a bucket start; undefined = no data.
function answer(
  value: (identifier: string, start: Date) => number | undefined,
) {
  query.mockImplementation((async (
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
      (start) => value(identifier, start),
    )) as unknown as typeof queryStatisticsCollectionForQuantity);
}

describe('queryDailyBody', () => {
  beforeEach(() => query.mockReset());

  it('puts the last value of each type on its local day', async () => {
    answer((identifier, start) => {
      if (start.getDate() !== 25) return undefined;
      if (identifier === QUANTITY.weight) return 82.4;
      if (identifier === QUANTITY.bodyFat) return 0.21;
      return 65.1;
    });
    // 24–26 Oct 2026; the 25th has 25 hours.
    const days = await queryDailyBody(new Date(2026, 9, 24), 3);
    expect(days).toEqual([
      { date: '2026-10-24' },
      {
        date: '2026-10-25',
        weightKg: 82.4,
        bodyFatFraction: 0.21,
        leanMassKg: 65.1,
      },
      { date: '2026-10-26' },
    ]);
  });

  it('leaves values out when a query fails', async () => {
    query.mockRejectedValue(new Error('denied'));
    expect(await queryDailyBody(new Date(2026, 9, 24), 2)).toEqual([
      { date: '2026-10-24' },
      { date: '2026-10-25' },
    ]);
  });
});

describe('healthKitSource.days', () => {
  beforeEach(() => query.mockReset());

  it('adds the body values to the energy of each day', async () => {
    answer((identifier, start) => {
      if (identifier === QUANTITY.weight)
        return start.getDate() === 24 && start.getHours() === 0
          ? 82.4
          : undefined;
      if (identifier === QUANTITY.food) return 2000;
      return undefined;
    });
    const [day] = await healthKitSource.days(new Date(2026, 9, 24), 1);
    expect(day).toMatchObject({
      date: '2026-10-24',
      food: 2000,
      weightKg: 82.4,
    });
    expect('bodyFatFraction' in day).toBe(false);
  });
});
