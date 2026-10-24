// Test helper: answers statistics collection queries like HealthKit, with one
// bucket per local calendar day or hour in the queried range.
export type Interval = { day?: number; hour?: number };

export type FakeBucket = {
  startDate: Date;
  sumQuantity?: { quantity: number };
  // Same value, for discrete types queried with 'mostRecent'.
  mostRecentQuantity?: { quantity: number };
};

export function fakeBuckets(
  start: Date,
  end: Date,
  interval: Interval,
  kcal: (bucketStart: Date) => number | undefined,
): FakeBucket[] {
  const buckets: FakeBucket[] = [];
  // HealthKit aligns buckets to the anchor (local midnight), not to the filter.
  let current = interval.hour
    ? new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        start.getHours(),
      )
    : new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (current < end) {
    const quantity = kcal(current);
    const value = quantity === undefined ? undefined : { quantity };
    buckets.push({
      startDate: current,
      sumQuantity: value,
      mostRecentQuantity: value,
    });
    current = interval.hour
      ? new Date(current.getTime() + 60 * 60 * 1000)
      : new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate() + 1,
        );
  }
  return buckets;
}
