import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Fragment, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TypeSpecimen } from './type-specimen';
import { AppText } from '@/components/app-text';
import { Divider } from '@/components/divider';
import { LinkButton } from '@/components/link-button';
import { NavRow } from '@/components/nav-row';
import { SwitchRow } from '@/components/switch-row';
import { formatApproxKcal } from '@/core/format';
import {
  openImprint,
  openLanguageSettings,
  openPrivacy,
} from '@/features/settings/links';
import {
  todayRestingEstimate,
  useHealthProfile,
} from '@/features/settings/resting-estimate';
import { openHealthApp } from '@/health/open-health-app';
import { formatLocale } from '@/i18n';
import {
  useSettings,
  useSettingsStore,
  useStoredProfile,
} from '@/storage/settings-context';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const colors = useColors();
  const rows = Array.isArray(children) ? children.filter(Boolean) : [children];

  return (
    <View>
      <AppText
        variant="caption"
        tone="muted"
        accessibilityRole="header"
        style={styles.sectionTitle}
      >
        {title}
      </AppText>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <View
              style={[styles.separator, { backgroundColor: colors.separator }]}
            />
          ) : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

export function SettingsPage() {
  const colors = useColors();
  const { t } = useTranslation();
  const locale = formatLocale();
  const store = useSettingsStore();
  const settings = useSettings();
  const stored = useStoredProfile();
  const health = useHealthProfile();
  const [now] = useState(() => new Date());
  const estimate =
    health.status === 'done'
      ? todayRestingEstimate(health.value, stored, now)
      : undefined;
  const estimateText =
    health.status === 'loading'
      ? undefined
      : estimate === undefined
        ? t('settings.restingMissing')
        : formatApproxKcal(estimate, locale);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="largeTitle" accessibilityRole="header">
          {t('settings.title')}
        </AppText>
        <Section title={t('settings.calculation')}>
          <SwitchRow
            label={t('settings.zeroDays')}
            detail={t('settings.zeroDaysDetail')}
            value={settings.zeroDaysAsMaintenance}
            onValueChange={(value) =>
              store.updateSettings({ zeroDaysAsMaintenance: value })
            }
          />
          <SwitchRow
            label={t('settings.includeToday')}
            detail={t('settings.includeTodayDetail')}
            value={settings.includeToday}
            onValueChange={(value) =>
              store.updateSettings({ includeToday: value })
            }
          />
        </Section>
        <Section title={t('settings.data')}>
          <NavRow
            label={t('settings.restingEstimate')}
            value={estimateText}
            onPress={() => router.push('/settings/resting-estimate')}
          />
          <View>
            <NavRow
              label={t('settings.healthPermissions')}
              external
              onPress={openHealthApp}
            />
            <AppText variant="footnote" tone="muted">
              {t('common.permissionsPath')}
            </AppText>
          </View>
        </Section>
        <Section title={t('settings.info')}>
          <NavRow
            label={t('settings.language')}
            value={t('settings.languageName')}
            onPress={openLanguageSettings}
          />
          <NavRow
            label={t('settings.calculationPage')}
            onPress={() => router.push('/settings/calculation')}
          />
          <NavRow
            label={t('settings.privacy')}
            external
            onPress={openPrivacy}
          />
          <NavRow
            label={t('settings.imprint')}
            external
            onPress={openImprint}
          />
        </Section>
        <AppText variant="footnote" tone="muted" style={styles.footer}>
          {t('settings.footer', { version: Constants.expoConfig?.version })}
        </AppText>
        {__DEV__ ? (
          <View style={styles.dev}>
            <Divider />
            <LinkButton label="Reset intro (dev)" onPress={store.resetIntro} />
            <LinkButton
              label="Zustandsgalerie (dev) ›"
              onPress={() => router.push('/dev/gallery')}
            />
            <LinkButton
              label="Tageswerte (dev) ›"
              onPress={() => router.push('/dev/day-values')}
            />
            <TypeSpecimen />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingVertical: space.l,
    gap: space.xl,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    marginBottom: space.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  footer: {
    textAlign: 'center',
  },
  dev: {
    gap: space.l,
  },
});
