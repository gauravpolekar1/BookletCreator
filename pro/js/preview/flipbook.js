/**
 * Renders PDF pages as browser canvases in a scrollable print preview.
 * @param {HTMLElement} container Preview container.
 * @param {object} pdfDocument Loaded pdf.js document.
 * @returns {Promise<object>} Preview controller.
 */
export async function renderPreviewPages(container, pdfDocument) {
  container.innerHTML = ''
  const canvases = []

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber)
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = Math.min(1, Math.max(container.clientWidth, 640) / baseViewport.width)
    const viewport = page.getViewport({ scale })

    const pageWrapper = document.createElement('div')
    pageWrapper.className = 'preview-page'

    const pageLabel = document.createElement('div')
    pageLabel.className = 'preview-page-label'
    pageLabel.textContent = `Page ${pageNumber} of ${pdfDocument.numPages}`

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(viewport.width))
    canvas.height = Math.max(1, Math.floor(viewport.height))
    canvas.style.width = '100%'
    canvas.style.height = 'auto'

    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

    pageWrapper.append(pageLabel, canvas)
    container.append(pageWrapper)
    canvases.push(canvas)
  }

  return { canvases }
}
