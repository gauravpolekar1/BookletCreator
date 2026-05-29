function roman(value) {
  const pairs = [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]
  let number = value
  let output = ''
  pairs.forEach(([letter, amount]) => {
    while (number >= amount) {
      output += letter
      number -= amount
    }
  })
  return output.toLowerCase()
}

function pageText(page, total, style) {
  if (style === '1/N') return `${page}/${total}`
  if (style === 'Page 1 of N') return `Page ${page} of ${total}`
  if (style === 'roman') return roman(page)
  return String(page)
}

function anchorPosition(anchor, width, height, textWidth, margin) {
  const positions = {
    'top-left': [margin, height - margin],
    'top-center': [(width - textWidth) / 2, height - margin],
    'top-right': [width - margin - textWidth, height - margin],
    'bottom-left': [margin, margin],
    'bottom-center': [(width - textWidth) / 2, margin],
    'bottom-right': [width - margin - textWidth, margin]
  }
  return positions[anchor] || positions['bottom-center']
}

/**
 * Adds page numbers to a PDF.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object} options Page number options.
 * @returns {Promise<Uint8Array>} Numbered PDF bytes.
 */
export async function addPageNumbers(sourcePdfBytes, options = {}) {
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib
  const pdf = await PDFDocument.load(sourcePdfBytes)
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const pages = pdf.getPages()
  const start = Number(options.startPage || 1)
  const size = Number(options.size || 10)
  const margin = Number(options.marginPt || 36)
  pages.forEach((page, index) => {
    const logicalPage = index + 1
    if (logicalPage < start) return
    const text = pageText(logicalPage - start + 1, pages.length - start + 1, options.style || '1')
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(text, size)
    const mirroredAnchor = options.mirror && logicalPage % 2 === 0 && options.anchor === 'bottom-right' ? 'bottom-left' : options.anchor
    const [x, y] = anchorPosition(mirroredAnchor || 'bottom-center', width, height, textWidth, margin)
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) })
  })
  return pdf.save()
}
