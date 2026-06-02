/**
 * Validation checks for KDP-style cover exports.
 */

/**
 * Validates cover objects against the calculated template.
 * @param {object} cover Cover canvas/model data.
 * @param {object} template Calculated cover template.
 * @returns {{ok: boolean, issues: Array<{level: string, message: string}>}} Validation result.
 */
export function validateCover(cover = {}, template = {}) {
  void cover
  void template
  // TODO Phase 3: check safe areas, bleed coverage, spine text fit, and barcode clearance.
  return { ok: true, issues: [] }
}
