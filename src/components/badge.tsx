import { StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { border, radius, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type BadgeProps = {
  label: string;
};

export function Badge({ label }: BadgeProps) {
  const colors = useColors();

  return (
    <View style={[styles.badge, { borderColor: colors.foreground }]}>
      <AppText variant="caption" style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: border.thin,
    borderRadius: radius.small,
    paddingHorizontal: space.s,
    paddingVertical: 2,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
