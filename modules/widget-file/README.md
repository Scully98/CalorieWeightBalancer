# widget-file

Local Expo module. Writes, reads and removes UTF-8 files in the App Group container, shared with the widget extension in `targets/widget/`.

- The folder of each file is excluded from backup, so derived Health values never reach iCloud (App Review Guideline 5.1.3).
- Files are written atomically with `completeUntilFirstUserAuthentication`, so the lock screen widget can read them once the device was unlocked after a restart.
- `isProtectedDataAvailable()` tells whether the device is unlocked; HealthKit is encrypted otherwise.

Only `src/storage/app-group.ts` imports it (ESLint).
