const units = ['mm', 'in', 'pt']

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
  return updateState(() => mergeState(defaultState, snapshot || {}))
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
  const merged = mergeState(defaultState, next)
  if (!units.includes(merged.unit)) merged.unit = 'mm'
  return merged
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
