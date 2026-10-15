// Age in full years on the given day; the birthday itself counts.
export function ageInYears(dateOfBirth: Date, on: Date): number {
  const age = on.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = on.getMonth() - dateOfBirth.getMonth();
  const beforeBirthday =
    monthDiff < 0 || (monthDiff === 0 && on.getDate() < dateOfBirth.getDate());
  return beforeBirthday ? age - 1 : age;
}
