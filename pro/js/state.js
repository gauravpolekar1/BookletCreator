const units = ['mm', 'in', 'pt']

/**
 * @typedef {Object} PagePlanEntry
 * @property {'source' | 'blank'} kind Ordered source-page reference or generated blank page.
 * @property {number} [sourceIndex] 0-based index into the source PDF when kind is 'source'.
 * @property {number} [repeatGroupId] Repeat sequence identifier shared by entries produced from one Repeat ×N action.
 */

const defaultState = {
  version: '0.1.0',
  unit: 'mm',
  currentTab: 'start',
  pdf: {
    name: '',
    size: 0,
    bytes: null,
    pageCount: 0,
    pageSizes: [],
    fonts: [],
    loadedAt: null
  },
  pagePlan: [],
  project: {
    id: null,
    title: 'Untitled booklet',
    notes: '',
    createdAt: null,
    updatedAt: null
  },
  settings: {
    imposition: { mode: 'saddle-stitch' },
    printPrep: { bleed: 0, marks: false, colorMode: 'color', gutter: 0 },
    layout: { pageNumbers: false, headersFooters: false, toc: false, watermark: false },
    cover: {},
    export: { fileNamePattern: '{title}_{date}_{pages}p_{mode}.pdf' }
  }
}

let state = structuredClone(defaultState)
const listeners = new Set()

/**
 * Returns the current immutable-ish application state snapshot.
 * @returns {object} Current state object.
 */
export function getState() {
  return state
}

/**
 * Replaces the state through an updater function and notifies subscribers.
 * @param {(state: object) => object} updater Function that returns the next state.
 * @returns {object} Updated state.
 */
export function updateState(updater) {
  const next = updater(structuredCloneForState(state))
  state = normalizeState(next)
  listeners.forEach((listener) => listener(state))
  return state
}

/**
 * Subscribes to state changes.
 * @param {(state: object) => void} listener Callback invoked after every update.
 * @returns {() => void} Unsubscribe function.
 */
export function subscribe(listener) {
  listeners.add(listener)
  listener(state)
  return () => listeners.delete(listener)
}

/**
 * Restores persisted settings and metadata into the central state.
 * @param {object} snapshot Project snapshot.
 * @returns {object} Updated state.
 */
export function hydrateState(snapshot) {
  return updateState(() => snapshot || {})
}

/**
 * Creates the default page plan for a source PDF: one source entry per page.
 * @param {number} pageCount Number of pages in the source PDF.
 * @returns {PagePlanEntry[]} Source-order page plan.
 */
export function createDefaultPagePlan(pageCount) {
  return Array.from({ length: Math.max(0, Number(pageCount || 0)) }, (_, sourceIndex) => ({
    kind: 'source',
    sourceIndex
  }))
}

/**
 * Replaces the current page plan.
 * @param {PagePlanEntry[]} pagePlan Next page plan entries.
 * @returns {object} Updated state.
 */
export function setPagePlan(pagePlan) {
  return updateState((draft) => {
    draft.pagePlan = sanitizePagePlan(pagePlan, draft.pdf.pageCount)
    draft.project.updatedAt = new Date().toISOString()
    return draft
  })
}

/**
 * Restores the page plan to the uploaded source PDF order.
 * @returns {object} Updated state.
 */
export function resetPagePlan() {
  return updateState((draft) => {
    draft.pagePlan = createDefaultPagePlan(draft.pdf.pageCount)
    draft.project.updatedAt = new Date().toISOString()
    return draft
  })
}

/**
 * Sets the active measurement unit used by all Pro inputs.
 * @param {'mm'|'in'|'pt'} unit Measurement unit.
 * @returns {object} Updated state.
 */
export function setUnit(unit) {
  if (!units.includes(unit)) {
    throw new Error(`Unsupported unit: ${unit}`)
  }
  return updateState((draft) => {
    draft.unit = unit
    return draft
  })
}

/**
 * Converts a value from the active unit to PDF points.
 * @param {number} value Numeric value in the current UI unit.
 * @param {'mm'|'in'|'pt'} [unit] Optional source unit override.
 * @returns {number} Value in points.
 */
export function toPoints(value, unit = state.unit) {
  if (unit === 'mm') return value * 72 / 25.4
  if (unit === 'in') return value * 72
  return value
}

/**
 * Converts PDF points to the active UI unit.
 * @param {number} value Numeric value in points.
 * @param {'mm'|'in'|'pt'} [unit] Optional target unit override.
 * @returns {number} Converted value.
 */
export function fromPoints(value, unit = state.unit) {
  if (unit === 'mm') return value * 25.4 / 72
  if (unit === 'in') return value / 72
  return value
}

/**
 * Returns a settings-only project export, optionally embedding the source PDF.
 * @param {boolean} includePdf Whether to include base64 PDF bytes.
 * @returns {Promise<object>} Serializable project package.
 */
export async function createProjectExport(includePdf = false) {
  const snapshot = structuredCloneForState(state)
  if (includePdf && state.pdf.bytes) {
    snapshot.pdf.embeddedBase64 = await arrayBufferToBase64(state.pdf.bytes)
  }
  snapshot.pdf.bytes = null
  return {
    type: 'bookletcreator-pro-project',
    version: state.version,
    exportedAt: new Date().toISOString(),
    project: snapshot
  }
}

/**
 * Imports a .bcproj object and restores embedded PDF bytes when present.
 * @param {object} packageData Parsed project package.
 * @returns {Promise<object>} Updated state.
 */
export async function importProjectPackage(packageData) {
  if (!packageData || packageData.type !== 'bookletcreator-pro-project') {
    throw new Error('The selected file is not a BookletCreator Pro project')
  }
  const snapshot = packageData.project || {}
  if (snapshot.pdf?.embeddedBase64) {
    snapshot.pdf.bytes = await base64ToArrayBuffer(snapshot.pdf.embeddedBase64)
    delete snapshot.pdf.embeddedBase64
  }
  return hydrateState(snapshot)
}

/**
 * Creates a persistence-ready state snapshot without transient raw PDF bytes.
 * @returns {object} Serializable settings snapshot.
 */
export function createSettingsSnapshot() {
  const snapshot = structuredCloneForState(state)
  snapshot.pdf.bytes = null
  return snapshot
}

function normalizeState(next) {
  const incomingPagePlan = next?.pagePlan
  const hasPagePlanArray = Array.isArray(incomingPagePlan)
  const merged = mergeState(defaultState, next)
  if (!units.includes(merged.unit)) merged.unit = 'mm'

  if (hasPagePlanArray) {
    merged.pagePlan = sanitizePagePlan(incomingPagePlan, merged.pdf.pageCount)
  } else if (merged.pdf.pageCount) {
    merged.pagePlan = createDefaultPagePlan(merged.pdf.pageCount)
  } else {
    merged.pagePlan = []
  }

  return merged
}

function sanitizePagePlan(pagePlan, pageCount = 0) {
  if (!Array.isArray(pagePlan)) return []
  const maxSourceIndex = Math.max(0, Number(pageCount || 0)) - 1
  return pagePlan.reduce((entries, entry) => {
    if (!entry || typeof entry !== 'object') return entries
    if (entry.kind === 'blank') {
      entries.push({ kind: 'blank' })
      return entries
    }
    if (entry.kind === 'source' && Number.isInteger(entry.sourceIndex) && entry.sourceIndex >= 0 && entry.sourceIndex <= maxSourceIndex) {
      const nextEntry = { kind: 'source', sourceIndex: entry.sourceIndex }
      if (Number.isInteger(entry.repeatGroupId)) nextEntry.repeatGroupId = entry.repeatGroupId
      entries.push(nextEntry)
    }
    return entries
  }, [])
}

function mergeState(base, patch) {
  const merged = structuredCloneForState(base)
  deepAssign(merged, patch)
  return merged
}

function deepAssign(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof ArrayBuffer)) {
      target[key] = target[key] || {}
      deepAssign(target[key], value)
      return
    }
    target[key] = value
  })
  return target
}

function structuredCloneForState(value) {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

async function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

async function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer
}
