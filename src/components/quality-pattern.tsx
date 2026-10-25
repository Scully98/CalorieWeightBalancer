import { useId } from 'react';
import Svg, { Defs, G, Line, Path, Pattern, Rect } from 'react-native-svg';

import type { DayFlag } from '@/core/day-balance';
import { useColors } from '@/theme/use-colors';

// Data quality without color: hatched = resting energy estimated, stripes =
// unusually little food, cross = no bar at all (no food, no resting energy).
export type QualityMark = 'hatch' | 'stripes' | 'cross';

export const QUALITY_MARK: Record<DayFlag, QualityMark> = {
  restingEstimated: 'hatch',
  lowFood: 'stripes',
  noFood: 'cross',
  noResting: 'cross',
};

// useId gives „:r1:“; colons break `url(#…)` references.
export function usePatternPrefix(): string {
  return `q${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

// Hatch lines 3.6 apart, measured across them as in the design; along the
// axes that is a tile of 3.6 × √2.
const HATCH_TILE = 3.6 * Math.SQRT2;
// One diagonal through the tile plus the two corner pieces of its
// neighbours, so tiles join seamlessly. react-native-svg clips a rotated
// pattern (`patternTransform`) per tile into triangles, so no rotation.
const HATCH_PATH = (() => {
  const s = HATCH_TILE;
  const q = s / 4;
  return `M0,${s} L${s},0 M${-q},${q} L${q},${-q} M${s - q},${s + q} L${s + q},${s - q}`;
})();

// The two fills as SVG patterns from the tokens. Put them into any <Svg>,
// e.g. the chart (P8), and fill shapes with `qualityFill`.
export function QualityPatternDefs({ idPrefix }: { idPrefix: string }) {
  const colors = useColors();
  return (
    <Defs>
      <Pattern
        id={`${idPrefix}-hatch`}
        patternUnits="userSpaceOnUse"
        width={HATCH_TILE}
        height={HATCH_TILE}
      >
        <Rect width={HATCH_TILE} height={HATCH_TILE} fill={colors.background} />
        <Path d={HATCH_PATH} stroke={colors.foreground} strokeWidth={1.5} />
      </Pattern>
      <Pattern
        id={`${idPrefix}-stripes`}
        patternUnits="userSpaceOnUse"
        width={4}
        height={3.4}
      >
        <Rect width={4} height={3.4} fill={colors.background} />
        <Rect width={4} height={1.3} fill={colors.foreground} />
      </Pattern>
    </Defs>
  );
}

// Fill for a bar of a day or week with this flag; undefined for the cross,
// which has no bar.
export function qualityFill(
  flag: DayFlag,
  idPrefix: string,
): string | undefined {
  const mark = QUALITY_MARK[flag];
  return mark === 'cross' ? undefined : `url(#${idPrefix}-${mark})`;
}

type CrossProps = {
  size: number;
  strokeWidth?: number;
  // Centre, inside a larger <Svg> such as the chart's zero line.
  x?: number;
  y?: number;
};

// „✕“ drawn as two lines, so it needs no font and scales with the chart.
export function QualityCross({
  size,
  strokeWidth = 1.6,
  x = size / 2,
  y = size / 2,
}: CrossProps) {
  const colors = useColors();
  const half = size / 2 - strokeWidth / 2;
  return (
    <G
      stroke={colors.foreground}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <Line x1={x - half} y1={y - half} x2={x + half} y2={y + half} />
      <Line x1={x + half} y1={y - half} x2={x - half} y2={y + half} />
    </G>
  );
}

// Legend square next to a text: pattern with a 1-pt border, or the cross.
// Fixed size; decoration only, the text next to it says the same.
export function QualitySwatch({
  flag,
  size = 11,
}: {
  flag: DayFlag;
  size?: number;
}) {
  const colors = useColors();
  const prefix = usePatternPrefix();
  const fill = qualityFill(flag, prefix);
  return (
    <Svg
      width={size}
      height={size}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {fill ? (
        <>
          <QualityPatternDefs idPrefix={prefix} />
          <Rect
            x={0.5}
            y={0.5}
            width={size - 1}
            height={size - 1}
            fill={fill}
            stroke={colors.foreground}
            strokeWidth={1}
          />
        </>
      ) : (
        <QualityCross size={size} strokeWidth={size > 11 ? 1.8 : 1.6} />
      )}
    </Svg>
  );
}
