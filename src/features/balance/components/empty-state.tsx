import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { TodayCard } from './today-card';
import { emptyModel } from '../empty';
import type { BalanceReport } from '../use-balance';
import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { openHealthApp } from '@/health/open-health-app';
import { formatLocale } from '@/i18n';
import { border, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type EmptyStateProps = {
  // Undefined after a load error: treated as no data, since iOS reports
  // denied read access as empty data anyway.
  report?: Pick<BalanceReport, 'emptyInfo' | 'today' | 'loadedAt'>;
};

// No food in the period (design 1f). Without any data, or with data only
// elsewhere, it points to the Health permissions; on the first day it shows
// what has arrived today.
export function EmptyState({ report }: EmptyStateProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const model = emptyModel(
    report?.emptyInfo,
    report?.loadedAt ?? new Date(),
    formatLocale(),
    t,
  );

  if (model.kind === 'firstDay' && report)
    return (
      <View style={styles.firstDay}>
        <AppText variant="emptyTitle" accessibilityRole="header">
          {model.title}
        </AppText>
        <AppText>{model.body}</AppText>
        <TodayCard today={report.today} loadedAt={report.loadedAt} />
      </View>
    );

  return (
    <View style={styles.empty}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.square, { borderColor: colors.foreground }]}
      />
      <AppText variant="emptyTitle" accessibilityRole="header">
        {model.title}
      </AppText>
      <AppText>{model.body}</AppText>
      <AppText variant="secondary" tone="muted">
        {t('empty.explain')}
      </AppText>
      <Button
        label={t('empty.open')}
        onPress={openHealthApp}
        style={styles.button}
      />
      <AppText variant="caption" tone="muted">
        {t('common.permissionsPath')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    minHeight: 440,
    justifyContent: 'center',
    gap: space.m,
    paddingHorizontal: space.xs,
  },
  firstDay: {
    gap: space.m,
  },
  square: {
    width: 44,
    height: 44,
    borderWidth: border.medium,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  button: {
    marginTop: space.m,
  },
});
