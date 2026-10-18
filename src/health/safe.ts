// Denied read access looks like missing data, so every query falls back
// instead of failing the whole screen.
export async function safe<T>(
  query: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await query();
  } catch {
    return fallback;
  }
}
