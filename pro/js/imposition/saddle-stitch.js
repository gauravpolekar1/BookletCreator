/**
 * Creates a 2-up saddle-stitch booklet PDF. Pages are padded to a multiple of 4.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object} options Imposition options.
 * @param {[number, number]} [options.sheetSize] Optional output sheet size in PDF points.
 * @returns {Promise<Uint8Array>} Imposed PDF bytes.
 */
export async function impose(sourcePdfBytes, options = {}) {
  const { PDFDocument } = window.PDFLib
  const source = await PDFDocument.load(sourcePdfBytes)
  const output = await PDFDocument.create()
  const sourcePages = source.getPages()
  if (!sourcePages.length) return output.save()

  const firstSize = sourcePages[0].getSize()
  const pageWidth = options.pageWidth || firstSize.width
  const pageHeight = options.pageHeight || firstSize.height
  const sheetWidth = options.sheetSize?.[0] || pageWidth * 2
  const sheetHeight = options.sheetSize?.[1] || pageHeight
  const totalPages = Math.ceil(sourcePages.length / 4) * 4
  const embedded = await output.embedPdf(sourcePdfBytes, sourcePages.map((_, index) => index))

  const drawPage = (sheet, sourceIndex, x, y) => {
    if (sourceIndex < 0 || sourceIndex >= embedded.length) return
    sheet.drawPage(embedded[sourceIndex], { x, y, width: pageWidth, height: pageHeight })
  }

  for (let sheetIndex = 0; sheetIndex < totalPages / 4; sheetIndex += 1) {
    const front = output.addPage([sheetWidth, sheetHeight])
    const back = output.addPage([sheetWidth, sheetHeight])
    const outsideLeft = totalPages - (sheetIndex * 2) - 1
    const outsideRight = sheetIndex * 2
    const insideLeft = sheetIndex * 2 + 1
    const insideRight = totalPages - (sheetIndex * 2) - 2

    drawPage(front, outsideLeft, 0, 0)
    drawPage(front, outsideRight, pageWidth, 0)
    drawPage(back, insideLeft, 0, 0)
    drawPage(back, insideRight, pageWidth, 0)
  }

  output.setTitle('Saddle stitch booklet')
  output.setSubject(`Booklet order padded to ${totalPages} pages`)
  return output.save()
}
