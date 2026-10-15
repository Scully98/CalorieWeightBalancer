import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from './app-text';
import { border, radius, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) {
  const colors = useColors();
  const tint = disabled ? colors.muted : colors.foreground;
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: tint,
          backgroundColor: primary ? tint : colors.background,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <AppText
        variant="bodyStrong"
        tone={primary ? 'inverse' : disabled ? 'muted' : 'foreground'}
        style={styles.label}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderWidth: border.thick,
    borderRadius: radius.pill,
    paddingHorizontal: space.l,
    paddingVertical: space.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
