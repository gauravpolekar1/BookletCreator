/**
 * Creates a simple photo-book PDF from image files.
 * @param {File[]} imageFiles Image files.
 * @param {object} options Layout options.
 * @returns {Promise<Uint8Array>} PDF bytes.
 */
export async function imagesToPdf(imageFiles, options = {}) {
  const { PDFDocument } = window.PDFLib
  const pdf = await PDFDocument.create()
  const pageSize = options.pageSize || [612, 792]
  const perPage = Number(options.perPage || 1)
  for (let index = 0; index < imageFiles.length; index += perPage) {
    const page = pdf.addPage(pageSize)
    const batch = imageFiles.slice(index, index + perPage)
    for (let itemIndex = 0; itemIndex < batch.length; itemIndex += 1) {
      const file = batch[itemIndex]
      const bytes = await file.arrayBuffer()
      const image = file.type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes)
      const columns = perPage === 4 ? 2 : 1
      const rows = perPage === 1 ? 1 : 2
      const cellWidth = pageSize[0] / columns
      const cellHeight = pageSize[1] / rows
      const column = itemIndex % columns
      const row = Math.floor(itemIndex / columns)
      page.drawImage(image, { x: column * cellWidth, y: pageSize[1] - (row + 1) * cellHeight, width: cellWidth, height: cellHeight })
    }
  }
  return pdf.save()
}
