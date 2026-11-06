import { useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';

// A message is new when it is set and differs from the one before.
export function isNewAnnouncement(
  last: string | undefined,
  message: string | undefined,
): message is string {
  return message !== undefined && message !== last;
}

// VoiceOver says `message` whenever it changes; iOS has no live regions. Pass
// undefined while there is nothing to say. `skipFirst` keeps what is already
// on screen when the view appears unspoken.
export function useAnnounceChange(
  message: string | undefined,
  { skipFirst = false }: { skipFirst?: boolean } = {},
) {
  const last = useRef(skipFirst ? message : undefined);

  useEffect(() => {
    if (isNewAnnouncement(last.current, message))
      AccessibilityInfo.announceForAccessibility(message);
    last.current = message;
  }, [message]);
}
