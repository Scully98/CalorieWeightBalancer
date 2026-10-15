import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Divider } from '@/components/divider';
import { InfoRow } from '@/components/info-row';
import { IntroLayout } from '@/features/intro/components/intro-layout';
import { requestReadAccess } from '@/health/authorization';

const ROWS = ['food', 'burn', 'weight', 'composition', 'profile'] as const;
const NOTES = ['note1', 'note2', 'note3'] as const;

// Intro step 3c. After the button iOS shows its own Health sheet.
export default function IntroHealthScreen() {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);

  async function allowAccess() {
    setPending(true);
    const result = await requestReadAccess();
    if (!result.ok && __DEV__) console.warn(result.error);
    setPending(false);
    // Also on error: step 3d explains what is missing.
    router.push('/intro/found');
  }

  return (
    <IntroLayout
      step={2}
      footer={
        <>
          <Button
            label={t('intro.health.allow')}
            onPress={allowAccess}
            disabled={pending}
          />
          <AppText variant="caption" tone="muted" style={styles.caption}>
            {t('intro.health.caption')}
          </AppText>
        </>
      }
    >
      <AppText variant="title" accessibilityRole="header">
        {t('intro.health.title')}
      </AppText>
      <AppText>{t('intro.health.body')}</AppText>
      <View>
        <Divider />
        {ROWS.map((row, index) => (
          <Fragment key={row}>
            {index > 0 ? <Divider variant="dashed" /> : null}
            <InfoRow
              label={t(`intro.health.rows.${row}.label`)}
              detail={t(`intro.health.rows.${row}.detail`)}
            />
          </Fragment>
        ))}
      </View>
      <Card variant="dashed">
        <AppText variant="bodyStrong">{t('intro.health.noteTitle')}</AppText>
        {NOTES.map((note) => (
          <AppText key={note} variant="secondary">
            · {t(`intro.health.${note}`)}
          </AppText>
        ))}
      </Card>
    </IntroLayout>
  );
}

const styles = StyleSheet.create({
  caption: {
    textAlign: 'center',
  },
});
