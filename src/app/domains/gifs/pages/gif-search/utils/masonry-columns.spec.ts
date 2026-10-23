import { distributeIntoColumns } from './masonry-columns';

type TItem = { id: string; ratio: number };

const item = (id: string, ratio: number): TItem => ({
  id,
  ratio,
});
const ids = (columns: TItem[][]) => columns.map((column) => column.map(({ id }) => id));

describe('distributeIntoColumns', () => {
  it('puts each item into the currently shortest column, leftmost on ties', () => {
    const items = [item('a', 1), item('b', 0.5), item('c', 0.5), item('d', 1)];

    expect(ids(distributeIntoColumns(items, 2, ({ ratio }) => ratio))).toEqual([
      ['a', 'd'],
      ['b', 'c'],
    ]);
  });

  it('keeps already placed items in place when more items are appended', () => {
    const firstPage = [item('a', 1.2), item('b', 0.6), item('c', 0.9), item('d', 0.4)];
    const before = ids(distributeIntoColumns(firstPage, 3, ({ ratio }) => ratio));

    const after = ids(
      distributeIntoColumns([...firstPage, item('e', 1), item('f', 0.3)], 3, ({ ratio }) => ratio),
    );

    after.forEach((column, index) => expect(column.slice(0, before[index]!.length)).toEqual(before[index]));
  });

  it('returns the requested number of columns even when there are fewer items', () => {
    expect(ids(distributeIntoColumns([item('a', 1)], 3, ({ ratio }) => ratio))).toEqual([['a'], [], []]);
  });

  it('treats a column count below one as a single column', () => {
    expect(ids(distributeIntoColumns([item('a', 1), item('b', 1)], 0, ({ ratio }) => ratio))).toEqual([
      ['a', 'b'],
    ]);
  });
});
