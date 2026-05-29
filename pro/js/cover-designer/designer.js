import { coverTemplates } from './templates.js'

/**
 * Initializes a Fabric.js cover canvas with back, spine, and front guides.
 * @param {HTMLCanvasElement} canvas Canvas element.
 * @param {object} options Designer options.
 * @returns {object|null} Fabric canvas or null if Fabric is unavailable.
 */
export function initCoverDesigner(canvas, options = {}) {
  if (!window.fabric || !canvas) return null
  const fabricCanvas = new window.fabric.Canvas(canvas)
  const width = canvas.width
  const height = canvas.height
  const spineWidth = Number(options.spineWidth || 40)
  const panelWidth = (width - spineWidth) / 2
  fabricCanvas.add(new window.fabric.Rect({ left: 0, top: 0, width, height, fill: options.background || '#ffffff', selectable: false }))
  fabricCanvas.add(new window.fabric.Line([panelWidth, 0, panelWidth, height], { stroke: '#2563eb', selectable: false }))
  fabricCanvas.add(new window.fabric.Line([panelWidth + spineWidth, 0, panelWidth + spineWidth, height], { stroke: '#2563eb', selectable: false }))
  fabricCanvas.add(new window.fabric.Text(options.title || 'Book Title', { left: panelWidth + spineWidth + 40, top: 90, fontSize: 34, fill: '#111827' }))
  return fabricCanvas
}

/**
 * Returns bundled cover templates.
 * @returns {object[]} Cover template definitions.
 */
export function listCoverTemplates() {
  return coverTemplates
}
