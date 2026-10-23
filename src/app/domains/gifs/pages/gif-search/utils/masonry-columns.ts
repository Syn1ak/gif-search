/**
 * Greedy masonry: each item goes to the currently shortest column (leftmost on ties).
 * Deterministic, so appending items never moves the ones already placed.
 *
 * @param getRelativeHeight height of an item relative to the column width (height / width)
 */
export function distributeIntoColumns<T>(
  items: readonly T[],
  columnCount: number,
  getRelativeHeight: (item: T) => number,
): T[][] {
  const count = Math.max(1, Math.floor(columnCount));
  const columns = Array.from({ length: count }, () => [] as T[]);
  const heights = new Array<number>(count).fill(0);

  for (const item of items) {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest]!.push(item);
    heights[shortest]! += getRelativeHeight(item);
  }

  return columns;
}
