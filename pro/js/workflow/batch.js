/**
 * Processes PDFs in sequence and returns a ZIP blob when JSZip is available.
 * @param {File[]} files PDF files.
 * @param {(file: File) => Promise<Uint8Array>} processor Processor callback.
 * @param {(progress: object) => void} [onProgress] Progress callback.
 * @returns {Promise<Blob>} ZIP blob.
 */
export async function processBatch(files, processor, onProgress = () => {}) {
  const zip = new window.JSZip()
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    onProgress({ current: index + 1, total: files.length, file: file.name })
    const bytes = await processor(file)
    zip.file(file.name.replace(/\.pdf$/i, '-pro.pdf'), bytes)
  }
  return zip.generateAsync({ type: 'blob' })
}
