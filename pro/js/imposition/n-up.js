/**
 * Places source pages into a generic N-up grid.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object} options N-up options.
 * @param {number} [options.columns=2] Grid columns.
 * @param {number} [options.rows=2] Grid rows.
 * @param {boolean} [options.cutAndStack=false] Use cut-and-stack order.
 * @returns {Promise<Uint8Array>} Imposed PDF bytes.
 */
export async function impose(sourcePdfBytes, options = {}) {
  const { PDFDocument } = window.PDFLib
  const source = await PDFDocument.load(sourcePdfBytes)
  const output = await PDFDocument.create()
  const pages = source.getPages()
  if (!pages.length) return output.save()
  const columns = Number(options.columns || 2)
  const rows = Number(options.rows || 2)
  const perSheet = columns * rows
  const firstSize = pages[0].getSize()
  const sheetWidth = options.sheetSize?.[0] || firstSize.width * columns
  const sheetHeight = options.sheetSize?.[1] || firstSize.height * rows
  const cellWidth = sheetWidth / columns
  const cellHeight = sheetHeight / rows
  const embedded = await output.embedPdf(sourcePdfBytes, pages.map((_, index) => index))
  const totalSheets = Math.ceil(pages.length / perSheet)

  for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex += 1) {
    const sheet = output.addPage([sheetWidth, sheetHeight])
    for (let cell = 0; cell < perSheet; cell += 1) {
      const orderedIndex = options.cutAndStack
        ? cell * totalSheets + sheetIndex
        : sheetIndex * perSheet + cell
      if (orderedIndex >= embedded.length) continue
      const column = cell % columns
      const row = Math.floor(cell / columns)
      sheet.drawPage(embedded[orderedIndex], {
        x: column * cellWidth,
        y: sheetHeight - ((row + 1) * cellHeight),
        width: cellWidth,
        height: cellHeight
      })
    }
  }
  output.setTitle(`${columns}x${rows} N-up PDF`)
  return output.save()
}
