import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Divider } from '@/components/divider';
import { Headline } from '@/components/headline';
import { InfoRow } from '@/components/info-row';
import { StatusRow } from '@/components/status-row';
import { formatApproxKcal } from '@/core/format';
import {
  buildCalcLines,
  buildCalcNotes,
  buildDataRows,
  buildEstimateLines,
  type CalcLine,
} from '@/features/balance/data-rows';
import type {
  BalanceReport,
  BalanceState,
} from '@/features/balance/use-balance';
import { openHealthApp } from '@/health/open-health-app';
import { formatLocale } from '@/i18n';
import { space } from '@/theme/spacing';

function CalcRow({ line }: { line: CalcLine }) {
  const variant = line.key === 'total' ? 'bodyStrong' : 'body';

  return (
    <View
      accessible
      accessibilityLabel={[line.label, line.value, line.detail]
        .filter(Boolean)
        .join(', ')}
      style={styles.calcRow}
    >
      <View style={styles.calcLabel}>
        <AppText variant={variant}>{line.label}</AppText>
        {line.detail ? (
          <AppText variant="caption" tone="muted">
            {line.detail}
          </AppText>
        ) : null}
      </View>
      <AppText variant={variant} style={styles.calcValue}>
        {line.value}
      </AppText>
    </View>
  );
}

function Report({ report }: { report: BalanceReport }) {
  const { t } = useTranslation();
  const locale = formatLocale();
  const { balance, fallback } = report;
  const lines = buildCalcLines(balance, fallback, t, locale);
  const total = lines[lines.length - 1];

  return (
    <>
      <Card>
        <Headline level="h3" title={t('data.calcTitle')} />
        {balance.countedDays === 0 ? (
          <AppText>{t('data.noCalc')}</AppText>
        ) : (
          <>
            {lines.slice(0, -1).map((line) => (
              <CalcRow key={line.key} line={line} />
            ))}
            <Divider />
            <CalcRow line={total} />
          </>
        )}
        {buildCalcNotes(balance, t).map((note) => (
          <AppText key={note} variant="caption" tone="muted">
            {note}
          </AppText>
        ))}
      </Card>
      <View>
        <Headline
          level="h3"
          title={t('data.arrivingTitle')}
          subline={t('data.arrivingBody')}
        />
        {buildDataRows(report, t).map((row) => (
          <StatusRow
            key={row.key}
            status={row.status}
            label={row.label}
            detail={row.detail}
            accessibilityLabel={row.accessibilityLabel}
          />
        ))}
      </View>
      {fallback?.kind === 'estimate' ? (
        <Card>
          <Headline
            level="h3"
            title={t('data.estimateTitle')}
            subline={t('data.estimateBody')}
          />
          <View>
            {buildEstimateLines(fallback.inputs, t, locale).map((line) => (
              <InfoRow key={line.key} label={line.label} detail={line.detail} />
            ))}
          </View>
          <Divider />
          <InfoRow
            label={t('intro.found.bmr.result')}
            detail={formatApproxKcal(fallback.kcal, locale)}
          />
        </Card>
      ) : null}
    </>
  );
}

// Second page: what arrives from Health and how the balance adds up.
export function DataPage({ state }: { state: BalanceState }) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Headline title={t('data.title')} subline={t('home.period')} />
      {state.status === 'done' ? (
        <Report report={state.value} />
      ) : state.status === 'error' ? (
        <AppText>{t('data.error')}</AppText>
      ) : (
        <AppText variant="secondary" tone="muted">
          {t('data.loading')}
        </AppText>
      )}
      <View style={styles.health}>
        <Button
          variant="secondary"
          label={t('data.openHealth')}
          onPress={openHealthApp}
        />
        <AppText variant="caption" tone="muted">
          {t('common.permissionsPath')}
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.l,
    paddingBottom: space.xl,
    gap: space.l,
  },
  calcRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    columnGap: space.m,
    rowGap: space.xs,
    paddingVertical: space.xs,
  },
  calcLabel: {
    flexShrink: 1,
    gap: 2,
  },
  calcValue: {
    marginLeft: 'auto',
    textAlign: 'right',
  },
  health: {
    gap: space.s,
  },
});
