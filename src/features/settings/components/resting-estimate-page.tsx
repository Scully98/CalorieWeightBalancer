import { BiologicalSex } from '@kingstinct/react-native-healthkit';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Headline } from '@/components/headline';
import { LinkButton } from '@/components/link-button';
import {
  inputFromStored,
  resolveBmrInputs,
  updateStoredProfile,
  type BmrInputs,
  type UserInput,
} from '@/features/intro/bmr-inputs';
import { BmrCard } from '@/features/intro/components/bmr-card';
import { useHealthProfile } from '@/features/settings/resting-estimate';
import type { HealthProfile } from '@/health/scan';
import { formatLocale } from '@/i18n';
import { profileToJson } from '@/storage/parse';
import { useSettingsStore, useStoredProfile } from '@/storage/settings-context';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

// Used when Health could not be read: every value is then editable.
const EMPTY_PROFILE: HealthProfile = { biologicalSex: BiologicalSex.notSet };

const NUMBER_KEYS = ['weight', 'age', 'height'] as const;

function allFromHealth(inputs: BmrInputs): boolean {
  return (
    NUMBER_KEYS.every((key) => inputs[key].source === 'health') &&
    inputs.sex.source === 'health'
  );
}

function hasInvalidField(inputs: BmrInputs): boolean {
  return NUMBER_KEYS.some((key) => {
    const state = inputs[key];
    return state.source === 'input' && state.showHint;
  });
}

// Settings → Grundumsatz-Schätzung: the values for Mifflin-St Jeor. Health
// values are shown, the missing ones can be entered and saved.
export function RestingEstimatePage() {
  const colors = useColors();
  const { t } = useTranslation();
  const locale = formatLocale();
  const store = useSettingsStore();
  const stored = useStoredProfile();
  const health = useHealthProfile();
  const [now] = useState(() => new Date());
  const [userInput, setUserInput] = useState<UserInput>(() =>
    inputFromStored(stored, locale, now),
  );

  const profile =
    health.status === 'done'
      ? health.value
      : health.status === 'error'
        ? EMPTY_PROFILE
        : undefined;
  const inputs = profile
    ? resolveBmrInputs(profile, userInput, now)
    : undefined;
  const next = inputs ? updateStoredProfile(stored, inputs, now) : undefined;
  const canSave =
    inputs !== undefined &&
    next !== undefined &&
    !hasInvalidField(inputs) &&
    profileToJson(next) !== profileToJson(stored);

  function save() {
    if (!next) return;
    store.setProfile(next);
    router.back();
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <LinkButton label={t('settings.back')} onPress={router.back} />
        <Headline
          title={t('settings.restingEstimate')}
          subline={t('settings.estimate.body')}
        />
        {inputs ? (
          <>
            <BmrCard
              inputs={inputs}
              userInput={userInput}
              onChange={setUserInput}
              locale={locale}
              partial={false}
              title={t('settings.estimate.cardTitle')}
              body={
                allFromHealth(inputs)
                  ? t('settings.estimate.allFromHealth')
                  : t('settings.estimate.cardBody')
              }
            />
            {allFromHealth(inputs) ? null : (
              <View>
                <Button
                  label={t('settings.estimate.save')}
                  onPress={save}
                  disabled={!canSave}
                />
              </View>
            )}
          </>
        ) : (
          <AppText variant="secondary" tone="muted">
            {t('settings.estimate.loading')}
          </AppText>
        )}
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
});
