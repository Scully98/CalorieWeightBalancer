import { useEffect, useRef } from 'react';
import type { GestureResponderEvent, ViewProps } from 'react-native';

import { slotAt, VIEW, type ChartSlot } from './chart-model';
import { useScrollLock } from '@/hooks/scroll-lock';

// Held this long without moving, the finger drags the selection; before
// that the page scrolls and the pager swipes as usual.
export const LONG_PRESS_MS = 300;
// Movement that still counts as holding still (pt).
const MOVE_SLOP = 8;

type ChartGestureOptions = {
  slots: readonly ChartSlot[];
  // Rendered width of the chart (pt); the slots are in viewBox units.
  width: number;
  selected?: number;
  onSelect: (index: number | undefined) => void;
};

type ResponderProps = Pick<
  ViewProps,
  | 'onStartShouldSetResponder'
  | 'onMoveShouldSetResponder'
  | 'onResponderTerminationRequest'
  | 'onResponderGrant'
  | 'onResponderMove'
  | 'onResponderRelease'
  | 'onResponderTerminate'
>;

// Tap selects a bar or closes its tooltip; a long press then drag moves the
// selection bar by bar while the scroll views around are locked.
export function useChartGesture({
  slots,
  width,
  selected,
  onSelect,
}: ChartGestureOptions): ResponderProps {
  const lockScroll = useScrollLock();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  // Never leave the page locked when the chart goes away mid-drag.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (dragging.current) lockScroll(false);
    },
    [lockScroll],
  );

  const indexAt = (event: GestureResponderEvent, clamp: boolean) =>
    slotAt(slots, (event.nativeEvent.locationX * VIEW.width) / width, clamp);

  function finish() {
    clearTimeout(timer.current);
    if (dragging.current) lockScroll(false);
    dragging.current = false;
  }

  return {
    onStartShouldSetResponder: () => slots.length > 0,
    onMoveShouldSetResponder: () => dragging.current,
    // Until the long press the scroll views may take the touch over.
    onResponderTerminationRequest: () => !dragging.current,
    onResponderGrant: (event) => {
      start.current = {
        x: event.nativeEvent.pageX,
        y: event.nativeEvent.pageY,
      };
      const index = indexAt(event, true);
      timer.current = setTimeout(() => {
        dragging.current = true;
        lockScroll(true);
        onSelect(index);
      }, LONG_PRESS_MS);
    },
    onResponderMove: (event) => {
      if (dragging.current) {
        const index = indexAt(event, true);
        if (index !== selected) onSelect(index);
        return;
      }
      const { pageX, pageY } = event.nativeEvent;
      if (
        Math.abs(pageX - start.current.x) > MOVE_SLOP ||
        Math.abs(pageY - start.current.y) > MOVE_SLOP
      )
        clearTimeout(timer.current);
    },
    onResponderRelease: (event) => {
      const wasDragging = dragging.current;
      const moved =
        Math.abs(event.nativeEvent.pageX - start.current.x) > MOVE_SLOP ||
        Math.abs(event.nativeEvent.pageY - start.current.y) > MOVE_SLOP;
      finish();
      if (wasDragging || moved) return;
      const index = indexAt(event, false);
      if (index === undefined) return;
      onSelect(index === selected ? undefined : index);
    },
    onResponderTerminate: finish,
  };
}
