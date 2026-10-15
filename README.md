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

Checks:

- `npm run lint`: ESLint
- `npm run format`: Prettier (writes changes)
- `npm run typecheck`: TypeScript
- `npm test`: Jest unit tests
