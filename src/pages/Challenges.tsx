import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, Circle, History, Lightbulb, RotateCcw, Target, XCircle } from 'lucide-react'
import { CHALLENGES, CHALLENGE_CATEGORY_LABEL, CHALLENGE_TYPE_LABEL, DIFFICULTY_LABEL, challengeById } from '../data'
import { useData } from '../store'
import { useActions } from '../actions'
import { describeAnswer, grade, seededShuffle, type ChallengeAnswer } from '../lib/grading'
import { solvedChallenges } from '../lib/gamification'
import { fmt } from '../lib/dates'
import { inline } from '../ui/markdown'
import { Callout, CodeBlock, Crumbs, DifficultyBadge, Empty, PageHead, Progress } from '../ui/ui'
import type { AppData, Challenge, ChallengeCategory, Difficulty } from '../types'

type Status = 'resolvido' | 'pendente' | 'novo'
function challengeStatus(d: AppData, id: string): Status {
  const at = d.attempts.filter((a) => a.challengeId === id)
  if (at.some((a) => a.correct)) return 'resolvido'
  return at.length ? 'pendente' : 'novo'
}

export default function Challenges() {
  const d = useData()
  const [cat, setCat] = useState<'all' | ChallengeCategory>('all')
  const [diff, setDiff] = useState<'all' | Difficulty>('all')
  const [st, setSt] = useState<'all' | Status>('all')
  const solved = solvedChallenges(d)
  const points = CHALLENGES.filter((c) => solved.has(c.id)).reduce((s, c) => s + c.points, 0)
  const total = CHALLENGES.reduce((s, c) => s + c.points, 0)
  const pending = CHALLENGES.filter((c) => challengeStatus(d, c.id) === 'pendente')

  const list = CHALLENGES.filter((c) => (cat === 'all' || c.category === cat) && (diff === 'all' || c.difficulty === diff) && (st === 'all' || challengeStatus(d, c.id) === st))
  const cats = Object.keys(CHALLENGE_CATEGORY_LABEL) as ChallengeCategory[]

  return (
    <>
      <PageHead
        eyebrow={<>{solved.size}/{CHALLENGES.length} resolvidos · {points}/{total} pontos</>}
        title="Desafios"
        desc="Exercícios com correção automática e explicação. A resposta só aparece depois que você tenta — errar faz parte e fica registrado para revisão."
      />
      {pending.length > 0 && (
        <div style={{ marginBottom: 'var(--gap)' }}>
          <Callout tone="warn" title={`Revisão de erros: ${pending.length} desafio(s) tentado(s) e ainda não resolvido(s)`}>
            <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
              {pending.slice(0, 6).map((c) => <Link key={c.id} to={`/desafios/${c.id}`} className="badge warn">{c.title}</Link>)}
              {pending.length > 6 && <button className="badge" onClick={() => setSt('pendente')}>ver todos</button>}
            </div>
          </Callout>
        </div>
      )}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 'var(--gap)' }}>
        {cats.map((c) => {
          const all = CHALLENGES.filter((x) => x.category === c)
          const ok = all.filter((x) => solved.has(x.id)).length
          return (
            <button key={c} className={`card stack-sm ${cat === c ? 'module-card is-em_andamento' : ''}`} style={{ gap: 8, textAlign: 'left', cursor: 'pointer' }} onClick={() => setCat(cat === c ? 'all' : c)} aria-pressed={cat === c}>
              <span className="small" style={{ fontWeight: 550 }}>{CHALLENGE_CATEGORY_LABEL[c]}</span>
              <span className="xs muted tabular">{ok}/{all.length}</span>
              <Progress value={(ok / all.length) * 100} label={CHALLENGE_CATEGORY_LABEL[c]} />
            </button>
          )
        })}
      </div>
      <div className="toolbar">
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} aria-label="Categoria">
          <option value="all">Todas as categorias</option>
          {cats.map((c) => <option key={c} value={c}>{CHALLENGE_CATEGORY_LABEL[c]}</option>)}
        </select>
        <select className="select" value={diff} onChange={(e) => setDiff(e.target.value as typeof diff)} aria-label="Dificuldade">
          <option value="all">Toda dificuldade</option>
          {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="select" value={st} onChange={(e) => setSt(e.target.value as typeof st)} aria-label="Status">
          <option value="all">Todos</option>
          <option value="novo">Não tentados</option>
          <option value="pendente">Tentados, não resolvidos</option>
          <option value="resolvido">Resolvidos</option>
        </select>
      </div>
      {list.length === 0 ? (
        <Empty icon={<Target size={20} />} title="Nenhum desafio com esses filtros" />
      ) : (
        <ul className="list">
          {list.map((c) => {
            const s = challengeStatus(d, c.id)
            return (
              <li key={c.id}>
                <Link to={`/desafios/${c.id}`} className="list-item link">
                  {s === 'resolvido' ? <CheckCircle2 size={20} color="var(--ok)" aria-label="Resolvido" /> : s === 'pendente' ? <XCircle size={20} color="var(--warn)" aria-label="Tentado" /> : <Circle size={20} className="dim" aria-label="Não tentado" />}
                  <span className="grow">
                    <span className="small" style={{ fontWeight: 520 }}>{c.title}</span>
                    <span className="xs dim" style={{ display: 'block' }}>{CHALLENGE_CATEGORY_LABEL[c.category]} · {CHALLENGE_TYPE_LABEL[c.type]}</span>
                  </span>
                  <DifficultyBadge d={c.difficulty} />
                  <span className="badge tabular">{c.points} pts</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

export function ChallengePage() {
  const { id = '' } = useParams()
  const c = challengeById.get(id)
  if (!c) return <Empty icon={<Target size={20} />} title="Desafio não encontrado" action={<Link to="/desafios" className="btn">Ver desafios</Link>} />
  return <ChallengeView key={c.id} c={c} />
}

function ChallengeView({ c }: { c: Challenge }) {
  const d = useData()
  const { recordAttempt } = useActions()
  const attempts = useMemo(() => d.attempts.filter((a) => a.challengeId === c.id).sort((a, b) => b.at.localeCompare(a.at)), [d.attempts, c.id])
  const alreadySolved = attempts.some((a) => a.correct)
  const [hint, setHint] = useState(false)
  const [result, setResult] = useState<null | { ok: boolean; answer: ChallengeAnswer; wasSolved: boolean }>(null)
  const [option, setOption] = useState<number | null>(null)
  const [text, setText] = useState('')
  const initialOrder = useMemo(() => (c.items ? seededShuffle(c.items, c.id) : []), [c])
  const [order, setOrder] = useState(initialOrder)
  const rights = useMemo(() => (c.pairs ? seededShuffle(c.pairs.map((p) => p[1]), c.id + 'r') : []), [c])
  const [map, setMap] = useState<Record<string, string>>({})

  const answer = (): ChallengeAnswer | null => {
    if (['mcq', 'tf', 'error'].includes(c.type)) return option === null ? null : { kind: 'option', index: option }
    if (c.type === 'fill') return text.trim() ? { kind: 'text', value: text } : null
    if (c.type === 'order') return { kind: 'order', items: order }
    if (c.type === 'match') return Object.keys(map).length === c.pairs!.length && Object.values(map).every(Boolean) ? { kind: 'match', map } : null
    return null
  }
  const current = answer()
  const submit = () => {
    if (!current) return
    const ok = grade(c, current)
    setResult({ ok, answer: current, wasSolved: alreadySolved })
    recordAttempt(c.id, c.title, ok, describeAnswer(c, current), hint, !alreadySolved)
  }
  const retry = () => {
    setResult(null)
    setOption(null)
    setText('')
    setMap({})
    setOrder(initialOrder)
  }
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= order.length) return
    const next = [...order]
    ;[next[i], next[j]] = [next[j], next[i]]
    setOrder(next)
  }
  const idx = CHALLENGES.findIndex((x) => x.id === c.id)
  const nextC = CHALLENGES.slice(idx + 1).find((x) => !solvedChallenges(d).has(x.id)) ?? CHALLENGES[(idx + 1) % CHALLENGES.length]
  const locked = result !== null
  const wrongOptionFeedback = result && !result.ok && result.answer.kind === 'option' ? c.optionFeedback?.[result.answer.index] : undefined

  return (
    <div style={{ maxWidth: 860 }}>
      <Crumbs items={[{ label: 'Desafios', to: '/desafios' }, { label: CHALLENGE_CATEGORY_LABEL[c.category] }, { label: c.title }]} />
      <header className="page-head">
        <div>
          <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
            <DifficultyBadge d={c.difficulty} />
            <span className="badge">{CHALLENGE_TYPE_LABEL[c.type]}</span>
            <span className="badge accent tabular">{c.points} pts{hint && !alreadySolved ? ` → ${Math.floor(c.points / 2)} com dica` : ''}</span>
            {alreadySolved && <span className="badge ok"><CheckCircle2 size={11} /> Resolvido</span>}
          </div>
          <h1>{c.title}</h1>
        </div>
      </header>

      <div className="card stack-sm" style={{ gap: 16 }}>
        {c.context && (
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Contexto</div>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{c.context}</pre>
          </div>
        )}
        {c.log && (
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Log (fictício)</div>
            <CodeBlock code={c.log} />
          </div>
        )}
        <p style={{ fontSize: '1.02rem', whiteSpace: 'pre-wrap' }}>{inline(c.prompt)}</p>
        {c.code && <CodeBlock code={c.code} />}

        {['mcq', 'tf', 'error'].includes(c.type) && (
          <div className="choices" role="group" aria-label="Alternativas">
            {c.options!.map((o, i) => {
              const cls = locked ? (result!.ok && i === c.answer ? 'correct' : !result!.ok && i === option ? 'wrong' : '') : ''
              return (
                <button key={i} className={`choice ${cls}`} aria-pressed={option === i} disabled={locked} onClick={() => setOption(i)}>
                  <span className="key">{String.fromCharCode(65 + i)}</span>
                  <span className="small mono" style={{ fontFamily: c.type === 'mcq' && /[\\(]/.test(o) ? 'var(--mono)' : 'var(--font)' }}>{o}</span>
                </button>
              )
            })}
          </div>
        )}

        {c.type === 'fill' && (
          <form onSubmit={(e) => { e.preventDefault(); submit() }}>
            <input className="input mono" style={{ maxWidth: 320 }} value={text} onChange={(e) => setText(e.target.value)} disabled={locked} aria-label="Sua resposta" placeholder="Sua resposta" autoComplete="off" />
          </form>
        )}

        {c.type === 'order' && (
          <ol className="list" aria-label="Itens para ordenar — use os botões para mover">
            {order.map((it, i) => (
              <li key={it} className="order-item">
                <span className="pos">{i + 1}</span>
                <span className="grow small" style={{ flex: 1 }}>{it}</span>
                <button className="btn ghost icon sm" onClick={() => move(i, -1)} disabled={locked || i === 0} aria-label={`Mover "${it}" para cima`}><ArrowUp size={15} /></button>
                <button className="btn ghost icon sm" onClick={() => move(i, 1)} disabled={locked || i === order.length - 1} aria-label={`Mover "${it}" para baixo`}><ArrowDown size={15} /></button>
              </li>
            ))}
          </ol>
        )}

        {c.type === 'match' && (
          <div className="stack-sm">
            {c.pairs!.map(([left]) => (
              <div key={left} className="match-row">
                <span className="small mono">{left}</span>
                <select className="select" value={map[left] ?? ''} disabled={locked} onChange={(e) => setMap((m) => ({ ...m, [left]: e.target.value }))} aria-label={`Associar "${left}"`}>
                  <option value="">Escolha…</option>
                  {rights.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        <div className="btn-row">
          {!locked ? (
            <button className="btn primary" onClick={submit} disabled={!current}>Enviar resposta</button>
          ) : (
            <button className="btn" onClick={retry}><RotateCcw size={15} /> Tentar novamente</button>
          )}
          {c.hint && !hint && !locked && (
            <button className="btn ghost" onClick={() => setHint(true)}><Lightbulb size={15} /> Ver dica {alreadySolved ? '' : '(vale metade dos pontos)'}</button>
          )}
        </div>
        {hint && c.hint && <Callout tone="info" title="Dica">{inline(c.hint)}</Callout>}

        {result && (
          <div aria-live="polite" className="stack-sm">
            <Callout tone={result.ok ? 'ok' : 'err'} title={result.ok ? (result.wasSolved ? 'Correto de novo!' : 'Correto!') : 'Não foi dessa vez.'}>
              {result.ok ? (
                inline(c.explanation)
              ) : (
                <>
                  {wrongOptionFeedback && <p style={{ marginBottom: 6 }}>{wrongOptionFeedback}</p>}
                  {c.type === 'match' && <p style={{ marginBottom: 6 }}>Acertos: {c.pairs!.filter(([l, r]) => map[l] === r).length} de {c.pairs!.length}.</p>}
                  {c.type === 'order' && <p style={{ marginBottom: 6 }}>Itens na posição certa: {order.filter((x, i) => c.items![i] === x).length} de {order.length}.</p>}
                  <p>Pense de novo com calma{c.hint && !hint ? ' ou use a dica' : ''}. </p>
                  <details style={{ marginTop: 6 }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--accent-hi)' }}>Quero ver a explicação agora</summary>
                    <p style={{ marginTop: 6 }}>{inline(c.explanation)}</p>
                  </details>
                </>
              )}
            </Callout>
            {result.ok && (
              <Link to={`/desafios/${nextC.id}`} className="btn primary" style={{ alignSelf: 'flex-start' }}>Próximo desafio <ArrowRight size={15} /></Link>
            )}
          </div>
        )}
      </div>

      <section className="card" style={{ marginTop: 'var(--gap)' }} aria-labelledby="h-att">
        <div className="card-head">
          <div className="icon-tile sm"><History size={15} /></div>
          <h2 id="h-att">Suas tentativas</h2>
        </div>
        {attempts.length === 0 ? (
          <p className="small muted">Nenhuma tentativa ainda.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Quando</th><th>Resultado</th><th>Resposta</th><th>Dica</th></tr></thead>
              <tbody>
                {attempts.slice(0, 10).map((a) => (
                  <tr key={a.id}>
                    <td className="nowrap">{fmt.dateTime(a.at)}</td>
                    <td>{a.correct ? <span className="badge ok">Correta</span> : <span className="badge err">Incorreta</span>}</td>
                    <td className="small">{a.answer}</td>
                    <td>{a.hintUsed ? 'Sim' : 'Não'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
