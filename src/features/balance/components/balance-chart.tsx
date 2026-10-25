import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ChartCanvas } from './chart-canvas';
import { ChartLegend } from './chart-legend';
import { ChartTooltip } from './chart-tooltip';
import {
  chartModel,
  VIEW,
  type ChartModel,
  type ChartSeries,
  type HiddenSeries,
} from '../chart-model';
import { chartSummary, tooltipModel } from '../chart-tooltip';
import { useChartGesture } from '../use-chart-gesture';
import type { BalanceReport } from '../use-balance';
import { AppText } from '@/components/app-text';
import { formatLocale } from '@/i18n';

// Fixed size at every Dynamic Type step, like the chart itself.
const AXIS_HEADER_FONT_SCALE = 1;
const TOOLTIP_WIDTH = 198;
// Space the tooltip keeps to the chart's edges when the text is large.
const TOOLTIP_INSET = 16;

// Gallery preset 1h: the tooltip on the last bar with estimated resting
// energy.
export type ChartTooltipPreset = 'lastEstimatedDay';

// A selection belongs to one set of bars; a new period starts without one,
// a reload of the same period keeps it.
function selectionKey(model: ChartModel): string {
  const first = model.slots[0]?.bucket;
  const date = first ? (first.kind === 'week' ? first.from : first.date) : '';
  return `${date}|${model.slots.length}`;
}

function presetIndex(model: ChartModel): number | undefined {
  return model.bars.findLast((bar) => bar.kind === 'hatch')?.slot;
}

type BalanceChartProps = {
  chart: BalanceReport['chart'];
  loadedAt: Date;
  initialTooltip?: ChartTooltipPreset;
};

// „Bilanz pro Tag/Woche“: bars per day or week on the balance page. Gets the
// finished series of the core and only draws them.
export function BalanceChart({
  chart,
  loadedAt,
  initialTooltip,
}: BalanceChartProps) {
  const { t } = useTranslation();
  const locale = formatLocale();
  const { fontScale } = useWindowDimensions();
  // Content width, measured: the canvas scales the design's viewBox to it.
  const [width, setWidth] = useState<number>();
  // Chips the user switched off; kept across period changes, not stored.
  const [hidden, setHidden] = useState<HiddenSeries>({});
  // Stable while only the width or the selection changes, so the memoized
  // layers of the canvas skip redrawing.
  const model = useMemo(
    () => chartModel(chart, hidden, locale, t),
    [chart, hidden, locale, t],
  );
  const [selection, setSelection] = useState<{ key: string; index: number }>(
    () => {
      const index = initialTooltip ? presetIndex(model) : undefined;
      return index === undefined
        ? { key: '', index: -1 }
        : { key: selectionKey(model), index };
    },
  );
  const selected =
    selection.key === selectionKey(model) && model.slots[selection.index]
      ? selection.index
      : undefined;
  const select = (index: number | undefined) =>
    setSelection({ key: selectionKey(model), index: index ?? -1 });
  const gesture = useChartGesture({
    slots: model.slots,
    width: width ?? VIEW.width,
    selected,
    onSelect: select,
  });

  const slot = selected === undefined ? undefined : model.slots[selected];
  const tooltip = slot && tooltipModel(slot.bucket, loadedAt, locale, t);
  const tooltipWidth =
    width === undefined
      ? TOOLTIP_WIDTH
      : Math.min(width - TOOLTIP_INSET, TOOLTIP_WIDTH * fontScale);
  const tooltipLeft =
    slot && width !== undefined
      ? Math.max(
          0,
          Math.min(
            width - tooltipWidth,
            (slot.center * width) / VIEW.width - tooltipWidth / 2,
          ),
        )
      : 0;

  function step(by: 1 | -1) {
    const last = model.slots.length - 1;
    if (last < 0) return;
    if (selected === undefined) select(by === 1 ? 0 : last);
    else select(Math.min(last, Math.max(0, selected + by)));
  }

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
        accessibilityRole="adjustable"
        accessibilityLabel={chartSummary(model, chart.lines, locale, t)}
        accessibilityValue={{
          text: tooltip?.spoken ?? t('chart.a11y.noSelection'),
        }}
        accessibilityHint={t('chart.a11y.hint')}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) =>
          step(event.nativeEvent.actionName === 'increment' ? 1 : -1)
        }
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
        {width ? (
          <View>
            <ChartCanvas model={model} width={width} selected={selected} />
            <View style={StyleSheet.absoluteFill} {...gesture} />
          </View>
        ) : null}
        {tooltip ? (
          <ChartTooltip
            model={tooltip}
            left={tooltipLeft}
            width={tooltipWidth}
          />
        ) : null}
      </View>
      <ChartLegend
        legend={model.legend}
        onToggle={(series: ChartSeries) => {
          // Hiding the bars closes their tooltip, as in the design.
          if (series === 'bars' && !hidden.bars) select(undefined);
          setHidden((current) => ({ ...current, [series]: !current[series] }));
        }}
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
