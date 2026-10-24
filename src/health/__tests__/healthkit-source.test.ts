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
