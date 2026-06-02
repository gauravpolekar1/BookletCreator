/**
 * Source PDF preview coordinator.
 *
 * This module will own the Start-tab source-page strip that renders uploaded PDF
 * pages on demand. It intentionally shares pdf.js and the existing preview worker
 * pipeline instead of introducing another renderer.
 */

/**
 * Initializes the source PDF preview shell.
 * @param {HTMLElement} container Scroll container that will host source page cards.
 * @param {object} options Preview wiring options.
 * @returns {{destroy: () => void}} Controller with cleanup hooks.
 */
export function initSourcePreview(container, options = {}) {
  void container
  void options
  // TODO Phase 3: render source pages lazily via IntersectionObserver and the shared preview worker pipeline.
  return {
    destroy() {}
  }
}
