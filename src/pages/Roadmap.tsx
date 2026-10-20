import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, LayoutList, Lock, Map as MapIcon, BookOpen, CircleDot, Circle } from 'lucide-react'
import { DIFFICULTY_LABEL, MODULES, PHASES } from '../data'
import { useData } from '../store'
import { STATUS_LABEL, lessonsDone, missingPrereqs, moduleFraction, moduleStatus, phaseFraction, roadmapPercent, type ModuleStatus } from '../lib/progress'
import { minutesLabel } from '../lib/dates'
import { CategoryBadge, DifficultyBadge, Empty, PageHead, Progress, Seg } from '../ui/ui'
import type { AppData, Difficulty, Module } from '../types'

const STATUS_ICON: Record<ModuleStatus, typeof Lock> = { bloqueado: Lock, disponivel: Circle, em_andamento: CircleDot, concluido: CheckCircle2 }
const STATUS_TONE: Record<ModuleStatus, string> = { bloqueado: '', disponivel: 'info', em_andamento: 'accent', concluido: 'ok' }

export function StatusBadge({ s }: { s: ModuleStatus }) {
  const I = STATUS_ICON[s]
  return (
    <span className={`badge ${STATUS_TONE[s]}`}>
      <I size={11} aria-hidden /> {STATUS_LABEL[s]}
    </span>
  )
}

const DURATIONS = { any: 'Qualquer duração', short: 'Até 4 h', mid: '4 a 5 h', long: 'Mais de 5 h' } as const

export default function Roadmap() {
  const d = useData()
  const [params, setParams] = useSearchParams()
  const view = (params.get('v') as 'lista' | 'mapa') ?? 'lista'
  const [phase, setPhase] = useState('all')
  const [diff, setDiff] = useState<'all' | Difficulty>('all')
  const [status, setStatus] = useState<'all' | ModuleStatus>('all')
  const [dur, setDur] = useState<keyof typeof DURATIONS>('any')

  const filtered = useMemo(
    () =>
      MODULES.filter((m) => {
        if (phase !== 'all' && String(m.phase) !== phase) return false
        if (diff !== 'all' && m.difficulty !== diff) return false
        if (status !== 'all' && moduleStatus(d, m) !== status) return false
        if (dur === 'short' && m.minutes > 240) return false
        if (dur === 'mid' && (m.minutes <= 240 || m.minutes > 300)) return false
        if (dur === 'long' && m.minutes <= 300) return false
        return true
      }),
    [d, phase, diff, status, dur],
  )
  const hasFilter = phase !== 'all' || diff !== 'all' || status !== 'all' || dur !== 'any'

  return (
    <>
      <PageHead
        eyebrow={<>Roadmap · {roadmapPercent(d)}% concluído</>}
        title="Meu roadmap"
        desc="Nove fases, da lógica de programação à preparação para vagas. Você pode abrir qualquer módulo — os pré-requisitos são recomendações, não bloqueios."
        actions={
          <Seg
            label="Visualização"
            value={view}
            onChange={(v) => setParams(v === 'lista' ? {} : { v }, { replace: true })}
            options={[
              { value: 'lista', label: <><LayoutList size={15} /> Lista</> },
              { value: 'mapa', label: <><MapIcon size={15} /> Mapa</> },
            ]}
          />
        }
      />

      {view === 'mapa' ? (
        <RoadmapMap d={d} />
      ) : (
        <>
          <div className="toolbar" role="search" aria-label="Filtros do roadmap">
            <select className="select" value={phase} onChange={(e) => setPhase(e.target.value)} aria-label="Filtrar por fase">
              <option value="all">Todas as fases</option>
              {PHASES.map((p) => <option key={p.n} value={p.n}>Fase {p.n} · {p.title}</option>)}
            </select>
            <select className="select" value={diff} onChange={(e) => setDiff(e.target.value as typeof diff)} aria-label="Filtrar por dificuldade">
              <option value="all">Toda dificuldade</option>
              {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filtrar por status">
              <option value="all">Todos os status</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="select" value={dur} onChange={(e) => setDur(e.target.value as typeof dur)} aria-label="Filtrar por duração">
              {Object.entries(DURATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {hasFilter && (
              <button className="btn ghost sm" onClick={() => { setPhase('all'); setDiff('all'); setStatus('all'); setDur('any') }}>
                Limpar filtros
              </button>
            )}
            <span className="xs dim" aria-live="polite">{filtered.length} módulos</span>
          </div>

          {filtered.length === 0 ? (
            <Empty icon={<MapIcon size={20} />} title="Nenhum módulo com esses filtros">Ajuste ou limpe os filtros para ver outros módulos.</Empty>
          ) : (
            <div className="stack" style={{ gap: 36 }}>
              {PHASES.map((p) => {
                const ms = filtered.filter((m) => m.phase === p.n)
                if (!ms.length) return null
                const frac = phaseFraction(d, p.n)
                return (
                  <section key={p.n} className="phase" aria-labelledby={`ph-${p.n}`}>
                    <div className="phase-head">
                      <span className={`phase-num ${frac === 1 ? 'done' : ''}`}>{String(p.n).padStart(2, '0')}</span>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <h2 id={`ph-${p.n}`}>{p.title}</h2>
                        <p className="small muted">{p.why}</p>
                      </div>
                      <div style={{ width: 160 }}>
                        <div className="xs muted tabular" style={{ textAlign: 'right', marginBottom: 4 }}>{Math.round(frac * 100)}%</div>
                        <Progress value={frac * 100} label={`Progresso da fase ${p.n}`} />
                      </div>
                    </div>
                    <div className="auto-grid">
                      {ms.map((m) => <ModuleCard key={m.id} m={m} d={d} />)}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}
    </>
  )
}

function ModuleCard({ m, d }: { m: Module; d: AppData }) {
  const s = moduleStatus(d, m)
  const missing = missingPrereqs(d, m)
  const frac = moduleFraction(d, m)
  return (
    <Link to={`/roadmap/${m.id}`} className={`card module-card is-${s}`}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <StatusBadge s={s} />
        <span className="xs dim row" style={{ gap: 4 }}><Clock size={12} /> {minutesLabel(m.minutes)}</span>
      </div>
      <div>
        <h3 style={{ marginBottom: 4 }}>{m.title}</h3>
        <p className="small muted">{m.description}</p>
      </div>
      <div className="module-meta">
        <CategoryBadge c={m.category} />
        <DifficultyBadge d={m.difficulty} />
        <span className="badge"><BookOpen size={11} /> {lessonsDone(d, m)}/{m.lessons.length}</span>
      </div>
      {missing.length > 0 && s === 'bloqueado' && (
        <p className="xs dim">Recomendado antes: {missing.map((x) => x.title).join(', ')}</p>
      )}
      <Progress value={frac * 100} label={`Progresso em ${m.title}`} tone={s === 'concluido' ? 'ok' : undefined} />
    </Link>
  )
}

function RoadmapMap({ d }: { d: AppData }) {
  const nav = useNavigate()
  const colW = 230
  const nodeW = 196
  const nodeH = 68
  const rowH = 96
  const top = 64
  const maxRows = Math.max(...PHASES.map((p) => MODULES.filter((m) => m.phase === p.n).length))
  const W = PHASES.length * colW + 20
  const H = top + maxRows * rowH + 20
  const pos = new Map<string, { x: number; y: number }>()
  for (const p of PHASES) {
    MODULES.filter((m) => m.phase === p.n).forEach((m, i) => pos.set(m.id, { x: 20 + (p.n - 1) * colW, y: top + i * rowH }))
  }
  const COLOR: Record<ModuleStatus, string> = { bloqueado: 'var(--border-strong)', disponivel: 'var(--info)', em_andamento: 'var(--accent)', concluido: 'var(--ok)' }
  return (
    <>
      <div className="legend" style={{ marginBottom: 12 }}>
        {(Object.keys(STATUS_LABEL) as ModuleStatus[]).map((s) => (
          <span key={s}><span className="cat-dot" style={{ background: COLOR[s] }} /> {STATUS_LABEL[s]}</span>
        ))}
        <span className="dim">· Linhas mostram pré-requisitos. Use Tab para navegar pelos módulos e Enter para abrir.</span>
      </div>
      <div className="map-wrap">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Mapa visual do roadmap">
          {PHASES.map((p) => (
            <g key={p.n}>
              <text x={20 + (p.n - 1) * colW} y={28} fill="var(--accent-hi)" fontFamily="var(--mono)" fontSize={11} letterSpacing="0.08em">FASE {String(p.n).padStart(2, '0')}</text>
              <text x={20 + (p.n - 1) * colW} y={46} fill="var(--text-2)" fontSize={12}>{p.title.length > 30 ? p.title.slice(0, 29) + '…' : p.title}</text>
            </g>
          ))}
          {MODULES.flatMap((m) =>
            m.prereqs.map((pid) => {
              const a = pos.get(pid)!
              const b = pos.get(m.id)!
              const x1 = a.x + nodeW
              const y1 = a.y + nodeH / 2
              const x2 = b.x
              const y2 = b.y + nodeH / 2
              const done = !!d.moduleProgress[pid]?.completedAt
              const mx = x1 + (x2 - x1) / 2
              const path = x2 > x1 ? `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}` : `M ${a.x + nodeW / 2} ${a.y + nodeH} L ${b.x + nodeW / 2} ${b.y}`
              return <path key={`${pid}-${m.id}`} d={path} fill="none" stroke={done ? 'var(--accent)' : 'var(--border-strong)'} strokeWidth={done ? 1.8 : 1.2} strokeDasharray={done ? undefined : '4 4'} />
            }),
          )}
          {MODULES.map((m) => {
            const p = pos.get(m.id)!
            const s = moduleStatus(d, m)
            const frac = moduleFraction(d, m)
            return (
              <g
                key={m.id}
                className="map-node"
                transform={`translate(${p.x},${p.y})`}
                tabIndex={0}
                role="link"
                aria-label={`${m.title} — ${STATUS_LABEL[s]}, ${Math.round(frac * 100)}%`}
                onClick={() => nav(`/roadmap/${m.id}`)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), nav(`/roadmap/${m.id}`))}
              >
                <rect width={nodeW} height={nodeH} rx={12} fill="var(--surface)" stroke={COLOR[s]} strokeWidth={s === 'em_andamento' ? 1.8 : 1.2} />
                <circle cx={16} cy={18} r={4.5} fill={COLOR[s]} />
                <text x={28} y={22} fill="var(--text)" fontSize={12.5} fontWeight={560}>{m.title.length > 24 ? m.title.slice(0, 23) + '…' : m.title}</text>
                <text x={16} y={42} fill="var(--text-3)" fontSize={10.5}>{DIFFICULTY_LABEL[m.difficulty]} · {minutesLabel(m.minutes)}</text>
                <rect x={16} y={52} width={nodeW - 32} height={4} rx={2} fill="var(--surface-3)" />
                <rect x={16} y={52} width={(nodeW - 32) * frac} height={4} rx={2} fill={s === 'concluido' ? 'var(--ok)' : 'var(--accent)'} />
              </g>
            )
          })}
        </svg>
      </div>
      <p className="xs dim" style={{ marginTop: 10 }}>
        Dica: módulos de fases diferentes podem ser estudados em paralelo quando os pré-requisitos estão concluídos — por exemplo, Redes (Fase 3) e Linux (Fase 4).
      </p>
    </>
  )
}

