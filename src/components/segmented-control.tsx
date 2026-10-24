import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { border, radius, space, touchTarget } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  // Spoken instead of the label, e.g. for abbreviations like "m".
  accessibilityLabel?: string;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  // No selection while undefined.
  value: T | undefined;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  // Segments grow to fill the width and wrap at large text sizes, e.g. the
  // period on the balance page; compact like the design there.
  stretch?: boolean;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  stretch = false,
}: SegmentedControlProps<T>) {
  const colors = useColors();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.group,
        stretch && styles.stretchGroup,
        { borderColor: colors.foreground },
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            // iOS does not announce the group label, so each option carries it.
            accessibilityLabel={`${accessibilityLabel}: ${option.accessibilityLabel ?? option.label}`}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            // 32 pt high like the design; the slop keeps 44 pt to tap.
            hitSlop={stretch ? STRETCH_SLOP : undefined}
            style={[
              styles.segment,
              stretch && styles.stretchSegment,
              selected && { backgroundColor: colors.foreground },
            ]}
          >
            <AppText
              variant={stretch ? 'segment' : 'secondary'}
              tone={selected ? 'inverse' : 'foreground'}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const STRETCH_SLOP = { top: 6, bottom: 6 };

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: border.thick,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  segment: {
    // With the group border the control is exactly touchTarget high.
    minHeight: touchTarget - 2 * border.thick,
    paddingHorizontal: space.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stretchGroup: {
    borderWidth: border.medium,
    borderRadius: 11,
    padding: 2,
    gap: 2,
  },
  stretchSegment: {
    flexGrow: 1,
    minHeight: 32,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
});
