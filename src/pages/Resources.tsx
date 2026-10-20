import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bookmark, BookmarkCheck, ExternalLink, Library, Plus, Search, Star, Trash2, BadgeCheck } from 'lucide-react'
import { CATEGORY_LABEL, COST_LABEL, DIFFICULTY_LABEL, RESOURCES, moduleById } from '../data'
import { useData, useStore, useToast } from '../store'
import { normalize } from '../lib/grading'
import { uid } from '../lib/id'
import { CategoryBadge, DifficultyBadge, Empty, ExtLink, Field, Modal, PageHead, useConfirm } from '../ui/ui'
import type { Category, CostType, Difficulty, Resource, ResourceState } from '../types'

const STATUS_LABEL: Record<ResourceState['status'], string> = { nenhum: 'Sem status', planejado: 'Quero estudar', estudando: 'Estudando', concluido: 'Concluído' }
const COST_TONE: Record<CostType, string> = { gratuito: 'ok', gratuito_limitado: 'info', freemium: 'warn', pago: 'err' }

export default function Resources() {
  const d = useData()
  const { updateMeta, remove } = useStore()
  const { toast } = useToast()
  const confirm = useConfirm()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [cat, setCat] = useState<'all' | Category>('all')
  const [cost, setCost] = useState<'all' | CostType>('all')
  const [lang, setLang] = useState<'all' | 'pt' | 'en'>('all')
  const [level, setLevel] = useState<'all' | Difficulty>('all')
  const [status, setStatus] = useState<'all' | 'fav' | ResourceState['status']>('all')
  const [adding, setAdding] = useState(false)

  const all = useMemo(() => [...RESOURCES, ...d.customResources], [d.customResources])
  const st = (id: string): ResourceState => d.resourceState[id] ?? { favorite: false, status: 'nenhum' }
  const setSt = (id: string, patch: Partial<ResourceState>) => updateMeta('resourceState', (rs) => ({ ...rs, [id]: { ...(rs[id] ?? { favorite: false, status: 'nenhum' }), ...patch } }))

  const list = all.filter((r) => {
    const s = st(r.id)
    if (q.trim() && !normalize(`${r.title} ${r.org} ${r.description}`).includes(normalize(q))) return false
    if (cat !== 'all' && r.category !== cat) return false
    if (cost !== 'all' && r.cost !== cost) return false
    if (lang === 'pt' && !/portugu/i.test(r.language)) return false
    if (lang === 'en' && !/ingl/i.test(r.language)) return false
    if (level !== 'all' && r.level !== level) return false
    if (status === 'fav' && !s.favorite) return false
    if (status !== 'all' && status !== 'fav' && s.status !== status) return false
    return true
  })

  return (
    <>
      <PageHead
        eyebrow={<>{all.length} recursos · {Object.values(d.resourceState).filter((s) => s.favorite).length} favoritos</>}
        title="Cursos e recursos"
        desc="Materiais oficiais e gratuitos sempre que possível. Custos e certificados foram conferidos nas páginas oficiais em 20/10/2026 — condições mudam, então confirme antes de se inscrever."
        actions={<button className="btn primary" onClick={() => setAdding(true)}><Plus size={16} /> Adicionar recurso</button>}
      />
      <div className="toolbar" role="search">
        <div className="search-box grow">
          <Search size={16} aria-hidden />
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título, organização ou assunto" aria-label="Buscar recursos" />
        </div>
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} aria-label="Categoria">
          <option value="all">Todas as categorias</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="select" value={cost} onChange={(e) => setCost(e.target.value as typeof cost)} aria-label="Custo">
          <option value="all">Qualquer custo</option>
          {Object.entries(COST_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="select" value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} aria-label="Idioma">
          <option value="all">Qualquer idioma</option>
          <option value="pt">Português</option>
          <option value="en">Inglês</option>
        </select>
        <select className="select" value={level} onChange={(e) => setLevel(e.target.value as typeof level)} aria-label="Nível">
          <option value="all">Qualquer nível</option>
          {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status pessoal">
          <option value="all">Qualquer status</option>
          <option value="fav">Favoritos</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <p className="xs dim" aria-live="polite" style={{ marginTop: -8, marginBottom: 14 }}>{list.length} resultado(s)</p>

      {list.length === 0 ? (
        <Empty icon={<Library size={20} />} title="Nenhum recurso encontrado" action={<button className="btn" onClick={() => { setQ(''); setCat('all'); setCost('all'); setLang('all'); setLevel('all'); setStatus('all') }}>Limpar filtros</button>}>
          Tente outros termos ou filtros — ou adicione um recurso seu.
        </Empty>
      ) : (
        <div className="auto-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}>
          {list.map((r) => {
            const s = st(r.id)
            return (
              <article key={r.id} className="card stack-sm" style={{ gap: 12 }}>
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <div className="grow" style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: '1rem' }}>{r.title}</h2>
                    <p className="xs muted">{r.org}{r.custom ? ' · adicionado por você' : ''}</p>
                  </div>
                  <button className="btn ghost icon sm" aria-pressed={s.favorite} aria-label={s.favorite ? `Remover ${r.title} dos favoritos` : `Favoritar ${r.title}`} onClick={() => setSt(r.id, { favorite: !s.favorite })}>
                    {s.favorite ? <BookmarkCheck size={18} color="var(--accent-hi)" /> : <Bookmark size={18} />}
                  </button>
                </div>
                <p className="small muted">{r.description}</p>
                <div className="row wrap" style={{ gap: 6 }}>
                  <span className={`badge ${COST_TONE[r.cost]}`}>{COST_LABEL[r.cost]}</span>
                  <CategoryBadge c={r.category} />
                  <DifficultyBadge d={r.level} />
                </div>
                <dl className="xs" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', margin: 0 }}>
                  <dt className="dim">Custo</dt><dd style={{ margin: 0 }}>{r.costNote}</dd>
                  {r.certificate && (<><dt className="dim">Certificado</dt><dd style={{ margin: 0 }}>{r.certificate}</dd></>)}
                  <dt className="dim">Idioma</dt><dd style={{ margin: 0 }}>{r.language}</dd>
                  {r.duration && (<><dt className="dim">Duração</dt><dd style={{ margin: 0 }}>{r.duration}</dd></>)}
                  <dt className="dim">Pré-req.</dt><dd style={{ margin: 0 }}>{r.prereqs}</dd>
                  {r.modules.length > 0 && (<><dt className="dim">Roadmap</dt><dd style={{ margin: 0 }}>{r.modules.map((m) => moduleById.get(m)?.title).filter(Boolean).join(' · ')}</dd></>)}
                </dl>
                {r.verifiedAt && <span className="xs dim row" style={{ gap: 4 }}><BadgeCheck size={12} /> Conferido na página oficial em {r.verifiedAt.split('-').reverse().join('/')}</span>}
                <div className="row wrap" style={{ marginTop: 'auto', gap: 8 }}>
                  <select className="select" style={{ width: 'auto', minHeight: 32, padding: '4px 10px', fontSize: '0.82rem' }} value={s.status} onChange={(e) => setSt(r.id, { status: e.target.value as ResourceState['status'] })} aria-label={`Status pessoal de ${r.title}`}>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <Stars value={s.rating} onChange={(v) => setSt(r.id, { rating: v })} label={r.title} />
                  <span className="spacer" />
                  {r.custom && (
                    <button
                      className="btn ghost icon sm"
                      aria-label={`Excluir ${r.title}`}
                      onClick={async () => {
                        if (await confirm.ask({ title: 'Excluir recurso?', body: `"${r.title}" será removido da sua biblioteca.`, confirm: 'Excluir', danger: true })) {
                          remove('customResources', r.id)
                          toast('Recurso excluído')
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <ExtLink href={r.url} className="btn sm">Abrir <ExternalLink size={13} /></ExtLink>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {adding && <AddResource onClose={() => setAdding(false)} />}
      {confirm.node}
    </>
  )
}

function Stars({ value, onChange, label }: { value?: number; onChange: (v: number | undefined) => void; label: string }) {
  return (
    <div className="row" style={{ gap: 0 }} role="group" aria-label={`Avaliação pessoal de ${label}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className="btn ghost icon sm" style={{ width: 24, height: 28 }} aria-label={`${n} estrela${n > 1 ? 's' : ''}`} aria-pressed={(value ?? 0) >= n} onClick={() => onChange(value === n ? undefined : n)}>
          <Star size={14} fill={(value ?? 0) >= n ? 'var(--warn)' : 'none'} color={(value ?? 0) >= n ? 'var(--warn)' : 'var(--text-3)'} />
        </button>
      ))}
    </div>
  )
}

function AddResource({ onClose }: { onClose: () => void }) {
  const { upsert, log } = useStore()
  const { toast } = useToast()
  const [r, setR] = useState<Resource>({
    id: uid('r'), title: '', org: '', description: '', category: 'seg_fundamental', language: 'Português', level: 'iniciante', cost: 'gratuito', costNote: '', url: '', prereqs: '', modules: [], custom: true,
  })
  const [err, setErr] = useState<Record<string, string>>({})
  const set = <K extends keyof Resource>(k: K, v: Resource[K]) => setR((p) => ({ ...p, [k]: v }))
  const save = () => {
    const e: Record<string, string> = {}
    if (!r.title.trim()) e.title = 'Informe o título.'
    try {
      const u = new URL(r.url)
      if (!['https:', 'http:'].includes(u.protocol)) throw new Error()
    } catch {
      e.url = 'Use um endereço completo começando com https://'
    }
    setErr(e)
    if (Object.keys(e).length) return
    upsert('customResources', { ...r, title: r.title.trim(), costNote: r.costNote || 'Informado por você.', prereqs: r.prereqs || '—' })
    log('nota', `Adicionou o recurso "${r.title.trim()}"`, r.id)
    toast('Recurso adicionado')
    onClose()
  }
  return (
    <Modal title="Adicionar recurso" onClose={onClose} wide footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></>}>
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); save() }}>
        <Field label="Título" error={err.title}><input className="input" data-autofocus value={r.title} onChange={(e) => set('title', e.target.value)} aria-invalid={!!err.title} maxLength={140} /></Field>
        <Field label="Organização"><input className="input" value={r.org} onChange={(e) => set('org', e.target.value)} maxLength={100} /></Field>
        <div className="full"><Field label="Link oficial" error={err.url}><input className="input" type="url" inputMode="url" value={r.url} onChange={(e) => set('url', e.target.value)} placeholder="https://" aria-invalid={!!err.url} /></Field></div>
        <div className="full"><Field label="Descrição"><textarea className="textarea" rows={2} value={r.description} onChange={(e) => set('description', e.target.value)} maxLength={600} /></Field></div>
        <Field label="Categoria">
          <select className="select" value={r.category} onChange={(e) => set('category', e.target.value as Category)}>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Nível">
          <select className="select" value={r.level} onChange={(e) => set('level', e.target.value as Difficulty)}>
            {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Custo">
          <select className="select" value={r.cost} onChange={(e) => set('cost', e.target.value as CostType)}>
            {Object.entries(COST_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Idioma"><input className="input" value={r.language} onChange={(e) => set('language', e.target.value)} maxLength={60} /></Field>
        <div className="full"><Field label="Observações de custo / certificado" hint="Só registre o que você conferiu na página oficial."><input className="input" value={r.costNote} onChange={(e) => set('costNote', e.target.value)} maxLength={240} /></Field></div>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
