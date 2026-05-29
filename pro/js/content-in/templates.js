export const templateFiles = [
  'novel-6x9.json',
  'childrens-square.json',
  'cookbook.json',
  'photo-book.json',
  'zine-half-letter.json',
  'manual-5.5x8.5.json',
  'worksheet-a4.json',
  'wedding-program.json',
  'sermon-notes.json'
]

/**
 * Loads bundled template JSON files.
 * @returns {Promise<object[]>} Template definitions.
 */
export async function loadTemplates() {
  const results = await Promise.all(templateFiles.map(async (file) => {
    const response = await fetch(`./templates/${file}`)
    if (!response.ok) throw new Error(`Could not load template ${file}`)
    return response.json()
  }))
  return results
}
