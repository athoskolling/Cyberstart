import { CHALLENGES, MODULES, SEED_CARDS } from '../data'
import type { AppData } from '../types'
import { addDays, dayKey, parseDay } from './dates'
import { emptyData } from './defaults'
import { review } from './srs'

/**
 * Dados de DEMONSTRAÇÃO — fictícios, para explorar a interface.
 * Ficam marcados com settings.demo = true e um aviso permanente na tela.
 */
export function demoData(now = new Date()): AppData {
  const d = emptyData()
  const today = dayKey(now)
  const at = (daysAgo: number, h = 19) => {
    const x = parseDay(addDays(today, -daysAgo))
    x.setHours(h, 15)
    return x.toISOString()
  }
  d.settings = { ...d.settings, name: 'Visitante', demo: true, onboarded: true, priorityCategories: ['seg_defensiva'] }

  const doneModules = ['m-logica-1', 'm-logica-2', 'm-comp-1']
  let day = 34
  for (const id of doneModules) {
    const m = MODULES.find((x) => x.id === id)!
    for (const l of m.lessons) {
      d.lessonProgress[l] = { done: true, completedAt: at(day), exerciseCorrect: true }
      d.activity.push({ id: `da-${l}`, at: at(day), type: 'licao', label: `Concluiu a lição (demo)`, ref: l })
      day -= 1
    }
    d.moduleProgress[id] = { startedAt: at(day + m.lessons.length), completedAt: at(day), checklist: Object.fromEntries(m.checklist.map((_, i) => [i, true])), notes: '' }
    d.activity.push({ id: `dm-${id}`, at: at(day), type: 'modulo', label: `Concluiu o módulo "${m.title}" (demo)`, ref: id })
  }
  d.lessonProgress['l-arquivos-conceito'] = { done: true, completedAt: at(3) }
  d.moduleProgress['m-comp-2'] = { startedAt: at(4), checklist: { 0: true }, notes: '', lastLessonId: 'l-python-primeiro' }
  d.lessonProgress['l-modelos-camadas'] = { done: true, completedAt: at(2) }
  d.moduleProgress['m-redes-1'] = { startedAt: at(2), checklist: {}, notes: '', lastLessonId: 'l-modelos-camadas' }

  const solved = CHALLENGES.filter((c) => c.category === 'logica' || c.id === 'c-net-1' || c.id === 'c-py-1')
  solved.forEach((c, i) => {
    d.attempts.push({ id: `dt-${c.id}`, challengeId: c.id, at: at(20 - i), correct: true, answer: '(demo)', hintUsed: i % 3 === 0 })
  })
  d.attempts.push({ id: 'dt-wrong', challengeId: 'c-net-3', at: at(1), correct: false, answer: '16', hintUsed: false })

  for (let i = 0; i < 24; i++) {
    const date = addDays(today, -i * 2 - 1)
    const min = [40, 55, 30, 60, 45, 25][i % 6]
    d.sessions.push({ id: `ds-${i}`, title: 'Sessão de estudo (demo)', date, plannedMin: 45, actualMin: min, priority: 'media', status: 'concluida', completedAt: at(i * 2 + 1), moduleId: MODULES[i % 5].id })
    d.activity.push({ id: `das-${i}`, at: at(i * 2 + 1, 20), type: 'sessao', label: `Estudou ${min} min (demo)` })
  }
  d.sessions.push(
    { id: 'ds-p1', title: 'Primeiro programa em Python', date: today, time: '19:00', plannedMin: 30, priority: 'alta', status: 'planejada', moduleId: 'm-comp-2' },
    { id: 'ds-p2', title: 'IPv4 e noções de IPv6', date: addDays(today, 1), plannedMin: 35, priority: 'media', status: 'planejada', moduleId: 'm-redes-1' },
    { id: 'ds-p3', title: 'Revisar flashcards', date: addDays(today, 2), plannedMin: 15, priority: 'baixa', status: 'planejada' },
  )

  for (const c of SEED_CARDS.slice(0, 18)) {
    let s = review({ ease: 2.5, interval: 0, due: today, reps: 0, lapses: 0, history: [] }, 'bom', new Date(at(9)))
    s = review(s, Math.random() > 0.3 ? 'bom' : 'errei', new Date(at(5)))
    d.cardState[c.id] = s
  }

  d.notes.push({
    id: 'dn-1', title: 'Teste de mesa (demo)', category: 'Conceito', tags: ['logica'], favorite: true, createdAt: at(30), updatedAt: at(30),
    body: '# Teste de mesa\n\nSimular o código à mão, linha por linha, anotando o valor de cada variável.\n\n| passo | i | total |\n|---|---|---|\n| 1 | 0 | 0 |\n| 2 | 1 | 3 |\n\n```python\nfor i in range(3):\n    total += i\n```',
    moduleId: 'm-logica-1',
  })
  d.projects.push({
    id: 'dp-1', name: 'Analisador simples de logs (demo)', description: 'Script Python que resume falhas de login por IP.', objectives: '- Ler logs\n- Contar falhas', tech: ['Python'], category: 'programacao',
    status: 'em_andamento', startDate: addDays(today, -6), checklist: [{ text: 'Ler arquivo', done: true }, { text: 'Extrair IP', done: true }, { text: 'Exportar CSV', done: false }],
    evidence: '', github: '', docs: '', learnings: '', nextSteps: '', createdAt: at(6),
  })
  d.jobs.push({
    id: 'dj-1', company: 'Empresa Exemplo (fictícia)', role: 'Estágio em Segurança da Informação', url: '', requirements: 'Vaga fictícia para demonstração.', status: 'preparando', nextAction: 'Revisar currículo',
    notes: '', skillsRequired: ['Linux', 'Redes', 'Python', 'Inglês'], skillsHave: ['Python', 'Inglês'], createdAt: at(4),
  })
  return d
}
