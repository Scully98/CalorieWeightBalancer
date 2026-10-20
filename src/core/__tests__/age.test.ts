import { ageInYears, currentAge } from '../age';

describe('ageInYears', () => {
  const born = new Date(1992, 5, 15);

  it('is one year less on the day before the birthday', () => {
    expect(ageInYears(born, new Date(2026, 5, 14))).toBe(33);
  });

  it('counts the birthday itself', () => {
    expect(ageInYears(born, new Date(2026, 5, 15))).toBe(34);
  });

  it('treats 29 February as reached on 1 March in a non-leap year', () => {
    const leapBorn = new Date(2000, 1, 29);
    expect(ageInYears(leapBorn, new Date(2025, 1, 28))).toBe(24);
    expect(ageInYears(leapBorn, new Date(2025, 2, 1))).toBe(25);
  });
});

describe('currentAge', () => {
  it('adds the full years since the age was entered', () => {
    expect(currentAge(34, '2026-10-15', new Date(2027, 9, 14))).toBe(34);
    expect(currentAge(34, '2026-10-15', new Date(2027, 9, 15))).toBe(35);
    expect(currentAge(34, '2026-10-15', new Date(2029, 11, 1))).toBe(37);
  });

  it('keeps the age without a valid date', () => {
    expect(currentAge(34, undefined, new Date(2030, 0, 1))).toBe(34);
    expect(currentAge(34, 'gestern', new Date(2030, 0, 1))).toBe(34);
  });
});
