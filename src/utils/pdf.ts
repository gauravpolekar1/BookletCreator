import { PDFDocument, PDFPage, degrees, rgb } from 'pdf-lib';
import { BookletSettings } from '../types/booklet';
import { getPaperDimensions, getSlotsPerSheet, mmToPt } from './layout';
import { buildSheetSpreads } from './imposition';

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface FourUpSide {
  front: [number | null, number | null, number | null, number | null];
  back: [number | null, number | null, number | null, number | null];
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


const drawGuideLines = (sheet: PDFPage, paperW: number, paperH: number, slotsPerSheet: 2 | 4, settings: BookletSettings) => {
  const centerX = paperW / 2;
  const centerY = paperH / 2;
  const mark = 10;

  if (settings.foldGuides) {
    sheet.drawLine({ start: { x: centerX, y: paperH - mark }, end: { x: centerX, y: paperH - 2 }, thickness: 0.7, color: rgb(0.2, 0.4, 0.95), opacity: 0.7 });
    sheet.drawLine({ start: { x: centerX, y: 2 }, end: { x: centerX, y: mark }, thickness: 0.7, color: rgb(0.2, 0.4, 0.95), opacity: 0.7 });
  }

  if (settings.cutGuides && slotsPerSheet === 4) {
    sheet.drawLine({ start: { x: centerX - mark, y: paperH - 2 }, end: { x: centerX + mark, y: paperH - 2 }, thickness: 0.7, color: rgb(0.9, 0.2, 0.2), opacity: 0.7 });
    sheet.drawLine({ start: { x: centerX - mark, y: 2 }, end: { x: centerX + mark, y: 2 }, thickness: 0.7, color: rgb(0.9, 0.2, 0.2), opacity: 0.7 });
    sheet.drawLine({ start: { x: 2, y: centerY - mark }, end: { x: 2, y: centerY + mark }, thickness: 0.7, color: rgb(0.9, 0.2, 0.2), opacity: 0.7 });
    sheet.drawLine({ start: { x: paperW - 2, y: centerY - mark }, end: { x: paperW - 2, y: centerY + mark }, thickness: 0.7, color: rgb(0.9, 0.2, 0.2), opacity: 0.7 });
  }

  if (settings.stitchGuides && slotsPerSheet === 2) {
    [paperH * 0.2, paperH * 0.5, paperH * 0.8].forEach((y) => {
      sheet.drawLine({ start: { x: centerX - 4, y }, end: { x: centerX + 4, y }, thickness: 0.9, color: rgb(0.05, 0.05, 0.05), opacity: 0.7 });
    });
  }
};

export const generateBookletPdf = async (file: File, settings: BookletSettings): Promise<Uint8Array> => {
  const srcBytes = await file.arrayBuffer();
  const src = await PDFDocument.load(srcBytes);
  const out = await PDFDocument.create();

  let workingDoc = src;
  const slotsPerSheet = getSlotsPerSheet(settings.bookletSize);


  const pages = workingDoc.getPages();
  const spreads = buildSheetSpreads(pages.length, settings);
  const [paperW, paperH] = getPaperDimensions(settings.paperSize, settings.outputOrientation);


  const embeddedPages = await out.embedPages(pages);

  const toPageNum = (page: number): number | null => (page >= 1 && page <= pages.length ? page : null);
  const buildFourUpSides = (): FourUpSide[] => {
    const padded = Math.ceil(pages.length / 8) * 8;
    const sides: FourUpSide[] = [];

    for (let offset = 0; offset < padded / 2; offset += 4) {
      const low = 1 + offset;
      const high = padded - offset;

      sides.push({
        front: [toPageNum(high), toPageNum(low), toPageNum(high - 2), toPageNum(low + 2)],
        back: [toPageNum(low + 1), toPageNum(high - 1), toPageNum(low + 3), toPageNum(high - 3)]
      });
    }

    return sides;
  };

  const drawSlot = (sheet: PDFPage, pageNum: number | null, slot: Slot, slotIndex: number) => {
    if (pageNum === null) return;

    // --- ADD THIS BLOCK TO DYNAMICALLY FORCE SLOTS BLANK ---
    const explicitAfter = new Set(
      settings.insertBlankAfterPages
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((n) => Number.isFinite(n) && n > 0)
    );

    const cadenceMatch = settings.insertBlankAfterEvery > 0 && pageNum % settings.insertBlankAfterEvery === 0;
    const explicitMatch = explicitAfter.has(pageNum);

    // If this specific slot index should remain empty, exit here!
    if (cadenceMatch || explicitMatch) {
      return;
    }
    // -----------------------------------------------------

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
      rotate: rotateForBestFit ? degrees(90) : undefined
    });
  };


  for (const spread of spreads) {
    if (slotsPerSheet === 4) continue;
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
      drawGuideLines(backSheet, paperW, paperH, slotsPerSheet, settings);
      if (slotsPerSheet === 2) {
        drawSlot(backSheet, spread.back?.[0].pageNumber ?? null, frontSlots[0], 0);
        drawSlot(backSheet, spread.back?.[1].pageNumber ?? null, frontSlots[1], 1);
      }
    } else if (slotsPerSheet === 2 && spread.back) {
      const backSheet = out.addPage([paperW, paperH]);
      drawGuideLines(backSheet, paperW, paperH, slotsPerSheet, settings);
      drawSlot(backSheet, spread.back[0].pageNumber, frontSlots[0], 0);
      drawSlot(backSheet, spread.back[1].pageNumber, frontSlots[1], 1);
    }
  }

  if (slotsPerSheet === 4) {
    const slots = getSlots(paperW, paperH, slotsPerSheet);
    const sides = buildFourUpSides();

    for (const side of sides) {
      const frontSheet = out.addPage([paperW, paperH]);
      drawGuideLines(frontSheet, paperW, paperH, slotsPerSheet, settings);
      side.front.forEach((pageNum, i) => drawSlot(frontSheet, pageNum, slots[i], i));

      const backSheet = out.addPage([paperW, paperH]);
      drawGuideLines(backSheet, paperW, paperH, slotsPerSheet, settings);
      side.back.forEach((pageNum, i) => drawSlot(backSheet, pageNum, slots[i], i));
    }
  }

  return out.save();
};
