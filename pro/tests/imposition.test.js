import { impose as saddle } from '../js/imposition/saddle-stitch.js'
import { impose as perfect } from '../js/imposition/perfect-bound.js'
import { impose as bifold } from '../js/imposition/bi-fold.js'
import { impose as trifold } from '../js/imposition/tri-fold.js'
import { impose as nup } from '../js/imposition/n-up.js'

const output = document.querySelector('#output')
const results = []

async function makePdf(pageCount) {
  const { PDFDocument, StandardFonts } = window.PDFLib
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  for (let index = 1; index <= pageCount; index += 1) {
    const page = pdf.addPage([200, 300])
    page.drawText(`Page ${index}`, { x: 40, y: 150, size: 24, font })
  }
  return pdf.save()
}

async function pageCount(bytes) {
  return (await window.PDFLib.PDFDocument.load(bytes)).getPageCount()
}

async function test(name, fn) {
  try {
    await fn()
    results.push(`PASS ${name}`)
  } catch (error) {
    results.push(`FAIL ${name}: ${error.message}`)
  }
  output.textContent = results.join('\n')
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message}; expected ${expected}, got ${actual}`)
}

const source4 = await makePdf(4)
const source6 = await makePdf(6)

await test('saddle stitch turns 4 pages into 2 sheet sides', async () => {
  assertEqual(await pageCount(await saddle(source4)), 2, 'saddle output page count')
})

await test('perfect bound signature output is concatenated imposed signatures', async () => {
  assertEqual(await pageCount(await perfect(source6, { signatureSize: 4 })), 4, 'perfect-bound output page count')
})

await test('bi-fold creates front and back sheets', async () => {
  assertEqual(await pageCount(await bifold(source4)), 2, 'bi-fold output page count')
})

await test('tri-fold creates front and back sheets', async () => {
  assertEqual(await pageCount(await trifold(source6)), 2, 'tri-fold output page count')
})

await test('n-up 4-up places 6 source pages on 2 sheets', async () => {
  assertEqual(await pageCount(await nup(source6, { columns: 2, rows: 2 })), 2, 'n-up output page count')
})

if (results.some((line) => line.startsWith('FAIL'))) {
  throw new Error('One or more imposition tests failed')
}
