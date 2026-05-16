import { PDFDocument, degrees } from 'pdf-lib';
import { BookletSettings } from '../types/booklet';
import { getPaperDimensions, mmToPt } from './layout';
import { buildSheetSpreads } from './imposition';

export const loadPdf = async (file: File): Promise<PDFDocument> => {
  const bytes = await file.arrayBuffer();
  return PDFDocument.load(bytes);
};

export const generateBookletPdf = async (file: File, settings: BookletSettings): Promise<Uint8Array> => {
  const srcBytes = await file.arrayBuffer();
  const src = await PDFDocument.load(srcBytes);
  const out = await PDFDocument.create();

  const pages = src.getPages();
  const spreads = buildSheetSpreads(pages.length, settings);
  const [paperW, paperH] = getPaperDimensions(settings.paperSize);
  const slotW = paperW / 2;
  const slotH = paperH;

  const map = await out.embedPages(pages);

  const drawSlot = (sheet: import('pdf-lib').PDFPage, pageNum: number | null, x: number) => {
    if (pageNum === null) return;
    const embed = map[pageNum - 1];
    const { width, height } = embed;
    const rot = embed.rotation.angle;
    const adjustedWidth = rot === 90 || rot === 270 ? height : width;
    const adjustedHeight = rot === 90 || rot === 270 ? width : height;

    const contentW = slotW - mmToPt(settings.margins.inner + settings.margins.outer + settings.gutter);
    const contentH = slotH - mmToPt(settings.margins.top + settings.margins.bottom);

    const scale = Math.min(contentW / adjustedWidth, contentH / adjustedHeight);

    const drawW = adjustedWidth * scale;
    const drawH = adjustedHeight * scale;
    const offsetX = x + (slotW - drawW) / 2;
    const offsetY = (slotH - drawH) / 2;

    sheet.drawPage(embed, {
      x: offsetX,
      y: offsetY,
      xScale: scale,
      yScale: scale,
      rotate: degrees(rot)
    });
  };

  for (const spread of spreads) {
    const frontSheet = out.addPage([paperW, paperH]);
    drawSlot(frontSheet, spread.front[0].pageNumber, 0);
    drawSlot(frontSheet, spread.front[1].pageNumber, slotW);

    if (settings.printMode === 'single' || spread.back) {
      const backSheet = out.addPage([paperW, paperH]);
      if (spread.back) {
        drawSlot(backSheet, spread.back[0].pageNumber, 0);
        drawSlot(backSheet, spread.back[1].pageNumber, slotW);
      }
    }
  }

  return out.save();
};
