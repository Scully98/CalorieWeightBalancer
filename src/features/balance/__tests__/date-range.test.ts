import { createInstance } from 'i18next';

import {
  calendarMonth,
  clampSelection,
  monthTitle,
  pickDay,
  pickerBounds,
  selectionSummary,
  spokenDate,
  type DateRangeSelection,
} from '../date-range';
import { de } from '@/i18n/locales/de';

const i18n = createInstance();
i18n.init({
  resources: { de: { translation: de } },
  lng: 'de',
  initAsync: false,
  interpolation: { escapeValue: false },
});
const t = i18n.t;

const NOW = new Date(2026, 9, 24, 14, 32);
const BOUNDS = { min: '2026-06-26', max: '2026-10-23' };

const selection = (
  from: string,
  to: string,
  editing: 'from' | 'to' = 'from',
): DateRangeSelection => ({ from, to, editing });

describe('pickerBounds', () => {
  it('runs from the first data point to yesterday', () => {
    expect(pickerBounds(new Date(2026, 5, 26, 8), NOW, false)).toEqual(BOUNDS);
  });

  it('ends today when today counts', () => {
    expect(pickerBounds(new Date(2026, 5, 26), NOW, true).max).toBe(
      '2026-10-24',
    );
  });

  it('goes back 365 days without a first data point', () => {
    expect(pickerBounds(undefined, NOW, false)).toEqual({
      min: '2025-10-23',
      max: '2026-10-23',
    });
  });
});

describe('pickDay', () => {
  it('sets the start with „Von“ active and moves on to „Bis“', () => {
    expect(
      pickDay(selection('2026-10-01', '2026-10-20'), '2026-10-06', BOUNDS),
    ).toEqual(selection('2026-10-06', '2026-10-20', 'to'));
  });

  it('pushes the end along when the start passes it', () => {
    expect(
      pickDay(selection('2026-10-01', '2026-10-05'), '2026-10-12', BOUNDS),
    ).toEqual(selection('2026-10-12', '2026-10-12', 'to'));
  });

  it('sets the end with „Bis“ active', () => {
    expect(
      pickDay(
        selection('2026-10-06', '2026-10-06', 'to'),
        '2026-10-20',
        BOUNDS,
      ),
    ).toEqual(selection('2026-10-06', '2026-10-20', 'to'));
  });

  it('moves the start for a day before it with „Bis“ active', () => {
    expect(
      pickDay(
        selection('2026-10-06', '2026-10-20', 'to'),
        '2026-10-02',
        BOUNDS,
      ),
    ).toEqual(selection('2026-10-02', '2026-10-20', 'to'));
  });

  it('ignores days outside the bounds', () => {
    const current = selection('2026-10-06', '2026-10-20', 'to');
    expect(pickDay(current, '2026-10-24', BOUNDS)).toBe(current);
    expect(pickDay(current, '2026-06-25', BOUNDS)).toBe(current);
  });
});

describe('clampSelection', () => {
  it('keeps the selection inside the bounds', () => {
    expect(
      clampSelection(selection('2026-06-01', '2026-10-24'), BOUNDS),
    ).toEqual(selection('2026-06-26', '2026-10-23'));
  });
});

describe('calendarMonth', () => {
  const october = calendarMonth(
    2026,
    9,
    BOUNDS,
    selection('2026-10-06', '2026-10-20', 'to'),
    NOW,
  );
  const cell = (day: number) => october.cells[day - 1];

  it('starts on Monday: 1 October 2026 is a Thursday', () => {
    expect(october.blanks).toBe(3);
    expect(october.cells).toHaveLength(31);
  });

  it('marks start, end, the band between and today', () => {
    expect(cell(6)).toMatchObject({ isStart: true, inRange: false });
    expect(cell(7)).toMatchObject({ inRange: true });
    expect(cell(19)).toMatchObject({ inRange: true });
    expect(cell(20)).toMatchObject({ isEnd: true, inRange: false });
    expect(cell(21).inRange).toBe(false);
    expect(cell(24)).toMatchObject({ isToday: true, selectable: false });
    expect(cell(23).selectable).toBe(true);
  });

  it('allows paging only inside the bounds', () => {
    expect(october).toMatchObject({ canGoBack: true, canGoForward: false });
    const june = calendarMonth(
      2026,
      5,
      BOUNDS,
      selection('2026-06-26', '2026-06-30'),
      NOW,
    );
    expect(june).toMatchObject({ canGoBack: false, canGoForward: true });
    expect(june.cells[24].selectable).toBe(false);
    expect(june.cells[25].selectable).toBe(true);
  });
});

describe('selectionSummary', () => {
  it('counts the days and names the data start', () => {
    expect(
      selectionSummary(
        selection('2026-10-06', '2026-10-20'),
        BOUNDS,
        false,
        NOW,
        'de-DE',
        t,
      ),
    ).toEqual({
      days: '15 Tage',
      caption: 'Daten ab 26.06.2026 · heute zählt nicht',
    });
  });

  it('says „bis gestern“ or „bis heute“ at the end', () => {
    const until = (to: string, includeToday: boolean) =>
      selectionSummary(
        selection('2026-10-20', to),
        BOUNDS,
        includeToday,
        NOW,
        'de-DE',
        t,
      );
    expect(until('2026-10-23', false).days).toBe('4 Tage · bis gestern');
    expect(until('2026-10-24', true)).toEqual({
      days: '5 Tage · bis heute',
      caption: 'Daten ab 26.06.2026 · heute zählt mit',
    });
    expect(until('2026-10-20', false).days).toBe('1 Tag');
  });
});

describe('monthTitle and spokenDate', () => {
  it('spells month and day in full', () => {
    expect(monthTitle(2026, 9, t)).toBe('Oktober 2026');
    expect(spokenDate('2026-10-01', t)).toBe('Donnerstag, 1. Oktober 2026');
  });
});
