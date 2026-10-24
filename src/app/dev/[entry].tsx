import type { ComponentType } from 'react';

// Development only, see ./gallery.tsx.
const EntryRoute: ComponentType = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/dev/gallery/entry-screen').EntryScreen
  : () => null;

export default EntryRoute;
