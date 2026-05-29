import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs'
import {
  createProjectExport,
  createSettingsSnapshot,
  fromPoints,
  getState,
  hydrateState,
  importProjectPackage,
  setUnit,
  subscribe,
  updateState
} from './state.js'
import { deleteProject, listProjects, loadProject, saveProject } from './storage.js'
import { impose as imposeSaddle } from './imposition/saddle-stitch.js'
import { impose as imposePerfectBound } from './imposition/perfect-bound.js'
import { impose as imposeBiFold } from './imposition/bi-fold.js'
import { impose as imposeTriFold } from './imposition/tri-fold.js'
import { impose as imposeNUp } from './imposition/n-up.js'
import { addBleed } from './print-prep/bleed.js'
import { addPrintMarks } from './print-prep/marks.js'
import { calculateSpineWidth } from './print-prep/spine-calc.js'
import { runPreflight, createPreflightReport } from './print-prep/preflight.js'
import { addPageNumbers } from './layout/page-numbers.js'
import { addHeadersFooters } from './layout/headers-footers.js'
import { applyGutter } from './layout/gutter.js'
import { insertToc } from './layout/toc.js'
import { addWatermark } from './layout/watermark.js'
import { initCoverDesigner, listCoverTemplates } from './cover-designer/designer.js'
import { createFlipbook } from './preview/flipbook.js'
import { processBatch } from './workflow/batch.js'
import { formatFileName } from './workflow/profiles.js'

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs'

const tabs = [
  { id: 'start', label: 'Start' },
  { id: 'imposition', label: 'Imposition' },
  { id: 'print-prep', label: 'Print prep' },
  { id: 'layout', label: 'Layout' },
  { id: 'cover', label: 'Cover' },
  { id: 'preview', label: 'Preview' },
  { id: 'export', label: 'Export' },
  { id: 'projects', label: 'Projects' }
]

const elements = {}
const generated = { imposed: null, prepped: null, layout: null, cover: null, preflight: null }
let coverDesigner = null

/**
 * Boots the Pro single-page application.
 * @returns {void}
 */
function init() {
  cacheElements()
  buildNavigation()
  bindEvents()
  restoreInitialTab()
  subscribe(render)
  void renderProjects()
  populateCoverTemplates()
  registerServiceWorker()
}

function cacheElements() {
  Object.assign(elements, {
    tabNav: document.querySelector('#tab-nav'),
    tabSelect: document.querySelector('#tab-select'),
    unitSelect: document.querySelector('#unit-select'),
    dropZone: document.querySelector('#drop-zone'),
    pdfInput: document.querySelector('#pdf-input'),
    pdfDetails: document.querySelector('#pdf-details'),
    projectTitle: document.querySelector('#project-title'),
    projectNotes: document.querySelector('#project-notes'),
    saveProject: document.querySelector('#save-project'),
    exportProject: document.querySelector('#export-project'),
    embedPdf: document.querySelector('#embed-pdf'),
    projectImport: document.querySelector('#project-import'),
    refreshProjects: document.querySelector('#refresh-projects'),
    projectList: document.querySelector('#project-list'),
    projectInfo: document.querySelector('#project-info'),
    previewCanvas: document.querySelector('#preview-canvas'),
    previewStatus: document.querySelector('#preview-status'),
    toggleInspector: document.querySelector('#toggle-inspector'),
    inspector: document.querySelector('.inspector'),
    toastRegion: document.querySelector('#toast-region'),
    impositionMode: document.querySelector('#imposition-mode'),
    signatureSize: document.querySelector('#signature-size'),
    nupColumns: document.querySelector('#nup-columns'),
    nupRows: document.querySelector('#nup-rows'),
    cutStack: document.querySelector('#cut-stack'),
    runImposition: document.querySelector('#run-imposition'),
    downloadImposed: document.querySelector('#download-imposed'),
    impositionStatus: document.querySelector('#imposition-status'),
    bleedValue: document.querySelector('#bleed-value'),
    cropMarks: document.querySelector('#crop-marks'),
    foldMarks: document.querySelector('#fold-marks'),
    applyPrintPrep: document.querySelector('#apply-print-prep'),
    downloadPrepped: document.querySelector('#download-prepped'),
    spinePages: document.querySelector('#spine-pages'),
    spineGsm: document.querySelector('#spine-gsm'),
    spineType: document.querySelector('#spine-type'),
    calculateSpine: document.querySelector('#calculate-spine'),
    spineResult: document.querySelector('#spine-result'),
    runPreflight: document.querySelector('#run-preflight'),
    downloadPreflight: document.querySelector('#download-preflight'),
    preflightReport: document.querySelector('#preflight-report'),
    layoutPageNumbers: document.querySelector('#layout-page-numbers'),
    pageNumberStyle: document.querySelector('#page-number-style'),
    headerTemplate: document.querySelector('#header-template'),
    footerTemplate: document.querySelector('#footer-template'),
    watermarkText: document.querySelector('#watermark-text'),
    gutterValue: document.querySelector('#gutter-value'),
    insertToc: document.querySelector('#insert-toc'),
    applyLayout: document.querySelector('#apply-layout'),
    downloadLayout: document.querySelector('#download-layout'),
    layoutStatus: document.querySelector('#layout-status'),
    initCover: document.querySelector('#init-cover'),
    coverTemplate: document.querySelector('#cover-template'),
    coverAddText: document.querySelector('#cover-add-text'),
    coverExport: document.querySelector('#cover-export'),
    coverCanvas: document.querySelector('#cover-canvas'),
    downloadCover: document.querySelector('#download-cover'),
    renderFlipbook: document.querySelector('#render-flipbook'),
    previewFullscreen: document.querySelector('#preview-fullscreen'),
    flipbookContainer: document.querySelector('#flipbook-container'),
    filePattern: document.querySelector('#file-pattern'),
    downloadCurrent: document.querySelector('#download-current'),
    batchFiles: document.querySelector('#batch-files'),
    runBatch: document.querySelector('#run-batch'),
    batchProgress: document.querySelector('#batch-progress'),
    exportStatus: document.querySelector('#export-status')
  })
}

function buildNavigation() {
  elements.tabNav.innerHTML = tabs.map((tab, index) => `
    <a class="tab-link" href="#${tab.id}" data-tab="${tab.id}">
      <span>${index + 1}. ${tab.label}</span>
      <span aria-hidden="true">→</span>
    </a>
  `).join('')

  elements.tabSelect.innerHTML = tabs.map((tab) => `<option value="${tab.id}">${tab.label}</option>`).join('')
}

function bindEvents() {
  window.addEventListener('hashchange', () => activateTab(getTabFromHash()))

  elements.tabSelect.addEventListener('change', (event) => {
    window.location.hash = event.target.value
  })

  elements.unitSelect.addEventListener('change', (event) => {
    try {
      setUnit(event.target.value)
      showToast(`Units changed to ${event.target.value}`, 'success')
    } catch (error) {
      handleError('Could not change units', error)
    }
  })

  elements.dropZone.addEventListener('click', () => elements.pdfInput.click())
  elements.dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      elements.pdfInput.click()
    }
  })
  elements.pdfInput.addEventListener('change', (event) => {
    const [file] = event.target.files || []
    if (file) void ingestPdf(file)
  })

  for (const eventName of ['dragenter', 'dragover']) {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault()
      elements.dropZone.classList.add('is-dragging')
    })
  }
  for (const eventName of ['dragleave', 'drop']) {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault()
      elements.dropZone.classList.remove('is-dragging')
    })
  }
  elements.dropZone.addEventListener('drop', (event) => {
    const [file] = event.dataTransfer?.files || []
    if (file) void ingestPdf(file)
  })

  elements.projectTitle.addEventListener('input', (event) => updateProjectField('title', event.target.value))
  elements.projectNotes.addEventListener('input', (event) => updateProjectField('notes', event.target.value))
  elements.saveProject.addEventListener('click', () => void persistCurrentProject())
  elements.exportProject.addEventListener('click', () => void downloadProjectPackage())
  elements.projectImport.addEventListener('change', (event) => void importSelectedProject(event))
  elements.refreshProjects.addEventListener('click', () => void renderProjects())
  elements.toggleInspector.addEventListener('click', toggleInspector)
  elements.runImposition.addEventListener('click', () => void runImposition())
  elements.downloadImposed.addEventListener('click', (event) => downloadGenerated(event, 'imposed'))
  elements.applyPrintPrep.addEventListener('click', () => void applyPrintPreparation())
  elements.downloadPrepped.addEventListener('click', (event) => downloadGenerated(event, 'prepped'))
  elements.calculateSpine.addEventListener('click', calculateSpine)
  elements.runPreflight.addEventListener('click', runPreflightUi)
  elements.downloadPreflight.addEventListener('click', () => void downloadPreflightReport())
  elements.applyLayout.addEventListener('click', () => void applyLayoutUi())
  elements.downloadLayout.addEventListener('click', (event) => downloadGenerated(event, 'layout'))
  elements.initCover.addEventListener('click', initCoverUi)
  elements.coverAddText.addEventListener('click', addCoverText)
  elements.coverExport.addEventListener('click', () => void exportCoverPdf())
  elements.downloadCover.addEventListener('click', (event) => downloadGenerated(event, 'cover'))
  elements.renderFlipbook.addEventListener('click', () => void renderFlipbookUi())
  elements.previewFullscreen.addEventListener('click', () => elements.flipbookContainer.requestFullscreen?.())
  elements.downloadCurrent.addEventListener('click', downloadCurrentPdf)
  elements.runBatch.addEventListener('click', () => void runBatchUi())
}

function restoreInitialTab() {
  const storedTab = localStorage.getItem('bookletcreator-pro:last-tab')
  const initialTab = getTabFromHash() || storedTab || 'start'
  activateTab(initialTab)
}

function getTabFromHash() {
  const tabId = window.location.hash.replace('#', '')
  return tabs.some((tab) => tab.id === tabId) ? tabId : ''
}

function activateTab(tabId) {
  const nextTab = tabs.some((tab) => tab.id === tabId) ? tabId : 'start'
  localStorage.setItem('bookletcreator-pro:last-tab', nextTab)
  updateState((draft) => {
    draft.currentTab = nextTab
    return draft
  })
}

async function ingestPdf(file) {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    showToast('Choose a PDF file to start a Pro project.', 'error')
    return
  }

  try {
    elements.previewStatus.textContent = 'Reading PDF locally…'
    const bytes = await file.arrayBuffer()
    const pdfDocument = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise
    const metadata = await inspectPdf(pdfDocument)

    updateState((draft) => {
      draft.pdf = {
        name: file.name,
        size: file.size,
        bytes,
        pageCount: pdfDocument.numPages,
        pageSizes: metadata.pageSizes,
        fonts: metadata.fonts,
        loadedAt: new Date().toISOString()
      }
      if (draft.project.title === 'Untitled booklet') {
        draft.project.title = file.name.replace(/\.pdf$/i, '')
      }
      draft.project.updatedAt = new Date().toISOString()
      return draft
    })

    await renderFirstPage(pdfDocument)
    showToast(`Loaded ${file.name} (${pdfDocument.numPages} pages).`, 'success')
  } catch (error) {
    handleError('Could not load that PDF. Try a different file.', error)
    elements.previewStatus.textContent = 'Upload a PDF to render the first page.'
  }
}

async function inspectPdf(pdfDocument) {
  const pageSizes = []
  const fonts = new Set()
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1 })
    pageSizes.push({ page: pageNumber, width: viewport.width, height: viewport.height })

    try {
      const textContent = await page.getTextContent()
      Object.values(textContent.styles || {}).forEach((style) => {
        if (style.fontFamily) fonts.add(style.fontFamily)
      })
    } catch (error) {
      console.debug('Font inspection skipped for a page', error)
    }
  }
  return { pageSizes, fonts: [...fonts].sort() }
}

async function renderFirstPage(pdfDocument) {
  const page = await pdfDocument.getPage(1)
  const canvas = elements.previewCanvas
  const context = canvas.getContext('2d')
  const baseViewport = page.getViewport({ scale: 1 })
  const scale = Math.min(canvas.width / baseViewport.width, canvas.height / baseViewport.height)
  const viewport = page.getViewport({ scale })
  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))
  await page.render({ canvasContext: context, viewport }).promise
  elements.previewStatus.textContent = 'Showing page 1 preview.'
}

function updateProjectField(field, value) {
  updateState((draft) => {
    draft.project[field] = value
    draft.project.updatedAt = new Date().toISOString()
    return draft
  })
}

async function persistCurrentProject() {
  try {
    const saved = await saveProject(createSettingsSnapshot())
    hydrateState(saved)
    await renderProjects()
    showToast('Project settings saved in this browser.', 'success')
  } catch (error) {
    handleError('Could not save this project.', error)
  }
}

async function downloadProjectPackage() {
  try {
    const packageData = await createProjectExport(elements.embedPdf.checked)
    const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json' })
    const title = safeFileName(getState().project.title || 'booklet-project')
    downloadBlob(blob, `${title}.bcproj`)
    showToast('Project file exported.', 'success')
  } catch (error) {
    handleError('Could not export this project.', error)
  }
}

async function importSelectedProject(event) {
  const [file] = event.target.files || []
  if (!file) return
  try {
    const packageData = JSON.parse(await file.text())
    await importProjectPackage(packageData)
    const state = getState()
    if (state.pdf.bytes) {
      const pdfDocument = await pdfjsLib.getDocument({ data: state.pdf.bytes.slice(0) }).promise
      await renderFirstPage(pdfDocument)
    }
    showToast('Project imported. Re-upload the PDF if it was not embedded.', 'success')
  } catch (error) {
    handleError('Could not import this project file.', error)
  } finally {
    event.target.value = ''
  }
}

async function renderProjects() {
  try {
    const projects = await listProjects()
    if (!projects.length) {
      elements.projectList.innerHTML = '<p class="muted">No saved projects yet.</p>'
      return
    }
    elements.projectList.innerHTML = projects.map((record) => `
      <article class="project-row" data-project-id="${escapeHtml(record.project.id)}">
        <header>
          <h3>${escapeHtml(record.project.title || 'Untitled booklet')}</h3>
          <small>${formatDate(record.project.updatedAt)}</small>
        </header>
        <p class="muted">${escapeHtml(record.pdf?.name || 'Settings only — source PDF not stored')}</p>
        <div class="button-row">
          <button class="project-action" type="button" data-action="load">Load</button>
          <button class="project-action danger" type="button" data-action="delete">Delete</button>
        </div>
      </article>
    `).join('')
    elements.projectList.querySelectorAll('button[data-action]').forEach((button) => {
      button.addEventListener('click', () => void handleProjectAction(button))
    })
  } catch (error) {
    handleError('Could not read saved projects.', error)
  }
}

async function handleProjectAction(button) {
  const row = button.closest('[data-project-id]')
  const id = row?.dataset.projectId
  if (!id) return
  try {
    if (button.dataset.action === 'load') {
      const record = await loadProject(id)
      hydrateState(record)
      showToast('Project settings loaded.', 'success')
      window.location.hash = 'start'
      return
    }
    await deleteProject(id)
    await renderProjects()
    showToast('Project deleted.', 'success')
  } catch (error) {
    handleError('Could not update saved projects.', error)
  }
}

function render(state) {
  elements.unitSelect.value = state.unit
  elements.tabSelect.value = state.currentTab
  document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.tabPanel === state.currentTab)
  })
  document.querySelectorAll('[data-tab]').forEach((link) => {
    const isActive = link.dataset.tab === state.currentTab
    link.setAttribute('aria-current', isActive ? 'page' : 'false')
  })
  elements.projectTitle.value = state.project.title || ''
  elements.projectNotes.value = state.project.notes || ''
  renderPdfDetails(state)
  renderProjectInfo(state)
}

function renderPdfDetails(state) {
  if (!state.pdf.name) {
    elements.pdfDetails.innerHTML = '<div><dt>Status</dt><dd>No PDF loaded yet</dd></div>'
    return
  }

  const pageSizeSummary = summarizePageSizes(state.pdf.pageSizes, state.unit)
  const fonts = state.pdf.fonts.length ? state.pdf.fonts.join(', ') : 'No text fonts detected yet'
  elements.pdfDetails.innerHTML = `
    <div><dt>File</dt><dd>${escapeHtml(state.pdf.name)}</dd></div>
    <div><dt>File size</dt><dd>${formatBytes(state.pdf.size)}</dd></div>
    <div><dt>Pages</dt><dd>${state.pdf.pageCount}</dd></div>
    <div><dt>Page sizes</dt><dd>${escapeHtml(pageSizeSummary)}</dd></div>
    <div><dt>Embedded fonts / font usage</dt><dd>${escapeHtml(fonts)}</dd></div>
  `
}

function renderProjectInfo(state) {
  elements.projectInfo.innerHTML = `
    <div><dt>Title</dt><dd>${escapeHtml(state.project.title || 'Untitled booklet')}</dd></div>
    <div><dt>Current tab</dt><dd>${escapeHtml(tabLabel(state.currentTab))}</dd></div>
    <div><dt>Units</dt><dd>${escapeHtml(state.unit)}</dd></div>
    <div><dt>Saved ID</dt><dd>${escapeHtml(state.project.id || 'Not saved yet')}</dd></div>
  `
}

function summarizePageSizes(pageSizes, unit) {
  if (!pageSizes.length) return 'Unknown'
  const grouped = new Map()
  pageSizes.forEach((size) => {
    const width = fromPoints(size.width, unit).toFixed(unit === 'pt' ? 0 : 2)
    const height = fromPoints(size.height, unit).toFixed(unit === 'pt' ? 0 : 2)
    const key = `${width} × ${height} ${unit}`
    grouped.set(key, (grouped.get(key) || 0) + 1)
  })
  return [...grouped.entries()].map(([key, count]) => `${key} (${count} page${count === 1 ? '' : 's'})`).join('; ')
}

function toggleInspector() {
  const collapsed = elements.inspector.classList.toggle('is-collapsed')
  elements.toggleInspector.textContent = collapsed ? 'Show preview' : 'Hide preview'
  elements.toggleInspector.setAttribute('aria-expanded', String(!collapsed))
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.textContent = message
  elements.toastRegion.append(toast)
  window.setTimeout(() => toast.remove(), 5000)
}

function handleError(message, error) {
  console.error(message, error)
  showToast(message, 'error')
}

function tabLabel(tabId) {
  return tabs.find((tab) => tab.id === tabId)?.label || 'Start'
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / (1024 ** exponent)).toFixed(exponent ? 1 : 0)} ${units[exponent]}`
}

function formatDate(dateString) {
  if (!dateString) return 'Not saved'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString))
}

function safeFileName(value) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '') || 'booklet-project'
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character])
}



function registerServiceWorker() {
  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.info('BookletCreator Pro offline cache unavailable', error)
    })
  }
}

function populateCoverTemplates() {
  elements.coverTemplate.innerHTML = listCoverTemplates().map((template) => `<option value="${template.id}">${template.name}</option>`).join('')
}

function sourceBytes() {
  return generated.layout || generated.prepped || generated.imposed || getState().pdf.bytes
}

async function runImposition() {
  const bytes = getState().pdf.bytes
  if (!bytes) {
    showToast('Upload a PDF before running imposition.', 'error')
    return
  }
  try {
    elements.impositionStatus.textContent = 'Imposing PDF locally…'
    const options = {
      signatureSize: Number(elements.signatureSize.value || 16),
      columns: Number(elements.nupColumns.value || 2),
      rows: Number(elements.nupRows.value || 2),
      cutAndStack: elements.cutStack.checked
    }
    const runners = {
      'saddle-stitch': imposeSaddle,
      'perfect-bound': imposePerfectBound,
      'bi-fold': imposeBiFold,
      'tri-fold': imposeTriFold,
      'n-up': imposeNUp
    }
    generated.imposed = await runners[elements.impositionMode.value](bytes, options)
    updateState((draft) => {
      draft.settings.imposition = { mode: elements.impositionMode.value, ...options }
      return draft
    })
    enableDownload(elements.downloadImposed, 'booklet-imposed.pdf')
    elements.impositionStatus.textContent = `Generated ${formatBytes(generated.imposed.length)} imposed PDF.`
    showToast('Imposition complete.', 'success')
  } catch (error) {
    handleError('Could not impose this PDF.', error)
    elements.impositionStatus.textContent = 'Imposition failed.'
  }
}

async function applyPrintPreparation() {
  const bytes = sourceBytes()
  if (!bytes) {
    showToast('Upload or generate a PDF before print prep.', 'error')
    return
  }
  try {
    let output = bytes
    const bleedPt = toPointsUi(Number(elements.bleedValue.value || 0))
    if (bleedPt) output = await addBleed(output, { bleedPt })
    if (elements.cropMarks.checked || elements.foldMarks.checked) {
      output = await addPrintMarks(output, { foldMarks: elements.foldMarks.checked })
    }
    generated.prepped = output
    enableDownload(elements.downloadPrepped, 'booklet-print-prep.pdf')
    showToast('Print prep complete.', 'success')
  } catch (error) {
    handleError('Could not apply print prep.', error)
  }
}

function calculateSpine() {
  const result = calculateSpineWidth({ pageCount: Number(elements.spinePages.value || getState().pdf.pageCount || 0), paperGsm: Number(elements.spineGsm.value || 80), paperType: elements.spineType.value })
  const unit = getState().unit
  const value = unit === 'in' ? result.inches : unit === 'pt' ? result.points : result.mm
  elements.spineResult.textContent = `Estimated spine width: ${value.toFixed(unit === 'pt' ? 1 : 2)} ${unit}`
}

function runPreflightUi() {
  generated.preflight = runPreflight(getState().pdf)
  const items = generated.preflight.issues.length ? generated.preflight.issues : [{ level: 'ok', message: 'No blocking issues found' }]
  elements.preflightReport.innerHTML = `<ul>${items.map((issue) => `<li><strong>${escapeHtml(issue.level)}</strong>: ${escapeHtml(issue.message)}</li>`).join('')}</ul>`
  showToast('Preflight report updated.', 'success')
}

async function downloadPreflightReport() {
  try {
    const result = generated.preflight || runPreflight(getState().pdf)
    const bytes = await createPreflightReport(result)
    downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'booklet-preflight-report.pdf')
  } catch (error) {
    handleError('Could not create preflight report.', error)
  }
}

async function applyLayoutUi() {
  const bytes = sourceBytes()
  if (!bytes) {
    showToast('Upload or generate a PDF before layout finishing.', 'error')
    return
  }
  try {
    let output = bytes
    if (elements.insertToc.checked) output = await insertToc(output, [{ title: getState().project.title || 'Document', page: 1 }])
    const gutterPt = toPointsUi(Number(elements.gutterValue.value || 0))
    if (gutterPt) output = await applyGutter(output, { amountPt: gutterPt })
    if (elements.layoutPageNumbers.checked) output = await addPageNumbers(output, { style: elements.pageNumberStyle.value, anchor: 'bottom-center' })
    if (elements.headerTemplate.value || elements.footerTemplate.value) output = await addHeadersFooters(output, { title: getState().project.title, headerTemplate: elements.headerTemplate.value, footerTemplate: elements.footerTemplate.value })
    if (elements.watermarkText.value) output = await addWatermark(output, { text: elements.watermarkText.value })
    generated.layout = output
    enableDownload(elements.downloadLayout, 'booklet-layout.pdf')
    elements.layoutStatus.textContent = `Generated ${formatBytes(output.length)} layout PDF.`
    showToast('Layout finishing complete.', 'success')
  } catch (error) {
    handleError('Could not apply layout features.', error)
  }
}

function initCoverUi() {
  const template = listCoverTemplates().find((item) => item.id === elements.coverTemplate.value) || listCoverTemplates()[0]
  coverDesigner = initCoverDesigner(elements.coverCanvas, { background: template.background, title: template.title })
  if (!coverDesigner) {
    showToast('Cover designer library is still loading. Try again in a moment.', 'error')
    return
  }
  showToast('Cover designer ready.', 'success')
}

function addCoverText() {
  if (!coverDesigner || !window.fabric) {
    initCoverUi()
  }
  if (coverDesigner && window.fabric) {
    coverDesigner.add(new window.fabric.Textbox('New cover text', { left: 80, top: 80, width: 260, fontSize: 28, fill: '#111827' }))
  }
}

async function exportCoverPdf() {
  try {
    if (!coverDesigner) initCoverUi()
    const dataUrl = elements.coverCanvas.toDataURL('image/png')
    const { PDFDocument } = window.PDFLib
    const pdf = await PDFDocument.create()
    const image = await pdf.embedPng(dataUrl)
    const page = pdf.addPage([elements.coverCanvas.width, elements.coverCanvas.height])
    page.drawImage(image, { x: 0, y: 0, width: elements.coverCanvas.width, height: elements.coverCanvas.height })
    generated.cover = await pdf.save()
    enableDownload(elements.downloadCover, 'booklet-cover.pdf')
    showToast('Cover PDF exported.', 'success')
  } catch (error) {
    handleError('Could not export the cover PDF.', error)
  }
}

async function renderFlipbookUi() {
  const bytes = sourceBytes()
  if (!bytes) {
    showToast('Upload or generate a PDF before previewing.', 'error')
    return
  }
  try {
    elements.flipbookContainer.textContent = 'Rendering pages…'
    const document = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise
    await createFlipbook(elements.flipbookContainer, document)
    showToast('Flipbook preview rendered.', 'success')
  } catch (error) {
    handleError('Could not render flipbook preview.', error)
  }
}

function downloadCurrentPdf() {
  const bytes = sourceBytes()
  if (!bytes) {
    showToast('Nothing to export yet.', 'error')
    return
  }
  const state = getState()
  const fileName = formatFileName(elements.filePattern.value, {
    title: safeFileName(state.project.title || 'booklet'),
    date: new Date().toISOString().slice(0, 10),
    pages: state.pdf.pageCount || '0',
    mode: state.settings.imposition.mode || elements.impositionMode.value
  })
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), fileName)
}

async function runBatchUi() {
  const files = [...(elements.batchFiles.files || [])]
  if (!files.length) {
    showToast('Choose PDFs for batch processing.', 'error')
    return
  }
  try {
    elements.batchProgress.value = 0
    const blob = await processBatch(files, async (file) => imposeSaddle(await file.arrayBuffer(), {}), (progress) => {
      elements.batchProgress.value = Math.round(progress.current / progress.total * 100)
      elements.exportStatus.textContent = `Processing ${progress.file} (${progress.current}/${progress.total})`
    })
    downloadBlob(blob, 'bookletcreator-pro-batch.zip')
    elements.exportStatus.textContent = 'Batch ZIP complete.'
  } catch (error) {
    handleError('Could not complete batch export.', error)
  }
}

function downloadGenerated(event, key) {
  event.preventDefault()
  if (!generated[key]) return
  downloadBlob(new Blob([generated[key]], { type: 'application/pdf' }), event.currentTarget.download || `booklet-${key}.pdf`)
}

function enableDownload(link, fileName) {
  link.classList.remove('is-disabled')
  link.removeAttribute('aria-disabled')
  link.href = '#download'
  link.download = fileName
}

function toPointsUi(value) {
  const unit = getState().unit
  if (unit === 'mm') return value * 72 / 25.4
  if (unit === 'in') return value * 72
  return value
}

init()
