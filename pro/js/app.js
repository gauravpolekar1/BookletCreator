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
    toastRegion: document.querySelector('#toast-region')
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

init()
