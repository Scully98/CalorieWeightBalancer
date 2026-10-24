import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from './app-text';
import { space, STACKED_FONT_SCALE, touchTarget } from '@/theme/spacing';

type NavRowProps = {
  label: string;
  value?: string;
  // Leaves the app (browser, Health, iOS Settings): ↗ instead of ›.
  external?: boolean;
  onPress: () => void;
};

export function NavRow({ label, value, external, onPress }: NavRowProps) {
  const { fontScale } = useWindowDimensions();
  // At accessibility sizes the value moves below the label, as in iOS.
  const stacked = fontScale > STACKED_FONT_SCALE;

  return (
    <Pressable
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.5 : 1 }]}
    >
      <View style={styles.label}>
        <AppText>{label}</AppText>
        {value && stacked ? (
          <AppText variant="secondary" tone="muted">
            {value}
          </AppText>
        ) : null}
      </View>
      {value && !stacked ? (
        <AppText variant="secondary" tone="muted" style={styles.value}>
          {value}
        </AppText>
      ) : null}
      <AppText tone="muted" accessibilityElementsHidden>
        {external ? '↗' : '›'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    minHeight: touchTarget,
    paddingVertical: space.m,
  },
  label: {
    flex: 1,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
