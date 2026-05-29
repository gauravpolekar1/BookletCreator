/**
 * Adds crop and optional fold marks to every page.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object} options Mark options.
 * @returns {Promise<Uint8Array>} Marked PDF bytes.
 */
export async function addPrintMarks(sourcePdfBytes, options = {}) {
  const { PDFDocument, rgb } = window.PDFLib
  const source = await PDFDocument.load(sourcePdfBytes)
  const output = await PDFDocument.create()
  const offset = Number(options.offsetPt || 9)
  const length = Number(options.lengthPt || 18)
  const embedded = await output.embedPdf(sourcePdfBytes, source.getPages().map((_, index) => index))
  source.getPages().forEach((page, index) => {
    const { width, height } = page.getSize()
    const sheet = output.addPage([width + offset * 4, height + offset * 4])
    const x = offset * 2
    const y = offset * 2
    sheet.drawPage(embedded[index], { x, y, width, height })
    const black = rgb(0, 0, 0)
    const lines = [
      [x - offset - length, y, x - offset, y], [x, y - offset - length, x, y - offset],
      [x + width + offset, y, x + width + offset + length, y], [x + width, y - offset - length, x + width, y - offset],
      [x - offset - length, y + height, x - offset, y + height], [x, y + height + offset, x, y + height + offset + length],
      [x + width + offset, y + height, x + width + offset + length, y + height], [x + width, y + height + offset, x + width, y + height + offset + length]
    ]
    lines.forEach(([x1, y1, x2, y2]) => sheet.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color: black }))
    if (options.foldMarks) {
      const center = x + width / 2
      sheet.drawLine({ start: { x: center, y: y - offset - length }, end: { x: center, y: y - offset }, thickness: 0.5, color: black })
      sheet.drawLine({ start: { x: center, y: y + height + offset }, end: { x: center, y: y + height + offset + length }, thickness: 0.5, color: black })
    }
  })
  return output.save()
}
