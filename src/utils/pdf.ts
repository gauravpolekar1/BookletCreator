import { PDFDocument, PDFPage } from 'pdf-lib';
import { BookletSettings } from '../types/booklet';
import { getPaperDimensions, getSlotsPerSheet, mmToPt } from './layout';
import { buildSheetSpreads } from './imposition';

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const loadPdf = async (file: File): Promise<PDFDocument> => {
  const bytes = await file.arrayBuffer();
  return PDFDocument.load(bytes);
};

const getSlots = (paperW: number, paperH: number, slotsPerSheet: 2 | 4): Slot[] => {
  if (slotsPerSheet === 2) {
    const slotW = paperW / 2;
    return [
      { x: 0, y: 0, w: slotW, h: paperH },
      { x: slotW, y: 0, w: slotW, h: paperH }
    ];
  }

  const slotW = paperW / 2;
  const slotH = paperH / 2;
  return [
    { x: 0, y: slotH, w: slotW, h: slotH },
    { x: slotW, y: slotH, w: slotW, h: slotH },
    { x: 0, y: 0, w: slotW, h: slotH },
    { x: slotW, y: 0, w: slotW, h: slotH }
  ];
};

const getSlotPadding = (slotIndex: number, slotsPerSheet: 2 | 4, settings: BookletSettings) => {
  const isLeftColumn = slotsPerSheet === 2 ? slotIndex === 0 : slotIndex % 2 === 0;
  const gutterHalf = mmToPt(settings.gutter) / 2;

  const left = mmToPt(isLeftColumn ? settings.margins.outer : settings.margins.inner) + (isLeftColumn ? 0 : gutterHalf);
  const right = mmToPt(isLeftColumn ? settings.margins.inner : settings.margins.outer) + (isLeftColumn ? gutterHalf : 0);

  return {
    left,
    right,
    top: mmToPt(settings.margins.top),
    bottom: mmToPt(settings.margins.bottom)
  };
};

export const generateBookletPdf = async (file: File, settings: BookletSettings): Promise<Uint8Array> => {
  const srcBytes = await file.arrayBuffer();
  const src = await PDFDocument.load(srcBytes);
  const out = await PDFDocument.create();

  const pages = src.getPages();
  const spreads = buildSheetSpreads(pages.length, settings);
  const [paperW, paperH] = getPaperDimensions(settings.paperSize);
  const slotsPerSheet = getSlotsPerSheet(settings.bookletSize);

  const embeddedPages = await out.embedPages(pages);

  const drawSlot = (sheet: PDFPage, pageNum: number | null, slot: Slot, slotIndex: number) => {
    if (pageNum === null) return;

    const pageIndex = pageNum - 1;
    const embed = embeddedPages[pageIndex];

    const padding = getSlotPadding(slotIndex, slotsPerSheet, settings);
    const contentW = Math.max(0, slot.w - padding.left - padding.right);
    const contentH = Math.max(0, slot.h - padding.top - padding.bottom);

    const normalScale = Math.min(contentW / embed.width, contentH / embed.height);
    const rotatedScale = Math.min(contentW / embed.height, contentH / embed.width);
    const rotateForBestFit = rotatedScale > normalScale;

    const drawW = (rotateForBestFit ? embed.height : embed.width) * (rotateForBestFit ? rotatedScale : normalScale);
    const drawH = (rotateForBestFit ? embed.width : embed.height) * (rotateForBestFit ? rotatedScale : normalScale);

    const x = slot.x + padding.left + (contentW - drawW) / 2;
    const y = slot.y + padding.bottom + (contentH - drawH) / 2;

    sheet.drawPage(embed, {
      x,
      y,
      width: drawW,
      height: drawH,
      rotate: rotateForBestFit ? { type: 'degrees', angle: 90 } : undefined
    });
  };

  for (const spread of spreads) {
    const frontSheet = out.addPage([paperW, paperH]);
    const frontSlots = getSlots(paperW, paperH, slotsPerSheet);
    const frontPages = [spread.front[0].pageNumber, spread.front[1].pageNumber, spread.back?.[0].pageNumber ?? null, spread.back?.[1].pageNumber ?? null];

    if (slotsPerSheet === 2) {
      drawSlot(frontSheet, frontPages[0], frontSlots[0], 0);
      drawSlot(frontSheet, frontPages[1], frontSlots[1], 1);
    } else {
      frontPages.forEach((pageNum, i) => drawSlot(frontSheet, pageNum, frontSlots[i], i));
    }

    if (settings.printMode === 'single') {
      const backSheet = out.addPage([paperW, paperH]);
      if (slotsPerSheet === 2) {
        drawSlot(backSheet, spread.back?.[0].pageNumber ?? null, frontSlots[0], 0);
        drawSlot(backSheet, spread.back?.[1].pageNumber ?? null, frontSlots[1], 1);
      }
    } else if (slotsPerSheet === 2 && spread.back) {
      const backSheet = out.addPage([paperW, paperH]);
      drawSlot(backSheet, spread.back[0].pageNumber, frontSlots[0], 0);
      drawSlot(backSheet, spread.back[1].pageNumber, frontSlots[1], 1);
    }
  }

  return out.save();
};
