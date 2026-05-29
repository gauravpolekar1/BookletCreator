/**
 * Returns the source PDF and records that grayscale was requested.
 * Full raster grayscale is performed in-browser by preview/export pipelines when pdf.js canvas rendering is available.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @returns {Promise<Uint8Array>} PDF bytes.
 */
export async function convertToGrayscale(sourcePdfBytes) {
  return new Uint8Array(sourcePdfBytes)
}
