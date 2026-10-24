import { queryQuantitySamples } from '@kingstinct/react-native-healthkit';

import { healthKitSource } from '../healthkit-source';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  queryQuantitySamples: jest.fn(),
}));

const samples = jest.mocked(queryQuantitySamples);

describe('healthKitSource.firstDataDate', () => {
  it('returns the date of the oldest food sample', async () => {
    samples.mockResolvedValueOnce([
      { startDate: new Date(2026, 0, 3, 8) },
    ] as unknown as Awaited<ReturnType<typeof queryQuantitySamples>>);

    expect(await healthKitSource.firstDataDate()).toEqual(
      new Date(2026, 0, 3, 8),
    );
  });

  it('returns undefined when the query fails or finds nothing', async () => {
    samples.mockRejectedValueOnce(new Error('denied'));
    expect(await healthKitSource.firstDataDate()).toBeUndefined();
    samples.mockResolvedValueOnce([]);
    expect(await healthKitSource.firstDataDate()).toBeUndefined();
  });
});

describe('healthKitSource.weightBefore', () => {
  it('returns the newest weight before the date', async () => {
    samples.mockResolvedValueOnce([{ quantity: 81.2 }] as unknown as Awaited<
      ReturnType<typeof queryQuantitySamples>
    >);

    expect(await healthKitSource.weightBefore(new Date(2026, 8, 24))).toBe(
      81.2,
    );
  });

  it('returns undefined when the query fails or finds nothing', async () => {
    samples.mockRejectedValueOnce(new Error('denied'));
    expect(await healthKitSource.weightBefore(new Date())).toBeUndefined();
    samples.mockResolvedValueOnce([]);
    expect(await healthKitSource.weightBefore(new Date())).toBeUndefined();
  });
});
