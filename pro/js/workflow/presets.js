export const builtInPresets = [
  { id: 'saddle-letter', name: 'Saddle stitch letter', settings: { imposition: { mode: 'saddle-stitch' }, printPrep: { bleed: 0, marks: true } } },
  { id: 'kdp-6x9', name: 'KDP 6 x 9 paperback', settings: { imposition: { mode: 'perfect-bound' }, printPrep: { bleed: 9, marks: false } } }
]

/**
 * Applies a preset to a settings object.
 * @param {object} settings Existing settings.
 * @param {object} preset Preset definition.
 * @returns {object} Merged settings.
 */
export function applyPreset(settings, preset) {
  return { ...settings, ...(preset?.settings || {}) }
}
