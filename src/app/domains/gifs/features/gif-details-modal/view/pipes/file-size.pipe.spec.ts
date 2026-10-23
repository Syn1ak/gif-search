import { FileSizePipe } from './file-size.pipe';

describe('FileSizePipe', () => {
  const pipe = new FileSizePipe();

  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1023, '1023 B'],
    [1024, '1 KB'],
    [1536, '1.5 KB'],
    [1_048_576, '1 MB'],
    [2_411_724, '2.3 MB'],
    [5_368_709_120, '5120 MB'],
  ])('formats %d bytes as %s', (bytes, expected) => {
    expect(pipe.transform(bytes)).toBe(expected);
  });

  it.each([null, -1, Number.NaN])('returns null for an unknown size (%s)', (bytes) => {
    expect(pipe.transform(bytes)).toBeNull();
  });
});
