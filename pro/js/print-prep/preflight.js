/**
 * Runs client-side preflight checks with pdf.js data collected by the caller.
 * @param {object} pdfState Current PDF state.
 * @param {object} [options] Preflight options.
 * @returns {{issues: object[], summary: object}} Preflight result.
 */
export function runPreflight(pdfState, options = {}) {
  const issues = []
  if (!pdfState?.pageCount) issues.push({ level: 'error', message: 'No source PDF loaded' })
  const sizes = pdfState?.pageSizes || []
  const first = sizes[0]
  const inconsistent = first && sizes.some((size) => Math.abs(size.width - first.width) > 0.5 || Math.abs(size.height - first.height) > 0.5)
  if (inconsistent) issues.push({ level: 'warning', message: 'Page sizes are not consistent' })
  if (!pdfState?.fonts?.length) issues.push({ level: 'info', message: 'No embedded font names were detected by text extraction' })
  return {
    issues,
    summary: {
      pageCount: pdfState?.pageCount || 0,
      fontCount: pdfState?.fonts?.length || 0,
      minimumDpi: options.minimumDpi || 150,
      checkedAt: new Date().toISOString()
    }
  }
}

/**
 * Creates a one-page PDF report for a preflight result.
 * @param {{issues: object[], summary: object}} result Preflight result.
 * @returns {Promise<Uint8Array>} Report PDF bytes.
 */
export async function createPreflightReport(result) {
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([612, 792])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  page.drawText('BookletCreator Pro Preflight Report', { x: 54, y: 730, size: 18, font })
  page.drawText(`Pages: ${result.summary.pageCount}  Fonts: ${result.summary.fontCount}  Minimum DPI: ${result.summary.minimumDpi}`, { x: 54, y: 700, size: 10, font })
  let y = 660
  ;(result.issues.length ? result.issues : [{ level: 'ok', message: 'No blocking issues found' }]).forEach((issue) => {
    page.drawText(`${issue.level.toUpperCase()}: ${issue.message}`, { x: 54, y, size: 11, font, color: issue.level === 'error' ? rgb(0.75, 0.05, 0.05) : rgb(0, 0, 0) })
    y -= 22
  })
  return pdf.save()
}
