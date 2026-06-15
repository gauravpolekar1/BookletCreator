import { PDFDocument } from 'pdf-lib';
import { OutputOrientation } from '../types/booklet';
import { getPaperDimensions, mmToPt } from './layout';

export interface SplitResult {
  name: string;
  bytes: Uint8Array;
  pages: number[];
}

export interface ResizeOptions {
  size: 'A5' | 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid' | 'Custom';
  orientation: OutputOrientation;
  mode: 'preserve' | 'stretch' | 'fitWidth' | 'fitHeight';
  customWidthMm: number;
  customHeightMm: number;
  marginMm: number;
  centerHorizontal: boolean;
  centerVertical: boolean;
}

const extraPageSizes: Record<string, [number, number]> = {
  A3: [841.89, 1190.55],
  Legal: [612, 1008],
  Tabloid: [792, 1224]
};

const pageSize = (options: ResizeOptions): [number, number] => {
  const base = options.size === 'Custom'
    ? [mmToPt(options.customWidthMm), mmToPt(options.customHeightMm)] as [number, number]
    : options.size in extraPageSizes
      ? extraPageSizes[options.size]
      : getPaperDimensions(options.size as 'A4' | 'A5' | 'Letter', 'portrait');
  const [short, long] = base[0] <= base[1] ? base : [base[1], base[0]];
  return options.orientation === 'portrait' ? [short, long] : [long, short];
};

export const parsePageSelection = (input: string, pageCount: number): number[] => {
  const pages: number[] = [];
  const seen = new Set<number>();

  input.split(',').map((part) => part.trim()).filter(Boolean).forEach((part) => {
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    const single = part.match(/^\d+$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      const step = start <= end ? 1 : -1;
      for (let page = start; step > 0 ? page <= end : page >= end; page += step) {
        if (page >= 1 && page <= pageCount && !seen.has(page)) {
          seen.add(page);
          pages.push(page);
        }
      }
    } else if (single) {
      const page = Number(part);
      if (page >= 1 && page <= pageCount && !seen.has(page)) {
        seen.add(page);
        pages.push(page);
      }
    }
  });

  return pages;
};

const copyPages = async (source: PDFDocument, pageNumbers: number[]): Promise<Uint8Array> => {
  const out = await PDFDocument.create();
  const copied = await out.copyPages(source, pageNumbers.map((page) => page - 1));
  copied.forEach((page) => out.addPage(page));
  return out.save();
};

export const splitByRanges = async (file: File, rangesInput: string): Promise<SplitResult[]> => {
  const source = await PDFDocument.load(await file.arrayBuffer());
  const pageCount = source.getPageCount();
  const ranges = rangesInput.split(/\n|;/).map((range) => range.trim()).filter(Boolean);
  const results: SplitResult[] = [];

  for (const [index, range] of ranges.entries()) {
    const pages = parsePageSelection(range, pageCount);
    if (pages.length > 0) {
      results.push({ name: `${file.name.replace(/\.pdf$/i, '')}-range-${index + 1}.pdf`, bytes: await copyPages(source, pages), pages });
    }
  }
  return results;
};

export const splitEveryNPages = async (file: File, n: number): Promise<SplitResult[]> => {
  const source = await PDFDocument.load(await file.arrayBuffer());
  const pageCount = source.getPageCount();
  const size = Math.max(1, Math.floor(n));
  const results: SplitResult[] = [];
  for (let start = 1; start <= pageCount; start += size) {
    const pages = Array.from({ length: Math.min(size, pageCount - start + 1) }, (_, i) => start + i);
    results.push({ name: `${file.name.replace(/\.pdf$/i, '')}-pages-${start}-${pages[pages.length - 1]}.pdf`, bytes: await copyPages(source, pages), pages });
  }
  return results;
};

export const extractPages = async (file: File, selection: string): Promise<SplitResult[]> => {
  const source = await PDFDocument.load(await file.arrayBuffer());
  const pages = parsePageSelection(selection, source.getPageCount());
  return pages.length ? [{ name: `${file.name.replace(/\.pdf$/i, '')}-extracted.pdf`, bytes: await copyPages(source, pages), pages }] : [];
};

export const mergePdfs = async (files: File[]): Promise<Uint8Array> => {
  const out = await PDFDocument.create();
  for (const file of files) {
    const source = await PDFDocument.load(await file.arrayBuffer());
    const copied = await out.copyPages(source, source.getPageIndices());
    copied.forEach((page) => out.addPage(page));
  }
  return out.save();
};

export const resizePdf = async (file: File, options: ResizeOptions): Promise<Uint8Array> => {
  const source = await PDFDocument.load(await file.arrayBuffer());
  const out = await PDFDocument.create();
  const pages = source.getPages();
  const embedded = await out.embedPages(pages);
  const [targetW, targetH] = pageSize(options);
  const margin = Math.max(0, mmToPt(options.marginMm));
  const boxW = Math.max(1, targetW - margin * 2);
  const boxH = Math.max(1, targetH - margin * 2);

  embedded.forEach((page) => {
    const outPage = out.addPage([targetW, targetH]);
    let drawW = boxW;
    let drawH = boxH;
    if (options.mode !== 'stretch') {
      const scale = options.mode === 'fitWidth'
        ? boxW / page.width
        : options.mode === 'fitHeight'
          ? boxH / page.height
          : Math.min(boxW / page.width, boxH / page.height);
      drawW = page.width * scale;
      drawH = page.height * scale;
    }
    const x = options.centerHorizontal ? margin + (boxW - drawW) / 2 : margin;
    const y = options.centerVertical ? margin + (boxH - drawH) / 2 : margin;
    outPage.drawPage(page, { x, y, width: drawW, height: drawH });
  });

  return out.save();
};

export const downloadBytes = (bytes: Uint8Array, filename: string) => {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
