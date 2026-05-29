/**
 * Creates a tri-fold brochure layout from up to six PDF pages.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object} options Tri-fold options.
 * @param {'c-fold'|'z-fold'} [options.fold='c-fold'] Fold style.
 * @returns {Promise<Uint8Array>} Tri-fold brochure PDF bytes.
 */
export async function impose(sourcePdfBytes, options = {}) {
  const { PDFDocument } = window.PDFLib
  const source = await PDFDocument.load(sourcePdfBytes)
  const output = await PDFDocument.create()
  const pages = source.getPages()
  if (!pages.length) return output.save()
  const size = pages[0].getSize()
  const narrowBy = 2 * 72 / 25.4
  const panelWidths = options.fold === 'z-fold'
    ? [size.width - narrowBy, size.width, size.width]
    : [size.width, size.width, size.width - narrowBy]
  const sheetWidth = panelWidths.reduce((sum, width) => sum + width, 0)
  const embedded = await output.embedPdf(sourcePdfBytes, pages.slice(0, 6).map((_, index) => index))
  const orders = options.fold === 'z-fold'
    ? [[5, 0, 1], [2, 3, 4]]
    : [[5, 0, 1], [2, 3, 4]]
  for (const order of orders) {
    const sheet = output.addPage([sheetWidth, size.height])
    let x = 0
    order.forEach((pageIndex, panelIndex) => {
      if (embedded[pageIndex]) {
        sheet.drawPage(embedded[pageIndex], { x, y: 0, width: panelWidths[panelIndex], height: size.height })
      }
      x += panelWidths[panelIndex]
    })
  }
  output.setTitle(`${options.fold || 'c-fold'} tri-fold brochure`)
  return output.save()
}
