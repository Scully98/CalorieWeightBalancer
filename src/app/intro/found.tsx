import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, useWindowDimensions, View } from 'react-native';

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
import { formatLocale } from '@/i18n';
import { completeIntro } from '@/storage/settings';
import { space } from '@/theme/spacing';

// Intro step 3d: what arrives from Health, plus a one-off resting energy
// estimate when Health has none.
export default function IntroFoundScreen() {
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const locale = formatLocale();
  const now = useMemo(() => new Date(), []);
  const scanState = useHealthScan();
  const [userInput, setUserInput] = useState<UserInput>({
    weight: '',
    age: '',
    height: '',
  });

  const scan = scanState.status === 'done' ? scanState.scan : undefined;
  const needsEstimate = scan !== undefined && !scan.resting.hasData;
  const inputs = scan
    ? resolveBmrInputs(scan.profile, userInput, now)
    : undefined;
  const canStart =
    scan !== undefined && (!needsEstimate || inputs?.estimate !== undefined);

  const stacked = fontScale > 1.3;
  const buttonStyle = stacked ? undefined : styles.button;

  function start() {
    completeIntro(needsEstimate && inputs ? toStoredProfile(inputs, now) : {});
  }

  return (
    <IntroLayout
      step={3}
      footer={
        <View style={stacked ? styles.stacked : styles.row}>
          <Button
            variant="secondary"
            label={t('intro.found.checkPermissions')}
            onPress={() => Linking.openSettings()}
            style={buttonStyle}
          />
          <Button
            label={t('intro.found.start')}
            onPress={start}
            disabled={!canStart}
            style={buttonStyle}
          />
        </View>
      }
    >
      <Headline
        title={t('intro.found.title')}
        subline={t('intro.found.body')}
      />
      {scan ? (
        <FoundList rows={buildFoundRows(scan, now, t, locale)} />
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
        />
      ) : null}
    </IntroLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.s,
  },
  stacked: {
    gap: space.s,
  },
  button: {
    flexGrow: 1,
    flexBasis: 0,
  },
});
