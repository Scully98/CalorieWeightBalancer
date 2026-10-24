import type { ComponentType } from 'react';

// Development only. Release builds set __DEV__ to false and Metro drops the
// require, so the screen doesn't end up in the bundle
// (npm run check:release-bundle).
const DayValuesRoute: ComponentType = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/dev/day-values/day-values-screen').DayValuesScreen
  : () => null;

export default DayValuesRoute;
