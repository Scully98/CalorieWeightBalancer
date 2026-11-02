import type { TFunction } from 'i18next';

import { numericDate } from './period-subtitle';
import type { EmptyInfo } from './use-balance';
import { toDateKey } from '@/core/day-record';

// noData: Health has no food at all · period: food exists, not in this
// period · firstDay: the first entries are from today.
export type EmptyKind = 'noData' | 'period' | 'firstDay';

export type EmptyModel = {
  kind: EmptyKind;
  title: string;
  body: string;
  // Explanation and permissions button; not on the first day, data arrives.
  showPermissions: boolean;
};

export function emptyKind(info: EmptyInfo | undefined, now: Date): EmptyKind {
  const first = info?.firstDataDate;
  if (!first) return 'noData';
  return toDateKey(first) === toDateKey(now) ? 'firstDay' : 'period';
}

export function emptyModel(
  info: EmptyInfo | undefined,
  now: Date,
  locale: string,
  t: TFunction,
): EmptyModel {
  const kind = emptyKind(info, now);
  const date = (value: Date) => numericDate(toDateKey(value), locale);
  switch (kind) {
    case 'noData':
      return {
        kind,
        title: t('empty.noData.title'),
        body: t('empty.noData.body'),
        showPermissions: true,
      };
    case 'firstDay':
      return {
        kind,
        title: t('empty.firstDay.title'),
        body: t('empty.firstDay.body'),
        showPermissions: false,
      };
    case 'period': {
      const before = info?.foodBefore;
      return {
        kind,
        title: t('empty.period.title'),
        body: before
          ? t('empty.period.lastBefore', { date: date(before) })
          : t('empty.period.first', {
              date: date(info?.firstDataDate as Date),
            }),
        showPermissions: true,
      };
    }
  }
}
