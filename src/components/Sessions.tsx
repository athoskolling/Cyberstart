import { useState } from 'react'
import { CalendarClock, CheckCircle2 } from 'lucide-react'
import { MODULES } from '../data'
import { useStore, useToast } from '../store'
import { dayKey } from '../lib/dates'
import { uid } from '../lib/id'
import type { StudySession } from '../types'
import { Field, Modal } from '../ui/ui'

export function newSession(partial: Partial<StudySession> = {}): StudySession {
  return { id: uid('s'), title: '', date: dayKey(), plannedMin: 45, priority: 'media', status: 'planejada', ...partial }
}

export function SessionModal({ initial, onClose }: { initial: StudySession; onClose: () => void }) {
  const { upsert, remove } = useStore()
  const { toast } = useToast()
  const [s, setS] = useState(initial)
  const [err, setErr] = useState<Record<string, string>>({})
  const exists = useStore().data.sessions.some((x) => x.id === s.id)
  const set = <K extends keyof StudySession>(k: K, v: StudySession[K]) => setS((p) => ({ ...p, [k]: v }))

  const save = () => {
    const e: Record<string, string> = {}
    if (!s.title.trim()) e.title = 'Dê um nome à sessão (ex.: "Lição de sub-redes").'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) e.date = 'Informe uma data válida.'
    if (!(s.plannedMin >= 5 && s.plannedMin <= 480)) e.plannedMin = 'Entre 5 e 480 minutos.'
    setErr(e)
    if (Object.keys(e).length) return
    upsert('sessions', { ...s, title: s.title.trim() })
    toast(exists ? 'Sessão atualizada' : 'Sessão agendada')
    onClose()
  }

  return (
    <Modal
      title={exists ? 'Editar sessão' : 'Nova sessão de estudo'}
      onClose={onClose}
      icon={<CalendarClock size={16} />}
      footer={
        <>
          {exists && (
            <button
              className="btn danger"
              style={{ marginRight: 'auto' }}
              onClick={() => {
                remove('sessions', s.id)
                toast('Sessão excluída')
                onClose()
              }}
            >
              Excluir
            </button>
          )}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={save}>Salvar</button>
        </>
      }
    >
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); save() }}>
        <div className="full">
          <Field label="O que você vai estudar?" error={err.title}>
            <input className="input" data-autofocus value={s.title} onChange={(e) => set('title', e.target.value)} aria-invalid={!!err.title} maxLength={120} />
          </Field>
        </div>
        <Field label="Data" error={err.date}>
          <input className="input" type="date" value={s.date} onChange={(e) => set('date', e.target.value)} aria-invalid={!!err.date} />
        </Field>
        <Field label="Horário (opcional)">
          <input className="input" type="time" value={s.time ?? ''} onChange={(e) => set('time', e.target.value || undefined)} />
        </Field>
        <Field label="Duração planejada (min)" error={err.plannedMin}>
          <input className="input" type="number" min={5} max={480} step={5} value={s.plannedMin} onChange={(e) => set('plannedMin', Number(e.target.value))} aria-invalid={!!err.plannedMin} />
        </Field>
        <Field label="Prioridade">
          <select className="select" value={s.priority} onChange={(e) => set('priority', e.target.value as StudySession['priority'])}>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </Field>
        <div className="full">
          <Field label="Objetivo (módulo do roadmap)" hint="Vincular ajuda os relatórios a mostrar onde você investe tempo.">
            <select className="select" value={s.moduleId ?? ''} onChange={(e) => set('moduleId', e.target.value || undefined)}>
              <option value="">Sem vínculo</option>
              {MODULES.map((m) => (
                <option key={m.id} value={m.id}>Fase {m.phase} · {m.title}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="full">
          <Field label="Notas">
            <textarea className="textarea" rows={2} value={s.notes ?? ''} onChange={(e) => set('notes', e.target.value)} maxLength={2000} />
          </Field>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}

/** Concluir sessão registrando o tempo REAL estudado. */
export function CompleteSessionModal({ session, onClose }: { session: StudySession; onClose: () => void }) {
  const { upsert, log } = useStore()
  const { toast } = useToast()
  const [min, setMin] = useState(session.actualMin ?? session.plannedMin)
  const [err, setErr] = useState('')
  const save = () => {
    if (!(min >= 1 && min <= 600)) return setErr('Informe entre 1 e 600 minutos.')
    upsert('sessions', { ...session, status: 'concluida', actualMin: Math.round(min), completedAt: new Date().toISOString() })
    log('sessao', `Estudou ${Math.round(min)} min: ${session.title}`, session.id)
    toast('Sessão registrada')
    onClose()
  }
  return (
    <Modal
      title="Concluir sessão"
      onClose={onClose}
      icon={<CheckCircle2 size={16} />}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={save}>Registrar</button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); save() }} className="stack-sm">
        <p className="muted small">{session.title}</p>
        <Field label="Quanto tempo você realmente estudou? (min)" error={err} hint={`Planejado: ${session.plannedMin} min. Registre o tempo real — é ele que alimenta os relatórios.`}>
          <input className="input" type="number" min={1} max={600} data-autofocus value={min} onChange={(e) => setMin(Number(e.target.value))} aria-invalid={!!err} />
        </Field>
        {min > 180 && <p className="xs" style={{ color: 'var(--warn)' }}>Sessões muito longas rendem menos. O XP considera no máximo 120 min por sessão e 180 min por dia — pausas fazem bem.</p>}
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
