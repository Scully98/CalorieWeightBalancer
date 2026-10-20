// Age in full years on the given day; the birthday itself counts.
export function ageInYears(dateOfBirth: Date, on: Date): number {
  const age = on.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = on.getMonth() - dateOfBirth.getMonth();
  const beforeBirthday =
    monthDiff < 0 || (monthDiff === 0 && on.getDate() < dateOfBirth.getDate());
  return beforeBirthday ? age - 1 : age;
}

// Age entered on `recordedOn` (YYYY-MM-DD), advanced by the full years since.
export function currentAge(
  ageYears: number,
  recordedOn: string | undefined,
  now: Date,
): number {
  const match = recordedOn?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return ageYears;
  const recorded = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return ageYears + Math.max(0, ageInYears(recorded, now));
}
