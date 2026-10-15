import { Pressable } from 'react-native';

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
      <AppText variant="secondary" tone="muted">
        {label}
      </AppText>
    </Pressable>
  );
}
