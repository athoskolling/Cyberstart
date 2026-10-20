import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, FileText, NotebookPen, Pencil, Plus, Search, Star, Trash2, Columns2 } from 'lucide-react'
import { LABS, MODULES, NOTE_TEMPLATES, RESOURCES, labById, moduleById } from '../data'
import { useData, useStore, useToast } from '../store'
import { normalize } from '../lib/grading'
import { uid } from '../lib/id'
import { relative } from '../lib/dates'
import { Markdown } from '../ui/markdown'
import { Empty, Field, Modal, PageHead, Seg, useConfirm } from '../ui/ui'
import type { Note } from '../types'

const CATEGORIES = ['Conceito', 'Comando', 'Incidente', 'Laboratório', 'Vulnerabilidade', 'Revisão', 'Debugging', 'Geral']

export default function Notes() {
  const d = useData()
  const { upsert, remove, log } = useStore()
  const { toast } = useToast()
  const confirm = useConfirm()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [tag, setTag] = useState('all')
  const [fav, setFav] = useState(false)
  const [picking, setPicking] = useState<null | { moduleId?: string; labId?: string }>(null)
  const openId = params.get('id')
  const current = d.notes.find((n) => n.id === openId) ?? null

  useEffect(() => {
    if (params.get('nova')) {
      setPicking({ moduleId: params.get('modulo') ?? undefined, labId: params.get('lab') ?? undefined })
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const create = (tplId: string | null, ctx: { moduleId?: string; labId?: string }) => {
    const tpl = NOTE_TEMPLATES.find((t) => t.id === tplId)
    const lab = ctx.labId ? labById.get(ctx.labId) : undefined
    const now = new Date().toISOString()
    let body = tpl?.body ?? ''
    if (lab && tpl?.id === 'nt-lab') {
      const logx = d.labLogs[lab.id]
      body = `# Lab: ${lab.title}\n\n## Objetivo\n${lab.objective}\n\n## Ambiente\n${lab.environment}\n\n## Passos executados\n${lab.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n## Evidências\n${logx?.evidence ? '```\n' + logx.evidence + '\n```' : ''}\n\n## Resultado\n${logx?.result ?? ''}\n\n## Dificuldades\n${logx?.difficulties ?? ''}\n\n## O que aprendi\n${logx?.lessons ?? ''}\n`
    }
    const n: Note = {
      id: uid('n'),
      title: lab ? `Lab: ${lab.title}` : ctx.moduleId ? moduleById.get(ctx.moduleId)!.title : '',
      body,
      category: tpl?.category ?? 'Geral',
      tags: [],
      favorite: false,
      moduleId: ctx.moduleId ?? (lab ? MODULES.find((m) => m.labs.includes(lab.id))?.id : undefined),
      labId: ctx.labId,
      createdAt: now,
      updatedAt: now,
    }
    upsert('notes', n)
    log('nota', `Criou a nota "${n.title || 'Sem título'}"`, n.id)
    setPicking(null)
    setParams({ id: n.id })
  }

  const tags = useMemo(() => Array.from(new Set(d.notes.flatMap((n) => n.tags))).sort(), [d.notes])
  const list = d.notes
    .filter((n) => (cat === 'all' || n.category === cat) && (tag === 'all' || n.tags.includes(tag)) && (!fav || n.favorite) && (!q.trim() || normalize(`${n.title} ${n.body} ${n.tags.join(' ')}`).includes(normalize(q))))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt))

  const del = async (n: Note) => {
    if (await confirm.ask({ title: 'Excluir nota?', body: `"${n.title || 'Sem título'}" será apagada permanentemente deste dispositivo.`, confirm: 'Excluir', danger: true })) {
      remove('notes', n.id)
      setParams({})
      toast('Nota excluída')
    }
  }

  if (current) return <><Editor key={current.id} note={current} onBack={() => setParams({})} onDelete={() => del(current)} />{confirm.node}</>

  return (
    <>
      <PageHead
        eyebrow={<>{d.notes.length} notas</>}
        title="Notas técnicas"
        desc="Sua base de conhecimento: conceitos, comandos, análises e erros resolvidos. Suporta Markdown com pré-visualização segura — nenhum HTML ou código das notas é executado."
        actions={<button className="btn primary" onClick={() => setPicking({})}><Plus size={16} /> Nova nota</button>}
      />
      <div className="toolbar" role="search">
        <div className="search-box grow">
          <Search size={16} aria-hidden />
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar no título, conteúdo e tags" aria-label="Buscar notas" />
        </div>
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoria">
          <option value="all">Todas as categorias</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        {tags.length > 0 && (
          <select className="select" value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Tag">
            <option value="all">Todas as tags</option>
            {tags.map((t) => <option key={t} value={t}>#{t}</option>)}
          </select>
        )}
        <button className={`btn ${fav ? 'primary' : ''}`} aria-pressed={fav} onClick={() => setFav(!fav)}><Star size={15} /> Favoritas</button>
      </div>

      {d.notes.length === 0 ? (
        <Empty icon={<NotebookPen size={20} />} title="Nenhuma nota ainda" action={<button className="btn primary" onClick={() => setPicking({})}>Criar a primeira nota</button>}>
          Escrever com suas palavras é uma das formas mais eficazes de aprender. Comece por um template: conceito, comando Linux, análise de incidente…
        </Empty>
      ) : list.length === 0 ? (
        <Empty icon={<Search size={20} />} title="Nenhuma nota encontrada">Ajuste a busca ou os filtros.</Empty>
      ) : (
        <div className="auto-grid">
          {list.map((n) => (
            <Link key={n.id} to={`/notas?id=${n.id}`} className="card module-card" style={{ gap: 8 }}>
              <div className="row between">
                <span className="badge">{n.category}</span>
                {n.favorite && <Star size={15} fill="var(--warn)" color="var(--warn)" aria-label="Favorita" />}
              </div>
              <h3>{n.title || 'Sem título'}</h3>
              <p className="small muted" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {n.body.replace(/[#`*>|_-]/g, ' ').replace(/\s+/g, ' ').trim() || 'Nota vazia'}
              </p>
              <div className="row wrap xs dim" style={{ gap: 6, marginTop: 'auto' }}>
                {n.tags.map((t) => <span key={t}>#{t}</span>)}
                <span className="spacer" />
                <span>{relative(n.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {picking && (
        <Modal title="Nova nota" onClose={() => setPicking(null)} wide icon={<FileText size={16} />}>
          <p className="small muted" style={{ marginBottom: 12 }}>Escolha um modelo para começar com uma estrutura útil.</p>
          <div className="auto-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            <button className="list-item link" onClick={() => create(null, picking)} data-autofocus>
              <FileText size={16} /> <span className="small">Em branco</span>
            </button>
            {NOTE_TEMPLATES.map((t) => (
              <button key={t.id} className="list-item link" onClick={() => create(t.id, picking)}>
                <NotebookPen size={16} /> <span className="small">{t.title}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {confirm.node}
    </>
  )
}

function Editor({ note, onBack, onDelete }: { note: Note; onBack: () => void; onDelete: () => void }) {
  const { upsert } = useStore()
  const [n, setN] = useState(note)
  const [tags, setTags] = useState(note.tags.join(', '))
  const [mode, setMode] = useState<'editar' | 'ver' | 'dividir'>(note.body ? 'ver' : 'editar')
  const [status, setStatus] = useState<'salvo' | 'salvando'>('salvo')

  const dirty = useRef<Note | null>(null)
  useEffect(() => {
    if (n === note) return
    dirty.current = n
    setStatus('salvando')
    const t = setTimeout(() => {
      upsert('notes', { ...n, updatedAt: new Date().toISOString() })
      dirty.current = null
      setStatus('salvo')
    }, 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])
  // Salva alterações pendentes ao sair do editor
  useEffect(() => () => { if (dirty.current) upsert('notes', { ...dirty.current, updatedAt: new Date().toISOString() }) }, [upsert])

  const set = <K extends keyof Note>(k: K, v: Note[K]) => setN((p) => ({ ...p, [k]: v }))
  const lab = n.labId ? labById.get(n.labId) : undefined
  const mod = n.moduleId ? moduleById.get(n.moduleId) : undefined

  return (
    <>
      <div className="row between wrap" style={{ marginBottom: 16 }}>
        <button className="btn ghost" onClick={onBack}><ArrowLeft size={16} /> Todas as notas</button>
        <div className="row" style={{ gap: 8 }}>
          <span className="xs dim" aria-live="polite">{status === 'salvando' ? 'Salvando…' : 'Salvo neste dispositivo'}</span>
          <Seg label="Modo do editor" value={mode} onChange={setMode} options={[{ value: 'editar', label: <><Pencil size={14} /> Editar</> }, { value: 'dividir', label: <><Columns2 size={14} /> Dividir</> }, { value: 'ver', label: <><Eye size={14} /> Ver</> }]} />
          <button className="btn ghost icon" aria-pressed={n.favorite} aria-label={n.favorite ? 'Desfavoritar' : 'Favoritar'} onClick={() => set('favorite', !n.favorite)}>
            <Star size={17} fill={n.favorite ? 'var(--warn)' : 'none'} color={n.favorite ? 'var(--warn)' : 'currentColor'} />
          </button>
          <button className="btn ghost icon" aria-label="Excluir nota" onClick={onDelete}><Trash2 size={17} /></button>
        </div>
      </div>
      <div className="card stack-sm" style={{ gap: 14 }}>
        <input className="input" style={{ fontSize: '1.3rem', fontWeight: 600, border: 0, background: 'transparent', padding: '4px 0' }} value={n.title} onChange={(e) => set('title', e.target.value)} placeholder="Título da nota" aria-label="Título" maxLength={160} />
        <div className="form-grid">
          <Field label="Categoria">
            <select className="select" value={n.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Tags" hint="Separadas por vírgula">
            <input className="input" value={tags} onChange={(e) => { setTags(e.target.value); set('tags', e.target.value.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)) }} maxLength={200} />
          </Field>
          <Field label="Módulo relacionado">
            <select className="select" value={n.moduleId ?? ''} onChange={(e) => set('moduleId', e.target.value || undefined)}>
              <option value="">Nenhum</option>
              {MODULES.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </Field>
          <Field label="Laboratório relacionado">
            <select className="select" value={n.labId ?? ''} onChange={(e) => set('labId', e.target.value || undefined)}>
              <option value="">Nenhum</option>
              {LABS.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </Field>
          <Field label="Curso/recurso relacionado">
            <select className="select" value={n.resourceId ?? ''} onChange={(e) => set('resourceId', e.target.value || undefined)}>
              <option value="">Nenhum</option>
              {RESOURCES.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </Field>
        </div>
        {(mod || lab) && (
          <p className="xs muted">
            Ligada a: {mod && <Link to={`/roadmap/${mod.id}`}>{mod.title}</Link>}{mod && lab && ' · '}{lab && <Link to={`/laboratorios/${lab.id}`}>{lab.title}</Link>}
          </p>
        )}
        <div className="grid" style={{ gridTemplateColumns: mode === 'dividir' ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr' }}>
          {mode !== 'ver' && (
            <textarea className="textarea mono" style={{ minHeight: 420 }} value={n.body} onChange={(e) => set('body', e.target.value)} placeholder={'# Título\n\nEscreva em Markdown. Blocos de código entre ``` ganham botão de copiar.'} aria-label="Conteúdo em Markdown" maxLength={100000} />
          )}
          {mode !== 'editar' && (
            <div className="card" style={{ background: 'var(--bg-2)', minHeight: 200 }}>
              {n.body.trim() ? <Markdown text={n.body} /> : <p className="small muted">Nada para pré-visualizar ainda.</p>}
            </div>
          )}
        </div>
        <p className="xs dim">Markdown suportado: títulos (#), listas (- e 1.), tarefas (- [ ]), **negrito**, *itálico*, `código`, blocos ```, citações (&gt;), tabelas e links https.</p>
      </div>
    </>
  )
}
