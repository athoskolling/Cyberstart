import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Briefcase, CheckCircle2, Circle, ExternalLink, GraduationCap, History, MessagesSquare, Plus, Trash2, Pencil, ArrowRight } from 'lucide-react'
import { INTERVIEW_QUESTIONS, ROLE_MATRIX, moduleById } from '../data'
import { useData, useStore, useToast } from '../store'
import { normalize } from '../lib/grading'
import { moduleFraction } from '../lib/progress'
import { fmt, dayKey } from '../lib/dates'
import { uid } from '../lib/id'
import { Callout, Empty, ExtLink, Field, Kebab, Modal, PageHead, Progress, Seg, useConfirm } from '../ui/ui'
import type { Job, JobStatus } from '../types'

const JOB_STATUS: Record<JobStatus, string> = {
  interessante: 'Interessante',
  preparando: 'Preparando candidatura',
  candidatado: 'Candidatado',
  entrevista: 'Entrevista',
  oferta: 'Oferta',
  encerrado: 'Encerrado',
}

export default function Career() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('aba') as 'vagas' | 'competencias' | 'entrevistas') ?? 'vagas'
  return (
    <>
      <PageHead
        title="Carreira e vagas"
        desc="Acompanhe candidaturas, compare requisitos com o que você já sabe e treine entrevistas. Cadastre apenas vagas reais que você encontrou — o CyberStart não inventa vagas nem salários."
        actions={
          <Seg
            label="Seção"
            value={tab}
            onChange={(v) => setParams(v === 'vagas' ? {} : { aba: v }, { replace: true })}
            options={[
              { value: 'vagas', label: <><Briefcase size={15} /> Vagas</> },
              { value: 'competencias', label: <><GraduationCap size={15} /> Competências</> },
              { value: 'entrevistas', label: <><MessagesSquare size={15} /> Entrevistas</> },
            ]}
          />
        }
      />
      {tab === 'vagas' && <Jobs />}
      {tab === 'competencias' && <Matrix />}
      {tab === 'entrevistas' && <Interviews />}
    </>
  )
}

function newJob(): Job {
  return { id: uid('j'), company: '', role: '', url: '', requirements: '', status: 'interessante', nextAction: '', notes: '', skillsRequired: [], skillsHave: [], createdAt: new Date().toISOString() }
}

function gaps(j: Job) {
  const have = new Set(j.skillsHave.map(normalize))
  return j.skillsRequired.filter((s) => !have.has(normalize(s)))
}

function Jobs() {
  const d = useData()
  const { upsert, remove } = useStore()
  const { toast } = useToast()
  const confirm = useConfirm()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState<Job | null>(null)
  useEffect(() => {
    const id = params.get('vaga')
    if (id) {
      const j = d.jobs.find((x) => x.id === id)
      if (j) setEditing(j)
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const move = (j: Job, status: JobStatus) => {
    upsert('jobs', { ...j, status, appliedAt: status === 'candidatado' && !j.appliedAt ? dayKey() : j.appliedAt })
    toast(`Movida para "${JOB_STATUS[status]}"`)
  }

  const allGaps = useMemo(() => {
    const count = new Map<string, number>()
    for (const j of d.jobs.filter((x) => x.status !== 'encerrado')) for (const g of gaps(j)) count.set(g, (count.get(g) ?? 0) + 1)
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [d.jobs])

  return (
    <>
      <div className="row between wrap" style={{ marginBottom: 16 }}>
        <p className="small muted">{d.jobs.length} vaga(s) acompanhada(s)</p>
        <button className="btn primary" onClick={() => setEditing(newJob())}><Plus size={16} /> Adicionar vaga</button>
      </div>
      {allGaps.length > 0 && (
        <div style={{ marginBottom: 'var(--gap)' }}>
          <Callout tone="warn" title="Lacunas mais frequentes nas vagas ativas">
            <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
              {allGaps.map(([g, n]) => (
                <Link key={g} to={`/recursos?q=${encodeURIComponent(g)}`} className="badge warn" title="Buscar recursos">{g} · {n}</Link>
              ))}
            </div>
          </Callout>
        </div>
      )}
      {d.jobs.length === 0 ? (
        <Empty icon={<Briefcase size={20} />} title="Nenhuma vaga cadastrada" action={<button className="btn primary" onClick={() => setEditing(newJob())}>Cadastrar uma vaga real</button>}>
          Copie os requisitos de vagas reais de estágio ou júnior. Marcar quais habilidades você já tem revela exatamente o que estudar a seguir.
        </Empty>
      ) : (
        <div className="kanban" role="list" aria-label="Vagas por status">
          {(Object.keys(JOB_STATUS) as JobStatus[]).map((s) => {
            const js = d.jobs.filter((j) => j.status === s)
            return (
              <section key={s} className="kanban-col" role="listitem" aria-label={`${JOB_STATUS[s]}: ${js.length}`}>
                <div className="row between">
                  <span className="small" style={{ fontWeight: 550 }}>{JOB_STATUS[s]}</span>
                  <span className="badge tabular">{js.length}</span>
                </div>
                {js.map((j) => {
                  const g = gaps(j)
                  const cover = j.skillsRequired.length ? Math.round(((j.skillsRequired.length - g.length) / j.skillsRequired.length) * 100) : null
                  return (
                    <article key={j.id} className="card" style={{ padding: 12, boxShadow: 'none' }}>
                      <div className="row" style={{ alignItems: 'flex-start' }}>
                        <button style={{ all: 'unset', cursor: 'pointer', flex: 1, minWidth: 0 }} onClick={() => setEditing(j)}>
                          <div className="small" style={{ fontWeight: 560 }}>{j.role || 'Cargo'}</div>
                          <div className="xs muted">{j.company || 'Empresa'}</div>
                        </button>
                        <Kebab
                          label={`Ações para ${j.role}`}
                          actions={[
                            { label: 'Editar', icon: <Pencil size={15} />, onClick: () => setEditing(j) },
                            ...(Object.keys(JOB_STATUS) as JobStatus[]).filter((x) => x !== s).map((x) => ({ label: `Mover: ${JOB_STATUS[x]}`, icon: <ArrowRight size={15} />, onClick: () => move(j, x) })),
                            { label: 'Excluir', icon: <Trash2 size={15} />, danger: true, onClick: async () => { if (await confirm.ask({ title: 'Excluir vaga?', body: `${j.role} — ${j.company}`, confirm: 'Excluir', danger: true })) remove('jobs', j.id) } },
                          ]}
                        />
                      </div>
                      {cover !== null && (
                        <div style={{ marginTop: 8 }}>
                          <div className="row between xs muted" style={{ marginBottom: 4 }}><span>Requisitos que você tem</span><span>{cover}%</span></div>
                          <Progress value={cover} label="Cobertura de requisitos" />
                        </div>
                      )}
                      {j.nextAction && <p className="xs" style={{ marginTop: 8 }}><span className="dim">Próxima ação:</span> {j.nextAction}</p>}
                    </article>
                  )
                })}
              </section>
            )
          })}
        </div>
      )}
      {editing && <JobModal job={editing} onClose={() => setEditing(null)} />}
      {confirm.node}
    </>
  )
}

function SkillList({ label, items, onChange, hint }: { label: string; items: string[]; onChange: (v: string[]) => void; hint?: string }) {
  const [t, setT] = useState('')
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="row wrap" style={{ gap: 6 }}>
        {items.map((s) => (
          <span key={s} className="badge">{s} <button type="button" onClick={() => onChange(items.filter((x) => x !== s))} aria-label={`Remover ${s}`} style={{ all: 'unset', cursor: 'pointer', marginLeft: 2 }}>×</button></span>
        ))}
      </div>
      <input className="input" value={t} onChange={(e) => setT(e.target.value)} placeholder="Digite e tecle Enter" aria-label={`Adicionar em ${label}`} onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault()
          const v = t.trim().replace(/,$/, '')
          if (v && !items.some((x) => normalize(x) === normalize(v))) onChange([...items, v])
          setT('')
        }
      }} maxLength={60} />
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  )
}

function JobModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const d = useData()
  const { upsert, log } = useStore()
  const { toast } = useToast()
  const [j, setJ] = useState(job)
  const [err, setErr] = useState<Record<string, string>>({})
  const exists = d.jobs.some((x) => x.id === j.id)
  const set = <K extends keyof Job>(k: K, v: Job[K]) => setJ((p) => ({ ...p, [k]: v }))
  const save = () => {
    const e: Record<string, string> = {}
    if (!j.company.trim()) e.company = 'Informe a empresa.'
    if (!j.role.trim()) e.role = 'Informe o cargo.'
    if (j.url && !/^https?:\/\//i.test(j.url)) e.url = 'Use um link completo (https://…).'
    setErr(e)
    if (Object.keys(e).length) return
    const out = { ...j, appliedAt: ['candidatado', 'entrevista', 'oferta'].includes(j.status) && !j.appliedAt ? dayKey() : j.appliedAt }
    upsert('jobs', out)
    if (!exists) log('vaga', `Cadastrou a vaga ${j.role} — ${j.company}`, j.id)
    toast(exists ? 'Vaga atualizada' : 'Vaga adicionada')
    onClose()
  }
  const g = gaps(j)
  return (
    <Modal title={exists ? 'Editar vaga' : 'Nova vaga'} onClose={onClose} wide icon={<Briefcase size={16} />} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></>}>
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); save() }}>
        <Field label="Empresa" error={err.company}><input className="input" data-autofocus value={j.company} onChange={(e) => set('company', e.target.value)} aria-invalid={!!err.company} maxLength={100} /></Field>
        <Field label="Cargo" error={err.role}><input className="input" value={j.role} onChange={(e) => set('role', e.target.value)} aria-invalid={!!err.role} maxLength={120} /></Field>
        <Field label="Status">
          <select className="select" value={j.status} onChange={(e) => set('status', e.target.value as JobStatus)}>
            {Object.entries(JOB_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Data de candidatura"><input className="input" type="date" value={j.appliedAt ?? ''} onChange={(e) => set('appliedAt', e.target.value || undefined)} /></Field>
        <div className="full"><Field label="Link da vaga" error={err.url}><input className="input" type="url" value={j.url} onChange={(e) => set('url', e.target.value)} placeholder="https://" aria-invalid={!!err.url} /></Field></div>
        {j.url && /^https?:\/\//.test(j.url) && <div className="full"><ExtLink href={j.url} className="xs">Abrir vaga <ExternalLink size={11} /></ExtLink></div>}
        <div className="full"><Field label="Requisitos (cole da vaga)"><textarea className="textarea" rows={3} value={j.requirements} onChange={(e) => set('requirements', e.target.value)} maxLength={10000} /></Field></div>
        <div className="full"><SkillList label="Habilidades exigidas" items={j.skillsRequired} onChange={(v) => set('skillsRequired', v)} hint="Ex.: Linux, TCP/IP, SIEM, Python, inglês" /></div>
        <div className="full"><SkillList label="Habilidades que você já tem" items={j.skillsHave} onChange={(v) => set('skillsHave', v)} hint="Use os mesmos nomes da lista acima para o cálculo de lacunas" /></div>
        {j.skillsRequired.length > 0 && (
          <div className="full">
            <Callout tone={g.length ? 'warn' : 'ok'} title={g.length ? `Lacunas de conhecimento (${g.length})` : 'Você cobre todos os requisitos listados'}>
              {g.length > 0 && g.join(' · ')}
            </Callout>
          </div>
        )}
        <div className="full"><Field label="Próxima ação"><input className="input" value={j.nextAction} onChange={(e) => set('nextAction', e.target.value)} placeholder="Ex.: adaptar currículo até sexta" maxLength={200} /></Field></div>
        <div className="full"><Field label="Observações"><textarea className="textarea" rows={2} value={j.notes} onChange={(e) => set('notes', e.target.value)} maxLength={5000} /></Field></div>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}

function Matrix() {
  const d = useData()
  return (
    <>
      <div style={{ marginBottom: 'var(--gap)' }}>
        <Callout tone="info" title="Referência geral, não uma vaga específica">
          A matriz reúne temas recorrentes em descrições de vagas de entrada. Requisitos mudam entre empresas — valide sempre com as vagas reais que você cadastrar na aba Vagas. O nível estimado vem do seu progresso nos módulos relacionados.
        </Callout>
      </div>
      <div className="auto-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))' }}>
        {ROLE_MATRIX.map((r) => {
          const scores = r.competencies.map((c) => (c.modules.length ? c.modules.reduce((s, m) => s + moduleFraction(d, moduleById.get(m)!), 0) / c.modules.length : null))
          const valid = scores.filter((x): x is number => x !== null)
          const overall = valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) : 0
          return (
            <section key={r.id} className="card" aria-labelledby={`r-${r.id}`}>
              <div className="row between" style={{ alignItems: 'flex-start', marginBottom: 6 }}>
                <h2 id={`r-${r.id}`}>{r.title}</h2>
                <span className="badge accent tabular">{overall}%</span>
              </div>
              <p className="small muted" style={{ marginBottom: 14 }}>{r.summary}</p>
              <ul className="list" style={{ gap: 10 }}>
                {r.competencies.map((c, i) => {
                  const sc = scores[i]
                  return (
                    <li key={c.skill}>
                      <div className="row between small" style={{ marginBottom: 4 }}>
                        <span>{c.skill} {c.level === 'diferencial' && <span className="xs dim">· diferencial</span>}</span>
                        <span className="xs muted tabular">{sc === null ? 'autoavaliação' : `${Math.round(sc * 100)}%`}</span>
                      </div>
                      {sc !== null ? <Progress value={sc * 100} label={c.skill} /> : <p className="xs dim">Sem módulo específico no roadmap — avalie por conta própria.</p>}
                      {c.modules.length > 0 && sc !== null && sc < 1 && (
                        <div className="xs" style={{ marginTop: 4 }}>
                          {c.modules.filter((m) => moduleFraction(d, moduleById.get(m)!) < 1).slice(0, 2).map((m) => (
                            <Link key={m} to={`/roadmap/${m}`} style={{ marginRight: 10 }}>{moduleById.get(m)!.title} →</Link>
                          ))}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </>
  )
}

function Interviews() {
  const d = useData()
  const { upsert, log } = useStore()
  const { toast } = useToast()
  const [type, setType] = useState<'tecnica' | 'comportamental'>('tecnica')
  const qs = INTERVIEW_QUESTIONS.filter((q) => q.type === type)
  const [qid, setQid] = useState(qs[0].id)
  const q = INTERVIEW_QUESTIONS.find((x) => x.id === qid) ?? qs[0]
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const history = d.interview.filter((a) => a.questionId === q.id).sort((a, b) => b.at.localeCompare(a.at))
  const detected = q.keyPoints.filter((k) => k.keywords.some((w) => normalize(answer).includes(normalize(w)))).map((k) => k.label)

  const pick = (id: string) => { setQid(id); setAnswer(''); setChecked([]); setSubmitted(false) }
  const submit = () => {
    if (answer.trim().length < 30) return toast('Escreva uma resposta um pouco mais completa (pelo menos 30 caracteres).', 'info')
    setSubmitted(true)
    setChecked(detected)
  }
  const save = () => {
    upsert('interview', { id: uid('ia'), questionId: q.id, answer: answer.trim(), checked, at: new Date().toISOString() })
    log('entrevista', `Treinou a pergunta: ${q.question.slice(0, 60)}…`, q.id)
    toast('Resposta salva no histórico')
    setAnswer('')
    setSubmitted(false)
    setChecked([])
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 'var(--gap)' }} data-stack>
      <div className="stack-sm">
        <Seg label="Tipo de pergunta" value={type} onChange={(v) => { setType(v); pick(INTERVIEW_QUESTIONS.find((x) => x.type === v)!.id) }} options={[{ value: 'tecnica', label: 'Técnicas' }, { value: 'comportamental', label: 'Comportamentais' }]} />
        <ul className="list">
          {qs.map((x) => {
            const n = d.interview.filter((a) => a.questionId === x.id).length
            return (
              <li key={x.id}>
                <button className={`list-item link ${x.id === q.id ? 'highlight' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => pick(x.id)} aria-current={x.id === q.id}>
                  {n ? <CheckCircle2 size={16} color="var(--ok)" /> : <Circle size={16} className="dim" />}
                  <span className="grow small">{x.question}</span>
                  {n > 0 && <span className="badge tabular">{n}×</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="stack">
        <section className="card stack-sm" style={{ gap: 14 }}>
          <h2>{q.question}</h2>
          <p className="small muted">{q.guidance}</p>
          <textarea className="textarea" rows={8} value={answer} onChange={(e) => { setAnswer(e.target.value); setSubmitted(false) }} placeholder="Responda como se estivesse falando com o entrevistador. Depois compare com os pontos-chave." aria-label="Sua resposta" maxLength={8000} />
          {!submitted ? (
            <button className="btn primary" style={{ alignSelf: 'flex-start' }} onClick={submit}>Ver feedback</button>
          ) : (
            <div className="stack-sm">
              <Callout tone={checked.length >= q.keyPoints.length - 1 ? 'ok' : 'info'} title={`Pontos-chave: ${checked.length} de ${q.keyPoints.length}`}>
                Marcamos automaticamente os pontos cujas palavras-chave aparecem na sua resposta. É uma checagem simples, não uma nota: revise e ajuste as marcações com honestidade.
              </Callout>
              <div className="stack-sm" style={{ gap: 2 }}>
                {q.keyPoints.map((k) => (
                  <label key={k.label} className={`check ${checked.includes(k.label) ? '' : ''}`}>
                    <input type="checkbox" checked={checked.includes(k.label)} onChange={() => setChecked((c) => (c.includes(k.label) ? c.filter((x) => x !== k.label) : [...c, k.label]))} />
                    <span className="small">{k.label}{!checked.includes(k.label) && <span className="xs dim"> — tente incluir na próxima versão</span>}</span>
                  </label>
                ))}
              </div>
              <div className="btn-row">
                <button className="btn primary" onClick={save}>Salvar no histórico</button>
                <button className="btn ghost" onClick={() => setSubmitted(false)}>Continuar editando</button>
              </div>
            </div>
          )}
        </section>
        <section className="card" aria-labelledby="h-ih">
          <div className="card-head">
            <div className="icon-tile sm"><History size={15} /></div>
            <h2 id="h-ih">Evolução nesta pergunta</h2>
          </div>
          {history.length === 0 ? (
            <p className="small muted">Suas respostas salvas aparecem aqui para você comparar versões ao longo do tempo.</p>
          ) : (
            <ul className="list">
              {history.map((h) => (
                <li key={h.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div className="row between xs muted"><span>{fmt.dateTime(h.at)}</span><span className="badge tabular">{h.checked.length}/{q.keyPoints.length} pontos</span></div>
                  <p className="small" style={{ whiteSpace: 'pre-wrap' }}>{h.answer}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
