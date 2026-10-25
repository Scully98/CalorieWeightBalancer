import { memo } from 'react';
import Svg, { Circle, G, Line, Polyline, Rect, Text } from 'react-native-svg';

import {
  AXIS_LABEL,
  CROSS_SIZE,
  GUIDE,
  PLOT,
  VIEW,
  type ChartBar,
  type ChartModel,
  type LineSeries,
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

// Three line styles that stay apart in grayscale: solid and thick, dashed,
// dotted (design „Muster & Linien“).
export const LINE_STROKE: Record<
  LineSeries,
  {
    strokeWidth: number;
    strokeDasharray?: string;
    strokeLinecap?: 'round';
    strokeLinejoin?: 'round';
  }
> = {
  weight: { strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' },
  fat: { strokeWidth: 1.8, strokeDasharray: '6 3.5', strokeLinejoin: 'round' },
  theoretical: {
    strokeWidth: 2.2,
    strokeDasharray: '0.1 4.2',
    strokeLinecap: 'round',
  },
};

const POINT = { r: 2.5, strokeWidth: 1.25 };

function barFill(bar: ChartBar, prefix: string, colors: ThemeColors) {
  if (bar.kind === 'full') return bar.plus ? colors.plus : colors.minus;
  if (bar.kind === 'today') return 'none';
  return qualityFill(
    bar.kind === 'hatch' ? 'restingEstimated' : 'lowFood',
    prefix,
  );
}

// Opacity of the other bars while one is selected (design).
const DIMMED = 0.3;

type LayerProps = { model: ChartModel };

// Grid lines; only change with the data.
const Grid = memo(function Grid({ model }: LayerProps) {
  const colors = useColors();
  return (
    <G>
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
    </G>
  );
});

// Bars and crosses; the only layer besides the guide that a selection
// redraws.
const Bars = memo(function Bars({
  model,
  prefix,
  selected,
}: LayerProps & { prefix: string; selected?: number }) {
  const colors = useColors();
  return (
    <G>
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
          opacity={selected === undefined || selected === bar.slot ? 1 : DIMMED}
        />
      ))}
      {model.crosses.map((x) => (
        <QualityCross key={x} size={CROSS_SIZE} x={x} y={PLOT.zeroY} />
      ))}
    </G>
  );
});

// Zero line, lines, points and axis labels above the bars.
const Foreground = memo(function Foreground({ model }: LayerProps) {
  const colors = useColors();
  return (
    <G>
      <Line
        x1={PLOT.left}
        x2={PLOT.right}
        y1={PLOT.zeroY}
        y2={PLOT.zeroY}
        stroke={colors.foreground}
        strokeWidth={1.25}
      />
      {model.lines.flatMap((line) =>
        line.segments.map((points, index) => (
          <Polyline
            key={`${line.series}${index}`}
            points={points}
            fill="none"
            stroke={colors.foreground}
            {...LINE_STROKE[line.series]}
          />
        )),
      )}
      {model.points.map((point) => (
        <Circle
          key={point.x}
          cx={point.x}
          cy={point.y}
          r={POINT.r}
          fill={colors.background}
          stroke={colors.foreground}
          strokeWidth={POINT.strokeWidth}
        />
      ))}
      {model.showRight
        ? model.ticks.map((tick) => (
            <Text
              key={`right${tick.y}`}
              x={AXIS_LABEL.rightX}
              y={tick.baseline}
              fontSize={AXIS_FONT_SIZE}
              fill={colors.muted}
            >
              {tick.right}
            </Text>
          ))
        : null}
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
    </G>
  );
});

type ChartCanvasProps = { model: ChartModel; width: number; selected?: number };

// The chart in the design's viewBox, scaled to `width`. Selecting a bar
// redraws only the bars and the guide line.
export function ChartCanvas({ model, width, selected }: ChartCanvasProps) {
  const colors = useColors();
  const prefix = usePatternPrefix();
  const guide = selected === undefined ? undefined : model.slots[selected];

  return (
    <Svg
      width={width}
      height={(width * VIEW.height) / VIEW.width}
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <QualityPatternDefs idPrefix={prefix} />
      <Grid model={model} />
      <Bars model={model} prefix={prefix} selected={selected} />
      <Foreground model={model} />
      {guide ? (
        <Line
          x1={guide.center}
          x2={guide.center}
          y1={GUIDE.top}
          y2={GUIDE.bottom}
          stroke={colors.foreground}
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      ) : null}
    </Svg>
  );
}
