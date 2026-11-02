import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { qualityRow } from '../quality';
import { AppText } from '@/components/app-text';
import { QualitySwatch } from '@/components/quality-pattern';
import type { PeriodBalance } from '@/core/period-balance';
import { border, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type QualityRowProps = {
  balance: PeriodBalance;
  onOpen: () => void;
};

// „24 von 30 Tagen vollständig“ with the patterns of the flags that occur.
// Opens „Unvollständige Tage“; with every day complete there is nothing to
// open.
export function QualityRow({ balance, onOpen }: QualityRowProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const model = qualityRow(balance, t);

  return (
    <Pressable
      accessibilityRole={model.tappable ? 'button' : undefined}
      accessibilityLabel={model.title}
      accessibilityValue={
        model.spokenEntries ? { text: model.spokenEntries } : undefined
      }
      accessibilityHint={model.tappable ? t('quality.openHint') : undefined}
      disabled={!model.tappable}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        { borderColor: colors.foreground, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={styles.text}>
        <AppText variant="bodyStrong">{model.title}</AppText>
        {model.entries.length > 0 ? (
          <View style={styles.entries}>
            {model.entries.map((entry) => (
              <View key={entry.flag} style={styles.entry}>
                <QualitySwatch flag={entry.flag} />
                <AppText variant="footnote" tone="muted" style={styles.label}>
                  {entry.text}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {model.tappable ? (
        <View style={[styles.chevron, { borderColor: colors.foreground }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingVertical: space.m,
    paddingHorizontal: 14,
    borderWidth: border.medium,
    borderRadius: 14,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  entries: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 5,
    columnGap: 14,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  label: {
    flexShrink: 1,
  },
  chevron: {
    width: 8,
    height: 8,
    marginRight: space.xs,
    borderRightWidth: border.thick,
    borderBottomWidth: border.thick,
    transform: [{ rotate: '-45deg' }],
  },
});
