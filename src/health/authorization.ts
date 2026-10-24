import { requestAuthorization } from '@kingstinct/react-native-healthkit';

import { READ_TYPES } from './read-types';

export type ReadAccessResult = { ok: true } | { ok: false; error: unknown };

// Shows the iOS Health sheet for types not yet answered. The result says
// nothing about which types were granted; iOS keeps that private.
export async function requestReadAccess(): Promise<ReadAccessResult> {
  try {
    await requestAuthorization({ toRead: READ_TYPES });
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
