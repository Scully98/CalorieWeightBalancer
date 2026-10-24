import { createContext, useContext, type ReactNode } from 'react';

import { healthKitSource } from './healthkit-source';
import type { HealthSource } from './source';

// HealthKit unless a screen provides another source, e.g. demo data in the
// development state gallery.
const HealthSourceContext = createContext<HealthSource>(healthKitSource);

export function HealthSourceProvider({
  source,
  children,
}: {
  source: HealthSource;
  children: ReactNode;
}) {
  return (
    <HealthSourceContext.Provider value={source}>
      {children}
    </HealthSourceContext.Provider>
  );
}

export function useHealthSource(): HealthSource {
  return useContext(HealthSourceContext);
}
