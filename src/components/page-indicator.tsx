import { StyleSheet, View } from 'react-native';

import { border, radius } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type PageIndicatorProps = {
  count: number;
  index: number;
  accessibilityLabel: string;
};

export function PageIndicator({
  count,
  index,
  accessibilityLabel,
}: PageIndicatorProps) {
  const colors = useColors();

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.row}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            i === index ? styles.active : styles.inactive,
            {
              borderColor: colors.foreground,
              backgroundColor:
                i === index ? colors.foreground : colors.background,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  active: {
    width: 24,
    height: 10,
    borderRadius: radius.pill,
    borderWidth: border.thin,
  },
  inactive: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
});
