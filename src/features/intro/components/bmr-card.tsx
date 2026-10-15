import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Badge } from '@/components/badge';
import { Card } from '@/components/card';
import { Divider } from '@/components/divider';
import { InfoRow } from '@/components/info-row';
import { NumberField } from '@/components/number-field';
import { SegmentedControl } from '@/components/segmented-control';
import type { Sex } from '@/core/bmr';
import { formatApproxKcal, formatNumber } from '@/core/format';
import {
  LIMITS,
  type BmrInputs,
  type NumberKey,
  type UserInput,
} from '@/features/intro/bmr-inputs';
import { space } from '@/theme/spacing';

type BmrCardProps = {
  inputs: BmrInputs;
  userInput: UserInput;
  onChange: (input: UserInput) => void;
  locale: string;
};

// Shown on intro step 3d when Health has no resting energy. Only the values
// Health lacks are editable.
export function BmrCard({ inputs, userInput, onChange, locale }: BmrCardProps) {
  const { t } = useTranslation();

  const units: Record<NumberKey, string> = {
    weight: 'kg',
    age: t('intro.found.bmr.years'),
    height: 'cm',
  };
  const healthText: Record<NumberKey, (value: number) => string> = {
    weight: (value) => `${formatNumber(value, locale, 1)} kg`,
    age: (value) => formatNumber(value, locale),
    height: (value) => `${formatNumber(value, locale)} cm`,
  };
  const sexLabels = {
    male: t('intro.found.bmr.sexMale'),
    female: t('intro.found.bmr.sexFemale'),
    other: t('intro.found.bmr.sexOther'),
    unspecified: t('intro.found.bmr.sexUnspecified'),
  };

  function numberRow(key: NumberKey) {
    const state = inputs[key];
    const label = t(`intro.found.bmr.${key}`);
    if (state.source === 'health') {
      return (
        <InfoRow
          label={label}
          detail={t('intro.found.bmr.fromHealth', {
            value: healthText[key](state.value),
          })}
        />
      );
    }
    const { min, max } = LIMITS[key];
    return (
      <InfoRow label={label}>
        <NumberField
          value={userInput[key]}
          onChangeText={(text) => onChange({ ...userInput, [key]: text })}
          unit={units[key]}
          keyboardType={key === 'weight' ? 'decimal-pad' : 'number-pad'}
          accessibilityLabel={label}
          invalid={state.showHint}
          hint={t('intro.found.bmr.range', { min, max, unit: units[key] })}
        />
      </InfoRow>
    );
  }

  const sexLabel = t('intro.found.bmr.sex');

  return (
    <Card>
      <AppText variant="bodyStrong">{t('intro.found.bmr.title')}</AppText>
      <AppText variant="secondary" tone="muted">
        {t('intro.found.bmr.body')}
      </AppText>
      <View>
        {numberRow('weight')}
        {numberRow('age')}
        {numberRow('height')}
        {inputs.sex.source === 'health' ? (
          <InfoRow
            label={sexLabel}
            detail={t('intro.found.bmr.fromHealth', {
              value: sexLabels[inputs.sex.fromHealth],
            })}
          />
        ) : (
          <InfoRow label={sexLabel}>
            <SegmentedControl<Sex>
              options={[
                { value: 'male', label: sexLabels.male },
                { value: 'female', label: sexLabels.female },
                { value: 'unspecified', label: sexLabels.unspecified },
              ]}
              value={inputs.sex.value}
              onChange={(sex) => onChange({ ...userInput, sex })}
              accessibilityLabel={sexLabel}
            />
          </InfoRow>
        )}
      </View>
      <Divider />
      <InfoRow label={t('intro.found.bmr.result')}>
        <View style={styles.result}>
          <AppText variant="number">
            {inputs.estimate === undefined
              ? '–'
              : formatApproxKcal(inputs.estimate, locale)}
          </AppText>
          {inputs.estimate === undefined ? null : (
            <Badge label={t('intro.found.bmr.estimated')} />
          )}
        </View>
      </InfoRow>
    </Card>
  );
}

const styles = StyleSheet.create({
  result: {
    alignItems: 'flex-end',
    gap: space.xs,
  },
});
