import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Download, FileText, FolderGit2, Github, LayoutGrid, LayoutList, Plus, Trash2, X, Lightbulb } from 'lucide-react'
import { CATEGORY_LABEL, NOTE_TEMPLATES, PROJECT_TEMPLATES, README_TEMPLATE } from '../data'
import { useData, useStore, useToast } from '../store'
import { uid } from '../lib/id'
import { dayKey } from '../lib/dates'
import { Markdown } from '../ui/markdown'
import { Callout, CategoryBadge, CopyButton, Crumbs, Empty, ExtLink, Field, Modal, PageHead, Progress, Seg, download, useConfirm } from '../ui/ui'
import type { Category, Project, ProjectTemplate } from '../types'

const STATUS: Record<Project['status'], { label: string; tone: string }> = {
  ideia: { label: 'Ideia', tone: '' },
  em_andamento: { label: 'Em andamento', tone: 'accent' },
  pausado: { label: 'Pausado', tone: 'warn' },
  concluido: { label: 'Concluído', tone: 'ok' },
}

function fromTemplate(t?: ProjectTemplate): Project {
  return {
    id: uid('p'),
    name: t?.title ?? '',
    description: t?.description ?? '',
    objectives: t ? t.objectives.map((o) => `- ${o}`).join('\n') : '',
    tech: t?.tech ?? [],
    category: t?.category ?? 'seg_defensiva',
    status: 'ideia',
    checklist: (t?.checklist ?? []).map((text) => ({ text, done: false })),
    evidence: '',
    github: '',
    docs: '',
    learnings: '',
    nextSteps: '',
    templateId: t?.id,
    createdAt: new Date().toISOString(),
  }
}

export default function Projects() {
  const d = useData()
  const { upsert, log } = useStore()
  const nav = useNavigate()
  const [view, setView] = useState<'cards' | 'lista'>('cards')
  const [picking, setPicking] = useState(false)
  const create = (t?: ProjectTemplate) => {
    const p = fromTemplate(t)
    upsert('projects', p)
    log('projeto', `Criou o projeto "${p.name || 'Novo projeto'}"`, p.id)
    nav(`/projetos/${p.id}`)
  }
  const sorted = [...d.projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <PageHead
        eyebrow={<>{d.projects.filter((p) => p.status === 'concluido').length} concluídos · {d.projects.length} no total</>}
        title="Projetos e portfólio"
        desc="Transforme estudos em evidências profissionais. Um projeto só aparece como concluído quando todo o checklist estiver feito."
        actions={
          <>
            {d.projects.length > 0 && <Seg label="Visualização" value={view} onChange={setView} options={[{ value: 'cards', label: <LayoutGrid size={15} aria-label="Cards" /> }, { value: 'lista', label: <LayoutList size={15} aria-label="Lista" /> }]} />}
            <button className="btn primary" onClick={() => setPicking(true)}><Plus size={16} /> Novo projeto</button>
          </>
        }
      />
      {d.projects.length === 0 ? (
        <>
          <Empty icon={<FolderGit2 size={20} />} title="Nenhum projeto ainda">Comece por um projeto pequeno e bem documentado — vale mais que um grande e inacabado. Sugestões para iniciantes:</Empty>
          <div className="auto-grid" style={{ marginTop: 'var(--gap)' }}>
            {PROJECT_TEMPLATES.map((t) => <TemplateCard key={t.id} t={t} onUse={() => create(t)} />)}
          </div>
        </>
      ) : view === 'cards' ? (
        <div className="auto-grid">
          {sorted.map((p) => {
            const done = p.checklist.filter((c) => c.done).length
            return (
              <Link key={p.id} to={`/projetos/${p.id}`} className="card module-card">
                <div className="row between">
                  <span className={`badge ${STATUS[p.status].tone}`}>{STATUS[p.status].label}</span>
                  {p.github && <Github size={16} className="dim" aria-label="Tem link do GitHub" />}
                </div>
                <h3>{p.name || 'Projeto sem nome'}</h3>
                <p className="small muted">{p.description || 'Sem descrição.'}</p>
                <div className="module-meta">
                  <CategoryBadge c={p.category} />
                  {p.tech.slice(0, 3).map((t) => <span key={t} className="badge">{t}</span>)}
                </div>
                {p.checklist.length > 0 && <Progress value={(done / p.checklist.length) * 100} label={`Checklist de ${p.name}`} tone={p.status === 'concluido' ? 'ok' : undefined} />}
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Projeto</th><th>Status</th><th>Categoria</th><th>Checklist</th><th>GitHub</th></tr></thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/projetos/${p.id}`}>{p.name || 'Projeto sem nome'}</Link></td>
                  <td><span className={`badge ${STATUS[p.status].tone}`}>{STATUS[p.status].label}</span></td>
                  <td className="small">{CATEGORY_LABEL[p.category]}</td>
                  <td className="small tabular">{p.checklist.filter((c) => c.done).length}/{p.checklist.length}</td>
                  <td>{p.github ? <ExtLink href={p.github}>link</ExtLink> : <span className="dim">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {picking && (
        <Modal title="Novo projeto" onClose={() => setPicking(false)} wide icon={<FolderGit2 size={16} />}>
          <button className="list-item link" style={{ width: '100%', marginBottom: 12 }} onClick={() => create()} data-autofocus>
            <Plus size={16} /> <span className="small">Projeto em branco</span>
          </button>
          <p className="small muted" style={{ marginBottom: 10 }}>Ou parta de uma sugestão para iniciantes:</p>
          <div className="stack-sm">
            {PROJECT_TEMPLATES.map((t) => (
              <button key={t.id} className="list-item link" style={{ textAlign: 'left' }} onClick={() => create(t)}>
                <FolderGit2 size={16} />
                <span className="grow"><span className="small" style={{ fontWeight: 520 }}>{t.title}</span><span className="xs dim" style={{ display: 'block' }}>{t.description}</span></span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}

function TemplateCard({ t, onUse }: { t: ProjectTemplate; onUse: () => void }) {
  return (
    <div className="card stack-sm">
      <CategoryBadge c={t.category} />
      <h3>{t.title}</h3>
      <p className="small muted">{t.description}</p>
      <div className="module-meta">{t.tech.map((x) => <span key={x} className="badge">{x}</span>)}</div>
      <button className="btn sm" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={onUse}><Plus size={14} /> Usar como ponto de partida</button>
    </div>
  )
}

export function ProjectPage() {
  const { id = '' } = useParams()
  const p = useData().projects.find((x) => x.id === id)
  if (!p) return <Empty icon={<FolderGit2 size={20} />} title="Projeto não encontrado" action={<Link to="/projetos" className="btn">Ver projetos</Link>} />
  return <ProjectEditor key={p.id} initial={p} />
}

function ProjectEditor({ initial }: { initial: Project }) {
  const { upsert, remove, log } = useStore()
  const { toast } = useToast()
  const nav = useNavigate()
  const confirm = useConfirm()
  const [p, setP] = useState(initial)
  const [techText, setTechText] = useState(initial.tech.join(', '))
  const [newItem, setNewItem] = useState('')
  const [doc, setDoc] = useState<null | 'readme' | 'report'>(null)
  const [ghErr, setGhErr] = useState('')
  const first = useRef(true)
  const latest = useRef(p)
  latest.current = p
  const deleted = useRef(false)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    const t = setTimeout(() => upsert('projects', p), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p])
  useEffect(() => () => { if (!deleted.current) upsert('projects', latest.current) }, [upsert])

  const set = <K extends keyof Project>(k: K, v: Project[K]) => setP((x) => ({ ...x, [k]: v }))
  const allDone = p.checklist.length > 0 && p.checklist.every((c) => c.done)

  const setStatus = (s: Project['status']) => {
    if (s === 'concluido') {
      if (!allDone) return toast('Conclua todos os itens do checklist antes de marcar o projeto como concluído.', 'info')
      setP((x) => ({ ...x, status: s, endDate: x.endDate ?? dayKey() }))
      log('projeto', `Concluiu o projeto "${p.name}"`, p.id)
      toast('Projeto concluído')
      return
    }
    setP((x) => ({ ...x, status: s, startDate: s === 'em_andamento' ? x.startDate ?? dayKey() : x.startDate, endDate: undefined }))
  }

  const checkGithub = (v: string) => {
    set('github', v)
    setGhErr(v && !/^https:\/\/(www\.)?github\.com\/[\w.-]+(\/[\w.-]+)?\/?$/.test(v) ? 'Use um link como https://github.com/usuario/repositorio' : '')
  }

  const readme = README_TEMPLATE({ name: p.name, description: p.description, objectives: p.objectives, tech: p.tech, learnings: p.learnings, nextSteps: p.nextSteps })
  const report = NOTE_TEMPLATES.find((t) => t.id === 'nt-lab')!.body.replace('# Lab: ', `# Relatório técnico: ${p.name}`)

  return (
    <>
      <Crumbs items={[{ label: 'Projetos', to: '/projetos' }, { label: p.name || 'Projeto sem nome' }]} />
      <div className="row between wrap" style={{ marginBottom: 18, gap: 12 }}>
        <input className="input" style={{ fontSize: '1.5rem', fontWeight: 620, border: 0, background: 'transparent', padding: '4px 0', flex: 1, minWidth: 240 }} value={p.name} onChange={(e) => set('name', e.target.value)} placeholder="Nome do projeto" aria-label="Nome do projeto" maxLength={120} />
        <div className="btn-row">
          <button className="btn" onClick={() => setDoc('readme')}><FileText size={15} /> Gerar README</button>
          <button className="btn" onClick={() => setDoc('report')}><FileText size={15} /> Modelo de relatório</button>
          <button className="btn ghost icon" aria-label="Excluir projeto" onClick={async () => {
            if (await confirm.ask({ title: 'Excluir projeto?', body: 'Esta ação não pode ser desfeita.', confirm: 'Excluir', danger: true })) {
              deleted.current = true
              remove('projects', p.id)
              nav('/projetos')
            }
          }}><Trash2 size={17} /></button>
        </div>
      </div>

      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <section className="card stack-sm" style={{ gap: 14 }}>
            <div className="row wrap" style={{ gap: 6 }} role="group" aria-label="Status do projeto">
              {(Object.keys(STATUS) as Project['status'][]).map((s) => (
                <button key={s} className={`btn sm ${p.status === s ? 'primary' : ''}`} aria-pressed={p.status === s} onClick={() => setStatus(s)}>{STATUS[s].label}</button>
              ))}
            </div>
            {!allDone && p.status !== 'concluido' && <p className="xs dim">"Concluído" fica disponível quando todo o checklist estiver marcado.</p>}
            <Field label="Descrição"><textarea className="textarea" rows={3} value={p.description} onChange={(e) => set('description', e.target.value)} maxLength={2000} /></Field>
            <Field label="Objetivos"><textarea className="textarea" rows={3} value={p.objectives} onChange={(e) => set('objectives', e.target.value)} maxLength={3000} /></Field>
            <div className="form-grid">
              <Field label="Tecnologias" hint="Separadas por vírgula"><input className="input" value={techText} onChange={(e) => { setTechText(e.target.value); set('tech', e.target.value.split(',').map((t) => t.trim()).filter(Boolean)) }} maxLength={300} /></Field>
              <Field label="Categoria">
                <select className="select" value={p.category} onChange={(e) => set('category', e.target.value as Category)}>
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Início"><input className="input" type="date" value={p.startDate ?? ''} onChange={(e) => set('startDate', e.target.value || undefined)} /></Field>
              <Field label="Conclusão"><input className="input" type="date" value={p.endDate ?? ''} onChange={(e) => set('endDate', e.target.value || undefined)} disabled={p.status !== 'concluido'} /></Field>
              <div className="full"><Field label="Link do GitHub" error={ghErr}><input className="input" type="url" value={p.github} onChange={(e) => checkGithub(e.target.value)} placeholder="https://github.com/usuario/repositorio" aria-invalid={!!ghErr} /></Field></div>
            </div>
          </section>
          <section className="card stack-sm" style={{ gap: 14 }}>
            <Field label="Evidências" hint="Prints descritos, saídas, links para relatórios…"><textarea className="textarea mono" rows={4} value={p.evidence} onChange={(e) => set('evidence', e.target.value)} maxLength={20000} /></Field>
            <Field label="Documentação"><textarea className="textarea" rows={3} value={p.docs} onChange={(e) => set('docs', e.target.value)} maxLength={20000} /></Field>
            <Field label="Aprendizados"><textarea className="textarea" rows={3} value={p.learnings} onChange={(e) => set('learnings', e.target.value)} maxLength={5000} /></Field>
            <Field label="Próximos passos"><textarea className="textarea" rows={2} value={p.nextSteps} onChange={(e) => set('nextSteps', e.target.value)} maxLength={5000} /></Field>
          </section>
        </div>
        <section className="card" aria-labelledby="h-pcheck">
          <div className="card-head">
            <h2 id="h-pcheck">Checklist</h2>
            <span className="spacer" />
            <span className="xs muted tabular">{p.checklist.filter((c) => c.done).length}/{p.checklist.length}</span>
          </div>
          {p.checklist.length > 0 && <div style={{ marginBottom: 10 }}><Progress value={(p.checklist.filter((c) => c.done).length / p.checklist.length) * 100} label="Checklist" /></div>}
          <div className="stack-sm" style={{ gap: 2 }}>
            {p.checklist.map((c, i) => (
              <div key={i} className="row" style={{ gap: 0 }}>
                <label className={`check ${c.done ? 'done' : ''}`} style={{ flex: 1 }}>
                  <input type="checkbox" checked={c.done} onChange={() => set('checklist', p.checklist.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} disabled={p.status === 'concluido'} />
                  <span className="small">{c.text}</span>
                </label>
                <button className="btn ghost icon sm" aria-label={`Remover "${c.text}"`} onClick={() => set('checklist', p.checklist.filter((_, j) => j !== i))} disabled={p.status === 'concluido'}><X size={14} /></button>
              </div>
            ))}
          </div>
          <form className="row" style={{ marginTop: 10 }} onSubmit={(e) => { e.preventDefault(); if (newItem.trim()) { set('checklist', [...p.checklist, { text: newItem.trim(), done: false }]); setNewItem('') } }}>
            <input className="input" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Novo item do checklist" aria-label="Novo item do checklist" maxLength={200} disabled={p.status === 'concluido'} />
            <button className="btn" type="submit" disabled={p.status === 'concluido'}><Plus size={15} /> Adicionar</button>
          </form>
          <div style={{ marginTop: 16 }}>
            <Callout tone="info" title="Dica de portfólio">
              <span className="row" style={{ gap: 6, alignItems: 'flex-start' }}><Lightbulb size={13} style={{ marginTop: 3, flex: 'none' }} /> Use dados fictícios ou anonimizados. Nunca publique logs reais do trabalho, senhas de CTF ou chaves.</span>
            </Callout>
          </div>
        </section>
      </div>

      {doc && (
        <Modal title={doc === 'readme' ? 'README gerado' : 'Modelo de relatório técnico'} onClose={() => setDoc(null)} wide footer={
          <>
            <CopyButton text={doc === 'readme' ? readme : report} />
            <button className="btn primary" onClick={() => download(doc === 'readme' ? 'README.md' : 'relatorio.md', doc === 'readme' ? readme : report, 'text/markdown')}><Download size={15} /> Baixar .md</button>
          </>
        }>
          <p className="xs muted" style={{ marginBottom: 10 }}>{doc === 'readme' ? 'Montado a partir dos campos do projeto. Complete as seções de execução e exemplos antes de publicar.' : 'Estrutura para documentar o projeto como relatório de laboratório.'}</p>
          <div className="card" style={{ background: 'var(--bg-2)', maxHeight: '55vh', overflow: 'auto' }}>
            <Markdown text={doc === 'readme' ? readme : report} />
          </div>
        </Modal>
      )}
      {confirm.node}
    </>
  )
}
