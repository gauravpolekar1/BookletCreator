export const printShopProfiles = [
  // Lulu print-ready PDF guidance: https://help.lulu.com/en/support/solutions/articles/64000255509
  { id: 'lulu', name: 'Lulu', sheetSize: 'trim-size', bleedPt: 9, marksStyle: 'none', colorMode: 'color', fileNamePattern: '{title}_{date}_{pages}p_lulu.pdf' },
  // Amazon KDP paperback formatting and bleed guidance: https://kdp.amazon.com/en_US/help/topic/G201857950
  { id: 'amazon-kdp', name: 'Amazon KDP', sheetSize: 'trim-size', bleedPt: 9, marksStyle: 'none', colorMode: 'color', fileNamePattern: '{title}_{date}_{pages}p_kdp.pdf' },
  // IngramSpark file creation guide: https://www.ingramspark.com/resources/file-creation-guide
  { id: 'ingramspark', name: 'IngramSpark', sheetSize: 'trim-size', bleedPt: 9, marksStyle: 'none', colorMode: 'color', fileNamePattern: '{title}_{date}_{pages}p_ingram.pdf' },
  // Blurb PDF to Book specifications: https://www.blurb.com/pdf-to-book
  { id: 'blurb', name: 'Blurb', sheetSize: 'trim-size', bleedPt: 9, marksStyle: 'none', colorMode: 'color', fileNamePattern: '{title}_{date}_{pages}p_blurb.pdf' }
]

/**
 * Formats an export file name from a profile pattern.
 * @param {string} pattern Naming pattern.
 * @param {object} data Project data.
 * @returns {string} File name.
 */
export function formatFileName(pattern, data) {
  return String(pattern || '{title}_{date}.pdf').replace(/\{(title|date|pages|mode)\}/g, (_, key) => data[key] ?? '')
}
