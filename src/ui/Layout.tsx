import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3, Bell, Briefcase, CalendarDays, FlaskConical, FolderGit2, Keyboard, Layers, LayoutGrid, Library, Menu as MenuIcon,
  NotebookPen, Orbit, PanelLeftClose, PanelLeftOpen, Plus, Play, Route, Search, Settings, Target, Trophy, X,
} from 'lucide-react'
import { useData, useStore, useToast } from '../store'
import { achievements, levelFor, totalXp } from '../lib/gamification'
import { isDue } from '../lib/srs'
import { dayKey, relative } from '../lib/dates'
import { SEED_CARDS } from '../data'
import { buildIndex, searchItems, type SearchItem } from '../search'
import { recommend } from '../lib/progress'
import { Modal } from './ui'

const NAV: { group: string; items: { to: string; label: string; icon: typeof LayoutGrid; end?: boolean; badge?: 'review' }[] }[] = [
  {
    group: 'Aprender',
    items: [
      { to: '/', label: 'Overview', icon: LayoutGrid, end: true },
      { to: '/roadmap', label: 'Meu roadmap', icon: Route },
      { to: '/recursos', label: 'Cursos e recursos', icon: Library },
      { to: '/laboratorios', label: 'Laboratórios', icon: FlaskConical },
      { to: '/desafios', label: 'Desafios', icon: Target },
      { to: '/revisao', label: 'Revisão', icon: Layers, badge: 'review' },
    ],
  },
  {
    group: 'Organizar',
    items: [
      { to: '/plano', label: 'Meu plano de estudos', icon: CalendarDays },
      { to: '/notas', label: 'Notas técnicas', icon: NotebookPen },
      { to: '/projetos', label: 'Projetos e portfólio', icon: FolderGit2 },
    ],
  },
  {
    group: 'Evoluir',
    items: [
      { to: '/carreira', label: 'Carreira e vagas', icon: Briefcase },
      { to: '/conquistas', label: 'Conquistas', icon: Trophy },
      { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    ],
  },
]

export function useDueCount(): number {
  const d = useData()
  const today = dayKey()
  return useMemo(() => {
    const ids = [...SEED_CARDS.map((c) => c.id), ...d.userCards.map((c) => c.id)]
    return ids.filter((id) => isDue(d.cardState[id], today)).length
  }, [d.cardState, d.userCards, today])
}

/** Anuncia conquistas recém-desbloqueadas comparando com o estado anterior. */
function AchievementWatcher() {
  const d = useData()
  const { toast } = useToast()
  const prev = useRef<Set<string> | null>(null)
  useEffect(() => {
    const now = new Set(achievements(d).filter((a) => a.unlocked).map((a) => a.id))
    if (prev.current && d.settings.gamification && !d.settings.demo) {
      const fresh = achievements(d).filter((a) => now.has(a.id) && !prev.current!.has(a.id))
      // Mudanças em massa (importação de backup) não geram avalanche de avisos
      if (fresh.length <= 2) for (const a of fresh) toast(`Conquista desbloqueada: ${a.title}`, 'conquista')
    }
    prev.current = now
  }, [d, toast])
  return null
}

export function Layout({ children }: { children: ReactNode }) {
  const d = useData()
  const { setSettings } = useStore()
  const collapsed = d.settings.sidebarCollapsed
  const [menuOpen, setMenuOpen] = useState(false)
  const [palette, setPalette] = useState(false)
  const [shortcuts, setShortcuts] = useState(false)
  const loc = useLocation()
  const due = useDueCount()
  const xp = totalXp(d)
  const lvl = levelFor(xp)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }, [loc.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((p) => !p)
      } else if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '/') {
          e.preventDefault()
          setPalette(true)
        } else if (e.key === '?') {
          setShortcuts(true)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const initials = (d.settings.name || 'Você').trim().slice(0, 1).toUpperCase()

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <a className="skip-link" href="#conteudo" onClick={(e) => { e.preventDefault(); mainRef.current?.focus() }}>
        Pular para o conteúdo
      </a>
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="row between">
          <Link to="/" className="brand" aria-label="CyberStart — início">
            <span className="brand-mark"><Orbit size={19} /></span>
            <span className="brand-text">
              CyberStart
              <small>Cybersecurity do zero</small>
            </span>
          </Link>
          <button className="btn ghost icon sm mobile-only" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
            <X size={18} />
          </button>
        </div>
        <nav>
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="nav-group">{g.group}</div>
              {g.items.map((it) => (
                <NavLink key={it.to} to={it.to} end={it.end} className="nav-link" data-tip={it.label} aria-label={collapsed ? it.label : undefined}>
                  <it.icon size={19} aria-hidden />
                  <span className="nav-label">{it.label}</span>
                  {it.badge === 'review' && due > 0 && (
                    <>
                      <span className="nav-badge" aria-label={`${due} cartões para revisar`}>{due}</span>
                      {collapsed && <span className="nav-badge-dot desktop-only" aria-hidden />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <NavLink to="/configuracoes" className="nav-link" data-tip="Configurações" aria-label={collapsed ? 'Configurações' : undefined}>
            <Settings size={19} aria-hidden />
            <span className="nav-label">Configurações</span>
          </NavLink>
          <button
            type="button"
            className="nav-link desktop-only"
            style={{ border: 0, background: 'transparent', cursor: 'pointer', width: '100%' }}
            onClick={() => setSettings({ sidebarCollapsed: !collapsed })}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            data-tip={collapsed ? 'Expandir' : 'Recolher'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            <span className="nav-label">Recolher menu</span>
          </button>
        </div>
      </aside>
      {menuOpen && <div className="scrim mobile-only" onClick={() => setMenuOpen(false)} aria-hidden />}

      <div className="main">
        {d.settings.demo && (
          <div className="demo-banner">
            Você está vendo <strong>dados de demonstração</strong>. Eles não representam seu progresso real.
            <Link to="/configuracoes#dados">Apagar e começar do zero</Link>
          </div>
        )}
        <header className="topbar">
          <button className="btn ghost icon mobile-only" onClick={() => setMenuOpen(true)} aria-label="Abrir menu" aria-expanded={menuOpen}>
            <MenuIcon size={20} />
          </button>
          <button type="button" className="search-trigger" onClick={() => setPalette(true)} aria-label="Buscar e executar comandos (Ctrl+K)">
            <Search size={16} aria-hidden />
            <span className="truncate">Buscar lições, notas, desafios…</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="top-actions">
            <button className="btn ghost icon desktop-only" onClick={() => setShortcuts(true)} aria-label="Atalhos de teclado">
              <Keyboard size={18} />
            </button>
            <RecentActivity />
            <Link to="/configuracoes" className="btn ghost icon hide-mobile" aria-label="Configurações">
              <Settings size={18} />
            </Link>
            <Link to="/conquistas" className="level-chip" aria-label={`Nível ${lvl.level}, ${xp} XP — ver conquistas`}>
              {d.settings.gamification && <span className="level-text tabular">Nv {lvl.level} · {xp} XP</span>}
              <span className="avatar" aria-hidden>{initials}</span>
            </Link>
          </div>
        </header>
        <main id="conteudo" className="content" ref={mainRef} tabIndex={-1} style={{ outline: 'none' }}>
          <div key={loc.pathname} className="page-enter">{children}</div>
        </main>
      </div>
      <AchievementWatcher />
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
      {shortcuts && <ShortcutsModal onClose={() => setShortcuts(false)} />}
    </div>
  )
}

function RecentActivity() {
  const d = useData()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const recent = useMemo(() => [...d.activity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6), [d.activity])
  const fresh = recent[0] && Date.now() - new Date(recent[0].at).getTime() < 86_400_000
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('keydown', k)
    }
  }, [open])
  return (
    <div className="kebab" ref={ref}>
      <button className="btn ghost icon" aria-label="Atividade recente" aria-expanded={open} onClick={() => setOpen((o) => !o)} style={{ position: 'relative' }}>
        <Bell size={18} />
        {fresh && <span aria-hidden style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 9, background: 'var(--accent-2)' }} />}
      </button>
      {open && (
        <div className="menu" style={{ width: 320 }} role="dialog" aria-label="Atividade recente">
          <div className="xs dim" style={{ padding: '6px 10px' }}>Atividade recente</div>
          {recent.length === 0 ? (
            <p className="small muted" style={{ padding: '6px 10px 10px' }}>Nada por aqui ainda. Conclua uma lição ou registre uma sessão.</p>
          ) : (
            recent.map((a) => (
              <div key={a.id} style={{ padding: '8px 10px' }}>
                <div className="small">{a.label}</div>
                <div className="xs dim">{relative(a.at)}</div>
              </div>
            ))
          )}
          <Link to="/relatorios" onClick={() => setOpen(false)} className="small" style={{ display: 'block', padding: '8px 10px' }}>
            Ver relatórios
          </Link>
        </div>
      )}
    </div>
  )
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const d = useData()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const index = useMemo(() => buildIndex(d), [d])
  const rec = recommend(d)
  const actions: SearchItem[] = [
    ...(rec?.lessonId ? [{ id: 'act-continue', group: 'Ações' as const, title: 'Continuar estudando', meta: rec.module.title, to: `/estudar/${rec.lessonId}`, text: 'continuar estudar' }] : []),
    { id: 'act-note', group: 'Ações', title: 'Criar nota', to: '/notas?nova=1', text: 'criar nova nota' },
    { id: 'act-session', group: 'Ações', title: 'Iniciar sessão de estudo agora', to: '/plano?iniciar=1', text: 'iniciar sessao estudo timer' },
    { id: 'act-task', group: 'Ações', title: 'Adicionar tarefa ao plano', to: '/plano?nova=1', text: 'adicionar tarefa sessao agendar' },
    { id: 'act-roadmap', group: 'Ações', title: 'Abrir roadmap', to: '/roadmap', text: 'abrir roadmap' },
    { id: 'act-res', group: 'Ações', title: 'Buscar recurso', to: '/recursos', text: 'buscar recurso curso' },
    { id: 'act-review', group: 'Ações', title: 'Revisar flashcards', to: '/revisao', text: 'revisar flashcards' },
    { id: 'act-settings', group: 'Ações', title: 'Abrir configurações', to: '/configuracoes', text: 'abrir configuracoes' },
  ]
  const results = q.trim() ? [...searchItems(actions, q, 4), ...searchItems(index, q)] : actions
  const go = (it: SearchItem) => {
    onClose()
    nav(it.to)
  }
  const listId = 'palette-list'
  return (
    <Modal title="Buscar" onClose={onClose} wide>
      <div className="palette" style={{ margin: '-18px -20px' }}>
        <div className="palette-input">
          <Search size={18} className="dim" aria-hidden />
          <input
            autoFocus
            data-autofocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setSel(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSel((s) => Math.min(results.length - 1, s + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSel((s) => Math.max(0, s - 1))
              } else if (e.key === 'Enter' && results[sel]) go(results[sel])
            }}
            placeholder="Digite para buscar ou escolha uma ação…"
            aria-label="Buscar"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[sel] ? `opt-${results[sel].id}` : undefined}
          />
        </div>
        <ul className="palette-list" id={listId} role="listbox" aria-label="Resultados">
          {results.length === 0 && <li className="small muted" style={{ padding: 16 }}>Nenhum resultado para “{q}”.</li>}
          {results.map((it, i) => (
            <li key={it.id} role="presentation">
              {(i === 0 || results[i - 1].group !== it.group) && <div className="palette-group" role="presentation">{it.group}</div>}
              <div id={`opt-${it.id}`} role="option" aria-selected={i === sel} className="palette-item" onMouseMove={() => setSel(i)} onClick={() => go(it)}>
                {it.group === 'Ações' ? (it.id === 'act-continue' ? <Play size={15} /> : <Plus size={15} />) : <Search size={15} />}
                <span className="truncate">{it.title}</span>
                {it.meta && <span className="meta">{it.meta}</span>}
              </div>
            </li>
          ))}
        </ul>
        <div className="palette-foot">
          <span><kbd>↑</kbd> <kbd>↓</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
          <span><kbd>Esc</kbd> fechar</span>
        </div>
      </div>
    </Modal>
  )
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ['Ctrl + K  /  ⌘ + K', 'Abrir busca e comandos'],
    ['/', 'Abrir busca (fora de campos de texto)'],
    ['?', 'Mostrar esta lista'],
    [']  /  [', 'Próxima / anterior lição (no modo de estudo)'],
    ['Espaço', 'Virar flashcard (na revisão)'],
    ['1 – 4', 'Avaliar flashcard: errei, difícil, bom, fácil'],
    ['Esc', 'Fechar janelas e menus'],
  ]
  return (
    <Modal title="Atalhos de teclado" onClose={onClose} icon={<Keyboard size={16} />}>
      <div className="table-wrap">
        <table>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <td className="mono nowrap">{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="xs dim" style={{ marginTop: 10 }}>Os atalhos de letra única só funcionam fora de campos de texto, para não interferir em digitação nem em leitores de tela.</p>
    </Modal>
  )
}
