import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity as ActivityIcon, ArrowRight, BookOpen, CalendarCheck, CalendarDays, Check, CheckCircle2, Circle, Clock, Flame, FolderGit2,
  Lightbulb, Pencil, Plus, Radar as RadarIcon, Rocket, Route, Target, TrendingUp, CalendarClock, Layers,
} from 'lucide-react'
import { CATEGORY_LABEL, CHALLENGES, MODULES, PHASES, lessonById } from '../data'
import { useData, useStore, useToast } from '../store'
import { categoryDistribution, completedModules, moduleFraction, recommend, roadmapPercent } from '../lib/progress'
import { activeDays, minutesStudied, solvedChallenges, streak, weeklyMissions } from '../lib/gamification'
import { addDays, dayKey, fmt, greeting, minutesLabel, relative, weekStart } from '../lib/dates'
import { AreaChart, Gauge, Radar, Sparkline } from '../ui/charts'
import { CategoryBadge, DifficultyBadge, Empty, Kebab, Progress } from '../ui/ui'
import { CompleteSessionModal, SessionModal, newSession } from '../components/Sessions'
import { useDueCount } from '../ui/Layout'
import type { StudySession } from '../types'

const ACT_ICON = { licao: BookOpen, modulo: Route, desafio: Target, sessao: Clock, nota: Pencil, revisao: Layers, lab: Rocket, projeto: FolderGit2, vaga: CalendarCheck, entrevista: CalendarCheck }

export default function Overview() {
  const d = useData()
  const { upsert } = useStore()
  const { toast } = useToast()
  const [editing, setEditing] = useState<StudySession | null>(null)
  const [completing, setCompleting] = useState<StudySession | null>(null)
  const today = dayKey()
  const now = new Date()
  const rec = recommend(d)
  const pct = roadmapPercent(d)
  const due = useDueCount()
  const isNew = d.activity.length === 0 && d.sessions.length === 0

  const weeks = useMemo(() => {
    const ws = weekStart(today)
    return Array.from({ length: 8 }, (_, i) => {
      const start = addDays(ws, -7 * (7 - i))
      const end = addDays(start, 6)
      return { x: fmt.short(start).replace(/ de /, ' '), y: Math.round((minutesStudied(d, start, end) / 60) * 10) / 10, start }
    })
  }, [d, today])

  const days14 = useMemo(() => {
    const act = activeDays(d)
    return Array.from({ length: 14 }, (_, i) => addDays(today, i - 13)).map((k) => ({
      k,
      active: act.has(k) ? 1 : 0,
      min: d.sessions.filter((s) => s.status === 'concluida' && s.date === k).reduce((a, s) => a + (s.actualMin ?? 0), 0),
      ch: new Set(d.attempts.filter((a) => a.correct && dayKey(new Date(a.at)) === k).map((a) => a.challengeId)).size,
      mods: d.activity.filter((a) => a.type === 'modulo' && dayKey(new Date(a.at)) === k).length,
    }))
  }, [d, today])

  const cumulative = (key: 'ch' | 'mods') => days14.reduce<number[]>((acc, x) => [...acc, (acc[acc.length - 1] ?? 0) + x[key]], [])

  const agenda = useMemo(
    () => d.sessions.filter((s) => s.status === 'planejada').sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? ''))).slice(0, 6),
    [d.sessions],
  )
  const recent = useMemo(() => [...d.activity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 7), [d.activity])
  const dist = categoryDistribution(d)
  const missions = weeklyMissions(d)
  const totalMin = minutesStudied(d)
  const mods = completedModules(d).length
  const solved = solvedChallenges(d).size
  const st = streak(d)
  const nActive = activeDays(d).size
  const projDone = d.projects.filter((p) => p.status === 'concluido').length
  const currentPhase = rec ? PHASES.find((p) => p.n === rec.module.phase)! : PHASES[PHASES.length - 1]

  const message = isNew
    ? 'Bem-vindo. O roadmap começa pelo básico — nenhum conhecimento prévio é exigido.'
    : pct === 100
      ? 'Roadmap concluído. Hora de aprofundar projetos e candidaturas.'
      : st >= 2
        ? `${st} dias seguidos de estudo. Constância vence intensidade.`
        : rec
          ? `Você está na Fase ${rec.module.phase} — ${currentPhase.title}.`
          : 'Continue no seu ritmo.'

  const reschedule = (s: StudySession) => {
    upsert('sessions', { ...s, date: addDays(s.date < today ? today : s.date, 1) })
    toast('Sessão adiada para o dia seguinte')
  }

  const nextLesson = rec?.lessonId ? lessonById.get(rec.lessonId) : null

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">
            <span className="tabular">{fmt.long(now)}</span>
          </div>
          <h1>
            {greeting(now)}
            {d.settings.name ? `, ${d.settings.name}` : ''}.
          </h1>
          <p>{message}</p>
        </div>
        <div className="btn-row">
          <Link to="/plano?iniciar=1" className="btn">
            <Clock size={16} /> Registrar sessão
          </Link>
          {rec?.lessonId && (
            <Link to={`/estudar/${rec.lessonId}`} className="btn primary">
              Continuar estudando <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </header>

      {isNew && (
        <div className="card" style={{ marginBottom: 'var(--gap)' }}>
          <div className="card-head">
            <div className="icon-tile"><Rocket size={18} /></div>
            <div>
              <h2>Comece por aqui</h2>
              <p>Três passos de 5 minutos para o CyberStart trabalhar por você.</p>
            </div>
          </div>
          <div className="grid cols-3">
            <Link to="/configuracoes" className="list-item link">
              <span className="status-ring">1</span>
              <span className="grow"><strong className="small">Defina seu ritmo</strong><br /><span className="xs muted">Nome, horas semanais e dias preferidos</span></span>
            </Link>
            <Link to={rec?.lessonId ? `/estudar/${rec.lessonId}` : '/roadmap'} className="list-item link">
              <span className="status-ring">2</span>
              <span className="grow"><strong className="small">Faça a primeira lição</strong><br /><span className="xs muted">"O que é um algoritmo" — 25 min</span></span>
            </Link>
            <Link to="/plano?nova=1" className="list-item link">
              <span className="status-ring">3</span>
              <span className="grow"><strong className="small">Agende a próxima sessão</strong><br /><span className="xs muted">Compromisso marcado é compromisso cumprido</span></span>
            </Link>
          </div>
        </div>
      )}

      <div className="dash-grid">
        {/* Horas por semana */}
        <section className="card area-chart" aria-labelledby="h-hours">
          <div className="card-head">
            <div className="icon-tile"><TrendingUp size={18} /></div>
            <div>
              <h2 id="h-hours">Horas de estudo</h2>
              <p>Últimas 8 semanas · sessões concluídas</p>
            </div>
          </div>
          {totalMin === 0 ? (
            <Empty icon={<Clock size={20} />} title="Sem sessões registradas" action={<Link to="/plano?iniciar=1" className="btn sm">Registrar a primeira</Link>}>
              O gráfico mostra o tempo real que você registra ao concluir sessões.
            </Empty>
          ) : (
            <AreaChart data={weeks} label="Horas estudadas por semana" unit="h" />
          )}
        </section>

        {/* Continue estudando */}
        <section className="card hero area-hero" aria-labelledby="h-continue">
          <div className="card-head">
            <div>
              <h2 id="h-continue" className="small muted" style={{ fontWeight: 500 }}>Progresso do roadmap</h2>
            </div>
            <span className="spacer" />
            <Link to="/roadmap" className="btn ghost sm">Ver roadmap</Link>
          </div>
          <Gauge value={pct} label="Progresso total do roadmap">
            <span className="big">{pct}%</span>
            <span className="small muted">{mods} de {MODULES.length} módulos</span>
            <span className="xs dim">Fase {currentPhase.n} · {currentPhase.title}</span>
          </Gauge>
          {rec ? (
            <div className="next-card">
              <div className="row between wrap">
                <span className="eyebrow" style={{ margin: 0 }}><Rocket size={13} /> Continue estudando</span>
                <span className="row" style={{ gap: 6 }}>
                  <DifficultyBadge d={rec.module.difficulty} />
                  <span className="badge"><Clock size={11} /> {minutesLabel(nextLesson?.minutes ?? rec.remainingMin)}</span>
                </span>
              </div>
              <h3>{nextLesson ? nextLesson.title : rec.module.title}</h3>
              <p className="small muted">
                {nextLesson ? <>Módulo: <strong style={{ color: 'var(--text)' }}>{rec.module.title}</strong> · </> : null}
                {rec.module.objectives[0]}
              </p>
              <div className="row" style={{ marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  <Progress value={moduleFraction(d, rec.module) * 100} label={`Progresso no módulo ${rec.module.title}`} />
                </div>
                <span className="xs muted tabular">{Math.round(moduleFraction(d, rec.module) * 100)}%</span>
                <Link to={rec.lessonId ? `/estudar/${rec.lessonId}` : `/roadmap/${rec.module.id}`} className="btn primary sm">
                  {rec.lessonId ? 'Continuar' : 'Ver checklist'} <ArrowRight size={14} />
                </Link>
              </div>
              <p className="why">
                <Lightbulb size={14} aria-hidden />
                <span>
                  <strong>Por que agora:</strong> {rec.lessonId ? rec.reason : 'Todas as lições estão feitas — falta concluir o checklist e marcar o módulo.'}
                </span>
              </p>
            </div>
          ) : (
            <div className="next-card"><p className="small">Todos os módulos foram concluídos. Revise com flashcards e foque em projetos.</p></div>
          )}
        </section>

        {/* Agenda */}
        <section className="card area-agenda" aria-labelledby="h-agenda" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div className="icon-tile magenta"><CalendarDays size={18} /></div>
            <div>
              <h2 id="h-agenda">Agenda de estudos</h2>
              <p>Próximas sessões planejadas</p>
            </div>
            <span className="spacer" />
            <Link to="/plano" className="btn ghost sm">Plano</Link>
          </div>
          {agenda.length === 0 ? (
            <Empty icon={<CalendarClock size={20} />} title="Nenhuma sessão planejada">
              Agende blocos curtos nos seus dias preferidos. Eles aparecem aqui com ações rápidas.
            </Empty>
          ) : (
            <ul className="list">
              {agenda.map((s) => {
                const overdue = s.date < today
                return (
                  <li key={s.id} className={`list-item ${s.date === today ? 'highlight' : ''}`}>
                    <button className="btn ghost icon sm" onClick={() => setCompleting(s)} aria-label={`Concluir: ${s.title}`} title="Concluir">
                      <Circle size={20} />
                    </button>
                    <div className="grow">
                      <div className="small truncate" style={{ fontWeight: 520 }}>{s.title}</div>
                      <div className="xs dim">
                        <span style={overdue ? { color: 'var(--err)' } : undefined}>
                          {s.date === today ? 'Hoje' : s.date === addDays(today, 1) ? 'Amanhã' : `${fmt.weekday(s.date)}, ${fmt.short(s.date)}`}
                          {overdue && ' · atrasada'}
                        </span>
                        {s.time && ` · ${s.time}`} · {s.plannedMin} min
                      </div>
                    </div>
                    <span className={`badge ${s.priority === 'alta' ? 'err' : s.priority === 'media' ? 'warn' : ''}`} title={`Prioridade ${s.priority}`}>
                      <span className="dot" />
                      <span className="sr-only">Prioridade {s.priority}</span>
                    </span>
                    <Kebab
                      label={`Ações para ${s.title}`}
                      actions={[
                        { label: 'Concluir', icon: <Check size={15} />, onClick: () => setCompleting(s) },
                        { label: 'Editar', icon: <Pencil size={15} />, onClick: () => setEditing(s) },
                        { label: 'Adiar 1 dia', icon: <CalendarClock size={15} />, onClick: () => reschedule(s) },
                      ]}
                    />
                  </li>
                )
              })}
            </ul>
          )}
          <div style={{ marginTop: 'auto', paddingTop: 14 }}>
            <button className="list-item link" style={{ width: '100%', borderStyle: 'dashed' }} onClick={() => setEditing(newSession({ title: nextLesson?.title ?? '', moduleId: rec?.module.id }))}>
              <span className="icon-tile sm"><Plus size={15} /></span>
              <span className="grow small muted" style={{ textAlign: 'left' }}>Agendar sessão{nextLesson ? ` · ${nextLesson.title}` : ''}</span>
            </button>
          </div>
        </section>

        {/* Distribuição */}
        <section className="card area-radar" aria-labelledby="h-radar">
          <div className="card-head">
            <div className="icon-tile cyan"><RadarIcon size={18} /></div>
            <div>
              <h2 id="h-radar">Distribuição de conhecimento</h2>
              <p>Estimativa a partir de lições e checklists</p>
            </div>
          </div>
          <Radar data={dist.map((x) => ({ label: CATEGORY_LABEL[x.category].replace('Segurança ', 'Seg. '), value: x.value }))} label="Progresso estimado por categoria" />
          <p className="xs dim" style={{ marginTop: 8 }}>
            Mostra quanto do conteúdo de cada área você já percorreu — não mede conhecimento de forma científica.
          </p>
        </section>
      </div>

      {/* Métricas */}
      <div className="stat-grid">
        <Metric icon={<Route size={17} />} tone="" label="Módulos concluídos" value={`${mods}/${MODULES.length}`} sub={mods ? `${pct}% do roadmap` : 'Conclua as lições e o checklist de um módulo'} spark={cumulative('mods')} color="var(--accent)" />
        <Metric icon={<Clock size={17} />} tone="cyan" label="Horas registradas" value={(totalMin / 60).toFixed(1).replace('.', ',')} sub={totalMin ? `${minutesLabel(minutesStudied(d, weekStart(today)))} nesta semana` : 'Conclua uma sessão para registrar tempo'} spark={days14.map((x) => x.min)} color="var(--cyan)" />
        <Metric icon={<Target size={17} />} tone="magenta" label="Desafios resolvidos" value={String(solved)} sub={solved ? `de ${CHALLENGES.length} disponíveis` : 'Comece pelos de nível iniciante'} spark={cumulative('ch')} color="var(--magenta)" />
        <Metric icon={<Flame size={17} />} tone="warn" label="Dias ativos" value={String(nActive)} sub={st ? `Sequência atual: ${st} ${st === 1 ? 'dia' : 'dias'}` : 'Qualquer estudo registrado conta'} spark={days14.map((x) => x.active)} color="var(--warn)" />
        <Metric icon={<FolderGit2 size={17} />} tone="ok" label="Projetos concluídos" value={String(projDone)} sub={d.projects.length ? `${d.projects.length} no total` : 'Projetos viram evidência no portfólio'} color="var(--ok)" />
      </div>

      <div className="grid cols-2" style={{ marginTop: 'var(--gap)' }}>
        {d.settings.gamification && (
          <section className="card" aria-labelledby="h-missions">
            <div className="card-head">
              <div className="icon-tile warn"><Flame size={18} /></div>
              <div>
                <h2 id="h-missions">Missões da semana</h2>
                <p>Reiniciam toda segunda-feira</p>
              </div>
              <span className="spacer" />
              {due > 0 && <Link to="/revisao" className="badge accent">{due} cartões para revisar</Link>}
            </div>
            <ul className="list">
              {missions.map((m) => {
                const done = m.progress >= m.target
                return (
                  <li key={m.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                    <div className="row between">
                      <span className="small row" style={{ gap: 8 }}>
                        {done ? <CheckCircle2 size={16} color="var(--ok)" /> : <Circle size={16} className="dim" />}
                        {m.label}
                      </span>
                      <span className="xs muted tabular">
                        {m.id === 'w-min' ? `${Math.round(m.progress)}/${m.target} min` : `${m.progress}/${m.target}`}
                      </span>
                    </div>
                    <Progress value={(m.progress / m.target) * 100} label={m.label} tone={done ? 'ok' : undefined} />
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        <section className="card" aria-labelledby="h-activity">
          <div className="card-head">
            <div className="icon-tile"><ActivityIcon size={18} /></div>
            <div>
              <h2 id="h-activity">Atividade recente</h2>
              <p>Registro automático das suas ações</p>
            </div>
          </div>
          {recent.length === 0 ? (
            <Empty icon={<ActivityIcon size={20} />} title="Nada registrado ainda">
              Concluir lições, desafios, sessões e notas cria um histórico aqui — e alimenta relatórios e conquistas.
            </Empty>
          ) : (
            <ul className="list">
              {recent.map((a) => {
                const I = ACT_ICON[a.type]
                return (
                  <li key={a.id} className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
                    <span className="icon-tile sm"><I size={14} /></span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="small">{a.label}</div>
                      <div className="xs dim">{relative(a.at)}</div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card" style={{ marginTop: 'var(--gap)' }} aria-labelledby="h-cats">
        <div className="card-head">
          <h2 id="h-cats">Onde você está em cada área</h2>
        </div>
        <div className="auto-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 14 }}>
          {dist.map((c) => (
            <div key={c.category} className="stack-sm" style={{ gap: 6 }}>
              <div className="row between">
                <CategoryBadge c={c.category} />
                <span className="xs muted tabular">{c.value}%</span>
              </div>
              <Progress value={c.value} label={CATEGORY_LABEL[c.category]} />
            </div>
          ))}
        </div>
      </section>

      {editing && <SessionModal initial={editing} onClose={() => setEditing(null)} />}
      {completing && <CompleteSessionModal session={completing} onClose={() => setCompleting(null)} />}
    </>
  )
}

function Metric({ icon, tone, label, value, sub, spark, color }: { icon: React.ReactNode; tone: string; label: string; value: string; sub: string; spark?: number[]; color: string }) {
  return (
    <div className="card stat">
      <div className="stat-top">
        <span className={`icon-tile sm ${tone}`}>{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {spark && spark.some((v) => v > 0) ? <Sparkline values={spark} color={color} label={`${label}: tendência dos últimos 14 dias`} /> : <div style={{ height: 34 }} />}
      <div className="stat-sub">{sub}</div>
    </div>
  )
}
