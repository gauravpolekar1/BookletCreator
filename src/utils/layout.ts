import { BookletSize, PaperSize } from '../types/booklet';

const MM_TO_PT = 2.8346456693;

export const mmToPt = (mm: number): number => mm * MM_TO_PT;

export const getPaperDimensions = (paper: PaperSize): [number, number] => {
  if (paper === 'A4') return [mmToPt(210), mmToPt(297)];
  return [612, 792];
};

export const getTargetPageDimensions = (paper: PaperSize, booklet: BookletSize): [number, number] => {
  const [w, h] = getPaperDimensions(paper);
  if (booklet === 'A5') return [w / 2, h];
  return [w / 2, h / 2];
};
