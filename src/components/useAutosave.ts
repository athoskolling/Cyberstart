import { useEffect, useRef, useState } from 'react'

/**
 * Estado local com salvamento automático (debounce).
 * Se o componente desmontar com alteração pendente, salva imediatamente.
 */
export function useAutosave(initial: string, save: (v: string) => void, delay = 600) {
  const [value, setValue] = useState(initial)
  const [status, setStatus] = useState<'salvo' | 'salvando'>('salvo')
  const saveRef = useRef(save)
  saveRef.current = save
  const pending = useRef<string | null>(null)

  useEffect(() => {
    if (pending.current === null) return
    setStatus('salvando')
    const t = setTimeout(() => {
      if (pending.current !== null) saveRef.current(pending.current)
      pending.current = null
      setStatus('salvo')
    }, delay)
    return () => clearTimeout(t)
  }, [value, delay])

  useEffect(
    () => () => {
      if (pending.current !== null) saveRef.current(pending.current)
    },
    [],
  )

  const set = (v: string) => {
    pending.current = v
    setValue(v)
  }
  return [value, set, status] as const
}
