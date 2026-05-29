function applyTemplate(template, data) {
  return String(template || '').replace(/\{(title|chapter|page|total)\}/g, (_, key) => data[key] ?? '')
}

/**
 * Adds headers and footers to pages.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object} options Header/footer options.
 * @returns {Promise<Uint8Array>} Decorated PDF bytes.
 */
export async function addHeadersFooters(sourcePdfBytes, options = {}) {
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib
  const pdf = await PDFDocument.load(sourcePdfBytes)
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const pages = pdf.getPages()
  pages.forEach((page, index) => {
    const { width, height } = page.getSize()
    const data = { title: options.title || '', chapter: options.chapter || '', page: index + 1, total: pages.length }
    const header = applyTemplate(options.headerTemplate, data)
    const footer = applyTemplate(options.footerTemplate, data)
    if (header) page.drawText(header, { x: 36, y: height - 30, size: 9, font, color: rgb(0.15, 0.15, 0.15) })
    if (footer) page.drawText(footer, { x: 36, y: 24, size: 9, font, color: rgb(0.15, 0.15, 0.15) })
    if (options.rule) page.drawLine({ start: { x: 36, y: height - 36 }, end: { x: width - 36, y: height - 36 }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) })
  })
  return pdf.save()
}
