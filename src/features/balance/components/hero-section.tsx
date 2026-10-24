import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BalanceHero } from './balance-hero';
import { ToleranceCard } from './tolerance-card';
import { heroModel } from '../hero';
import type { PeriodBalance } from '@/core/period-balance';
import type { Settings } from '@/core/settings';
import { formatLocale } from '@/i18n';
import { useSettings, useSettingsStore } from '@/storage/settings-context';

type HeroSectionProps = {
  balance: PeriodBalance;
  initialOpen?: boolean;
};

// Hero and tolerance card. While a slider moves, only this section renders:
// the draft goes through the period sums (`heroModel` → `toleranceRange`),
// and the store, with the full report behind it, changes on release.
export function HeroSection({
  balance,
  initialOpen = false,
}: HeroSectionProps) {
  const { t } = useTranslation();
  const store = useSettingsStore();
  const { tolerance } = useSettings();
  const [draft, setDraft] = useState<Settings['tolerance']>();
  const [open, setOpen] = useState(initialOpen);
  const shown = draft ?? tolerance;

  function complete(next: Settings['tolerance']) {
    store.updateSettings({ tolerance: next });
    setDraft(undefined);
  }

  return (
    <View style={styles.section}>
      <BalanceHero model={heroModel(balance, shown, formatLocale(), t)} />
      <ToleranceCard
        tolerance={shown}
        open={open}
        onToggle={() => setOpen(!open)}
        onChange={setDraft}
        onComplete={complete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
});
