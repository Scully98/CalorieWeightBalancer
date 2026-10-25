import { requestAuthorization } from '@kingstinct/react-native-healthkit';

import { requestReadAccess } from '../authorization';
import { READ_TYPES } from '../read-types';
import appJson from '../../../app.json';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  requestAuthorization: jest.fn(),
}));

const authorize = jest.mocked(requestAuthorization);

describe('READ_TYPES', () => {
  it('are exactly the V1 types from CLAUDE.md', () => {
    expect([...READ_TYPES].sort()).toEqual(
      [
        'HKQuantityTypeIdentifierDietaryEnergyConsumed',
        'HKQuantityTypeIdentifierBasalEnergyBurned',
        'HKQuantityTypeIdentifierActiveEnergyBurned',
        'HKQuantityTypeIdentifierBodyMass',
        'HKQuantityTypeIdentifierBodyFatPercentage',
        'HKQuantityTypeIdentifierLeanBodyMass',
        'HKQuantityTypeIdentifierHeight',
        'HKCharacteristicTypeIdentifierDateOfBirth',
        'HKCharacteristicTypeIdentifierBiologicalSex',
      ].sort(),
    );
  });
});

describe('requestReadAccess', () => {
  beforeEach(() => authorize.mockReset());

  it('asks to read only, never to write', async () => {
    authorize.mockResolvedValueOnce(true);
    expect(await requestReadAccess()).toEqual({ ok: true });
    expect(authorize).toHaveBeenCalledTimes(1);
    expect(authorize.mock.calls[0][0]).toEqual({ toRead: READ_TYPES });
  });

  it('reports a failed request', async () => {
    authorize.mockRejectedValueOnce(new Error('unavailable'));
    expect(await requestReadAccess()).toMatchObject({ ok: false });
  });
});

describe('HealthKit config plugin', () => {
  it('has no write permission and no background delivery', () => {
    const plugin = appJson.expo.plugins.find(
      (entry) =>
        Array.isArray(entry) &&
        entry[0] === '@kingstinct/react-native-healthkit',
    ) as [string, Record<string, unknown>];
    expect(plugin[1]).toMatchObject({
      NSHealthUpdateUsageDescription: false,
      background: false,
    });
  });
});
