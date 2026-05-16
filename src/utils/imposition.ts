import { BookletSettings, SheetSpread } from '../types/booklet';
import { buildBookletPairs } from './pageOrder';

export const buildSheetSpreads = (pages: number, settings: BookletSettings): SheetSpread[] => {
  const pairs = buildBookletPairs(pages);
  const spreads: SheetSpread[] = [];

  for (let i = 0; i < pairs.length; i += 2) {
    const front = settings.rtl ? [pairs[i][1], pairs[i][0]] as const : pairs[i];
    const backPair = pairs[i + 1] ?? null;
    const back = backPair ? (settings.rtl ? [backPair[1], backPair[0]] as const : backPair) : null;
    spreads.push({ front, back, sheetIndex: i / 2 + 1 });
  }

  return spreads;
};
