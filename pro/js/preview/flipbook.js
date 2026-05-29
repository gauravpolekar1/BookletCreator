/**
 * Renders PDF pages to canvases and loads them into StPageFlip when available.
 * @param {HTMLElement} container Flipbook container.
 * @param {object} pdfDocument Loaded pdf.js document.
 * @returns {Promise<object>} Preview controller.
 */
export async function createFlipbook(container, pdfDocument) {
  container.innerHTML = ''
  const canvases = []
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 0.8 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    container.append(canvas)
    canvases.push(canvas)
  }
  if (window.St?.PageFlip) {
    const pageFlip = new window.St.PageFlip(container, { width: canvases[0]?.width || 320, height: canvases[0]?.height || 420, showCover: true })
    pageFlip.loadFromHTML(canvases)
    return pageFlip
  }
  return { canvases }
}
