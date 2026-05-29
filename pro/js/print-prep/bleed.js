/**
 * Adds transparent bleed around each page.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object} options Bleed options.
 * @param {number} [options.bleedPt=0] Bleed in PDF points.
 * @returns {Promise<Uint8Array>} PDF with larger pages.
 */
export async function addBleed(sourcePdfBytes, options = {}) {
  const { PDFDocument } = window.PDFLib
  const bleed = Number(options.bleedPt || 0)
  if (!bleed) return new Uint8Array(sourcePdfBytes)
  const source = await PDFDocument.load(sourcePdfBytes)
  const output = await PDFDocument.create()
  const embedded = await output.embedPdf(sourcePdfBytes, source.getPages().map((_, index) => index))
  source.getPages().forEach((page, index) => {
    const { width, height } = page.getSize()
    const next = output.addPage([width + bleed * 2, height + bleed * 2])
    next.drawPage(embedded[index], { x: bleed, y: bleed, width, height })
  })
  output.setTitle('PDF with bleed')
  return output.save()
}
