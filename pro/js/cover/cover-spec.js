/**
 * KDP-style cover specification and dimension calculations.
 */

export const COVER_TODO_SCOPE = [
  'TODO Phase X: hardcover support',
  'TODO Phase X: real ISBN barcode generation',
  'TODO Phase X: AI-generated cover art',
  'TODO Phase X: image stock library'
]

/**
 * Calculates a paperback cover template from trim, page count, and paper stock.
 * @param {object} spec Cover specification.
 * @returns {object} Calculated cover dimensions.
 */
export function calculateCoverSpec(spec = {}) {
  void spec
  // TODO Phase 3: use the shared paper thickness table from print-prep creep/spine calculations.
  return {}
}
