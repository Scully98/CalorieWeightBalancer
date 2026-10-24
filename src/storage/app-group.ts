import { ExtensionStorage } from '@bacons/apple-targets';

// Shared with the widget extension (step 9); needs the App Group entitlement.
export const APP_GROUP = 'group.com.scully98.calorieweightbalancer';

export const appGroupStorage = new ExtensionStorage(APP_GROUP);
