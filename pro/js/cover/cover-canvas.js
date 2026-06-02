/**
 * Guided three-panel KDP-style cover canvas.
 */

/**
 * Initializes the cover canvas controller.
 * @param {HTMLCanvasElement} canvas Canvas element used for the cover editor.
 * @param {object} template Calculated cover template.
 * @returns {{destroy: () => void}} Canvas controller.
 */
export function initCoverCanvas(canvas, template = {}) {
  void canvas
  void template
  // TODO Phase 3: draw back | spine | front panels, bleed, safe areas, and barcode placeholder.
  return {
    destroy() {}
  }
}
