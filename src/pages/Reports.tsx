import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Download } from 'lucide-react'
import { CATEGORY_LABEL, CHALLENGES, CHALLENGE_CATEGORY_LABEL, MODULES, RESOURCES, SEED_CARDS, challengeById, moduleById } from '../data'
import { useData } from '../store'
import { addDays, dayKey, fmt, minutesLabel, weekStart } from '../lib/dates'
import { activeDays, consistency } from '../lib/gamification'
import { categoryDistribution, completedModules } from '../lib/progress'
import { isDue } from '../lib/srs'
import { toCsv } from '../lib/validate'
import { AreaChart, Bars } from '../ui/charts'
import { Empty, PageHead, Progress, Seg, download } from '../ui/ui'
import type { ChallengeCategory } from '../types'

type Period = '30' | '90' | '365' | 'all'

export default function Reports() {
  const d = useData()
  const [period, setPeriod] = useState<Period>('90')
  const today = dayKey()
  const from = period === 'all' ? '0000-00-00' : addDays(today, -Number(period) + 1)
  const inP = (iso: string) => dayKey(new Date(iso)) >= from

  const sessions = d.sessions.filter((s) => s.status === 'concluida' && s.date >= from)
  const totalMin = sessions.reduce((a, s) => a + (s.actualMin ?? 0), 0)
  const planned = d.sessions.filter((s) => s.date >= from && s.date <= today)
  const completionRate = planned.length ? Math.round((planned.filter((s) => s.status === 'concluida').length / planned.length) * 100) : null

  const weekly = useMemo(() => {
    const n = period === '30' ? 5 : period === '90' ? 13 : 12
    const ws = weekStart(today)
    if (period === '365' || period === 'all') {
      // mensal
      const out = []
      const now = new Date()
      for (let i = 11; i >= 0; i--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
        const min = d.sessions.filter((s) => s.status === 'concluida' && s.date.startsWith(key)).reduce((a, s) => a + (s.actualMin ?? 0), 0)
        out.push({ x: dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), y: Math.round((min / 60) * 10) / 10 })
      }
      return out
    }
    return Array.from({ length: n }, (_, i) => {
      const s = addDays(ws, -7 * (n - 1 - i))
      const e = addDays(s, 6)
      const min = d.sessions.filter((x) => x.status === 'concluida' && x.date >= s && x.date <= e).reduce((a, x) => a + (x.actualMin ?? 0), 0)
      return { x: fmt.short(s), y: Math.round((min / 60) * 10) / 10 }
    })
  }, [d.sessions, period, today])

  const byCategory = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of sessions) {
      const cat = s.moduleId ? CATEGORY_LABEL[moduleById.get(s.moduleId)!.category] : 'Sem vínculo'
      m.set(cat, (m.get(cat) ?? 0) + (s.actualMin ?? 0))
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [sessions])

  const attempts = d.attempts.filter((a) => inP(a.at))
  const tried = new Set(attempts.map((a) => a.challengeId))
  const solvedP = new Set(attempts.filter((a) => a.correct).map((a) => a.challengeId))
  const chCat = (Object.keys(CHALLENGE_CATEGORY_LABEL) as ChallengeCategory[]).map((c) => ({ x: CHALLENGE_CATEGORY_LABEL[c].split(' ')[0], y: [...solvedP].filter((id) => challengeById.get(id)?.category === c).length }))

  const resStarted = Object.entries(d.resourceState).filter(([, s]) => s.status === 'estudando' || s.status === 'concluido').length
  const resDone = Object.values(d.resourceState).filter((s) => s.status === 'concluido').length
  const dist = categoryDistribution(d)
  const weak = [...dist].sort((a, b) => a.value - b.value).slice(0, 3)
  const strong = [...dist].sort((a, b) => b.value - a.value).filter((x) => x.value > 0).slice(0, 3)
  const dueCards = [...SEED_CARDS.map((c) => c.id), ...d.userCards.map((c) => c.id)].filter((id) => isDue(d.cardState[id], today)).length
  const cons = consistency(d)
  const projDone = d.projects.filter((p) => p.status === 'concluido').length
  const modsP = completedModules(d).filter((m) => (d.moduleProgress[m.id].completedAt ?? '') >= from).length
  const hasData = d.activity.length > 0 || d.sessions.length > 0

  const exportCsv = (kind: 'sessoes' | 'tentativas' | 'modulos') => {
    if (kind === 'sessoes') download('cyberstart-sessoes.csv', toCsv(d.sessions.map((s) => ({ ...s, modulo: s.moduleId ? moduleById.get(s.moduleId)?.title : '' })), ['date', 'time', 'title', 'modulo', 'plannedMin', 'actualMin', 'priority', 'status']), 'text/csv')
    if (kind === 'tentativas') download('cyberstart-tentativas.csv', toCsv(d.attempts.map((a) => ({ ...a, desafio: challengeById.get(a.challengeId)?.title })), ['at', 'desafio', 'correct', 'hintUsed', 'answer']), 'text/csv')
    if (kind === 'modulos') download('cyberstart-modulos.csv', toCsv(MODULES.map((m) => ({ fase: m.phase, modulo: m.title, iniciado: d.moduleProgress[m.id]?.startedAt ?? '', concluido: d.moduleProgress[m.id]?.completedAt ?? '' })), ['fase', 'modulo', 'iniciado', 'concluido']), 'text/csv')
  }

  return (
    <>
      <PageHead
        eyebrow={<>Dados reais registrados neste dispositivo</>}
        title="Relatórios"
        desc="Sem métricas de vaidade: tempo real estudado, conclusão, desafios e o que está ficando para trás."
        actions={<Seg label="Período" value={period} onChange={setPeriod} options={[{ value: '30', label: '30 dias' }, { value: '90', label: '90 dias' }, { value: '365', label: '12 meses' }, { value: 'all', label: 'Tudo' }]} />}
      />
      {!hasData ? (
        <Empty icon={<BarChart3 size={20} />} title="Ainda não há dados para relatar" action={<Link to="/plano?iniciar=1" className="btn primary">Registrar uma sessão</Link>}>
          Os relatórios usam apenas o que você registra: sessões concluídas, lições, desafios, revisões e projetos. Nada é estimado ou inventado.
        </Empty>
      ) : (
        <>
          <div className="stat-grid" style={{ marginTop: 0, marginBottom: 'var(--gap)' }}>
            {[
              ['Tempo estudado', minutesLabel(totalMin)],
              ['Taxa de conclusão de sessões', completionRate === null ? '—' : `${completionRate}%`],
              ['Desafios tentados / resolvidos', `${tried.size} / ${solvedP.size}`],
              ['Módulos concluídos no período', String(modsP)],
              ['Cursos iniciados / concluídos', `${resStarted} / ${resDone}`],
              ['Revisões pendentes', String(dueCards)],
              ['Projetos concluídos', String(projDone)],
              ['Consistência (28 dias)', `${cons.active}/${cons.of} dias`],
            ].map(([k, v]) => (
              <div key={k} className="card stat">
                <span className="stat-label">{k}</span>
                <span className="stat-value" style={{ fontSize: '1.35rem' }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="grid cols-2">
            <section className="card" aria-labelledby="h-r1">
              <div className="card-head"><h2 id="h-r1">{period === '365' || period === 'all' ? 'Evolução mensal' : 'Tempo estudado por semana'}</h2></div>
              {weekly.some((w) => w.y > 0) ? <AreaChart data={weekly} label="Horas estudadas" unit="h" /> : <p className="small muted">Sem sessões concluídas no período.</p>}
            </section>
            <section className="card" aria-labelledby="h-r2">
              <div className="card-head"><h2 id="h-r2">Desafios resolvidos por categoria</h2></div>
              {solvedP.size ? <Bars data={chCat} label="Desafios resolvidos por categoria" unit="desafios" color="var(--magenta)" /> : <p className="small muted">Nenhum desafio resolvido no período.</p>}
            </section>
            <section className="card" aria-labelledby="h-r3">
              <div className="card-head"><h2 id="h-r3">Onde o tempo foi investido</h2></div>
              {byCategory.length === 0 ? <p className="small muted">Sem sessões concluídas no período.</p> : (
                <ul className="list" style={{ gap: 12 }}>
                  {byCategory.map(([c, m]) => (
                    <li key={c}>
                      <div className="row between small" style={{ marginBottom: 4 }}><span>{c}</span><span className="muted tabular">{minutesLabel(m)}</span></div>
                      <Progress value={(m / Math.max(1, totalMin)) * 100} label={c} />
                    </li>
                  ))}
                </ul>
              )}
              <p className="xs dim" style={{ marginTop: 10 }}>Vincule sessões a módulos no planejador para refinar este gráfico.</p>
            </section>
            <section className="card" aria-labelledby="h-r4">
              <div className="card-head"><h2 id="h-r4">Categorias mais e menos exploradas</h2></div>
              <p className="small muted" style={{ marginBottom: 6 }}>Mais estudadas</p>
              <div className="row wrap" style={{ gap: 6, marginBottom: 14 }}>{strong.length ? strong.map((c) => <span key={c.category} className="badge ok">{CATEGORY_LABEL[c.category]} · {c.value}%</span>) : <span className="xs dim">—</span>}</div>
              <p className="small muted" style={{ marginBottom: 6 }}>Pouco exploradas</p>
              <div className="row wrap" style={{ gap: 6 }}>{weak.map((c) => <span key={c.category} className="badge warn">{CATEGORY_LABEL[c.category]} · {c.value}%</span>)}</div>
              <div className="divider" />
              <p className="xs dim">Estimativa a partir de lições e checklists concluídos em cada categoria — indica cobertura de conteúdo, não domínio.</p>
            </section>
          </div>

          <section className="card" style={{ marginTop: 'var(--gap)' }} aria-labelledby="h-exp">
            <div className="card-head"><div className="icon-tile sm"><Download size={15} /></div><h2 id="h-exp">Exportar</h2></div>
            <div className="btn-row">
              <button className="btn" onClick={() => exportCsv('sessoes')}>Sessões (.csv)</button>
              <button className="btn" onClick={() => exportCsv('tentativas')}>Tentativas de desafios (.csv)</button>
              <button className="btn" onClick={() => exportCsv('modulos')}>Progresso dos módulos (.csv)</button>
              <Link className="btn ghost" to="/configuracoes#dados">Backup completo (.json)</Link>
            </div>
            <p className="xs dim" style={{ marginTop: 10 }}>Contagem total de conteúdo: {MODULES.length} módulos, {CHALLENGES.length} desafios, {RESOURCES.length} recursos verificados, {activeDays(d).size} dias ativos registrados.</p>
          </section>
        </>
      )}
    </>
  )
}
