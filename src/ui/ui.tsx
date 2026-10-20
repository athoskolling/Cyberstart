import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, CheckCircle2, ChevronRight, Copy, Info, MoreHorizontal, X, XCircle, HelpCircle } from 'lucide-react'
import { CATEGORY_LABEL, DIFFICULTY_LABEL } from '../data'
import type { Category, Difficulty } from '../types'
import { useToast } from '../store'

export function PageHead({ eyebrow, title, desc, actions }: { eyebrow?: ReactNode; title: ReactNode; desc?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {actions && <div className="btn-row">{actions}</div>}
    </header>
  )
}

export function Crumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="crumbs">
      {items.map((it, i) => (
        <span key={i} className="row" style={{ gap: 6 }}>
          {i > 0 && <ChevronRight size={13} aria-hidden />}
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
        </span>
      ))}
    </nav>
  )
}

export function Progress({ value, label, tone, lg }: { value: number; label: string; tone?: 'ok'; lg?: boolean }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={`progress ${tone ?? ''} ${lg ? 'lg' : ''}`} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${v}%` }} />
    </div>
  )
}

export function Empty({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="icon-tile">{icon}</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div className="btn-row" style={{ justifyContent: 'center', marginTop: 6 }}>{action}</div>}
    </div>
  )
}

const CALLOUT_ICON = { info: Info, warn: AlertTriangle, ok: CheckCircle2, err: XCircle }
export function Callout({ tone = 'info', children, title }: { tone?: keyof typeof CALLOUT_ICON; children: ReactNode; title?: string }) {
  const I = CALLOUT_ICON[tone]
  return (
    <div className={`callout ${tone}`} role={tone === 'err' ? 'alert' : undefined}>
      <I size={18} aria-hidden />
      <div>
        {title && <strong style={{ display: 'block', marginBottom: 2 }}>{title}</strong>}
        {children}
      </div>
    </div>
  )
}

export function Tip({ text, children }: { text: string; children?: ReactNode }) {
  const id = useId()
  return (
    <span className="tip">
      {children ?? (
        <button type="button" className="tip-btn" aria-describedby={id} aria-label="Mais informações">
          <HelpCircle size={14} />
        </button>
      )}
      <span role="tooltip" id={id}>
        {text}
      </span>
    </span>
  )
}

export function CatDot({ c }: { c: Category }) {
  return <span className="cat-dot" style={{ background: `var(--c-${c})` }} aria-hidden />
}

export function CategoryBadge({ c }: { c: Category }) {
  return (
    <span className="badge">
      <CatDot c={c} />
      {CATEGORY_LABEL[c]}
    </span>
  )
}

const DIFF_TONE: Record<Difficulty, string> = { iniciante: 'ok', basico: 'info', intermediario: 'warn', avancado: 'err' }
export function DifficultyBadge({ d }: { d: Difficulty }) {
  return (
    <span className={`badge ${DIFF_TONE[d]}`}>
      <span className="dot" aria-hidden />
      {DIFFICULTY_LABEL[d]}
    </span>
  )
}

/** Modal acessível: foco preso, Esc fecha, foco devolvido ao gatilho. */
export function Modal({ title, onClose, children, footer, wide, icon }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean; icon?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const node = ref.current!
    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute('disabled'))
    const first = node.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[1] ?? focusables()[0]
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'Tab') {
        const f = focusables()
        if (!f.length) return
        const a = f[0]
        const z = f[f.length - 1]
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault()
          z.focus()
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault()
          a.focus()
        }
      }
    }
    node.addEventListener('keydown', onKey)
    const ov = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      node.removeEventListener('keydown', onKey)
      document.body.style.overflow = ov
      prev?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-head">
          {icon && <div className="icon-tile sm">{icon}</div>}
          <h2 id={titleId} style={{ flex: 1 }}>
            {title}
          </h2>
          <button type="button" className="btn ghost icon sm" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

/** Confirmação explícita, sem window.confirm. */
export function useConfirm() {
  const [state, setState] = useState<null | { title: string; body: ReactNode; confirm: string; danger?: boolean; resolve: (v: boolean) => void }>(null)
  const ask = useCallback(
    (opts: { title: string; body: ReactNode; confirm?: string; danger?: boolean }) =>
      new Promise<boolean>((resolve) => setState({ confirm: 'Confirmar', ...opts, resolve })),
    [],
  )
  const close = (v: boolean) => {
    state?.resolve(v)
    setState(null)
  }
  const node = state ? (
    <Modal
      title={state.title}
      onClose={() => close(false)}
      icon={state.danger ? <AlertTriangle size={16} /> : undefined}
      footer={
        <>
          <button className="btn" onClick={() => close(false)} data-autofocus>
            Cancelar
          </button>
          <button className={`btn ${state.danger ? 'danger' : 'primary'}`} onClick={() => close(true)}>
            {state.confirm}
          </button>
        </>
      }
    >
      <div className="muted">{state.body}</div>
    </Modal>
  ) : null
  return { ask, node }
}

export interface MenuAction {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
}

/** Menu contextual (⋯) com navegação por setas. */
export function Kebab({ actions, label = 'Mais ações' }: { actions: MenuAction[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  const onKey = (e: React.KeyboardEvent) => {
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const i = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Escape') {
      setOpen(false)
      ref.current?.querySelector<HTMLElement>('button')?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(i + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(i - 1 + items.length) % items.length]?.focus()
    }
  }
  return (
    <div className="kebab" ref={ref} onKeyDown={onKey}>
      <button type="button" className="btn ghost icon sm" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o) }}>
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="menu" role="menu">
          {actions.map((a) => (
            <button
              key={a.label}
              role="menuitem"
              type="button"
              className={a.danger ? 'danger' : ''}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setOpen(false)
                a.onClick()
              }}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Seg<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  const { toast } = useToast()
  return (
    <button
      type="button"
      className="btn sm copy"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {
          toast('Não foi possível copiar. Selecione o texto manualmente.', 'erro')
        }
      }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
      {done ? 'Copiado' : 'Copiar'}
    </button>
  )
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <div className="code-block">
      <pre>
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  )
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

/** Abre links externos com proteções (noopener, noreferrer). */
export function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const safe = /^https?:\/\//i.test(href) ? href : undefined
  if (!safe) return <span className={className}>{children}</span>
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  )
}

export function download(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
