import {
  getMostRecentQuantitySample,
  queryQuantitySamples,
} from '@kingstinct/react-native-healthkit';

import { healthKitSource } from '../healthkit-source';

import { QUANTITY } from '../read-types';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  queryQuantitySamples: jest.fn(),
  getMostRecentQuantitySample: jest.fn(),
}));

const samples = jest.mocked(queryQuantitySamples);
const mostRecent = jest.mocked(getMostRecentQuantitySample);

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

describe('healthKitSource.foodBefore', () => {
  it('returns the start of the newest food sample before the date', async () => {
    samples.mockResolvedValueOnce([
      { startDate: new Date(2026, 8, 12, 19) },
    ] as unknown as Awaited<ReturnType<typeof queryQuantitySamples>>);

    expect(await healthKitSource.foodBefore(new Date(2026, 9, 18))).toEqual(
      new Date(2026, 8, 12, 19),
    );
    expect(samples).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        limit: 1,
        ascending: false,
        filter: {
          date: { endDate: new Date(2026, 9, 18), strictEndDate: true },
        },
      }),
    );
  });

  it('returns undefined when the query fails or finds nothing', async () => {
    samples.mockRejectedValueOnce(new Error('denied'));
    expect(await healthKitSource.foodBefore(new Date())).toBeUndefined();
    samples.mockResolvedValueOnce([]);
    expect(await healthKitSource.foodBefore(new Date())).toBeUndefined();
  });
});

describe('healthKitSource.latestSources', () => {
  const revision = (name: string) => ({
    source: { name, bundleIdentifier: `test.${name}` },
    productType: 'iPhone15,2',
  });

  it('takes lean mass as body fat source without body fat samples', async () => {
    mostRecent.mockImplementation((async (identifier: string) =>
      identifier === QUANTITY.bodyFat
        ? undefined
        : {
            sourceRevision: revision(
              identifier === QUANTITY.leanMass ? 'Lean scale' : 'Other',
            ),
            startDate: new Date(2026, 9, 23),
            quantity: 1,
          }) as unknown as typeof getMostRecentQuantitySample);

    const sources = await healthKitSource.latestSources();
    expect(sources.bodyFat?.source.name).toBe('Lean scale');
    expect(sources.weight?.source.name).toBe('Other');
  });
});
