import { BookletSettings, SheetSpread } from '../types/booklet';
import { buildBookletPairs } from './pageOrder';

export const buildSheetSpreads = (pages: number, settings: BookletSettings): SheetSpread[] => {
  const pairs = buildBookletPairs(pages);
  const spreads: SheetSpread[] = [];

  for (let i = 0; i < pairs.length; i += 2) {
    const front: [typeof pairs[number][0], typeof pairs[number][1]] = settings.rtl
      ? [pairs[i][1], pairs[i][0]]
      : [pairs[i][0], pairs[i][1]];

    const backPair = pairs[i + 1] ?? null;
    const back: [typeof pairs[number][0], typeof pairs[number][1]] | null = backPair
      ? settings.rtl
        ? [backPair[1], backPair[0]]
        : [backPair[0], backPair[1]]
      : null;

    spreads.push({ front, back, sheetIndex: i / 2 + 1 });
  }

  return spreads;
};
