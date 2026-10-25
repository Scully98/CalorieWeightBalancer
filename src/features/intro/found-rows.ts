import type { SourceRevision } from '@kingstinct/react-native-healthkit';
import type { TFunction } from 'i18next';

import type { Status } from '@/components/status-row';
import { MAX_COUNTED_SAMPLES, type HealthScan } from '@/health/scan';

export type FoundRowKey = 'food' | 'active' | 'weight' | 'resting' | 'bodyFat';

export type FoundRow = {
  key: FoundRowKey;
  status: Status;
  label: string;
  detail: string;
  accessibilityLabel: string;
};

// Apple's own sources carry the personal device name ("Julius' iPhone"), so
// they are shown by device type instead. Apps such as Yazio or Withings run on
// the iPhone too and keep their name; only the bundle tells them apart.
export function sourceLabel(revision: SourceRevision | undefined): string {
  const bundle = revision?.source.bundleIdentifier.toLowerCase() ?? '';
  const productType = revision?.productType ?? '';
  // Device sources are com.apple.health.<id>; manual entries in the Health
  // app (com.apple.Health) keep the name „Health“.
  if (bundle.startsWith('com.apple.health.')) {
    if (productType.startsWith('iPhone')) return 'iPhone';
    if (productType.startsWith('Watch')) return 'Apple Watch';
  }
  return revision?.source.name ?? '';
}

export function formatShortDate(date: Date, now: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date);
}

export function buildFoundRows(
  scan: HealthScan,
  now: Date,
  t: TFunction,
  locale: string,
): FoundRow[] {
  const date = (value: Date | undefined) =>
    value ? formatShortDate(value, now, locale) : '';

  function energyDetail(row: HealthScan['active']): string {
    const source = sourceLabel(row.source);
    if (row.daysWithData >= 7) return t('intro.found.detail.daily', { source });
    if (row.daysWithData > 0) {
      return t('intro.found.detail.daysOf7', {
        source,
        count: row.daysWithData,
      });
    }
    return t('intro.found.detail.lastOn', { source, date: date(row.lastDate) });
  }

  function measurementDetail(row: HealthScan['weight']): string {
    const source = sourceLabel(row.source);
    if (row.count >= MAX_COUNTED_SAMPLES) {
      return t('intro.found.detail.measurementsMany', {
        source,
        count: MAX_COUNTED_SAMPLES,
      });
    }
    return t('intro.found.detail.measurements', { source, count: row.count });
  }

  const rows: {
    key: FoundRowKey;
    found: boolean;
    detail: () => string;
    missing: string;
  }[] = [
    {
      key: 'food',
      found: scan.food.hasData,
      detail: () =>
        t('intro.found.detail.since', {
          source: sourceLabel(scan.food.source),
          date: date(scan.food.firstDate ?? scan.food.lastDate),
        }),
      missing: t('intro.found.detail.missing'),
    },
    {
      key: 'active',
      found: scan.active.hasData,
      detail: () => energyDetail(scan.active),
      missing: t('intro.found.detail.missing'),
    },
    {
      key: 'weight',
      found: scan.weight.hasData,
      detail: () => measurementDetail(scan.weight),
      missing: t('intro.found.detail.missing'),
    },
    {
      key: 'resting',
      found: scan.resting.hasData,
      detail: () => energyDetail(scan.resting),
      missing: t('intro.found.detail.missingEstimate'),
    },
    {
      key: 'bodyFat',
      found: scan.bodyFat.hasData,
      detail: () => measurementDetail(scan.bodyFat),
      missing: t('intro.found.detail.optional'),
    },
  ];

  return rows.map(({ key, found, detail, missing }) => {
    const label = t(`intro.found.rows.${key}`);
    const text = found ? detail() : missing;
    const status = found ? 'found' : 'missing';
    return {
      key,
      status,
      label,
      detail: text,
      accessibilityLabel: [label, t(`intro.found.status.${status}`), text].join(
        ', ',
      ),
    };
  });
}
