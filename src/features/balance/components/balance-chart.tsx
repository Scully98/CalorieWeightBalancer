import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ChartCanvas } from './chart-canvas';
import { ChartLegend } from './chart-legend';
import {
  chartModel,
  type ChartSeries,
  type HiddenSeries,
} from '../chart-model';
import { chartSummary } from '../chart-tooltip';
import type { BalanceReport } from '../use-balance';
import { AppText } from '@/components/app-text';
import { formatLocale } from '@/i18n';

// Fixed size at every Dynamic Type step, like the chart itself.
const AXIS_HEADER_FONT_SCALE = 1;

type BalanceChartProps = { chart: BalanceReport['chart'] };

// „Bilanz pro Tag/Woche“: bars per day or week on the balance page. Gets the
// finished series of the core and only draws them.
export function BalanceChart({ chart }: BalanceChartProps) {
  const { t } = useTranslation();
  const locale = formatLocale();
  // Content width, measured: the canvas scales the design's viewBox to it.
  const [width, setWidth] = useState<number>();
  // Chips the user switched off; kept across period changes, not stored.
  const [hidden, setHidden] = useState<HiddenSeries>({});
  // Stable while only the width or nothing changes, so the memoized canvas
  // skips redrawing.
  const model = useMemo(
    () => chartModel(chart, hidden, locale, t),
    [chart, hidden, locale, t],
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="sectionTitle" accessibilityRole="header">
          {model.title}
        </AppText>
        <AppText variant="footnote" tone="muted">
          {model.subtitle}
        </AppText>
      </View>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={chartSummary(model, chart.lines, locale, t)}
      >
        <View style={styles.axisHeader}>
          <AppText
            variant="caption2"
            tone="muted"
            maxFontSizeMultiplier={AXIS_HEADER_FONT_SCALE}
          >
            {t('chart.axisKcal')}
          </AppText>
          {model.showRight ? (
            <AppText
              variant="caption2"
              tone="muted"
              maxFontSizeMultiplier={AXIS_HEADER_FONT_SCALE}
            >
              {t('chart.axisKg')}
            </AppText>
          ) : null}
        </View>
        {width ? <ChartCanvas model={model} width={width} /> : null}
      </View>
      <ChartLegend
        legend={model.legend}
        onToggle={(series: ChartSeries) =>
          setHidden((current) => ({ ...current, [series]: !current[series] }))
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  header: {
    gap: 2,
  },
  axisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
});
