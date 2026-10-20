import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, ExternalLink, Lightbulb, NotebookPen, RotateCcw } from 'lucide-react'
import { PHASES, RESOURCES, lessonById, moduleById, COST_LABEL } from '../data'
import { useData, useStore } from '../store'
import { useActions } from '../actions'
import { checkText } from '../lib/grading'
import { lessonsDone } from '../lib/progress'
import { minutesLabel } from '../lib/dates'
import { inline } from '../ui/markdown'
import { useAutosave } from '../components/useAutosave'
import { Callout, CodeBlock, Crumbs, Empty, ExtLink, Progress } from '../ui/ui'
import type { Lesson, LessonExercise } from '../types'

const SECTIONS: { key: keyof Lesson; title: string }[] = [
  { key: 'what', title: 'O que é' },
  { key: 'why', title: 'Por que importa' },
  { key: 'how', title: 'Como funciona' },
  { key: 'example', title: 'Exemplo' },
  { key: 'mistake', title: 'Erro comum' },
  { key: 'exercise', title: 'Exercício' },
  { key: 'verify', title: 'Como verificar' },
  { key: 'next', title: 'O que estudar depois' },
]

export default function Study() {
  const { id = '' } = useParams()
  const l = lessonById.get(id)
  if (!l) return <Empty icon={<BookOpen size={20} />} title="Lição não encontrada" action={<Link className="btn" to="/roadmap">Voltar ao roadmap</Link>} />
  return <StudyView key={l.id} lesson={l} />
}

function StudyView({ lesson: l }: { lesson: Lesson }) {
  const d = useData()
  const act = useActions()
  const nav = useNavigate()
  const m = moduleById.get(l.moduleId)!
  const phase = PHASES.find((p) => p.n === m.phase)!
  const idx = m.lessons.indexOf(l.id)
  const prev = idx > 0 ? m.lessons[idx - 1] : null
  const next = idx < m.lessons.length - 1 ? m.lessons[idx + 1] : null
  const done = !!d.lessonProgress[l.id]?.done
  const doneCount = lessonsDone(d, m)
  const remaining = m.lessons.filter((x) => !d.lessonProgress[x]?.done && x !== l.id).reduce((s, x) => s + lessonById.get(x)!.minutes, 0) + (done ? 0 : l.minutes)
  const [notes, setNotes, saveState] = useAutosave(d.moduleProgress[m.id]?.notes ?? '', (v) => act.setModuleNotes(m.id, v))
  const scrollKey = `cs-scroll-${l.id}`
  const restored = useRef(false)

  // Retomar a última posição: lição atual + rolagem
  useEffect(() => {
    act.visitLesson(l.id)
    if (!restored.current) {
      restored.current = true
      try {
        const y = Number(localStorage.getItem(scrollKey))
        if (y > 0) setTimeout(() => window.scrollTo({ top: y }), 50)
      } catch { /* armazenamento indisponível: ignora */ }
    }
    let t: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(t)
      t = setTimeout(() => { try { localStorage.setItem(scrollKey, String(Math.round(window.scrollY))) } catch { /* ignora */ } }, 300)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l.id])

  // Navegação por teclado: [ anterior, ] próxima
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === ']' && next) nav(`/estudar/${next}`)
      if (e.key === '[' && prev) nav(`/estudar/${prev}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, nav])

  const complete = () => {
    act.setLesson(l.id, !done)
    if (!done && next) setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }
  const resource = l.resourceId ? RESOURCES.find((r) => r.id === l.resourceId) : undefined

  return (
    <div className="study">
      <article>
        <Crumbs items={[{ label: 'Roadmap', to: '/roadmap' }, { label: m.title, to: `/roadmap/${m.id}` }, { label: `Lição ${idx + 1}` }]} />
        <header style={{ marginBottom: 20 }}>
          <div className="eyebrow">Fase {m.phase} · {phase.title}</div>
          <h1>{l.title}</h1>
          <div className="row wrap small muted" style={{ marginTop: 10, gap: 14 }}>
            <span className="row" style={{ gap: 6 }}><Clock size={14} /> {minutesLabel(l.minutes)}</span>
            {l.kind === 'external' ? <span className="badge info"><ExternalLink size={11} /> Estudo externo</span> : <span className="badge accent">Lição do CyberStart</span>}
            {done && <span className="badge ok"><CheckCircle2 size={11} /> Concluída</span>}
          </div>
        </header>

        <div className="card">
          {l.kind === 'external' ? (
            <div className="stack-sm">
              <Callout tone="info" title="Este conteúdo fica fora do CyberStart">
                O material abaixo é de outra organização e abre em uma nova aba. O CyberStart não incorpora nem acompanha automaticamente o seu progresso lá — marque aqui quando terminar.
              </Callout>
              <p style={{ marginTop: 8 }}>{l.guidance}</p>
              {resource && (
                <div className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                  <strong>{resource.title}</strong>
                  <span className="xs muted">{resource.org} · {COST_LABEL[resource.cost]} · {resource.language}</span>
                  <span className="xs dim">{resource.costNote}</span>
                </div>
              )}
              <div>
                <a className="btn primary" href={l.url} target="_blank" rel="noopener noreferrer">
                  Abrir material externo <ExternalLink size={15} />
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="callout" style={{ marginBottom: 6 }}>
                <Lightbulb size={18} color="var(--accent-hi)" aria-hidden />
                <div className="small">
                  <strong>Objetivo do módulo:</strong> {m.objectives.join(' · ')}
                </div>
              </div>
              {SECTIONS.map((s, i) => (
                <section key={s.key} className="lesson-section" aria-labelledby={`sec-${s.key}`}>
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <div style={{ minWidth: 0 }}>
                    <h3 id={`sec-${s.key}`}>{s.title}</h3>
                    {s.key === 'example' ? (
                      <div className="stack-sm">
                        <p>{inline(l.example!.text)}</p>
                        {l.example!.code && <CodeBlock code={l.example!.code} />}
                      </div>
                    ) : s.key === 'exercise' ? (
                      <Exercise lessonId={l.id} ex={l.exercise!} />
                    ) : s.key === 'mistake' ? (
                      <Callout tone="warn">{inline(String(l[s.key]))}</Callout>
                    ) : (
                      <p>{inline(String(l[s.key]))}</p>
                    )}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>

        <div className="card row wrap between" style={{ marginTop: 'var(--gap)' }}>
          <div>
            <strong className="small">{done ? 'Lição concluída.' : 'Terminou esta lição?'}</strong>
            <p className="xs muted">{done ? 'Você pode desmarcar se quiser revisar depois.' : 'Marcar como concluída atualiza o roadmap, o XP e as recomendações.'}</p>
          </div>
          <div className="btn-row">
            <button className={`btn ${done ? '' : 'primary'}`} onClick={complete}>
              {done ? <><RotateCcw size={15} /> Desmarcar</> : <><CheckCircle2 size={16} /> Concluir lição</>}
            </button>
            {done && next && (
              <Link className="btn primary" to={`/estudar/${next}`}>Próxima lição <ArrowRight size={15} /></Link>
            )}
            {done && !next && (
              <Link className="btn primary" to={`/roadmap/${m.id}`}>Ver checklist do módulo <ArrowRight size={15} /></Link>
            )}
          </div>
        </div>

        <nav className="row between" style={{ marginTop: 16 }} aria-label="Navegação entre lições">
          {prev ? <Link to={`/estudar/${prev}`} className="btn ghost"><ArrowLeft size={15} /> {lessonById.get(prev)!.title}</Link> : <span />}
          {next ? <Link to={`/estudar/${next}`} className="btn ghost">{lessonById.get(next)!.title} <ArrowRight size={15} /></Link> : <span />}
        </nav>
      </article>

      <aside className="study-aside stack" aria-label="Sumário do módulo">
        <div className="card">
          <div className="small muted" style={{ marginBottom: 4 }}>{m.title}</div>
          <div className="row between xs muted" style={{ marginBottom: 8 }}>
            <span>{doneCount}/{m.lessons.length} lições</span>
            <span>~{minutesLabel(remaining)} restantes</span>
          </div>
          <Progress value={(doneCount / m.lessons.length) * 100} label="Progresso no módulo" />
          <ol className="toc" style={{ marginTop: 12 }}>
            {m.lessons.map((lid, i) => {
              const x = lessonById.get(lid)!
              const ok = d.lessonProgress[lid]?.done
              return (
                <li key={lid}>
                  <Link to={`/estudar/${lid}`} aria-current={lid === l.id ? 'page' : undefined}>
                    <span className={`status-ring ${ok ? 'done' : ''}`}>{ok ? <CheckCircle2 size={12} /> : <span className="xs mono">{i + 1}</span>}</span>
                    <span>
                      {x.title}
                      {x.kind === 'external' && <span className="xs dim"> · externo</span>}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
          <p className="xs dim" style={{ marginTop: 10 }}>Atalhos: <kbd>[</kbd> anterior · <kbd>]</kbd> próxima</p>
        </div>

        <div className="card">
          <div className="row between" style={{ marginBottom: 8 }}>
            <label htmlFor="study-notes" className="small row" style={{ gap: 8, fontWeight: 550 }}><NotebookPen size={15} /> Notas rápidas</label>
            <span className="xs dim" aria-live="polite">{saveState === 'salvando' ? 'Salvando…' : notes ? 'Salvo' : ''}</span>
          </div>
          <textarea id="study-notes" className="textarea" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anote enquanto estuda. Salva sozinho." maxLength={20000} />
          <Link to={`/notas?nova=1&modulo=${m.id}`} className="xs" style={{ display: 'inline-block', marginTop: 8 }}>Criar nota técnica completa →</Link>
        </div>

        {m.resources.length > 0 && (
          <div className="card">
            <div className="small" style={{ fontWeight: 550, marginBottom: 8 }}>Referências</div>
            <ul className="list" style={{ gap: 6 }}>
              {m.resources.map((rid) => {
                const r = RESOURCES.find((x) => x.id === rid)!
                return (
                  <li key={rid} className="small">
                    <ExtLink href={r.url}>{r.title}</ExtLink> <span className="xs dim">· {r.org}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}

function Exercise({ lessonId, ex }: { lessonId: string; ex: LessonExercise }) {
  const d = useData()
  const { updateMeta } = useStore()
  const prevResult = d.lessonProgress[lessonId]?.exerciseCorrect
  const [choice, setChoice] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [result, setResult] = useState<null | boolean>(null)
  const answered = result !== null

  const submit = () => {
    const ok = ex.kind === 'choice' ? choice === ex.answer : checkText(text, ex.accept)
    setResult(ok)
    updateMeta('lessonProgress', (lp) => ({ ...lp, [lessonId]: { done: lp[lessonId]?.done ?? false, ...lp[lessonId], exerciseCorrect: ok || !!lp[lessonId]?.exerciseCorrect } }))
  }
  const reset = () => {
    setResult(null)
    setChoice(null)
    setText('')
  }

  return (
    <div className="stack-sm">
      <p style={{ whiteSpace: 'pre-wrap' }}>{inline(ex.prompt)}</p>
      {prevResult && result === null && <span className="badge ok" style={{ alignSelf: 'flex-start' }}><CheckCircle2 size={11} /> Você já acertou este exercício antes</span>}
      {ex.kind === 'choice' ? (
        <div className="choices" role="group" aria-label="Alternativas">
          {ex.options.map((o, i) => {
            const cls = answered ? (i === ex.answer && result ? 'correct' : i === choice && !result ? 'wrong' : '') : ''
            return (
              <button key={i} type="button" className={`choice ${cls}`} aria-pressed={choice === i} disabled={answered} onClick={() => setChoice(i)}>
                <span className="key">{String.fromCharCode(65 + i)}</span>
                <span className="small">{o}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) submit() }}>
          <input className="input mono" value={text} onChange={(e) => setText(e.target.value)} placeholder={ex.placeholder ?? 'Sua resposta'} disabled={answered} aria-label="Sua resposta" style={{ maxWidth: 320 }} />
        </form>
      )}
      <div className="btn-row">
        {!answered ? (
          <button className="btn primary sm" onClick={submit} disabled={ex.kind === 'choice' ? choice === null : !text.trim()}>Verificar resposta</button>
        ) : (
          <button className="btn sm" onClick={reset}><RotateCcw size={14} /> Tentar de novo</button>
        )}
      </div>
      {answered && (
        <div className="feedback" aria-live="polite">
          <Callout tone={result ? 'ok' : 'err'} title={result ? 'Correto!' : 'Ainda não.'}>
            {result || ex.kind === 'choice' ? ex.explain : <>Releia a seção "Como funciona" e tente de novo. Se quiser ver a explicação agora: <details style={{ display: 'inline' }}><summary style={{ display: 'inline', cursor: 'pointer', color: 'var(--accent-hi)' }}>mostrar</summary> {ex.explain}</details></>}
          </Callout>
        </div>
      )}
    </div>
  )
}
