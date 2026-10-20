import type { AppData } from '../types'
import { COLLECTION_KEYS, DEFAULT_SETTINGS, emptyData } from './defaults'

// Formato de exportação versionado. Ao mudar o modelo de dados:
// 1) incremente EXPORT_VERSION; 2) adicione um passo em MIGRATIONS.

export const EXPORT_VERSION = 1

export interface ExportFile {
  app: 'cyberstart'
  version: number
  exportedAt: string
  data: AppData
}

type Json = Record<string, unknown>

const MIGRATIONS: Record<number, (d: Json) => Json> = {
  // Exemplo de como uma migração futura ficaria:
  // 1: (d) => ({ ...d, novoCampo: [] }),  // de v1 para v2
}

const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const MAX_TEXT = 200_000

export class ImportError extends Error {}

/** Converte e valida um arquivo exportado. Lança ImportError com mensagem legível. */
export function parseImport(text: string): { data: AppData; summary: Record<string, number>; fromVersion: number } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new ImportError('O arquivo não é um JSON válido.')
  }
  if (!isObj(raw) || raw.app !== 'cyberstart') throw new ImportError('Este arquivo não parece ser um backup do CyberStart.')
  const version = raw.version
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1)
    throw new ImportError('Versão do backup ausente ou inválida.')
  if (version > EXPORT_VERSION)
    throw new ImportError(`Backup criado por uma versão mais nova (v${version}). Atualize o CyberStart antes de importar.`)
  if (!isObj(raw.data)) throw new ImportError('Backup sem bloco de dados.')

  let d: Json = raw.data
  for (let v = version; v < EXPORT_VERSION; v++) d = MIGRATIONS[v](d)

  const out = emptyData()
  // Configurações: aceitamos só chaves conhecidas, com o mesmo tipo do padrão.
  if (isObj(d.settings)) {
    for (const [k, def] of Object.entries(DEFAULT_SETTINGS)) {
      const val = (d.settings as Json)[k]
      if (val !== undefined && typeof val === typeof def && Array.isArray(val) === Array.isArray(def)) {
        ;(out.settings as unknown as Json)[k] = val
      }
    }
  }
  for (const k of ['moduleProgress', 'lessonProgress', 'resourceState', 'cardState', 'labLogs'] as const) {
    if (d[k] !== undefined) {
      if (!isObj(d[k])) throw new ImportError(`Campo "${k}" com formato inválido.`)
      ;(out as unknown as Json)[k] = d[k]
    }
  }
  const summary: Record<string, number> = {}
  for (const k of COLLECTION_KEYS) {
    const arr = d[k]
    if (arr === undefined) continue
    if (!Array.isArray(arr)) throw new ImportError(`Campo "${k}" deveria ser uma lista.`)
    const items = arr.filter((it): it is Json => isObj(it) && isStr(it.id) && it.id.length > 0 && it.id.length < 200)
    if (items.length !== arr.length) throw new ImportError(`Há itens sem identificador válido em "${k}".`)
    for (const it of items) {
      for (const val of Object.values(it)) {
        if (isStr(val) && val.length > MAX_TEXT) throw new ImportError(`Texto grande demais em "${k}".`)
      }
    }
    const ids = new Set(items.map((i) => i.id))
    if (ids.size !== items.length) throw new ImportError(`IDs duplicados em "${k}".`)
    ;(out as unknown as Json)[k] = items
    summary[k] = items.length
  }
  return { data: out, summary, fromVersion: version }
}

export function buildExport(data: AppData): ExportFile {
  return { app: 'cyberstart', version: EXPORT_VERSION, exportedAt: new Date().toISOString(), data }
}

/** CSV seguro: aspas escapadas e neutralização de fórmulas (CSV injection). */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const cell = (v: unknown) => {
    let s = v === undefined || v === null ? '' : Array.isArray(v) ? v.join('; ') : String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return `"${s.replace(/"/g, '""')}"`
  }
  return [columns.join(','), ...rows.map((r) => columns.map((c) => cell(r[c])).join(','))].join('\n')
}
