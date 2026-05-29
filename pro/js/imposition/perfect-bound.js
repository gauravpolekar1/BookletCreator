import { impose as imposeSaddle } from './saddle-stitch.js'

/**
 * Imposes source pages as saddle-stitched signatures for perfect binding.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object} options Perfect-bound options.
 * @param {number} [options.signatureSize=16] Pages per signature before padding.
 * @returns {Promise<Uint8Array>} Concatenated signature PDF bytes.
 */
export async function impose(sourcePdfBytes, options = {}) {
  const { PDFDocument } = window.PDFLib
  const signatureSize = Number(options.signatureSize || 16)
  const source = await PDFDocument.load(sourcePdfBytes)
  const output = await PDFDocument.create()
  const pages = source.getPages()
  for (let start = 0; start < pages.length; start += signatureSize) {
    const temp = await PDFDocument.create()
    const indexes = pages.slice(start, start + signatureSize).map((_, index) => start + index)
    const copied = await temp.copyPages(source, indexes)
    copied.forEach((page) => temp.addPage(page))
    const imposedBytes = await imposeSaddle(await temp.save(), options)
    const imposed = await PDFDocument.load(imposedBytes)
    const imposedPages = await output.copyPages(imposed, imposed.getPages().map((_, index) => index))
    imposedPages.forEach((page) => output.addPage(page))
  }
  output.setTitle('Perfect-bound signatures')
  output.setSubject(`Signature size: ${signatureSize} pages`)
  return output.save()
}
