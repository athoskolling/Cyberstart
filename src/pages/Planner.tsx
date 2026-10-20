import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, LayoutList, Lightbulb, Pause, Pencil, Play, Plus, SkipForward, Square, Timer, CalendarClock, Wand2 } from 'lucide-react'
import { moduleById } from '../data'
import { useData, useStore, useToast } from '../store'
import { addDays, dayKey, fmt, minutesLabel, parseDay, weekStart } from '../lib/dates'
import { distribute, suggestWeek } from '../lib/planner'
import { minutesStudied } from '../lib/gamification'
import { CompleteSessionModal, SessionModal, newSession } from '../components/Sessions'
import { Callout, Empty, Kebab, PageHead, Progress, Seg } from '../ui/ui'
import type { StudySession } from '../types'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const TIMER_KEY = 'cs-timer'

export default function Planner() {
  const d = useData()
  const { upsert, setSettings } = useStore()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const today = dayKey()
  const [view, setView] = useState<'semana' | 'lista'>('semana')
  const [ws, setWs] = useState(weekStart(today))
  const [editing, setEditing] = useState<StudySession | null>(null)
  const [completing, setCompleting] = useState<StudySession | null>(null)
  const [listFilter, setListFilter] = useState<'planejada' | 'concluida' | 'todas'>('planejada')

  // Ações vindas da paleta de comandos / outros links
  useEffect(() => {
    if (params.get('nova')) setEditing(newSession())
    const id = params.get('id')
    if (id) {
      const s = d.sessions.find((x) => x.id === id)
      if (s) setEditing(s)
    }
    if (params.get('iniciar')) startTimer()
    if (params.toString()) setParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cronômetro de sessão (o horário de início fica no navegador para sobreviver a recarregamentos)
  const [timerStart, setTimerStart] = useState<number | null>(() => {
    try { const v = localStorage.getItem(TIMER_KEY); return v ? Number(v) : null } catch { return null }
  })
  const [, tick] = useState(0)
  useEffect(() => {
    if (!timerStart) return
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [timerStart])
  function startTimer() {
    const now = Date.now()
    setTimerStart(now)
    try { localStorage.setItem(TIMER_KEY, String(now)) } catch { /* ignora */ }
  }
  const stopTimer = () => {
    if (!timerStart) return
    const min = Math.max(1, Math.round((Date.now() - timerStart) / 60000))
    setTimerStart(null)
    try { localStorage.removeItem(TIMER_KEY) } catch { /* ignora */ }
    const planned = d.sessions.find((s) => s.status === 'planejada' && s.date === today)
    setCompleting(planned ? { ...planned, actualMin: min } : newSession({ title: 'Sessão livre de estudo', plannedMin: min, actualMin: min }))
  }
  const elapsed = timerStart ? Math.floor((Date.now() - timerStart) / 1000) : 0

  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i))
  const weekSessions = d.sessions.filter((s) => s.date >= ws && s.date <= addDays(ws, 6))
  const plannedMin = weekSessions.filter((s) => s.status !== 'pulada').reduce((a, s) => a + s.plannedMin, 0)
  const doneMin = minutesStudied(d, ws, addDays(ws, 6))
  const goal = d.settings.weeklyHours * 60
  const sugg = useMemo(() => suggestWeek(d, today), [d, today])

  const applySuggestions = () => {
    const dates = distribute(sugg.items, d.settings.preferredDays, today)
    sugg.items.forEach((it, i) => upsert('sessions', newSession({ title: it.title, date: dates[i], plannedMin: it.minutes, moduleId: it.moduleId, priority: it.priority, notes: it.reason })))
    toast(`${sugg.items.length} sessão(ões) adicionadas ao plano`)
  }
  const skip = (s: StudySession) => { upsert('sessions', { ...s, status: 'pulada' }); toast('Sessão marcada como pulada') }
  const postpone = (s: StudySession) => { upsert('sessions', { ...s, date: addDays(s.date < today ? today : s.date, 1) }); toast('Sessão adiada') }
  const actions = (s: StudySession) => [
    ...(s.status === 'planejada' ? [{ label: 'Concluir', icon: <Check size={15} />, onClick: () => setCompleting(s) }] : []),
    { label: 'Editar', icon: <Pencil size={15} />, onClick: () => setEditing(s) },
    ...(s.status === 'planejada' ? [{ label: 'Adiar 1 dia', icon: <CalendarClock size={15} />, onClick: () => postpone(s) }, { label: 'Pular', icon: <SkipForward size={15} />, onClick: () => skip(s) }] : []),
    ...(s.status !== 'planejada' ? [{ label: 'Reabrir', icon: <Play size={15} />, onClick: () => upsert('sessions', { ...s, status: 'planejada', actualMin: undefined, completedAt: undefined }) }] : []),
  ]

  const list = d.sessions.filter((s) => listFilter === 'todas' || s.status === listFilter).sort((a, b) => (listFilter === 'concluida' ? -1 : 1) * (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))

  return (
    <>
      <PageHead
        eyebrow={<>Semana de {fmt.short(ws)} · {minutesLabel(doneMin)} estudados</>}
        title="Meu plano de estudos"
        desc="Planeje blocos realistas, registre o tempo real e ajuste. Lembretes funcionam apenas dentro do CyberStart — não há notificações fora do navegador."
        actions={
          <>
            {timerStart ? (
              <button className="btn primary" onClick={stopTimer} aria-live="polite"><Square size={14} /> Parar · <span className="mono tabular">{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</span></button>
            ) : (
              <button className="btn" onClick={startTimer}><Timer size={16} /> Iniciar sessão agora</button>
            )}
            <button className="btn primary" onClick={() => setEditing(newSession())}><Plus size={16} /> Agendar sessão</button>
          </>
        }
      />

      <div className="grid cols-3" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card stack-sm">
          <span className="small muted">Meta semanal</span>
          <div className="row" style={{ alignItems: 'baseline', gap: 6 }}>
            <span className="stat-value">{Math.round((doneMin / 60) * 10) / 10}</span>
            <span className="muted small">de {d.settings.weeklyHours} h estudadas</span>
          </div>
          <Progress value={(doneMin / Math.max(1, goal)) * 100} label="Meta semanal" tone={doneMin >= goal ? 'ok' : undefined} />
          <span className="xs dim">{minutesLabel(plannedMin)} planejados nesta semana</span>
        </div>
        <div className="card stack-sm">
          <label className="small muted" htmlFor="wh">Horas disponíveis por semana</label>
          <div className="row">
            <input id="wh" className="input" type="range" min={1} max={40} value={d.settings.weeklyHours} onChange={(e) => setSettings({ weeklyHours: Number(e.target.value) })} style={{ padding: 0, minHeight: 'auto', border: 0, background: 'none', accentColor: 'var(--accent)' }} />
            <span className="mono tabular" style={{ minWidth: 42 }}>{d.settings.weeklyHours} h</span>
          </div>
          <span className="xs dim">Ritmo sustentável vence maratonas. Entre 6 e 10 h por semana é um bom começo.</span>
        </div>
        <div className="card stack-sm">
          <span className="small muted" id="pd">Dias preferidos</span>
          <div className="row wrap" style={{ gap: 4 }} role="group" aria-labelledby="pd">
            {WEEKDAYS.map((w, i) => {
              const on = d.settings.preferredDays.includes(i)
              return (
                <button key={w} className={`btn sm ${on ? 'primary' : ''}`} style={{ padding: '0 9px' }} aria-pressed={on} onClick={() => setSettings({ preferredDays: on ? d.settings.preferredDays.filter((x) => x !== i) : [...d.settings.preferredDays, i].sort() })}>
                  {w}
                </button>
              )
            })}
          </div>
          <span className="xs dim">Usados para distribuir as sugestões.</span>
        </div>
      </div>

      <section className="card" style={{ marginBottom: 'var(--gap)' }} aria-labelledby="h-sugg">
        <div className="card-head">
          <div className="icon-tile"><Wand2 size={18} /></div>
          <div>
            <h2 id="h-sugg">Sequência recomendada</h2>
            <p>Calculada por regras: revisões vencidas → desafios com erro → módulos em andamento → próximos módulos (pré-requisitos e prioridades de carreira). Sem IA.</p>
          </div>
          <span className="spacer" />
          {sugg.items.length > 0 && <button className="btn primary sm" onClick={applySuggestions}><Plus size={14} /> Adicionar ao plano</button>}
        </div>
        {sugg.items.length === 0 ? (
          <p className="small muted">{sugg.budget <= 0 ? 'Seu tempo semanal já está todo planejado. Ajuste as horas disponíveis para receber mais sugestões.' : 'Nada pendente para sugerir agora.'}</p>
        ) : (
          <ol className="list">
            {sugg.items.map((s, i) => (
              <li key={i} className="list-item">
                <span className="status-ring"><span className="xs mono">{i + 1}</span></span>
                <div className="grow">
                  <div className="small" style={{ fontWeight: 520 }}>{s.title}</div>
                  <div className="xs dim row" style={{ gap: 6 }}><Lightbulb size={12} /> {s.reason}</div>
                </div>
                <span className="badge"><Clock size={11} /> {s.minutes} min</span>
              </li>
            ))}
          </ol>
        )}
        <p className="xs dim" style={{ marginTop: 10 }}>Tempo livre na semana: {minutesLabel(sugg.budget)} (meta de {d.settings.weeklyHours} h − já planejado).</p>
      </section>

      <div className="toolbar">
        <Seg label="Visualização" value={view} onChange={setView} options={[{ value: 'semana', label: <><CalendarDays size={15} /> Semana</> }, { value: 'lista', label: <><LayoutList size={15} /> Lista</> }]} />
        {view === 'semana' ? (
          <div className="row" style={{ gap: 4 }}>
            <button className="btn icon sm" onClick={() => setWs(addDays(ws, -7))} aria-label="Semana anterior"><ChevronLeft size={16} /></button>
            <button className="btn sm" onClick={() => setWs(weekStart(today))}>Esta semana</button>
            <button className="btn icon sm" onClick={() => setWs(addDays(ws, 7))} aria-label="Próxima semana"><ChevronRight size={16} /></button>
            <span className="small muted" style={{ marginLeft: 8 }}>{fmt.short(ws)} – {fmt.short(addDays(ws, 6))}</span>
          </div>
        ) : (
          <Seg label="Filtro" value={listFilter} onChange={setListFilter} options={[{ value: 'planejada', label: 'Pendentes' }, { value: 'concluida', label: 'Concluídas' }, { value: 'todas', label: 'Todas' }]} />
        )}
      </div>

      {view === 'semana' ? (
        <div className="week">
          {days.map((k) => {
            const ss = weekSessions.filter((s) => s.date === k).sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'))
            const dow = parseDay(k).getDay()
            return (
              <section key={k} className={`day-col ${k === today ? 'today' : ''} ${d.settings.preferredDays.includes(dow) ? 'pref' : ''}`} aria-label={`${fmt.weekday(k)} ${fmt.short(k)}`}>
                <div className="row between">
                  <span className="small day-name" style={{ fontWeight: 550, textTransform: 'capitalize' }}>{fmt.weekday(k)}</span>
                  <span className="xs dim">{fmt.short(k)}</span>
                </div>
                {ss.map((s) => (
                  <div key={s.id} className={`session-chip prio-${s.priority} ${s.status !== 'planejada' ? 'done' : ''}`} style={{ position: 'relative' }}>
                    <button className="t" style={{ all: 'unset', cursor: 'pointer', display: 'block', paddingRight: 26 }} onClick={() => (s.status === 'planejada' ? setCompleting(s) : setEditing(s))} aria-label={`${s.title} — ${s.status === 'planejada' ? 'concluir' : 'editar'}`}>
                      <span style={{ display: 'block', fontWeight: 520 }}>{s.title}</span>
                      <span className="dim">{s.time ? `${s.time} · ` : ''}{s.status === 'concluida' ? `${s.actualMin} min feitos` : s.status === 'pulada' ? 'pulada' : `${s.plannedMin} min`}</span>
                    </button>
                    <div style={{ position: 'absolute', top: 2, right: 0 }}><Kebab label={`Ações para ${s.title}`} actions={actions(s)} /></div>
                  </div>
                ))}
                <button className="btn ghost sm" style={{ marginTop: 'auto', justifyContent: 'flex-start' }} onClick={() => setEditing(newSession({ date: k }))} aria-label={`Agendar em ${fmt.weekday(k)} ${fmt.short(k)}`}>
                  <Plus size={14} /> Adicionar
                </button>
              </section>
            )
          })}
        </div>
      ) : list.length === 0 ? (
        <Empty icon={<CalendarDays size={20} />} title="Nenhuma sessão aqui" action={<button className="btn primary" onClick={() => setEditing(newSession())}>Agendar sessão</button>}>
          Use a sequência recomendada acima para montar a semana em um clique.
        </Empty>
      ) : (
        <ul className="list">
          {list.map((s) => (
            <li key={s.id} className={`list-item prio-${s.priority}`}>
              {s.status === 'planejada' ? (
                <button className="btn ghost icon sm" onClick={() => setCompleting(s)} aria-label={`Concluir ${s.title}`}><Square size={18} /></button>
              ) : (
                <span className="icon-tile sm ok"><Check size={14} /></span>
              )}
              <div className="grow">
                <div className="small" style={{ fontWeight: 520, textDecoration: s.status === 'pulada' ? 'line-through' : undefined }}>{s.title}</div>
                <div className="xs dim">
                  {fmt.weekday(s.date)}, {fmt.short(s.date)}{s.time ? ` · ${s.time}` : ''} · {s.status === 'concluida' ? `${s.actualMin} de ${s.plannedMin} min` : `${s.plannedMin} min`}
                  {s.moduleId && ` · ${moduleById.get(s.moduleId)?.title}`}
                  {s.status === 'planejada' && s.date < today && <span style={{ color: 'var(--err)' }}> · atrasada</span>}
                </div>
              </div>
              <span className={`badge ${s.priority === 'alta' ? 'err' : s.priority === 'media' ? 'warn' : ''}`}>{s.priority}</span>
              <Kebab label={`Ações para ${s.title}`} actions={actions(s)} />
            </li>
          ))}
        </ul>
      )}

      {timerStart && (
        <div style={{ marginTop: 'var(--gap)' }}>
          <Callout tone="info" title="Cronômetro em andamento">
            O tempo continua contando mesmo se você navegar pelo CyberStart ou recarregar a página. Faça pausas: <Pause size={12} style={{ verticalAlign: -1 }} /> 50 min de foco + 10 de descanso funciona bem.
          </Callout>
        </div>
      )}

      {editing && <SessionModal initial={editing} onClose={() => setEditing(null)} />}
      {completing && <CompleteSessionModal session={completing} onClose={() => setCompleting(null)} />}
    </>
  )
}
