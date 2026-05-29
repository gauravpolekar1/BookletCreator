import { openDB } from 'https://unpkg.com/idb@8.0.2/build/index.js?module'

const databaseName = 'bookletcreator-pro'
const databaseVersion = 1
const projectStore = 'projects'
const presetStore = 'presets'

let databasePromise

/**
 * Opens the BookletCreator Pro IndexedDB database.
 * @returns {Promise<IDBPDatabase>} Open database connection.
 */
export function getDatabase() {
  databasePromise ||= openDB(databaseName, databaseVersion, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(projectStore)) {
        const store = database.createObjectStore(projectStore, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
      }
      if (!database.objectStoreNames.contains(presetStore)) {
        database.createObjectStore(presetStore, { keyPath: 'id' })
      }
    }
  })
  return databasePromise
}

/**
 * Saves a project settings snapshot to IndexedDB.
 * @param {object} snapshot Project settings snapshot.
 * @returns {Promise<object>} Saved record.
 */
export async function saveProject(snapshot) {
  const database = await getDatabase()
  const now = new Date().toISOString()
  const record = {
    ...snapshot,
    project: {
      ...snapshot.project,
      id: snapshot.project?.id || crypto.randomUUID(),
      createdAt: snapshot.project?.createdAt || now,
      updatedAt: now
    }
  }
  await database.put(projectStore, record)
  return record
}

/**
 * Lists saved projects newest first.
 * @returns {Promise<object[]>} Project records.
 */
export async function listProjects() {
  const database = await getDatabase()
  const records = await database.getAll(projectStore)
  return records.sort((a, b) => String(b.project?.updatedAt).localeCompare(String(a.project?.updatedAt)))
}

/**
 * Loads a saved project by id.
 * @param {string} id Project id.
 * @returns {Promise<object|undefined>} Project record.
 */
export async function loadProject(id) {
  const database = await getDatabase()
  return database.get(projectStore, id)
}

/**
 * Deletes a saved project by id.
 * @param {string} id Project id.
 * @returns {Promise<void>} Delete completion.
 */
export async function deleteProject(id) {
  const database = await getDatabase()
  await database.delete(projectStore, id)
}
