import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppText } from './app-text';
import {
  border,
  space,
  STACKED_FONT_SCALE,
  touchTarget,
} from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

const TRACK = { width: 51, height: 31 };
const THUMB = 27;
const THUMB_INSET = 2;
const THUMB_TRAVEL = TRACK.width - THUMB - 2 * THUMB_INSET;
const TOGGLE_MS = 180;

// Drawn in views so its colors are always the tokens: the native switch
// sometimes showed a light thumb on the light track in dark mode. Touches and
// VoiceOver belong to the row.
function SwitchMark({ value }: { value: boolean }) {
  const colors = useColors();
  const [progress] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    let active = true;
    const toValue = value ? 1 : 0;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active) return;
      if (reduced) progress.setValue(toValue);
      else
        Animated.timing(progress, {
          toValue,
          duration: TOGGLE_MS,
          useNativeDriver: true,
        }).start();
    });
    return () => {
      active = false;
    };
  }, [progress, value]);

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: value ? colors.foreground : colors.separator,
          // The separator alone is too faint to show the control's edge.
          borderColor: value ? colors.foreground : colors.muted,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: value ? colors.background : colors.foreground,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, THUMB_TRAVEL],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

type SwitchRowProps = {
  label: string;
  detail?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

// The whole row toggles; VoiceOver reads it as one switch with its state.
export function SwitchRow({
  label,
  detail,
  value,
  onValueChange,
}: SwitchRowProps) {
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale > STACKED_FONT_SCALE;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={detail}
      onPress={() => onValueChange(!value)}
      style={[styles.row, stacked ? styles.stacked : null]}
    >
      <View style={styles.text}>
        <AppText>{label}</AppText>
        {detail ? (
          <AppText variant="footnote" tone="muted">
            {detail}
          </AppText>
        ) : null}
      </View>
      <SwitchMark value={value} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    minHeight: touchTarget,
    paddingVertical: space.m,
  },
  // At accessibility sizes the switch moves below the text, as in iOS.
  stacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  text: {
    flexShrink: 1,
    flexGrow: 1,
    gap: space.xs,
  },
  track: {
    width: TRACK.width,
    height: TRACK.height,
    borderRadius: TRACK.height / 2,
    borderWidth: border.medium,
    padding: THUMB_INSET - border.medium,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
  },
});
