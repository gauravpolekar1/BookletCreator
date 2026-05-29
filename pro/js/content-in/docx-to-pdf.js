/**
 * Converts DOCX bytes to a simplified PDF through mammoth and pdfmake.
 * @param {ArrayBuffer} docxBytes DOCX file bytes.
 * @param {object} template Template styles.
 * @returns {Promise<{bytes: Uint8Array, warning: string}>} PDF bytes and conversion warning.
 */
export async function docxToPdf(docxBytes, template = {}) {
  const result = await window.mammoth.convertToHtml({ arrayBuffer: docxBytes })
  const text = result.value.replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n')
  const docDefinition = {
    pageSize: template.pageSize?.pdfmake || 'LETTER',
    pageMargins: template.margins || [72, 72, 72, 72],
    content: text.split('\n').filter(Boolean).map((line) => ({ text: line, margin: [0, 0, 0, 8] }))
  }
  const bytes = await new Promise((resolve) => {
    window.pdfMake.createPdf(docDefinition).getBuffer((buffer) => resolve(new Uint8Array(buffer)))
  })
  return { bytes, warning: 'Complex DOCX formatting may not survive conversion.' }
}
