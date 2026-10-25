import { createInstance } from 'i18next';

import { chartModel, PLOT, slotAt, VIEW } from '../chart-model';
import { chartBuckets, type ChartBucket } from '@/core/chart';
import { addDays } from '@/core/dates';
import type { DayBalance } from '@/core/day-balance';
import { toDateKey } from '@/core/day-record';
import type { ChartLines, LinePoint } from '@/core/lines';
import { de } from '@/i18n/locales/de';
import { en } from '@/i18n/locales/en';

const i18n = createInstance();
i18n.init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: 'de',
  initAsync: false,
  interpolation: { escapeValue: false },
});
const t = i18n.getFixedT('de');
const tEn = i18n.getFixedT('en');

// Friday 23 Oct 2026, the last period day.
const LAST = new Date(2026, 9, 23);

function day(
  index: number,
  count: number,
  overrides: Partial<DayBalance> = {},
) {
  return {
    date: toDateKey(addDays(LAST, index - count + 1)),
    food: 2900,
    resting: 1800,
    restingSource: 'measured',
    active: 800,
    activeMissing: false,
    kcal: 300,
    maintenance: false,
    flags: [],
    ...overrides,
  } satisfies DayBalance;
}

function period(
  count: number,
  overrides: Record<number, Partial<DayBalance>> = {},
) {
  return Array.from({ length: count }, (_, index) =>
    day(index, count, overrides[index]),
  );
}

function lines(
  count: number,
  point: (index: number) => Partial<LinePoint> = () => ({}),
): ChartLines {
  const points = Array.from({ length: count }, (_, index) => ({
    date: toDateKey(addDays(LAST, index - count + 1)),
    theoreticalFat: 0,
    ...point(index),
  }));
  return {
    points,
    hasWeight: points.some((p) => p.weightTrend !== undefined),
    hasFat: points.some((p) => p.fatTrend !== undefined),
  };
}

function model(
  buckets: ChartBucket[],
  chartLines: ChartLines,
  hidden = {},
  locale = 'de-DE',
) {
  return chartModel({ buckets, lines: chartLines }, hidden, locale, t);
}

describe('chartModel slots and bars', () => {
  it('gives 30 day slots plus today across the plot', () => {
    const today = day(0, 1, { date: '2026-10-24', kcal: 40, running: true });
    const m = model(chartBuckets(period(30), { today }), lines(30));
    expect(m.daily).toBe(true);
    expect(m.slots).toHaveLength(31);
    expect(m.slots[0].left).toBe(PLOT.left);
    expect(m.slots[30].left + m.slots[30].width).toBeCloseTo(PLOT.right);
    expect(m.bars.at(-1)).toMatchObject({ kind: 'today', plus: true });
    expect(m.title).toBe('Bilanz pro Tag');
    expect(m.subtitle).toBe('Balken kcal · Linien kg Veränderung seit 24. Sep');
  });

  it('gives 13 or 14 week slots for 90 days, hatched with incomplete days', () => {
    const m = model(
      chartBuckets(period(90, { 3: { flags: ['restingEstimated'] } })),
      lines(90),
    );
    expect(m.daily).toBe(false);
    expect([13, 14]).toContain(m.slots.length);
    expect(m.bars[0].kind).toBe('hatch');
    expect(m.bars.slice(1).every((bar) => bar.kind === 'full')).toBe(true);
    expect(m.title).toBe('Bilanz pro Woche');
    expect(m.legend.hints).toEqual(['weekIncomplete']);
  });

  it('fills day bars by the worst flag', () => {
    const m = model(
      chartBuckets(
        period(4, {
          0: { flags: ['restingEstimated'] },
          1: { flags: ['lowFood'], kcal: -1500 },
          2: { flags: ['noFood'], food: undefined, kcal: 0, maintenance: true },
          3: { flags: ['noFood'], food: undefined, kcal: -2600 },
        }),
      ),
      lines(4),
    );
    expect(m.bars.map((bar) => bar.kind)).toEqual(['hatch', 'stripes', 'full']);
    expect(m.bars[1]).toMatchObject({ plus: false, y: PLOT.zeroY });
    // A zero day has only the cross, a no-food day with a value both.
    expect(m.crosses).toEqual([m.slots[2].center, m.slots[3].center]);
  });

  it('draws no bar but a cross for a day without resting energy', () => {
    const m = model(
      chartBuckets(
        period(2, {
          1: {
            flags: ['noResting'],
            resting: undefined,
            restingSource: 'missing',
            kcal: undefined,
          },
        }),
      ),
      lines(2),
    );
    expect(m.bars).toHaveLength(1);
    expect(m.crosses).toEqual([m.slots[1].center]);
  });

  it('scales by 500 kcal for days and 250 for weeks', () => {
    const days = model(
      chartBuckets(period(7, { 2: { kcal: 1234 } })),
      lines(7),
    );
    expect(days.ticks.map((tick) => tick.left)).toEqual([
      '+1.500',
      '+750',
      '0',
      '−750',
      '−1.500',
    ]);
    const weeks = model(chartBuckets(period(60)), lines(60));
    expect(weeks.ticks[0].left).toBe('+500');
  });

  it('draws bars by their value with a minimum height', () => {
    const m = model(
      chartBuckets(period(3, { 0: { kcal: 1000 }, 1: { kcal: 2 } })),
      lines(3),
    );
    // Scale 1.000: full half height.
    expect(m.bars[0].height).toBeCloseTo(PLOT.half);
    expect(m.bars[0].y).toBeCloseTo(PLOT.zeroY - PLOT.half);
    expect(m.bars[1].height).toBe(1.5);
  });

  it('points a negative today down, at least 14 high', () => {
    const today = day(0, 1, { date: '2026-10-24', kcal: -60, running: true });
    const m = model(chartBuckets(period(7), { today }), lines(7));
    expect(m.bars.at(-1)).toMatchObject({
      kind: 'today',
      plus: false,
      y: PLOT.zeroY,
      height: 14,
    });
    expect(m.legend.hints).toContain('todayExcluded');
  });

  it('dashes a counted today and says so in the legend', () => {
    const m = model(
      chartBuckets(period(7, { 6: { running: true, kcal: 40 } })),
      lines(7),
    );
    expect(m.bars.at(-1)?.kind).toBe('today');
    expect(m.legend.hints).toContain('todayIncluded');
    expect(m.xLabels.at(-1)?.text).toBe('heute');
  });

  it('hides bars and crosses with the „Bilanz“ chip', () => {
    const m = model(
      chartBuckets(
        period(3, { 1: { flags: ['noFood'], kcal: 0, maintenance: true } }),
      ),
      lines(3),
      { bars: true },
    );
    expect(m.bars).toEqual([]);
    expect(m.crosses).toEqual([]);
    expect(m.ticks[0].left).toBe('+500');
    expect(m.legend.chips[0]).toEqual({ series: 'bars', visible: false });
  });
});

describe('chartModel labels', () => {
  it('labels up to 10 days by weekday', () => {
    const m = model(chartBuckets(period(7)), lines(7));
    expect(m.xLabels.map((label) => label.text)).toEqual([
      'Sa',
      'So',
      'Mo',
      'Di',
      'Mi',
      'Do',
      'Fr',
    ]);
  });

  it('labels every 7th day and today for 30 days', () => {
    const today = day(0, 1, { date: '2026-10-24', kcal: 40, running: true });
    const m = model(chartBuckets(period(30), { today }), lines(30));
    expect(m.xLabels.map((label) => label.text)).toEqual([
      '24.9.',
      '1.10.',
      '8.10.',
      '15.10.',
      'heute',
    ]);
    const en = chartModel(
      { buckets: chartBuckets(period(30)), lines: lines(30) },
      {},
      'en-US',
      tEn,
    );
    expect(en.xLabels[1].text).toBe('10/1');
  });

  it('labels weeks, every second one beyond 9', () => {
    const m = model(chartBuckets(period(90)), lines(90));
    const texts = m.xLabels.map((label) => label.text);
    expect(texts.at(-1)).toBe('KW 43');
    expect(texts.length).toBe(Math.ceil(m.slots.length / 2));
    const few = model(chartBuckets(period(40)), lines(40));
    expect(few.xLabels).toHaveLength(few.slots.length);
  });
});

describe('chartModel lines', () => {
  const withBody = lines(30, (index) => ({
    weightTrend: index * 0.03,
    weightPoint: index % 3 === 0 ? index * 0.03 + 0.4 : undefined,
    fatTrend: index * 0.01,
    theoreticalFat: index * 0.02,
  }));

  it('draws three lines in design order and hollow points', () => {
    const m = model(chartBuckets(period(30)), withBody);
    expect(m.lines.map((line) => line.series)).toEqual([
      'theoretical',
      'fat',
      'weight',
    ]);
    expect(m.points).toHaveLength(10);
    expect(m.showRight).toBe(true);
    expect(m.legend.chips.map((chip) => chip.series)).toEqual([
      'bars',
      'weight',
      'fat',
      'theoretical',
    ]);
    expect(m.legend.hints[0]).toBe('trend');
  });

  it('scales the kg axis over visible lines including points', () => {
    // Max point 0,87 + 0,4 → scale 2 (not 1).
    expect(model(chartBuckets(period(30)), withBody).ticks[0].right).toBe(
      '+2,0',
    );
    // Without weight only fat and theoretical (max 0,58) → 1.
    const m = model(chartBuckets(period(30)), withBody, { weight: true });
    expect(m.ticks[0].right).toBe('+1,0');
    expect(m.points).toEqual([]);
    expect(m.ticks[1].right).toBe('+0,5');
  });

  it('uses 0,5 kg for small changes', () => {
    const m = model(
      chartBuckets(period(7)),
      lines(7, () => ({ theoreticalFat: 0.1 })),
    );
    expect(m.ticks.map((tick) => tick.right)).toEqual([
      '+0,5',
      '+0,3',
      '0',
      '−0,3',
      '−0,5',
    ]);
  });

  it('hides the right axis without a visible line', () => {
    const m = model(chartBuckets(period(7)), lines(7), { theoretical: true });
    expect(m.showRight).toBe(false);
    expect(m.lines).toEqual([]);
  });

  it('starts the weight line at its first value and shows chips with data only', () => {
    const late = lines(10, (index) =>
      index < 4 ? {} : { weightTrend: (index - 4) * 0.1 },
    );
    const m = model(chartBuckets(period(10)), late);
    const weight = m.lines.find((line) => line.series === 'weight');
    expect(weight?.segments).toHaveLength(1);
    expect(weight?.segments[0].split(' ')).toHaveLength(6);
    expect(m.legend.chips.map((chip) => chip.series)).toEqual([
      'bars',
      'weight',
      'theoretical',
    ]);
    expect(
      model(chartBuckets(period(10)), lines(10)).legend.hints,
    ).not.toContain('trend');
  });

  it('places line points per day under week bars', () => {
    const m = model(chartBuckets(period(90)), withBody90());
    const weight = m.lines.find((line) => line.series === 'weight');
    expect(weight?.segments[0].split(' ')).toHaveLength(90);
    const firstX = Number(weight?.segments[0].split(' ')[0].split(',')[0]);
    expect(firstX).toBeCloseTo(PLOT.left + PLOT.width / 90 / 2);
  });
});

function withBody90() {
  return lines(90, (index) => ({ weightTrend: index * 0.01 }));
}

describe('slotAt', () => {
  const slots = model(chartBuckets(period(10)), lines(10)).slots;

  it('finds the slot under x and nothing outside the plot', () => {
    expect(slotAt(slots, slots[3].center)).toBe(3);
    expect(slotAt(slots, PLOT.left - 1)).toBeUndefined();
    expect(slotAt(slots, VIEW.width)).toBeUndefined();
  });

  it('clamps to the first and last slot while dragging', () => {
    expect(slotAt(slots, 0, true)).toBe(0);
    expect(slotAt(slots, VIEW.width, true)).toBe(9);
    expect(slotAt([], 100, true)).toBeUndefined();
  });
});

describe('chartModel without buckets', () => {
  it('stays empty', () => {
    const m = model([], lines(0));
    expect(m.slots).toEqual([]);
    expect(m.subtitle).toBe('');
  });
});
