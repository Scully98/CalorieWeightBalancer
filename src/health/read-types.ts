import type {
  ObjectTypeIdentifier,
  QuantityTypeIdentifier,
} from '@kingstinct/react-native-healthkit';

export const QUANTITY = {
  food: 'HKQuantityTypeIdentifierDietaryEnergyConsumed',
  resting: 'HKQuantityTypeIdentifierBasalEnergyBurned',
  active: 'HKQuantityTypeIdentifierActiveEnergyBurned',
  weight: 'HKQuantityTypeIdentifierBodyMass',
  bodyFat: 'HKQuantityTypeIdentifierBodyFatPercentage',
  leanMass: 'HKQuantityTypeIdentifierLeanBodyMass',
  height: 'HKQuantityTypeIdentifierHeight',
} as const satisfies Record<string, QuantityTypeIdentifier>;

// Read-only access; menstrual flow follows in V2.
export const READ_TYPES: readonly ObjectTypeIdentifier[] = [
  ...Object.values(QUANTITY),
  'HKCharacteristicTypeIdentifierDateOfBirth',
  'HKCharacteristicTypeIdentifierBiologicalSex',
];
