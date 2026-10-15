import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from './app-text';
import { border, space } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

type NumberFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  unit: string;
  keyboardType: 'number-pad' | 'decimal-pad';
  accessibilityLabel: string;
  // Shown in muted below the field while the value is invalid.
  hint?: string;
  invalid?: boolean;
};

export function NumberField({
  value,
  onChangeText,
  unit,
  keyboardType,
  accessibilityLabel,
  hint,
  invalid = false,
}: NumberFieldProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={invalid ? hint : undefined}
          placeholderTextColor={colors.muted}
          selectionColor={colors.foreground}
          style={[
            { fontSize: typography.body.fontSize },
            styles.input,
            { color: colors.foreground, borderColor: colors.foreground },
          ]}
        />
        <AppText>{unit}</AppText>
      </View>
      {invalid && hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    gap: space.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
  },
  input: {
    minWidth: 72,
    minHeight: 44,
    borderBottomWidth: border.thick,
    textAlign: 'right',
    paddingVertical: space.xs,
  },
});
