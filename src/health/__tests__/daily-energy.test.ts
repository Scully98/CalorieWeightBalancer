import { queryStatisticsCollectionForQuantity } from '@kingstinct/react-native-healthkit';

import { queryDailyEnergy } from '../daily-energy';
import { QUANTITY } from '../read-types';
import { fakeBuckets, type Interval } from '../__fixtures__/fake-statistics';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  queryStatisticsCollectionForQuantity: jest.fn(),
}));

const query = jest.mocked(queryStatisticsCollectionForQuantity);

type Options = { filter: { date: { startDate: Date; endDate: Date } } };

// kcal per identifier and interval for a bucket start; undefined = no data.
function answer(
  kcal: (
    identifier: string,
    interval: Interval,
    start: Date,
  ) => number | undefined,
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
      (start) => kcal(identifier, interval, start),
    )) as unknown as typeof queryStatisticsCollectionForQuantity);
}

describe('queryDailyEnergy', () => {
  beforeEach(() => query.mockReset());

  it('returns one entry per calendar day with gaps as undefined', async () => {
    answer((identifier, interval, start) => {
      if (interval.hour)
        return identifier === QUANTITY.resting ? 75 : undefined;
      if (identifier === QUANTITY.food)
        return start.getDate() === 2 ? undefined : 2000;
      if (identifier === QUANTITY.resting) return 1800;
      return 400;
    });

    const days = await queryDailyEnergy(new Date(2026, 2, 1), 3);

    expect(days).toEqual([
      {
        date: '2026-03-01',
        food: 2000,
        resting: 1800,
        active: 400,
        restingCoverage: 1,
      },
      {
        date: '2026-03-02',
        food: undefined,
        resting: 1800,
        active: 400,
        restingCoverage: 1,
      },
      {
        date: '2026-03-03',
        food: 2000,
        resting: 1800,
        active: 400,
        restingCoverage: 1,
      },
    ]);
  });

  it('measures resting coverage in hours of the local day', async () => {
    answer((identifier, interval, start) => {
      if (identifier !== QUANTITY.resting) return undefined;
      if (!interval.hour) return 1200;
      // Worn from 08:00 to 20:00 only.
      return start.getHours() >= 8 && start.getHours() < 20 ? 50 : undefined;
    });

    const [day] = await queryDailyEnergy(new Date(2026, 2, 1), 1);

    expect(day.restingCoverage).toBe(12 / 24);
  });

  it('counts 25 hours on the day daylight saving time ends', async () => {
    // Guards the Europe/Berlin zone from jest.global-setup.js.
    expect(
      new Date(2026, 9, 26).getTime() - new Date(2026, 9, 25).getTime(),
    ).toBe(25 * 60 * 60 * 1000);
    answer((identifier) => (identifier === QUANTITY.resting ? 70 : undefined));

    const days = await queryDailyEnergy(new Date(2026, 9, 24), 3);

    expect(days.map((day) => day.restingCoverage)).toEqual([1, 1, 1]);
    const hourly = query.mock.calls.find(
      ([, , , interval]) => 'hour' in interval,
    );
    const options = hourly?.[4] as Options;
    expect(options.filter.date.endDate).toEqual(new Date(2026, 9, 27));
  });

  it('leaves coverage unknown when the hourly query fails', async () => {
    query.mockImplementation((async (
      _identifier: string,
      _statistics: unknown,
      _anchor: Date,
      interval: Interval,
    ) => {
      if (interval.hour) throw new Error('denied');
      return [
        { startDate: new Date(2026, 2, 1), sumQuantity: { quantity: 1800 } },
      ];
    }) as unknown as typeof queryStatisticsCollectionForQuantity);

    const [day] = await queryDailyEnergy(new Date(2026, 2, 1), 1);

    expect(day).toEqual({
      date: '2026-03-01',
      food: 1800,
      resting: 1800,
      active: 1800,
      restingCoverage: undefined,
    });
  });
});
