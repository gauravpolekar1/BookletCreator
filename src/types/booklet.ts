export type PaperSize = 'A4' | 'A5' | 'A6' | 'Letter';
export type BookletSize = 'A5' | 'A6';
export type PrintMode = 'duplex' | 'single';
export type DuplexFlip = 'long' | 'short';
export type OutputOrientation = 'portrait' | 'landscape';

export interface MarginSettings {
  inner: number;
  outer: number;
  top: number;
  bottom: number;
}

export interface BookletSettings {
  paperSize: PaperSize;
  bookletSize: BookletSize;
  printMode: PrintMode;
  duplexFlip: DuplexFlip;
  margins: MarginSettings;
  gutter: number;
  outputOrientation: OutputOrientation;
  signatures: 1 | 4 | 8 | 16 | 32;
  rtl: boolean;
  saddleStitch: boolean;
  coverMode: 'auto' | 'separate';
  cropMarks: boolean;
  bleedMarks: boolean;
  printMarks: boolean;
  foldGuides: boolean;
  cutGuides: boolean;
  stitchGuides: boolean;
}

export interface ImposedCell {
  pageNumber: number | null;
  isBlank: boolean;
}

export interface SheetSpread {
  front: [ImposedCell, ImposedCell];
  back: [ImposedCell, ImposedCell] | null;
  sheetIndex: number;
}

export type ToolId =
  | 'booklet'
  | 'nup'
  | 'signatures'
  | 'zine'
  | 'preview'
  | 'duplex'
  | 'arrange'
  | 'calibration';
