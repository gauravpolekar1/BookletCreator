/**
 * PDF export for KDP-style covers.
 */

/**
 * Exports a validated cover to a single-page PDF at the calculated dimensions.
 * @param {object} cover Cover canvas/model data.
 * @param {object} template Calculated cover template.
 * @returns {Promise<Uint8Array>} Cover PDF bytes.
 */
export async function exportCoverPdf(cover = {}, template = {}) {
  void cover
  void template
  // TODO Phase 3: render the guided cover canvas to PDF at exact cover dimensions.
  return new Uint8Array()
}
