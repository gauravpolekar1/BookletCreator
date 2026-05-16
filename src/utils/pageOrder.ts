import { ImposedCell } from '../types/booklet';

export const buildBookletPairs = (pageCount: number): [ImposedCell, ImposedCell][] => {
  const padded = Math.ceil(pageCount / 4) * 4;
  const pairs: [ImposedCell, ImposedCell][] = [];
  let low = 1;
  let high = padded;

  while (low < high) {
    pairs.push([toCell(high, pageCount), toCell(low, pageCount)]);
    low += 1;
    high -= 1;
    pairs.push([toCell(low, pageCount), toCell(high, pageCount)]);
    low += 1;
    high -= 1;
  }

  return pairs;
};

const toCell = (page: number, pageCount: number): ImposedCell => ({
  pageNumber: page <= pageCount ? page : null,
  isBlank: page > pageCount
});
