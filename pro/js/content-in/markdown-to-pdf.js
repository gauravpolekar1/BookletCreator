/**
 * Converts Markdown text into a PDF using markdown-it and pdfmake globals.
 * @param {string} markdown Markdown source.
 * @param {object} template Template styles.
 * @returns {Promise<Uint8Array>} PDF bytes.
 */
export async function markdownToPdf(markdown, template = {}) {
  const markdownIt = window.markdownit
  const parser = markdownIt ? markdownIt() : null
  const text = parser ? parser.render(markdown).replace(/<[^>]+>/g, '') : markdown
  const docDefinition = {
    pageSize: template.pageSize?.pdfmake || 'LETTER',
    pageMargins: template.margins || [72, 72, 72, 72],
    content: text.split('\n').filter(Boolean).map((line) => ({ text: line, margin: [0, 0, 0, 8] })),
    defaultStyle: template.defaultStyle || { fontSize: 11 }
  }
  return new Promise((resolve) => {
    window.pdfMake.createPdf(docDefinition).getBuffer((buffer) => resolve(new Uint8Array(buffer)))
  })
}
