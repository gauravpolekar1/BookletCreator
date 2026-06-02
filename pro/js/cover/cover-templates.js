/**
 * Starter cover templates for the guided cover generator.
 */

export const coverTemplates = [
  { id: 'novel', name: 'Novel', elements: [] },
  { id: 'photo-book', name: 'Photo book', elements: [] },
  { id: 'manual-workbook', name: 'Manual / workbook', elements: [] },
  { id: 'journal', name: 'Journal', elements: [] }
]

/**
 * Returns bundled guided cover templates.
 * @returns {Array<object>} Starter templates.
 */
export function listGuidedCoverTemplates() {
  return coverTemplates.slice()
}
