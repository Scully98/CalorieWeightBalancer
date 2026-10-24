import Slider from '@react-native-community/slider';
import {
  StyleSheet,
  useColorScheme,
  View,
  type AccessibilityActionEvent,
} from 'react-native';

import { AppText } from './app-text';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

// Thumb per scheme, drawn from the color tokens by
// scripts/make-slider-thumbs.swift (24 pt, 2 pt ring, no shadow).
const THUMB = {
  light: require('../../assets/images/slider-thumb-light.png'),
  dark: require('../../assets/images/slider-thumb-dark.png'),
};

// UISlider moves the thumb center from half the thumb width to the width
// minus that; the norm band uses the same inset.
const THUMB_INSET = 12;

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
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  // UISlider steps VoiceOver by 10 % of the range; one swipe here is one
  // step, and it is stored at once like a finished drag.
  function onAccessibilityAction(event: AccessibilityActionEvent) {
    const step = event.nativeEvent.actionName === 'increment' ? 1 : -1;
    const next = Math.min(max, Math.max(0, value + step));
    if (next === value) return;
    onChange(next);
    onComplete(next);
  }

  return (
    <View style={styles.slider}>
      <View style={styles.header}>
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
        style={styles.track}
      >
        <View style={styles.bandArea} pointerEvents="none">
          <View
            style={[
              styles.band,
              {
                left: `${(norm.min / max) * 100}%`,
                right: `${(1 - norm.max / max) * 100}%`,
                backgroundColor: colors.separator,
              },
            ]}
          />
        </View>
        <Slider
          // The JS wrapper treats 0 as "no value" and would not move the
          // thumb back to 0; the native step rounds this to 0.
          value={value === 0 ? Number.EPSILON : value}
          minimumValue={0}
          maximumValue={max}
          step={1}
          minimumTrackTintColor={colors.foreground}
          maximumTrackTintColor={colors.separator}
          thumbImage={THUMB[scheme]}
          onValueChange={(next) => onChange(Math.round(next))}
          onSlidingComplete={(next) => onComplete(Math.round(next))}
          style={styles.native}
        />
      </View>
      <View style={styles.header}>
        <AppText variant="footnote" tone="muted" style={styles.caption}>
          {captions[0]}
        </AppText>
        <AppText variant="footnote" tone="muted">
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
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: space.s,
  },
  caption: {
    flexShrink: 1,
  },
  track: {
    height: 34,
    justifyContent: 'center',
  },
  bandArea: {
    position: 'absolute',
    left: THUMB_INSET,
    right: THUMB_INSET,
    top: 13,
    height: 8,
  },
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  native: {
    height: 34,
  },
});
