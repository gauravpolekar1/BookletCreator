/**
 * Future imposition entry point. Implementation is intentionally deferred until Phase 2.
 * @param {ArrayBuffer|Uint8Array} sourcePdfBytes Source PDF bytes.
 * @param {object} options Imposition options.
 * @returns {Promise<Uint8Array>} Imposed PDF bytes.
 */
export async function impose(sourcePdfBytes, options = {}) {
  void sourcePdfBytes
  void options
  throw new Error('This imposition mode is deferred until Phase 2')
}
