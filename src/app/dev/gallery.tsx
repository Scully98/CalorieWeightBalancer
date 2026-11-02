import type { ComponentType } from 'react';

// Development only. Release builds set __DEV__ to false and Metro drops the
// require, so no gallery or demo code ends up in the bundle
// (npm run check:release-bundle).
const GalleryRoute: ComponentType = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/dev/gallery/gallery-screen').GalleryScreen
  : () => null;

export default GalleryRoute;
