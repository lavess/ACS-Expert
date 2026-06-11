/**
 * Cache de leitura offline usando IndexedDB.
 * Armazena respostas de GET com TTL configurável.
 * Quando offline, serve o último valor salvo em vez de falhar.
 */
import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME    = 'acs-expert-cache'
const STORE      = 'responses'
const DB_VERSION = 1
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000  // 24 horas

interface CacheEntry {
  key:       string
  data:      unknown
  cachedAt:  number   // timestamp ms
  ttl:       number   // ms
}

let db: IDBPDatabase | null = null

async function getDb(): Promise<IDBPDatabase> {
  if (db) return db
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: 'key' })
      }
    },
  })
  return db
}

export async function cacheSet(key: string, data: unknown, ttl = DEFAULT_TTL_MS): Promise<void> {
  const database = await getDb()
  const entry: CacheEntry = { key, data, cachedAt: Date.now(), ttl }
  await database.put(STORE, entry)
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const database = await getDb()
    const entry = await database.get(STORE, key) as CacheEntry | undefined
    if (!entry) return null
    if (Date.now() - entry.cachedAt > entry.ttl) {
      await database.delete(STORE, key)
      return null
    }
    return entry.data as T
  } catch {
    return null
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const database = await getDb()
  await database.delete(STORE, key)
}

/** Invalida todas as entradas cujo prefixo bate com keyPrefix */
export async function cacheInvalidatePrefix(keyPrefix: string): Promise<void> {
  try {
    const database = await getDb()
    const allKeys  = await database.getAllKeys(STORE) as string[]
    await Promise.all(
      allKeys
        .filter((k) => k.startsWith(keyPrefix))
        .map((k) => database.delete(STORE, k))
    )
  } catch { /* ignora */ }
}
