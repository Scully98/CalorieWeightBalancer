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

// Explicit sign: "+" for plus, U+2212 for minus, "±" for a value that rounds
// to zero at the shown digits, so the sign is always there ("±0 kcal").
export function formatSigned(
  value: number,
  locale: string,
  fractionDigits = 0,
): string {
  const magnitude = formatNumber(Math.abs(value), locale, fractionDigits);
  if (Number(Math.abs(value).toFixed(fractionDigits)) === 0)
    return `±${magnitude}`;
  return `${value < 0 ? MINUS : '+'}${magnitude}`;
}

// Whole kcal with explicit sign, e.g. "+7.000". Callers round if needed.
export function formatKcal(value: number, locale: string): string {
  return formatSigned(value, locale);
}

// Mass is kept in kg everywhere; only these functions know the unit, so a
// later switch to lb stays in one place.
export function formatKg(value: number, locale: string): string {
  return formatNumber(value, locale, 1);
}

// With explicit sign, e.g. "+0,9" for a fat equivalent.
export function formatSignedKg(value: number, locale: string): string {
  return formatSigned(value, locale, 1);
}

// Energy is shown rounded to 10 kcal to avoid false precision.
export function roundKcal(value: number): number {
  return Math.round(value / 10) * 10;
}

// Ends of a tolerance range are shown rounded to 50 kcal; the tolerance is
// coarse anyway.
export function roundRangeKcal(value: number): number {
  return Math.round(value / 50) * 50;
}

// Rounded to 10 kcal, e.g. "≈ 1.800 kcal".
export function formatApproxKcal(value: number, locale: string): string {
  return `≈ ${formatNumber(roundKcal(value), locale)} kcal`;
}

// Accepts "82,4" and "82.4"; returns undefined for anything else.
export function parseLocaleNumber(text: string): number | undefined {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return undefined;
  return Number(normalized);
}
