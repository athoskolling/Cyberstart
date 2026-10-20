import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Circle, CircleDot, Clock, Download, ExternalLink, FlaskConical, ShieldCheck } from 'lucide-react'
import { LABS, labById } from '../data'
import { useData, useStore, useToast } from '../store'
import { minutesLabel } from '../lib/dates'
import { useAutosave } from '../components/useAutosave'
import { Callout, CategoryBadge, CodeBlock, Crumbs, DifficultyBadge, Empty, ExtLink, PageHead, Progress, download } from '../ui/ui'
import type { Lab, LabLog } from '../types'

const STATUS: Record<LabLog['status'], { label: string; tone: string; icon: typeof Circle }> = {
  nao_iniciado: { label: 'Não iniciado', tone: '', icon: Circle },
  em_andamento: { label: 'Em andamento', tone: 'accent', icon: CircleDot },
  concluido: { label: 'Concluído', tone: 'ok', icon: CheckCircle2 },
}
const emptyLog = (): LabLog => ({ status: 'nao_iniciado', steps: {}, evidence: '', result: '', difficulties: '', lessons: '' })

export default function Labs() {
  const d = useData()
  const done = LABS.filter((l) => d.labLogs[l.id]?.status === 'concluido').length
  return (
    <>
      <PageHead
        eyebrow={<>{done}/{LABS.length} concluídos</>}
        title="Laboratórios"
        desc="Prática guiada com registro de evidências. Os comandos rodam no SEU ambiente (VM, WSL, terminal) ou em plataformas feitas para isso — nada é executado dentro do navegador."
      />
      <div style={{ marginBottom: 'var(--gap)' }}>
        <Callout tone="info" title="Ética e segurança">
          Exercícios ofensivos só em ambientes próprios, CTFs ou laboratórios com autorização explícita. Os conjuntos de dados aqui são fictícios e usam faixas de IP reservadas para documentação.
        </Callout>
      </div>
      <div className="auto-grid">
        {LABS.map((l) => {
          const log = d.labLogs[l.id] ?? emptyLog()
          const S = STATUS[log.status]
          const steps = l.steps.filter((_, i) => log.steps[i]).length
          return (
            <Link key={l.id} to={`/laboratorios/${l.id}`} className="card module-card">
              <div className="row between">
                <span className={`badge ${S.tone}`}><S.icon size={11} /> {S.label}</span>
                <span className="xs dim row" style={{ gap: 4 }}><Clock size={12} /> {minutesLabel(l.minutes)}</span>
              </div>
              <div>
                <h3 style={{ marginBottom: 4 }}>{l.title}</h3>
                <p className="small muted">{l.objective}</p>
              </div>
              <div className="module-meta">
                <CategoryBadge c={l.category} />
                <DifficultyBadge d={l.difficulty} />
                {l.externalUrl && <span className="badge info"><ExternalLink size={11} /> Externo</span>}
                {l.dataset && <span className="badge"><Download size={11} /> Dataset</span>}
              </div>
              <Progress value={(steps / l.steps.length) * 100} label={`Etapas de ${l.title}`} tone={log.status === 'concluido' ? 'ok' : undefined} />
            </Link>
          )
        })}
      </div>
    </>
  )
}

export function LabPage() {
  const { id = '' } = useParams()
  const l = labById.get(id)
  if (!l) return <Empty icon={<FlaskConical size={20} />} title="Laboratório não encontrado" action={<Link to="/laboratorios" className="btn">Ver laboratórios</Link>} />
  return <LabView key={l.id} l={l} />
}

function LabView({ l }: { l: Lab }) {
  const d = useData()
  const { updateMeta, log } = useStore()
  const { toast } = useToast()
  const cur = d.labLogs[l.id] ?? emptyLog()
  const patch = (p: Partial<LabLog>) =>
    updateMeta('labLogs', (ll) => {
      const prev = ll[l.id] ?? emptyLog()
      const next = { ...prev, ...p }
      if (next.status === 'nao_iniciado' && (Object.values(next.steps).some(Boolean) || next.evidence)) next.status = 'em_andamento'
      if (!next.startedAt && next.status !== 'nao_iniciado') next.startedAt = new Date().toISOString()
      return { ...ll, [l.id]: next }
    })
  const ev = useAutosave(cur.evidence, (v) => patch({ evidence: v }))
  const res = useAutosave(cur.result, (v) => patch({ result: v }))
  const dif = useAutosave(cur.difficulties, (v) => patch({ difficulties: v }))
  const les = useAutosave(cur.lessons, (v) => patch({ lessons: v }))
  const stepsDone = l.steps.filter((_, i) => cur.steps[i]).length
  const canFinish = stepsDone === l.steps.length && (ev[0].trim().length > 0 || res[0].trim().length > 0)

  const finish = () => {
    if (!canFinish) {
      toast('Conclua todas as etapas e registre evidências ou resultado antes de finalizar.', 'info')
      return
    }
    patch({ status: 'concluido', completedAt: new Date().toISOString() })
    log('lab', `Concluiu o laboratório "${l.title}"`, l.id)
    toast('Laboratório concluído')
  }
  const S = STATUS[cur.status]

  const area = (label: string, hint: string, st: ReturnType<typeof useAutosave>, mono = false) => (
    <label className="field">
      <span className="row between">
        {label}
        <span className="xs dim">{st[2] === 'salvando' ? 'Salvando…' : ''}</span>
      </span>
      <textarea className={`textarea ${mono ? 'mono' : ''}`} rows={mono ? 7 : 3} value={st[0]} onChange={(e) => st[1](e.target.value)} placeholder={hint} maxLength={50000} />
    </label>
  )

  return (
    <>
      <Crumbs items={[{ label: 'Laboratórios', to: '/laboratorios' }, { label: l.title }]} />
      <header className="page-head">
        <div>
          <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
            <span className={`badge ${S.tone}`}><S.icon size={11} /> {S.label}</span>
            <CategoryBadge c={l.category} />
            <DifficultyBadge d={l.difficulty} />
            <span className="badge"><Clock size={11} /> {minutesLabel(l.minutes)}</span>
          </div>
          <h1>{l.title}</h1>
          <p>{l.objective}</p>
        </div>
        <div className="btn-row">
          {l.externalUrl && <ExtLink href={l.externalUrl} className="btn">Abrir ambiente externo <ExternalLink size={14} /></ExtLink>}
          {cur.status === 'concluido' ? (
            <button className="btn" onClick={() => patch({ status: 'em_andamento', completedAt: undefined })}>Reabrir</button>
          ) : (
            <button className="btn primary" onClick={finish} aria-disabled={!canFinish}><CheckCircle2 size={16} /> Finalizar laboratório</button>
          )}
        </div>
      </header>

      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <section className="card stack-sm" style={{ gap: 12 }}>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 14px', margin: 0 }} className="small">
              <dt className="muted">Ambiente</dt><dd style={{ margin: 0 }}>{l.environment}</dd>
              <dt className="muted">Pré-requisitos</dt><dd style={{ margin: 0 }}>{l.prereqs}</dd>
            </dl>
            <p className="small">{l.instructions}</p>
            {l.safety && <p className="xs dim row" style={{ gap: 6 }}><ShieldCheck size={13} /> {l.safety}</p>}
          </section>

          <section className="card" aria-labelledby="h-steps">
            <div className="card-head">
              <h2 id="h-steps">Etapas</h2>
              <span className="spacer" />
              <span className="xs muted">{stepsDone}/{l.steps.length}</span>
            </div>
            <div className="stack-sm" style={{ gap: 2 }}>
              {l.steps.map((s, i) => (
                <label key={i} className={`check ${cur.steps[i] ? 'done' : ''}`}>
                  <input type="checkbox" checked={!!cur.steps[i]} onChange={() => patch({ steps: { ...cur.steps, [i]: !cur.steps[i] } })} disabled={cur.status === 'concluido'} />
                  <span className="small">{s.split('`').map((part, j) => (j % 2 ? <code key={j}>{part}</code> : part))}</span>
                </label>
              ))}
            </div>
          </section>

          {l.dataset && (
            <section className="card" aria-labelledby="h-data">
              <div className="card-head">
                <h2 id="h-data">Dados do laboratório</h2>
                <span className="spacer" />
                <button className="btn sm" onClick={() => download(l.dataset!.name, l.dataset!.content, 'text/plain')}><Download size={14} /> Baixar {l.dataset.name}</button>
              </div>
              <CodeBlock code={l.dataset.content} />
            </section>
          )}
        </div>

        <section className="card stack-sm" style={{ gap: 14 }} aria-label="Registro do laboratório">
          <div className="row between">
            <h2>Registro</h2>
            <span className="xs dim">Salvo automaticamente</span>
          </div>
          {area('Evidências', 'Comandos usados, saídas relevantes, prints descritos…', ev, true)}
          {area('Resultado', 'O que você descobriu / entregou?', res)}
          {area('Dificuldades encontradas', 'Onde travou e como destravou?', dif)}
          {area('Lições aprendidas', 'O que você faria diferente na próxima?', les)}
          {!canFinish && cur.status !== 'concluido' && <p className="xs dim">Para finalizar: conclua todas as etapas e preencha evidências ou resultado.</p>}
          <Link to={`/notas?nova=1&lab=${l.id}`} className="xs">Transformar em nota técnica (template Laboratório) →</Link>
        </section>
      </div>
    </>
  )
}
