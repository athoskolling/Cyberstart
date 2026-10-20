import { Link } from 'react-router-dom'
import { Award, CheckCircle2, Circle, Flame, Lock, Medal, Sparkles, Trophy } from 'lucide-react'
import { useData } from '../store'
import { XP_RULES, achievements, consistency, levelFor, streak, totalXp, weeklyMissions, xpBreakdown } from '../lib/gamification'
import { Callout, PageHead, Progress } from '../ui/ui'

export default function Achievements() {
  const d = useData()
  const xp = totalXp(d)
  const lvl = levelFor(xp)
  const achs = achievements(d)
  const unlocked = achs.filter((a) => a.unlocked).length
  const st = streak(d)
  const cons = consistency(d)
  const missions = weeklyMissions(d)

  if (!d.settings.gamification) {
    return (
      <>
        <PageHead title="Conquistas" />
        <Callout tone="info" title="Gamificação desativada">
          XP, níveis, missões e conquistas estão ocultos. Você pode reativá-los em <Link to="/configuracoes">Configurações</Link>. Seu progresso continua sendo registrado normalmente.
        </Callout>
      </>
    )
  }

  return (
    <>
      <PageHead
        eyebrow={<>{unlocked}/{achs.length} conquistas</>}
        title="Conquistas"
        desc="XP vem só de eventos reais de aprendizagem e tem limites diários — não dá para ganhar clicando à toa, e estudar demais num dia não rende mais."
      />
      <div className="grid cols-3" style={{ marginBottom: 'var(--gap)' }}>
        <section className="card stack-sm" aria-label="Nível">
          <div className="row"><span className="icon-tile"><Trophy size={18} /></span><span className="small muted">Nível atual</span></div>
          <div className="row" style={{ alignItems: 'baseline', gap: 8 }}><span className="stat-value">{lvl.level}</span><span className="small muted tabular">{xp} XP</span></div>
          <Progress value={(lvl.into / lvl.span) * 100} label="Progresso até o próximo nível" lg />
          <span className="xs dim tabular">{lvl.next - xp} XP para o nível {lvl.level + 1}</span>
        </section>
        <section className="card stack-sm" aria-label="Sequência">
          <div className="row"><span className="icon-tile warn"><Flame size={18} /></span><span className="small muted">Sequência de dias ativos</span></div>
          <div className="row" style={{ alignItems: 'baseline', gap: 8 }}><span className="stat-value">{st}</span><span className="small muted">{st === 1 ? 'dia' : 'dias'}</span></div>
          <span className="xs dim">A sequência não zera enquanto o dia de hoje não termina. Perder um dia não apaga nada além dela.</span>
        </section>
        <section className="card stack-sm" aria-label="Consistência">
          <div className="row"><span className="icon-tile cyan"><Medal size={18} /></span><span className="small muted">Consistência (28 dias)</span></div>
          <div className="row" style={{ alignItems: 'baseline', gap: 8 }}><span className="stat-value">{cons.active}</span><span className="small muted">de {cons.of} dias</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 3 }} aria-hidden>
            {Array.from({ length: 28 }, (_, i) => {
              const dt = new Date(); dt.setDate(dt.getDate() - (27 - i))
              const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
              const on = d.activity.some((a) => a.at.slice(0, 10) === k) || Object.values(d.cardState).some((c) => c.history.some((h) => h.at.slice(0, 10) === k))
              return <span key={i} style={{ aspectRatio: '1', borderRadius: 3, background: on ? 'var(--accent)' : 'var(--surface-3)' }} />
            })}
          </div>
        </section>
      </div>

      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        <section className="card" aria-labelledby="h-ach">
          <div className="card-head"><div className="icon-tile"><Award size={18} /></div><h2 id="h-ach">Conquistas</h2></div>
          <ul className="list">
            {achs.map((a) => (
              <li key={a.id} className={`list-item ach ${a.unlocked ? '' : 'locked'}`}>
                <span className={`icon-tile ${a.unlocked ? 'warn celebrate' : ''}`}>{a.unlocked ? <Sparkles size={18} /> : <Lock size={16} />}</span>
                <div className="grow">
                  <div className="small" style={{ fontWeight: 560 }}>{a.title}</div>
                  <div className="xs muted">{a.description}</div>
                </div>
                {a.unlocked ? <span className="badge ok">Desbloqueada</span> : <span className="badge">Bloqueada</span>}
              </li>
            ))}
          </ul>
        </section>
        <div className="stack">
          <section className="card" aria-labelledby="h-mis">
            <div className="card-head"><div className="icon-tile warn"><Flame size={18} /></div><h2 id="h-mis">Missões da semana</h2></div>
            <ul className="list">
              {missions.map((m) => (
                <li key={m.id} className="stack-sm" style={{ gap: 6 }}>
                  <span className="small row" style={{ gap: 8 }}>{m.progress >= m.target ? <CheckCircle2 size={15} color="var(--ok)" /> : <Circle size={15} className="dim" />}{m.label}</span>
                  <Progress value={(m.progress / m.target) * 100} label={m.label} tone={m.progress >= m.target ? 'ok' : undefined} />
                </li>
              ))}
            </ul>
          </section>
          <section className="card" aria-labelledby="h-xp">
            <div className="card-head"><h2 id="h-xp">De onde vem seu XP</h2></div>
            <div className="table-wrap">
              <table>
                <tbody>
                  {xpBreakdown(d).map((x) => <tr key={x.source}><td>{x.source}</td><td className="tabular" style={{ textAlign: 'right' }}>{x.xp} XP</td></tr>)}
                </tbody>
              </table>
            </div>
            <details style={{ marginTop: 12 }}>
              <summary className="small" style={{ cursor: 'pointer', color: 'var(--accent-hi)' }}>Regras de pontuação</summary>
              <ul className="list" style={{ marginTop: 10, gap: 6 }}>
                {XP_RULES.map((r) => <li key={r.label} className="row between xs"><span>{r.label}</span><span className="muted" style={{ textAlign: 'right' }}>{r.value}</span></li>)}
              </ul>
              <p className="xs dim" style={{ marginTop: 8 }}>Sem rankings: o único competidor é você de ontem.</p>
            </details>
          </section>
        </div>
      </div>
    </>
  )
}
