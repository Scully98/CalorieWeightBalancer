import {
  formatApproxKcal,
  formatKcal,
  formatKg,
  formatSigned,
  formatSignedKg,
  parseLocaleNumber,
} from '../format';

describe('formatKcal', () => {
  it('groups by language with explicit sign', () => {
    expect(formatKcal(7000, 'de-DE')).toBe('+7.000');
    expect(formatKcal(7000, 'en-US')).toBe('+7,000');
  });

  it('uses U+2212 for negative values and no sign for zero', () => {
    expect(formatKcal(-6200, 'en-US')).toBe('−6,200');
    expect(formatKcal(0, 'de-DE')).toBe('0');
  });
});

describe('formatKg', () => {
  it('shows one decimal without sign', () => {
    expect(formatKg(0.9, 'de-DE')).toBe('0,9');
    expect(formatKg(0.9, 'en-US')).toBe('0.9');
    expect(formatKg(0.04, 'de-DE')).toBe('0,0');
  });
});

describe('formatSignedKg', () => {
  it('shows one decimal with explicit sign', () => {
    expect(formatSignedKg(0.9, 'de-DE')).toBe('+0,9');
    expect(formatSignedKg(-0.8, 'en-US')).toBe('−0.8');
    expect(formatSignedKg(-0.04, 'de-DE')).toBe('0,0');
  });
});

describe('formatApproxKcal', () => {
  it('rounds to 10 kcal with German grouping', () => {
    expect(formatApproxKcal(1796.5, 'de-DE')).toBe('≈ 1.800 kcal');
  });

  it('uses English grouping', () => {
    expect(formatApproxKcal(1796.5, 'en-US')).toBe('≈ 1,800 kcal');
  });
});

describe('formatSigned', () => {
  it('uses U+2212 for negative values', () => {
    expect(formatSigned(-0.8, 'de-DE', 1)).toBe('−0,8');
    expect(formatSigned(-6200, 'en-US')).toBe('−6,200');
  });

  it('uses + for positive values', () => {
    expect(formatSigned(800, 'de-DE')).toBe('+800');
    expect(formatSigned(1200, 'de-DE')).toBe('+1.200');
  });

  it('shows no sign for zero after rounding', () => {
    expect(formatSigned(-0.04, 'de-DE', 1)).toBe('0,0');
  });
});

describe('parseLocaleNumber', () => {
  it('accepts comma and dot', () => {
    expect(parseLocaleNumber('82,4')).toBe(82.4);
    expect(parseLocaleNumber(' 82.4 ')).toBe(82.4);
    expect(parseLocaleNumber('182')).toBe(182);
  });

  it('rejects invalid input', () => {
    expect(parseLocaleNumber('abc')).toBeUndefined();
    expect(parseLocaleNumber('')).toBeUndefined();
    expect(parseLocaleNumber('8,2,4')).toBeUndefined();
    expect(parseLocaleNumber('-5')).toBeUndefined();
  });
});
