import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Activity, ActivityType, AppData, CollectionName, Collections, Meta, MetaKey, Settings } from './types'
import * as db from './lib/db'
import { emptyData } from './lib/defaults'
import { uid } from './lib/id'

// ───────── Toasts

export type ToastKind = 'ok' | 'erro' | 'info' | 'conquista'
interface Toast {
  id: string
  kind: ToastKind
  text: string
}

interface ToastApi {
  toast: (text: string, kind?: ToastKind) => void
}
const ToastCtx = createContext<ToastApi>({ toast: () => {} })
export const useToast = () => useContext(ToastCtx)

// ───────── Store

interface StoreApi {
  data: AppData
  /** Leitura síncrona do estado mais recente (já inclui escritas ainda não renderizadas). */
  getData: () => AppData
  setSettings: (patch: Partial<Settings>) => void
  updateMeta: <K extends MetaKey>(key: K, fn: (prev: Meta[K]) => Meta[K]) => void
  upsert: <C extends CollectionName>(c: C, item: Collections[C][number]) => void
  remove: (c: CollectionName, id: string) => void
  log: (type: ActivityType, label: string, ref?: string) => void
  replaceAll: (data: AppData) => Promise<void>
}

const StoreCtx = createContext<StoreApi | null>(null)

export function useStore(): StoreApi {
  const s = useContext(StoreCtx)
  if (!s) throw new Error('useStore fora do StoreProvider')
  return s
}

export function useData(): AppData {
  return useStore().data
}

type LoadState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string }

export function StoreProvider({ children, fallback }: { children: ReactNode; fallback: (s: LoadState) => ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData)
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [toasts, setToasts] = useState<Toast[]>([])
  const dataRef = useRef(data)
  dataRef.current = data

  const toast = useCallback((text: string, kind: ToastKind = 'ok') => {
    const id = uid('t')
    setToasts((t) => [...t.slice(-3), { id, kind, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'erro' ? 7000 : 3800)
  }, [])

  const fail = useCallback(
    (e: unknown) => {
      console.error(e)
      toast('Não foi possível salvar no armazenamento do navegador. Exporte um backup e verifique o espaço disponível.', 'erro')
    },
    [toast],
  )

  useEffect(() => {
    db.loadAll()
      .then((d) => {
        setData(d)
        setLoad({ status: 'ready' })
      })
      .catch((e) => {
        console.error(e)
        setLoad({
          status: 'error',
          message:
            'O navegador bloqueou o IndexedDB (comum em janelas anônimas ou com dados de site desativados). Sem ele, o progresso não pode ser salvo.',
        })
      })
  }, [])

  const updateMeta = useCallback(
    <K extends MetaKey>(key: K, fn: (prev: Meta[K]) => Meta[K]) => {
      const next = fn(dataRef.current[key])
      dataRef.current = { ...dataRef.current, [key]: next }
      setData(dataRef.current)
      db.putMeta(key, next).catch(fail)
    },
    [fail],
  )

  const setSettings = useCallback((patch: Partial<Settings>) => updateMeta('settings', (s) => ({ ...s, ...patch })), [updateMeta])

  const upsert = useCallback(
    <C extends CollectionName>(c: C, item: Collections[C][number]) => {
      const list = dataRef.current[c] as { id: string }[]
      const i = list.findIndex((x) => x.id === item.id)
      const next = i >= 0 ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]
      dataRef.current = { ...dataRef.current, [c]: next }
      setData(dataRef.current)
      db.putItem(c, item).catch(fail)
    },
    [fail],
  )

  const remove = useCallback(
    (c: CollectionName, id: string) => {
      const list = dataRef.current[c] as { id: string }[]
      dataRef.current = { ...dataRef.current, [c]: list.filter((x) => x.id !== id) }
      setData(dataRef.current)
      db.deleteItem(c, id).catch(fail)
    },
    [fail],
  )

  const log = useCallback(
    (type: ActivityType, label: string, ref?: string) => {
      const a: Activity = { id: uid('a'), at: new Date().toISOString(), type, label, ref }
      upsert('activity', a)
    },
    [upsert],
  )

  const replaceAll = useCallback(async (d: AppData) => {
    await db.replaceAll(d)
    dataRef.current = d
    setData(d)
  }, [])

  const getData = useCallback(() => dataRef.current, [])
  const api = useMemo(() => ({ data, getData, setSettings, updateMeta, upsert, remove, log, replaceAll }), [data, getData, setSettings, updateMeta, upsert, remove, log, replaceAll])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {load.status === 'ready' ? <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider> : fallback(load)}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
