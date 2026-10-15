import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Divider } from '@/components/divider';
import { formatSigned } from '@/core/format';
import { formatLocale } from '@/i18n';
import { border, radius, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type BarVariant = 'filled' | 'outlined' | 'dashed';

function Bar({ variant }: { variant: BarVariant }) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.bar,
        {
          borderColor: colors.foreground,
          borderStyle: variant === 'dashed' ? 'dashed' : 'solid',
          backgroundColor:
            variant === 'filled' ? colors.foreground : colors.background,
        },
      ]}
    />
  );
}

function BarRow({ label, variant }: { label: string; variant: BarVariant }) {
  return (
    <View style={styles.row}>
      <AppText style={styles.label}>{label}</AppText>
      <Bar variant={variant} />
    </View>
  );
}

// Card on intro step 3a: calories, burned and weight set in relation.
export function BalanceBarsIllustration() {
  const { t } = useTranslation();
  const locale = formatLocale();
  const value = t('intro.vision.resultValue', {
    min: formatSigned(800, locale),
    max: formatSigned(1200, locale),
  });

  return (
    <Card
      accessible
      accessibilityLabel={[
        t('intro.vision.a11y'),
        `${t('intro.vision.resultLabel')}: ${value}`,
        t('intro.vision.resultSign'),
      ].join('. ')}
    >
      <BarRow label={t('intro.vision.calories')} variant="filled" />
      <BarRow label={t('intro.vision.burned')} variant="outlined" />
      <BarRow label={t('intro.vision.weight')} variant="dashed" />
      <Divider />
      <AppText variant="secondary">{t('intro.vision.relation')}</AppText>
      <View>
        <AppText variant="secondary">{t('intro.vision.resultLabel')}</AppText>
        <AppText variant="number">{value}</AppText>
        <AppText variant="caption" tone="muted">
          {t('intro.vision.resultSign')}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: space.m,
    rowGap: space.xs,
  },
  label: {
    minWidth: 96,
  },
  bar: {
    flexGrow: 1,
    minWidth: 120,
    height: 14,
    borderWidth: border.thick,
    borderRadius: radius.pill,
  },
});
