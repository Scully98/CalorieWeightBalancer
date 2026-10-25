import { memo } from 'react';
import Svg, { Line, Rect, Text } from 'react-native-svg';

import {
  AXIS_LABEL,
  CROSS_SIZE,
  PLOT,
  VIEW,
  type ChartBar,
  type ChartModel,
} from '../chart-model';
import {
  QualityCross,
  QualityPatternDefs,
  qualityFill,
  usePatternPrefix,
} from '@/components/quality-pattern';
import type { ThemeColors } from '@/theme/colors';
import { useColors } from '@/theme/use-colors';

// Axis labels keep their size at every Dynamic Type step, like the chart.
const AXIS_FONT_SIZE = 10;

function barFill(bar: ChartBar, prefix: string, colors: ThemeColors) {
  if (bar.kind === 'full') return bar.plus ? colors.plus : colors.minus;
  if (bar.kind === 'today') return 'none';
  return qualityFill(
    bar.kind === 'hatch' ? 'restingEstimated' : 'lowFood',
    prefix,
  );
}

type StaticLayerProps = { model: ChartModel; width: number };

// Everything that only changes with the data, the width or the visible
// series; selecting a bar never redraws it.
function StaticLayer({ model, width }: StaticLayerProps) {
  const colors = useColors();
  const prefix = usePatternPrefix();

  return (
    <Svg
      width={width}
      height={(width * VIEW.height) / VIEW.width}
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <QualityPatternDefs idPrefix={prefix} />
      {model.ticks.map((tick) => (
        <Line
          key={tick.y}
          x1={PLOT.left}
          x2={PLOT.right}
          y1={tick.y}
          y2={tick.y}
          stroke={colors.separator}
          strokeWidth={0.75}
        />
      ))}
      {model.bars.map((bar) => (
        <Rect
          key={bar.slot}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          fill={barFill(bar, prefix, colors)}
          stroke={bar.kind === 'full' ? undefined : colors.foreground}
          strokeWidth={1}
          strokeDasharray={bar.kind === 'today' ? '2.5 2' : undefined}
        />
      ))}
      {model.crosses.map((x) => (
        <QualityCross key={x} size={CROSS_SIZE} x={x} y={PLOT.zeroY} />
      ))}
      <Line
        x1={PLOT.left}
        x2={PLOT.right}
        y1={PLOT.zeroY}
        y2={PLOT.zeroY}
        stroke={colors.foreground}
        strokeWidth={1.25}
      />
      {model.ticks.map((tick) => (
        <Text
          key={`left${tick.y}`}
          x={AXIS_LABEL.leftX}
          y={tick.baseline}
          fontSize={AXIS_FONT_SIZE}
          fill={colors.muted}
          textAnchor="end"
        >
          {tick.left}
        </Text>
      ))}
      {model.xLabels.map((label) => (
        <Text
          key={label.x}
          x={label.x}
          y={AXIS_LABEL.xBaseline}
          fontSize={AXIS_FONT_SIZE}
          fill={colors.muted}
          textAnchor="middle"
        >
          {label.text}
        </Text>
      ))}
    </Svg>
  );
}

export const ChartCanvas = memo(StaticLayer);
