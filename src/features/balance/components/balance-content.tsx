import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AnalysisCard } from './analysis-card';
import { BalanceChart, type ChartTooltipPreset } from './balance-chart';
import { BalanceHero } from './balance-hero';
import { QualityRow } from './quality-row';
import { TodayCard } from './today-card';
import { ToleranceCard } from './tolerance-card';
import { heroModel } from '../hero';
import type { BalanceReport } from '../use-balance';
import type { Settings } from '@/core/settings';
import { formatLocale } from '@/i18n';
import { useSettings, useSettingsStore } from '@/storage/settings-context';

type BalanceContentProps = {
  report: BalanceReport;
  // Gallery preset: the tolerance card starts open.
  toleranceOpen?: boolean;
  // Gallery preset: the today card starts open.
  todayOpen?: boolean;
  // Gallery preset: a bar of the chart starts selected.
  initialTooltip?: ChartTooltipPreset;
  onOpenQuality: () => void;
};

// Everything below the period, in page order. While a slider moves, only the
// hero and the tolerance card change: the draft goes through the period sums
// (`heroModel` → `toleranceRange`), the memoized parts keep their props, and
// the store, with the full report behind it, changes on release.
export function BalanceContent({
  report,
  toleranceOpen = false,
  todayOpen,
  initialTooltip,
  onOpenQuality,
}: BalanceContentProps) {
  const { t } = useTranslation();
  const store = useSettingsStore();
  const { tolerance } = useSettings();
  const [draft, setDraft] = useState<Settings['tolerance']>();
  const [open, setOpen] = useState(toleranceOpen);
  const shown = draft ?? tolerance;
  const model = heroModel(report.balance, shown, formatLocale(), t);

  function complete(next: Settings['tolerance']) {
    store.updateSettings({ tolerance: next });
    setDraft(undefined);
  }

  return (
    <>
      <BalanceHero model={model} />
      <TodayCard
        today={report.today}
        loadedAt={report.loadedAt}
        initialOpen={todayOpen}
      />
      <AnalysisCard analysis={report.analysis} days={report.days} />
      <BalanceChart
        chart={report.chart}
        loadedAt={report.loadedAt}
        initialTooltip={initialTooltip}
      />
      <QualityRow balance={report.balance} onOpen={onOpenQuality} />
      <ToleranceCard
        tolerance={shown}
        hero={model}
        open={open}
        onToggle={() => setOpen(!open)}
        onChange={setDraft}
        onComplete={complete}
      />
    </>
  );
}
