import {
  Pressable,
  StyleSheet,
  Switch,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppText } from './app-text';
import { space, STACKED_FONT_SCALE, touchTarget } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

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
  const colors = useColors();
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
      <Switch
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.separator, true: colors.foreground }}
        thumbColor={colors.background}
        ios_backgroundColor={colors.separator}
      />
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
});
