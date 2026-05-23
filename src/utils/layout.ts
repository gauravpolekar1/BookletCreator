import { BookletSize, OutputOrientation, PaperSize } from '../types/booklet';

const MM_TO_PT = 2.8346456693;

export const mmToPt = (mm: number): number => mm * MM_TO_PT;

const paperDimensionsMm: Record<PaperSize, [number, number]> = {
  A4: [210, 297],
  A5: [148, 210],
  A6: [105, 148],
  Letter: [215.9, 279.4]
};

export const getPaperDimensions = (paper: PaperSize, orientation: OutputOrientation = 'portrait'): [number, number] => {
  const [wMm, hMm] = paperDimensionsMm[paper];
  const dimensions: [number, number] = [mmToPt(wMm), mmToPt(hMm)];
  return orientation === 'portrait' ? dimensions : [dimensions[1], dimensions[0]];
};

export const getTargetPageDimensions = (paper: PaperSize, booklet: BookletSize): [number, number] => {
  const [w, h] = getPaperDimensions(paper, 'portrait');
  if (booklet === 'A5') return [w / 2, h];
  return [w / 2, h / 2];
};

export const getSlotsPerSheet = (booklet: BookletSize): 2 | 4 => (booklet === 'A5' ? 2 : 4);
