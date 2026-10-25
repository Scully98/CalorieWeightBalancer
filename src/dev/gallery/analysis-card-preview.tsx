import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { AnalysisCard } from '@/features/balance/components/analysis-card';
import { useBalance } from '@/features/balance/use-balance';

// Development only: the Abgleich card on its own, as the design shows 1j, 1k
// and 1l.
export function AnalysisCardPreview() {
  const { t } = useTranslation();
  const state = useBalance();

  return (
    <SafeAreaView edges={['top']} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        {state.status === 'done' ? (
          <AnalysisCard
            analysis={state.value.analysis}
            days={state.value.days}
          />
        ) : (
          <AppText variant="secondary" tone="muted">
            {state.status === 'loading' ? t('home.loading') : state.status}
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
    padding: 20,
  },
});
