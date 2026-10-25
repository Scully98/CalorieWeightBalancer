import { createContext, useContext } from 'react';

// A control that drags sideways (a slider) locks the scroll views around it
// while the finger is down; otherwise the pager would take over the drag.
// Screens without scroll views can leave the default.
export const ScrollLockContext = createContext<(locked: boolean) => void>(
  () => {},
);

export function useScrollLock(): (locked: boolean) => void {
  return useContext(ScrollLockContext);
}
