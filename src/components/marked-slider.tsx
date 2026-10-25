import { useState } from 'react';
import {
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
} from 'react-native';

import { AppText } from './app-text';
import { useScrollLock } from '@/hooks/scroll-lock';
import { border, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

const THUMB = 24;
// The thumb center runs from half the thumb to the width minus that; track,
// band and fill use the same inset.
const INSET = THUMB / 2;

type MarkedSliderProps = {
  label: string;
  // Whole steps from 0 to `max`.
  value: number;
  max: number;
  // The usual range, marked as a band behind the track.
  norm: { min: number; max: number };
  valueText: string;
  captions: [string, string];
  accessibilityLabel: string;
  accessibilityValueText: string;
  // Every step while dragging; `onComplete` when the finger lifts.
  onChange: (value: number) => void;
  onComplete: (value: number) => void;
};

// Slider after the design: 2 pt track, 8 pt norm band, 4 pt fill and a 24 pt
// thumb with a 2 pt ring, all from the color tokens. Drawn in views because
// the native slider cannot load a thumb image without the bridge.
export function MarkedSlider({
  label,
  value,
  max,
  norm,
  valueText,
  captions,
  accessibilityLabel,
  accessibilityValueText,
  onChange,
  onComplete,
}: MarkedSliderProps) {
  const colors = useColors();
  const lockScroll = useScrollLock();
  const [width, setWidth] = useState(0);
  const span = Math.max(0, width - THUMB);
  // Step under the finger; the parts above the track ignore touches, so
  // locationX is measured on the track area. Beyond its ends it clamps.
  function valueAt(event: GestureResponderEvent): number {
    if (span === 0) return value;
    const x = event.nativeEvent.locationX - INSET;
    return Math.round(Math.min(1, Math.max(0, x / span)) * max);
  }

  function move(event: GestureResponderEvent) {
    const next = valueAt(event);
    if (next !== value) onChange(next);
  }

  function finish(event: GestureResponderEvent) {
    lockScroll(false);
    onComplete(valueAt(event));
  }

  // VoiceOver: one swipe up or down is one step, stored at once.
  function onAccessibilityAction(event: AccessibilityActionEvent) {
    const step = event.nativeEvent.actionName === 'increment' ? 1 : -1;
    const next = Math.min(max, Math.max(0, value + step));
    if (next === value) return;
    onChange(next);
    onComplete(next);
  }

  const offset = max > 0 ? (span * value) / max : 0;

  return (
    <View style={styles.slider}>
      <View style={styles.row}>
        <AppText>{label}</AppText>
        <AppText variant="bodyStrong">{valueText}</AppText>
      </View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: accessibilityValueText }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAccessibilityAction}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        // A tap on the track jumps there; the scroll views stay put while
        // the finger is down.
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(event) => {
          lockScroll(true);
          move(event);
        }}
        onResponderMove={move}
        onResponderRelease={finish}
        onResponderTerminate={finish}
        style={styles.area}
      >
        <View
          pointerEvents="none"
          style={[styles.track, { backgroundColor: colors.separator }]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.band,
            {
              left: INSET + (span * norm.min) / max,
              width: (span * (norm.max - norm.min)) / max,
              backgroundColor: colors.separator,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.fill,
            { width: offset, backgroundColor: colors.foreground },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              left: offset,
              backgroundColor: colors.background,
              borderColor: colors.foreground,
            },
          ]}
        />
      </View>
      <View style={styles.row}>
        <AppText variant="footnote" tone="muted" style={styles.caption}>
          {captions[0]}
        </AppText>
        <AppText variant="footnote" tone="muted" style={styles.end}>
          {captions[1]}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slider: {
    gap: space.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: space.s,
  },
  caption: {
    flexShrink: 1,
  },
  // Stays on the right when it wraps below the left caption.
  end: {
    marginLeft: 'auto',
  },
  area: {
    height: 34,
  },
  track: {
    position: 'absolute',
    left: INSET,
    right: INSET,
    top: 16,
    height: 2,
  },
  band: {
    position: 'absolute',
    top: 13,
    height: 8,
    borderRadius: 4,
  },
  fill: {
    position: 'absolute',
    left: INSET,
    top: 15,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: 5,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: border.thick,
  },
});
