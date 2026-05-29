/**
 * Creates a two-panel brochure sheet from the first four PDF pages.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object} options Bi-fold options.
 * @returns {Promise<Uint8Array>} Brochure PDF bytes.
 */
export async function impose(sourcePdfBytes, options = {}) {
  const { PDFDocument } = window.PDFLib
  const source = await PDFDocument.load(sourcePdfBytes)
  const output = await PDFDocument.create()
  const pages = source.getPages()
  if (!pages.length) return output.save()
  const size = pages[0].getSize()
  const panelWidth = size.width
  const panelHeight = size.height
  const embedded = await output.embedPdf(sourcePdfBytes, pages.slice(0, 4).map((_, index) => index))
  const front = output.addPage([panelWidth * 2, panelHeight])
  const back = output.addPage([panelWidth * 2, panelHeight])
  const draw = (sheet, embeddedIndex, x) => {
    if (!embedded[embeddedIndex]) return
    sheet.drawPage(embedded[embeddedIndex], { x, y: 0, width: panelWidth, height: panelHeight })
  }
  draw(front, 3, 0)
  draw(front, 0, panelWidth)
  draw(back, 1, 0)
  draw(back, 2, panelWidth)
  if (options.separateSides) {
    output.setSubject('Front and back are separate pages')
  }
  output.setTitle('Bi-fold brochure')
  return output.save()
}
