# CalorieWeightBalancer

## Setup

Prerequisites: Node.js LTS (tested with 22.16.0) and npm. Local builds need macOS with Xcode and CocoaPods. Cloud builds need an Expo account; the EAS CLI runs via `npx eas-cli@latest`.

1. Install dependencies:

   ```sh
   npm install
   ```

2. Build the development build and install it in the iOS Simulator, either locally:

   ```sh
   npx expo run:ios
   ```

   or in the cloud with EAS:

   ```sh
   npx eas-cli@latest build --profile development --platform ios
   npx eas-cli@latest build:run --platform ios --latest
   ```

   Rebuild whenever a dependency with native code changes.

3. Start the dev server and press `i` to open the app in the simulator:

   ```sh
   npx expo start
   ```

   Expo Go is not supported; the app only runs in its development build.

### iPhone with the paid developer account

`app.json` sets `ios.appleTeamId`, so Xcode signs automatically with that team and registers the App IDs, the App Group and HealthKit on the first build.

1. Add the Apple ID of the team in Xcode → Settings → Accounts.
2. Make sure `.env.local` does not set `APPLE_PERSONAL_TEAM_ID`.
3. Connect the iPhone, then:

   ```sh
   npx expo prebuild --clean
   npx expo run:ios --device --configuration Release
   ```

   `Release` embeds the JS bundle, so the app and its background updates work without Metro. If signing fails, open `ios/UnRestart.xcworkspace`, select the team with "Automatically manage signing" for the targets `UnRestart` and `widget`, and build once with ⌘R.

### iPhone with a free Apple ID

Without a paid developer account, Xcode signs with a Personal Team. Profiles expire after 7 days, and App Groups are not available, so the widget only shows its placeholder ("Open the app to see your balance.").

1. Add your Apple ID in Xcode → Settings → Accounts.
2. On the iPhone, turn on Settings → Privacy & Security → Developer Mode, connect it via USB and trust the Mac.
3. Put your Personal Team ID (the OU field of your "Apple Development" certificate) into `.env.local`, which is git-ignored and read by the Expo CLI. This drops the App Group entitlement and uses the bundle ID `com.scully98.unrestart.dev`:

   ```sh
   echo "APPLE_PERSONAL_TEAM_ID=XXXXXXXXXX" > .env.local
   npx expo prebuild --clean
   npx expo run:ios --device
   ```

   If the first build fails with `errSecInternalComponent`, build once from Xcode (`ios/UnRestart.xcworkspace`, ⌘R) and choose "Always Allow" when macOS asks for keychain access.

4. On the iPhone, trust the developer certificate under Settings → General → VPN & Device Management.

### Widget

The widget lives in `targets/widget/` (SwiftUI, linked by `@bacons/apple-targets` on prebuild) and reads the file the app writes into the App Group container. Run `npx expo prebuild --clean` after changing `targets/widget/expo-target.config.js` or `app.json`.

In the Simulator: build and open the app once so it writes the file, then long-press the home screen → Edit → Add Widget → UnRestart. Lock screen widgets: lock the Simulator (⌘L), long-press the lock screen → Customize.

If `.env.local` sets `APPLE_PERSONAL_TEAM_ID`, local builds drop the App Group. Prefix the command with `APPLE_PERSONAL_TEAM_ID=` to build with it.

Checks:

- `npm run lint`: ESLint
- `npm run format`: Prettier (writes changes)
- `npm run typecheck`: TypeScript
- `npm test`: Jest unit tests
