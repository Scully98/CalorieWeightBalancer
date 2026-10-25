import { BiologicalSex } from '@kingstinct/react-native-healthkit';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Headline } from '@/components/headline';
import {
  resolveBmrInputs,
  toStoredProfile,
  type UserInput,
} from '@/features/intro/bmr-inputs';
import { BmrCard } from '@/features/intro/components/bmr-card';
import { FoundList } from '@/features/intro/components/found-list';
import { IntroLayout } from '@/features/intro/components/intro-layout';
import { buildFoundRows } from '@/features/intro/found-rows';
import { useHealthScan } from '@/features/intro/use-health-scan';
import { openHealthApp } from '@/health/open-health-app';
import type { HealthProfile } from '@/health/scan';
import { formatLocale } from '@/i18n';
import { useSettingsStore } from '@/storage/settings-context';

// Used when the scan failed: every value is then asked for.
const EMPTY_PROFILE: HealthProfile = { biologicalSex: BiologicalSex.notSet };

// Intro step 3d: what arrives from Health, plus a one-off resting energy
// estimate when Health has none.
export default function IntroFoundScreen() {
  const { t } = useTranslation();
  const store = useSettingsStore();
  const locale = formatLocale();
  // One fixed point in time for age, relative dates and the stored profile.
  const [now] = useState(() => new Date());
  const scanState = useHealthScan();
  const [userInput, setUserInput] = useState<UserInput>({
    weight: '',
    age: '',
    height: '',
  });

  const scan = scanState.status === 'done' ? scanState.value : undefined;
  const failed = scanState.status === 'error';
  // Also when a watch is worn only now and then: days without resting energy
  // then use the estimate.
  const needsEstimate =
    failed || (scan !== undefined && scan.resting.typical === undefined);
  const profile = failed ? EMPTY_PROFILE : scan?.profile;
  const inputs = profile
    ? resolveBmrInputs(profile, userInput, now)
    : undefined;
  const canStart =
    (scan !== undefined || failed) &&
    (!needsEstimate || inputs?.estimate !== undefined);

  function start() {
    store.completeIntro(
      needsEstimate && inputs ? toStoredProfile(inputs, now) : {},
    );
  }

  return (
    <IntroLayout
      step={3}
      footer={
        <>
          <Button
            label={t('intro.found.start')}
            onPress={start}
            disabled={!canStart}
          />
          <Button
            variant="secondary"
            label={t('intro.found.checkPermissions')}
            onPress={openHealthApp}
          />
          <AppText variant="caption" tone="muted">
            {t('common.permissionsPath')}
          </AppText>
        </>
      }
    >
      <Headline
        title={t('intro.found.title')}
        subline={t('intro.found.body')}
      />
      {scan ? (
        <FoundList rows={buildFoundRows(scan, now, t, locale)} />
      ) : failed ? (
        <AppText>{t('intro.found.error')}</AppText>
      ) : (
        <AppText variant="secondary" tone="muted">
          {t('intro.found.loading')}
        </AppText>
      )}
      {needsEstimate && inputs ? (
        <BmrCard
          inputs={inputs}
          userInput={userInput}
          onChange={setUserInput}
          locale={locale}
          partial={scan?.resting.hasData ?? false}
        />
      ) : null}
    </IntroLayout>
  );
}
