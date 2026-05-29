/**
 * Applies a visual inner-margin shift by redrawing pages with odd/even offsets.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object} options Gutter options.
 * @returns {Promise<Uint8Array>} Adjusted PDF bytes.
 */
export async function applyGutter(sourcePdfBytes, options = {}) {
  const { PDFDocument } = window.PDFLib
  const amount = Number(options.amountPt || 0)
  if (!amount) return new Uint8Array(sourcePdfBytes)
  const source = await PDFDocument.load(sourcePdfBytes)
  const output = await PDFDocument.create()
  const embedded = await output.embedPdf(sourcePdfBytes, source.getPages().map((_, index) => index))
  source.getPages().forEach((page, index) => {
    const { width, height } = page.getSize()
    const next = output.addPage([width, height])
    const odd = (index + 1) % 2 === 1
    next.drawPage(embedded[index], { x: odd ? -amount : amount, y: 0, width, height })
  })
  return output.save()
}
