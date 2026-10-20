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

### iPhone with a free Apple ID

Without a paid developer account, Xcode signs with a Personal Team. Profiles expire after 7 days, and App Groups are not available, so the widget won't get data.

1. Add your Apple ID in Xcode → Settings → Accounts.
2. On the iPhone, turn on Settings → Privacy & Security → Developer Mode, connect it via USB and trust the Mac.
3. Build with your Personal Team ID. This drops the App Group entitlement and uses the bundle ID `com.scully98.calorieweightbalancer.dev`:

   ```sh
   APPLE_PERSONAL_TEAM_ID=XXXXXXXXXX npx expo prebuild --clean
   APPLE_PERSONAL_TEAM_ID=XXXXXXXXXX npx expo run:ios --device
   ```

4. On the iPhone, trust the developer certificate under Settings → General → VPN & Device Management.

Checks:

- `npm run lint`: ESLint
- `npm run format`: Prettier (writes changes)
- `npm run typecheck`: TypeScript
- `npm test`: Jest unit tests
