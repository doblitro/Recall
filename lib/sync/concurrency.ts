// Runs `fn` over `items` with at most `concurrency` in flight at once.
// Unbounded Promise.all over a real mailbox/drive (thousands of items) blows
// past connection limits and the provider's rate limits, surfacing as
// generic "fetch failed" TypeErrors — this keeps sync well-behaved at scale.
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );

  return results;
}
