const MINUS = '−';

export function formatNumber(
  value: number,
  locale: string,
  fractionDigits = 0,
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

// Explicit sign: "+" for plus, U+2212 for minus, none for zero.
export function formatSigned(
  value: number,
  locale: string,
  fractionDigits = 0,
): string {
  const magnitude = formatNumber(Math.abs(value), locale, fractionDigits);
  if (Number(Math.abs(value).toFixed(fractionDigits)) === 0) return magnitude;
  return `${value < 0 ? MINUS : '+'}${magnitude}`;
}

// Rounded to 10 kcal to avoid false precision, e.g. "≈ 1.800 kcal".
export function formatApproxKcal(value: number, locale: string): string {
  return `≈ ${formatNumber(Math.round(value / 10) * 10, locale)} kcal`;
}

// Accepts "82,4" and "82.4"; returns undefined for anything else.
export function parseLocaleNumber(text: string): number | undefined {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return undefined;
  return Number(normalized);
}
