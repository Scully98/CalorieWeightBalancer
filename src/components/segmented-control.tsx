import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { border, radius, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  // No selection while undefined.
  value: T | undefined;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const colors = useColors();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.group, { borderColor: colors.foreground }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              selected && { backgroundColor: colors.foreground },
            ]}
          >
            <AppText
              variant="secondary"
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

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: border.thick,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  segment: {
    minHeight: 44,
    paddingHorizontal: space.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
