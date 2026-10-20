import { openDB, type IDBPDatabase } from 'idb'
import type { AppData, CollectionName, Meta, MetaKey } from '../types'
import { COLLECTION_KEYS, META_KEYS, emptyData } from './defaults'

// Persistência local em IndexedDB.
// - store "meta": um registro por chave de Meta (settings, progresso…)
// - um store por coleção, com keyPath "id"
// Migrações de esquema ficam em `upgrade`, por versão.

const DB_NAME = 'cyberstart'
export const DB_VERSION = 1

let dbp: Promise<IDBPDatabase> | null = null

function getDb() {
  if (!dbp) {
    dbp = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('meta')
          for (const c of COLLECTION_KEYS) db.createObjectStore(c, { keyPath: 'id' })
        }
        // if (oldVersion < 2) { ...migração futura... }
      },
      blocked() {
        console.warn('[CyberStart] Banco bloqueado por outra aba com versão antiga.')
      },
    })
  }
  return dbp
}

export async function loadAll(): Promise<AppData> {
  const db = await getDb()
  const data = emptyData()
  const tx = db.transaction(['meta', ...COLLECTION_KEYS], 'readonly')
  for (const k of META_KEYS) {
    const v = await tx.objectStore('meta').get(k)
    if (v !== undefined) {
      if (k === 'settings') data.settings = { ...data.settings, ...v }
      else (data as unknown as Record<string, unknown>)[k] = v
    }
  }
  for (const c of COLLECTION_KEYS) {
    ;(data as unknown as Record<string, unknown>)[c] = await tx.objectStore(c).getAll()
  }
  await tx.done
  return data
}

export async function putMeta<K extends MetaKey>(key: K, value: Meta[K]) {
  const db = await getDb()
  await db.put('meta', value, key)
}

export async function putItem(c: CollectionName, item: { id: string }) {
  const db = await getDb()
  await db.put(c, item)
}

export async function deleteItem(c: CollectionName, id: string) {
  const db = await getDb()
  await db.delete(c, id)
}

/** Substitui todos os dados de uma vez, numa única transação (import/reset). */
export async function replaceAll(data: AppData) {
  const db = await getDb()
  const tx = db.transaction(['meta', ...COLLECTION_KEYS], 'readwrite')
  const meta = tx.objectStore('meta')
  await meta.clear()
  for (const k of META_KEYS) await meta.put(data[k], k)
  for (const c of COLLECTION_KEYS) {
    const s = tx.objectStore(c)
    await s.clear()
    for (const it of data[c] as { id: string }[]) await s.put(it)
  }
  await tx.done
}

export async function storageEstimate(): Promise<{ usage: number; quota: number; persisted: boolean } | null> {
  if (!navigator.storage?.estimate) return null
  const e = await navigator.storage.estimate()
  const persisted = (await navigator.storage.persisted?.()) ?? false
  return { usage: e.usage ?? 0, quota: e.quota ?? 0, persisted }
}

export async function requestPersistence(): Promise<boolean> {
  return (await navigator.storage?.persist?.()) ?? false
}

/** Somente para testes. */
export function __resetDbHandle() {
  dbp = null
}
