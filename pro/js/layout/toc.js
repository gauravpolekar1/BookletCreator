/**
 * Inserts a simple manually-generated table of contents page.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object[]} entries TOC entries.
 * @returns {Promise<Uint8Array>} PDF with TOC page prepended.
 */
export async function insertToc(sourcePdfBytes, entries = []) {
  const { PDFDocument, StandardFonts } = window.PDFLib
  const source = await PDFDocument.load(sourcePdfBytes)
  const output = await PDFDocument.create()
  const page = output.addPage([612, 792])
  const font = await output.embedFont(StandardFonts.Helvetica)
  page.drawText('Table of Contents', { x: 54, y: 730, size: 20, font })
  let y = 690
  ;(entries.length ? entries : [{ title: 'Document', page: 1 }]).forEach((entry) => {
    page.drawText(`${entry.title || 'Section'}  ${'.'.repeat(48)}  ${entry.page || ''}`, { x: 54, y, size: 11, font })
    y -= 22
  })
  const copied = await output.copyPages(source, source.getPages().map((_, index) => index))
  copied.forEach((copiedPage) => output.addPage(copiedPage))
  return output.save()
}
