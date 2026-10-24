import { Pressable, StyleSheet } from 'react-native';

import { AppText } from './app-text';

type LinkButtonProps = {
  label: string;
  onPress: () => void;
};

export function LinkButton({ label, onPress }: LinkButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
    >
      {/* Without an accent color the underline is what marks it as tappable. */}
      <AppText variant="secondary" style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    textDecorationLine: 'underline',
  },
});
