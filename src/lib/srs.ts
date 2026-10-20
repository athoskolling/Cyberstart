import type { CardState, Grade } from '../types'
import { addDays, dayKey } from './dates'

// Repetição espaçada — variação simplificada do SM-2 (SuperMemo 2):
// - "errei": volta para intervalo 1 dia, ease −0.2 (mín. 1.3), conta lapso
// - "difícil": intervalo × 1.2, ease −0.15
// - "bom": 1 → 3 → intervalo × ease
// - "fácil": intervalo × ease × 1.3, ease +0.15
// Intervalo máximo: 180 dias.

export const NEW_CARD = (today = dayKey()): CardState => ({ ease: 2.5, interval: 0, due: today, reps: 0, lapses: 0, history: [] })

export function review(state: CardState, grade: Grade, now = new Date()): CardState {
  const today = dayKey(now)
  let { ease, interval, reps, lapses } = state
  switch (grade) {
    case 'errei':
      ease = Math.max(1.3, ease - 0.2)
      interval = 1
      lapses += 1
      reps = 0
      break
    case 'dificil':
      ease = Math.max(1.3, ease - 0.15)
      interval = Math.max(1, Math.round((interval || 1) * 1.2))
      reps += 1
      break
    case 'bom':
      interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease)
      reps += 1
      break
    case 'facil':
      ease = ease + 0.15
      interval = reps === 0 ? 4 : Math.round(Math.max(interval, 1) * ease * 1.3)
      reps += 1
      break
  }
  interval = Math.min(180, interval)
  const history = [...state.history, { at: now.toISOString(), grade }].slice(-50)
  return { ease: Math.round(ease * 100) / 100, interval, reps, lapses, due: addDays(today, interval), history }
}

export function isDue(state: CardState | undefined, today = dayKey()): boolean {
  return !state || state.due <= today
}

export function previewInterval(state: CardState | undefined, grade: Grade): number {
  return review(state ?? NEW_CARD(), grade).interval
}
