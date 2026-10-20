import { Link, useParams } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, Circle, ClipboardCheck, Clock, ExternalLink, FlaskConical, Goal, Lock, NotebookPen, Target, Library } from 'lucide-react'
import { LABS, PHASES, RESOURCES, challengeById, lessonById, moduleById, COST_LABEL } from '../data'
import { useData } from '../store'
import { useActions } from '../actions'
import { canComplete, checklistDone, lessonsDone, missingPrereqs, moduleFraction, moduleStatus } from '../lib/progress'
import { solvedChallenges } from '../lib/gamification'
import { minutesLabel } from '../lib/dates'
import { useAutosave } from '../components/useAutosave'
import { CategoryBadge, Callout, Crumbs, DifficultyBadge, Empty, ExtLink, Progress } from '../ui/ui'
import { StatusBadge } from './Roadmap'

export default function ModulePage() {
  const { id = '' } = useParams()
  const m = moduleById.get(id)
  if (!m) return <Empty icon={<BookOpen size={20} />} title="Módulo não encontrado" action={<Link className="btn" to="/roadmap">Voltar ao roadmap</Link>} />
  return <ModuleView key={m.id} id={m.id} />
}

function ModuleView({ id }: { id: string }) {
  const m = moduleById.get(id)!
  const d = useData()
  const act = useActions()
  const s = moduleStatus(d, m)
  const missing = missingPrereqs(d, m)
  const phase = PHASES.find((p) => p.n === m.phase)!
  const mp = d.moduleProgress[m.id]
  const solved = solvedChallenges(d)
  const [notes, setNotes, saveState] = useAutosave(mp?.notes ?? '', (v) => act.setModuleNotes(m.id, v))
  const nextLesson = m.lessons.find((l) => !d.lessonProgress[l]?.done) ?? m.lessons[0]
  const resources = m.resources.map((r) => RESOURCES.find((x) => x.id === r)!).filter(Boolean)
  const labs = m.labs.map((l) => LABS.find((x) => x.id === l)!)
  const allLessons = canComplete(d, m)

  return (
    <>
      <Crumbs items={[{ label: 'Roadmap', to: '/roadmap' }, { label: `Fase ${m.phase} · ${phase.title}`, to: '/roadmap' }, { label: m.title }]} />
      <header className="page-head">
        <div>
          <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
            <StatusBadge s={s} />
            <CategoryBadge c={m.category} />
            <DifficultyBadge d={m.difficulty} />
            <span className="badge"><Clock size={11} /> {minutesLabel(m.minutes)}</span>
          </div>
          <h1>{m.title}</h1>
          <p>{m.description}</p>
        </div>
        <div className="btn-row">
          {mp?.completedAt ? (
            <button className="btn" onClick={() => act.completeModule(m.id, false)}>Reabrir módulo</button>
          ) : (
            <button className="btn" onClick={() => act.completeModule(m.id, true)} disabled={!allLessons} title={allLessons ? undefined : 'Conclua todas as lições primeiro'}>
              <CheckCircle2 size={16} /> Marcar como concluído
            </button>
          )}
          <Link to={`/estudar/${nextLesson}`} className="btn primary">
            {lessonsDone(d, m) ? 'Continuar' : 'Começar'} <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {missing.length > 0 && !mp?.completedAt && (
        <div style={{ marginBottom: 'var(--gap)' }}>
          <Callout tone="warn" title="Fundamentos recomendados antes">
            Este módulo fica mais fácil depois de:{' '}
            {missing.map((x, i) => (
              <span key={x.id}>
                {i > 0 && ', '}
                <Link to={`/roadmap/${x.id}`}>{x.title}</Link>
              </span>
            ))}
            . Você pode estudar agora mesmo assim — o progresso será registrado normalmente.
          </Callout>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 'var(--gap)' }} data-stack>
        <div className="stack">
          <section className="card" aria-labelledby="h-obj">
            <div className="card-head">
              <div className="icon-tile"><Goal size={18} /></div>
              <h2 id="h-obj">Objetivos de aprendizagem</h2>
            </div>
            <ul className="list">
              {m.objectives.map((o) => (
                <li key={o} className="row small" style={{ alignItems: 'flex-start' }}>
                  <ArrowRight size={14} style={{ marginTop: 4, color: 'var(--accent-hi)', flex: 'none' }} /> {o}
                </li>
              ))}
            </ul>
            <div className="divider" />
            <p className="small"><span className="muted">Por que esta fase importa: </span>{phase.why}</p>
          </section>

          <section className="card" aria-labelledby="h-lessons">
            <div className="card-head">
              <div className="icon-tile"><BookOpen size={18} /></div>
              <div>
                <h2 id="h-lessons">Lições</h2>
                <p>{lessonsDone(d, m)} de {m.lessons.length} concluídas</p>
              </div>
            </div>
            <ul className="list">
              {m.lessons.map((lid, i) => {
                const l = lessonById.get(lid)!
                const done = d.lessonProgress[lid]?.done
                return (
                  <li key={lid}>
                    <Link to={`/estudar/${lid}`} className={`list-item link ${mp?.lastLessonId === lid && !done ? 'highlight' : ''}`}>
                      <span className={`status-ring ${done ? 'done' : ''}`}>{done ? <CheckCircle2 size={14} /> : <span className="xs mono">{i + 1}</span>}</span>
                      <span className="grow">
                        <span className="small" style={{ fontWeight: 520 }}>{l.title}</span>
                        <span className="xs dim" style={{ display: 'block' }}>
                          {l.kind === 'external' ? 'Estudo externo · ' : ''}
                          {minutesLabel(l.minutes)}
                        </span>
                      </span>
                      {l.kind === 'external' && <span className="badge info"><ExternalLink size={11} /> Externo</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>

          {(m.challenges.length > 0 || labs.length > 0) && (
            <section className="card" aria-labelledby="h-ex">
              <div className="card-head">
                <div className="icon-tile magenta"><Target size={18} /></div>
                <div>
                  <h2 id="h-ex">Exercícios e avaliação</h2>
                  <p>Avaliação opcional: resolva os desafios do módulo para checar o que aprendeu</p>
                </div>
              </div>
              <ul className="list">
                {m.challenges.map((cid) => {
                  const c = challengeById.get(cid)!
                  const ok = solved.has(cid)
                  return (
                    <li key={cid}>
                      <Link to={`/desafios/${cid}`} className="list-item link">
                        {ok ? <CheckCircle2 size={18} color="var(--ok)" /> : <Circle size={18} className="dim" />}
                        <span className="grow small">{c.title}</span>
                        <span className="badge">{c.points} pts</span>
                      </Link>
                    </li>
                  )
                })}
                {labs.map((l) => (
                  <li key={l.id}>
                    <Link to={`/laboratorios/${l.id}`} className="list-item link">
                      <FlaskConical size={18} className={d.labLogs[l.id]?.status === 'concluido' ? '' : 'dim'} color={d.labLogs[l.id]?.status === 'concluido' ? 'var(--ok)' : undefined} />
                      <span className="grow small">Laboratório: {l.title}</span>
                      <span className="badge">{minutesLabel(l.minutes)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card" aria-labelledby="h-notes">
            <div className="card-head">
              <div className="icon-tile"><NotebookPen size={18} /></div>
              <h2 id="h-notes">Minhas notas do módulo</h2>
              <span className="spacer" />
              <span className="xs dim" aria-live="polite">{saveState === 'salvando' ? 'Salvando…' : notes ? 'Salvo automaticamente' : ''}</span>
            </div>
            <textarea
              className="textarea"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dúvidas, insights, comandos que quer lembrar… (para notas maiores, use Notas técnicas)"
              aria-labelledby="h-notes"
              maxLength={20000}
            />
          </section>
        </div>

        <div className="stack">
          <section className="card" aria-labelledby="h-prog">
            <h2 id="h-prog" className="small muted" style={{ fontWeight: 500, marginBottom: 10 }}>Progresso do módulo</h2>
            <div className="row" style={{ marginBottom: 8 }}>
              <span className="stat-value">{Math.round(moduleFraction(d, m) * 100)}%</span>
            </div>
            <Progress value={moduleFraction(d, m) * 100} label="Progresso do módulo" lg tone={s === 'concluido' ? 'ok' : undefined} />
            <p className="xs dim" style={{ marginTop: 8 }}>Lições valem 70% e o checklist 30%.</p>
            <div className="divider" />
            <p className="small"><strong>Critério de conclusão:</strong> <span className="muted">{m.criteria}</span></p>
            {m.prereqs.length > 0 && (
              <>
                <div className="divider" />
                <p className="small muted" style={{ marginBottom: 8 }}>Pré-requisitos</p>
                <ul className="list">
                  {m.prereqs.map((pid) => {
                    const p = moduleById.get(pid)!
                    const ok = !!d.moduleProgress[pid]?.completedAt
                    return (
                      <li key={pid}>
                        <Link to={`/roadmap/${pid}`} className="row small">
                          {ok ? <CheckCircle2 size={15} color="var(--ok)" /> : <Lock size={15} className="dim" />}
                          {p.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </section>

          <section className="card" aria-labelledby="h-check">
            <div className="card-head">
              <div className="icon-tile ok"><ClipboardCheck size={18} /></div>
              <div>
                <h2 id="h-check">Checklist prático</h2>
                <p>{checklistDone(d, m)} de {m.checklist.length}</p>
              </div>
            </div>
            <div className="stack-sm" style={{ gap: 2 }}>
              {m.checklist.map((item, i) => {
                const on = !!mp?.checklist[i]
                return (
                  <label key={i} className={`check ${on ? 'done' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => act.toggleChecklist(m.id, i)} />
                    <span className="small">{item}</span>
                  </label>
                )
              })}
            </div>
          </section>

          <section className="card" aria-labelledby="h-res">
            <div className="card-head">
              <div className="icon-tile cyan"><Library size={18} /></div>
              <h2 id="h-res">Recursos recomendados</h2>
            </div>
            {resources.length === 0 ? (
              <p className="small muted">Este módulo usa principalmente as lições próprias do CyberStart.</p>
            ) : (
              <ul className="list">
                {resources.map((r) => (
                  <li key={r.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <ExtLink href={r.url} className="small">
                      <strong>{r.title}</strong> <ExternalLink size={12} />
                    </ExtLink>
                    <span className="xs dim">{r.org} · {COST_LABEL[r.cost]} · {r.language}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
