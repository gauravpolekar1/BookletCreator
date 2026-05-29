/**
 * Stamps a text watermark on each page.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object} options Watermark options.
 * @returns {Promise<Uint8Array>} Watermarked PDF bytes.
 */
export async function addWatermark(sourcePdfBytes, options = {}) {
  const { PDFDocument, StandardFonts, rgb, degrees } = window.PDFLib
  const pdf = await PDFDocument.load(sourcePdfBytes)
  const font = await pdf.embedFont(StandardFonts.HelveticaBold)
  const text = options.text || 'Draft'
  const size = Number(options.size || 54)
  pdf.getPages().forEach((page) => {
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(text, size)
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size,
      font,
      rotate: degrees(Number(options.rotation || -35)),
      opacity: Number(options.opacity || 0.18),
      color: rgb(0.5, 0.5, 0.5)
    })
  })
  return pdf.save()
}
