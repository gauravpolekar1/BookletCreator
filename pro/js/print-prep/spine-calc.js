/**
 * Calculates perfect-bound spine width in PDF points.
 * @param {object} options Spine inputs.
 * @param {number} options.pageCount Interior page count.
 * @param {number} [options.paperGsm=80] Paper weight.
 * @param {'bond'|'offset'|'coated'} [options.paperType='offset'] Paper type.
 * @param {number} [options.coverThicknessPt=0] Cover wrap thickness in points.
 * @returns {{points:number, mm:number, inches:number}} Spine width.
 */
export function calculateSpineWidth(options = {}) {
  const pageCount = Math.max(0, Number(options.pageCount || 0))
  const gsm = Number(options.paperGsm || 80)
  const typeFactor = { bond: 0.00082, offset: 0.0009, coated: 0.00072 }[options.paperType || 'offset'] || 0.0009
  const mm = (pageCount / 2) * gsm * typeFactor + (Number(options.coverThicknessPt || 0) * 25.4 / 72)
  return { points: mm * 72 / 25.4, mm, inches: mm / 25.4 }
}
