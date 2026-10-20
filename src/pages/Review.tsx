import { useEffect, useMemo, useState } from 'react'
import { Layers, Plus, RotateCcw, Trash2, Pencil, Search, Sparkles } from 'lucide-react'
import { DECKS, SEED_CARDS } from '../data'
import { useData, useStore, useToast } from '../store'
import { NEW_CARD, isDue, previewInterval, review } from '../lib/srs'
import { dayKey, fmt } from '../lib/dates'
import { normalize } from '../lib/grading'
import { uid } from '../lib/id'
import { Callout, Empty, Field, Kebab, Modal, PageHead, Seg, useConfirm } from '../ui/ui'
import type { Grade, UserCard } from '../types'

interface Card { id: string; front: string; back: string; deck: string; tags: string[]; user: boolean }
const GRADES: { g: Grade; label: string; key: string; cls: string }[] = [
  { g: 'errei', label: 'Errei', key: '1', cls: 'danger' },
  { g: 'dificil', label: 'Difícil', key: '2', cls: '' },
  { g: 'bom', label: 'Bom', key: '3', cls: '' },
  { g: 'facil', label: 'Fácil', key: '4', cls: 'primary' },
]

export default function Review() {
  const d = useData()
  const { updateMeta, remove, log } = useStore()
  const { toast } = useToast()
  const confirm = useConfirm()
  const [tab, setTab] = useState<'revisar' | 'cartoes'>('revisar')
  const [deck, setDeck] = useState('all')
  const [mode, setMode] = useState<'due' | 'forgotten'>('due')
  const [flipped, setFlipped] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [editing, setEditing] = useState<UserCard | null>(null)
  const [q, setQ] = useState('')
  const today = dayKey()

  const cards: Card[] = useMemo(
    () => [...SEED_CARDS.map((c) => ({ ...c, user: false })), ...d.userCards.map((c) => ({ ...c, user: true }))],
    [d.userCards],
  )
  const decks = useMemo(() => Array.from(new Set([...DECKS, ...d.userCards.map((c) => c.deck)])), [d.userCards])
  const inDeck = cards.filter((c) => deck === 'all' || c.deck === deck)
  const queue = useMemo(() => {
    if (mode === 'forgotten') return inDeck.filter((c) => (d.cardState[c.id]?.lapses ?? 0) > 0 && d.cardState[c.id]?.history.at(-1)?.grade !== 'facil')
    // devidos primeiro (mais atrasados), depois novos — máx. 15 novos por sessão
    const due = inDeck.filter((c) => d.cardState[c.id] && isDue(d.cardState[c.id], today)).sort((a, b) => d.cardState[a.id].due.localeCompare(d.cardState[b.id].due))
    const fresh = inDeck.filter((c) => !d.cardState[c.id]).slice(0, Math.max(0, 15 - sessionCount))
    return [...due, ...fresh]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inDeck.length, deck, mode, d.cardState, today])
  const card = queue[0]

  const grade = (g: Grade) => {
    if (!card) return
    const prev = d.cardState[card.id] ?? NEW_CARD(today)
    updateMeta('cardState', (cs) => ({ ...cs, [card.id]: review(prev, g) }))
    setFlipped(false)
    setSessionCount((n) => n + 1)
    if (queue.length === 1) {
      log('revisao', `Revisou ${sessionCount + 1} flashcard(s)`)
      toast('Revisão concluída por hoje')
    }
  }

  useEffect(() => {
    if (tab !== 'revisar') return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(t.tagName) && e.key === ' ') return
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || e.ctrlKey || e.metaKey || e.altKey) return
      if (document.querySelector('[role="dialog"]')) return
      if (e.key === ' ') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) grade(GRADES[Number(e.key) - 1].g)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const dueTotal = cards.filter((c) => isDue(d.cardState[c.id], today)).length
  const reviewed = Object.values(d.cardState).reduce((s, x) => s + x.history.length, 0)
  const listCards = inDeck.filter((c) => !q.trim() || normalize(`${c.front} ${c.back} ${c.tags.join(' ')}`).includes(normalize(q)))

  return (
    <>
      <PageHead
        eyebrow={<>{dueTotal} para hoje · {reviewed} revisões feitas</>}
        title="Revisão"
        desc="Flashcards com repetição espaçada: quanto melhor você lembra, mais tempo o cartão leva para voltar. Errou? Ele volta amanhã."
        actions={<button className="btn primary" onClick={() => setEditing({ id: uid('uc'), front: '', back: '', deck: deck === 'all' ? 'Meus cartões' : deck, tags: [], createdAt: new Date().toISOString() })}><Plus size={16} /> Novo cartão</button>}
      />
      <div className="toolbar">
        <Seg label="Seção" value={tab} onChange={setTab} options={[{ value: 'revisar', label: 'Revisar' }, { value: 'cartoes', label: `Todos os cartões (${cards.length})` }]} />
        <select className="select" value={deck} onChange={(e) => { setDeck(e.target.value); setFlipped(false) }} aria-label="Baralho">
          <option value="all">Todos os baralhos</option>
          {decks.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        {tab === 'revisar' && (
          <Seg label="Modo" value={mode} onChange={(v) => { setMode(v); setFlipped(false) }} options={[{ value: 'due', label: 'Pendentes' }, { value: 'forgotten', label: 'Esquecidos' }]} />
        )}
      </div>

      {tab === 'revisar' ? (
        !card ? (
          <Empty icon={<Sparkles size={20} />} title={mode === 'forgotten' ? 'Nenhum cartão esquecido' : 'Tudo revisado por hoje'}>
            {mode === 'forgotten'
              ? 'Cartões que você marcar como "Errei" aparecem aqui até você acertá-los com facilidade.'
              : `Volte amanhã — a repetição espaçada funciona melhor em doses diárias. ${sessionCount ? `Você revisou ${sessionCount} cartão(ões) nesta sessão.` : ''}`}
          </Empty>
        ) : (
          <div style={{ maxWidth: 680, margin: '0 auto' }} className="stack">
            <div className="row between xs muted">
              <span>{card.deck}</span>
              <span className="tabular">{queue.length} na fila{sessionCount ? ` · ${sessionCount} feitos` : ''}</span>
            </div>
            <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
              <button className="flashcard-inner" style={{ width: '100%', border: 0, background: 'none', padding: 0, cursor: 'pointer', color: 'inherit', display: 'block' }} onClick={() => setFlipped((f) => !f)} aria-label={flipped ? `Resposta: ${card.back}. Clique para ver a pergunta.` : `Pergunta: ${card.front}. Clique para ver a resposta.`}>
                <div className="flashcard-face" aria-hidden={flipped}>
                  <span className="xs dim mono">PERGUNTA</span>
                  <span>{card.front}</span>
                </div>
                <div className="flashcard-face back" aria-hidden={!flipped}>
                  <span className="xs dim mono">RESPOSTA</span>
                  <span>{card.back}</span>
                </div>
              </button>
            </div>
            <div aria-live="polite" className="sr-only">{flipped ? `Resposta: ${card.back}` : ''}</div>
            {!flipped ? (
              <button className="btn primary" style={{ alignSelf: 'center' }} onClick={() => setFlipped(true)}>Mostrar resposta <kbd style={{ marginLeft: 6 }}>Espaço</kbd></button>
            ) : (
              <div className="grade-row" role="group" aria-label="Quão bem você lembrou?">
                {GRADES.map((x) => (
                  <button key={x.g} className={`btn ${x.cls}`} onClick={() => grade(x.g)}>
                    <span>{x.label}</span>
                    <span className="xs" style={{ opacity: 0.75 }}>{fmtInterval(previewInterval(d.cardState[card.id], x.g))} · <kbd>{x.key}</kbd></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        <>
          <div className="search-box" style={{ marginBottom: 14, maxWidth: 420 }}>
            <Search size={16} aria-hidden />
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cartões e tags" aria-label="Buscar cartões" />
          </div>
          {listCards.length === 0 ? (
            <Empty icon={<Layers size={20} />} title="Nenhum cartão encontrado" />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Frente</th><th>Verso</th><th>Baralho</th><th>Próxima revisão</th><th>Histórico</th><th><span className="sr-only">Ações</span></th></tr></thead>
                <tbody>
                  {listCards.map((c) => {
                    const s = d.cardState[c.id]
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 520 }}>{c.front}</td>
                        <td className="muted">{c.back}</td>
                        <td className="nowrap xs">{c.deck}{c.tags.length > 0 && <div className="dim">{c.tags.map((t) => `#${t}`).join(' ')}</div>}</td>
                        <td className="nowrap xs">{!s ? <span className="badge info">Novo</span> : s.due <= today ? <span className="badge warn">Hoje</span> : fmt.short(s.due)}</td>
                        <td className="nowrap xs muted">{s ? `${s.history.length} rev. · ${s.lapses} erro(s)` : '—'}</td>
                        <td>
                          <Kebab
                            label={`Ações para ${c.front}`}
                            actions={[
                              ...(c.user
                                ? [
                                    { label: 'Editar', icon: <Pencil size={15} />, onClick: () => setEditing(d.userCards.find((u) => u.id === c.id)!) },
                                    {
                                      label: 'Excluir',
                                      icon: <Trash2 size={15} />,
                                      danger: true,
                                      onClick: async () => {
                                        if (await confirm.ask({ title: 'Excluir cartão?', body: c.front, confirm: 'Excluir', danger: true })) {
                                          remove('userCards', c.id)
                                          updateMeta('cardState', (cs) => { const n = { ...cs }; delete n[c.id]; return n })
                                        }
                                      },
                                    },
                                  ]
                                : []),
                              { label: 'Reiniciar agendamento', icon: <RotateCcw size={15} />, onClick: () => updateMeta('cardState', (cs) => { const n = { ...cs }; delete n[c.id]; return n }) },
                            ]}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <Callout tone="info" title="Como o agendamento funciona">
              Variação simplificada do algoritmo SM-2: "Bom" leva o cartão para 1 dia, depois 3, depois multiplica pelo fator de facilidade (começa em 2,5). "Difícil" reduz o fator; "Errei" volta para 1 dia; "Fácil" aumenta o fator. O intervalo máximo é 180 dias.
            </Callout>
          </div>
        </>
      )}
      {editing && <CardModal card={editing} decks={decks} onClose={() => setEditing(null)} />}
      {confirm.node}
    </>
  )
}

function fmtInterval(days: number) {
  if (days <= 1) return '1 dia'
  if (days < 30) return `${days} dias`
  return `${Math.round(days / 30)} mês(es)`
}

function CardModal({ card, decks, onClose }: { card: UserCard; decks: string[]; onClose: () => void }) {
  const d = useData()
  const { upsert } = useStore()
  const { toast } = useToast()
  const [c, setC] = useState(card)
  const [tags, setTags] = useState(card.tags.join(', '))
  const [err, setErr] = useState('')
  const exists = d.userCards.some((x) => x.id === c.id)
  const save = () => {
    if (!c.front.trim() || !c.back.trim()) return setErr('Preencha frente e verso.')
    upsert('userCards', { ...c, front: c.front.trim(), back: c.back.trim(), deck: c.deck.trim() || 'Meus cartões', tags: tags.split(',').map((t) => t.trim()).filter(Boolean) })
    toast(exists ? 'Cartão atualizado' : 'Cartão criado — ele já entra na fila de revisão')
    onClose()
  }
  return (
    <Modal title={exists ? 'Editar cartão' : 'Novo cartão'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></>}>
      <form className="stack-sm" style={{ gap: 14 }} onSubmit={(e) => { e.preventDefault(); save() }}>
        <Field label="Frente (pergunta)" error={err && !c.front.trim() ? err : undefined}><textarea className="textarea" rows={2} data-autofocus value={c.front} onChange={(e) => setC({ ...c, front: e.target.value })} maxLength={500} /></Field>
        <Field label="Verso (resposta)" error={err && !c.back.trim() ? err : undefined}><textarea className="textarea" rows={3} value={c.back} onChange={(e) => setC({ ...c, back: e.target.value })} maxLength={1500} /></Field>
        <div className="form-grid">
          <Field label="Baralho / categoria">
            <input className="input" list="decks" value={c.deck} onChange={(e) => setC({ ...c, deck: e.target.value })} maxLength={60} />
            <datalist id="decks">{decks.map((x) => <option key={x} value={x} />)}</datalist>
          </Field>
          <Field label="Tags" hint="Separadas por vírgula"><input className="input" value={tags} onChange={(e) => setTags(e.target.value)} maxLength={200} /></Field>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
