import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { CHALLENGES, LESSONS, MODULES, RESOURCES, LABS, SEED_CARDS, lessonById, moduleById, challengeById } from '../data'
import { emptyData } from './defaults'
import { addDays, dayKey, weekStart } from './dates'
import { grade, checkText, seededShuffle } from './grading'
import { activeDays, levelFor, streak, totalXp, xpBreakdown } from './gamification'
import { categoryDistribution, moduleStatus, recommend, roadmapPercent, canComplete } from './progress'
import { NEW_CARD, review } from './srs'
import { buildExport, parseImport, ImportError, toCsv, EXPORT_VERSION } from './validate'
import * as db from './db'

describe('integridade do conteúdo', () => {
  it('todo módulo referencia lições, recursos, desafios, labs e pré-requisitos existentes', () => {
    const resIds = new Set(RESOURCES.map((r) => r.id))
    const labIds = new Set(LABS.map((l) => l.id))
    for (const m of MODULES) {
      for (const l of m.lessons) expect(lessonById.get(l)?.moduleId, `${m.id} → ${l}`).toBe(m.id)
      for (const r of m.resources) expect(resIds.has(r), `${m.id} → ${r}`).toBe(true)
      for (const c of m.challenges) expect(challengeById.has(c), `${m.id} → ${c}`).toBe(true)
      for (const l of m.labs) expect(labIds.has(l), `${m.id} → ${l}`).toBe(true)
      for (const p of m.prereqs) {
        const pm = moduleById.get(p)
        expect(pm, `${m.id} prereq ${p}`).toBeTruthy()
        expect(pm!.phase).toBeLessThanOrEqual(m.phase)
      }
    }
  })
  it('toda lição pertence a um módulo que a lista', () => {
    for (const l of LESSONS) expect(moduleById.get(l.moduleId)?.lessons).toContain(l.id)
  })
  it('lições próprias têm as 8 partes; externas têm link', () => {
    for (const l of LESSONS) {
      if (l.kind === 'internal') {
        for (const k of ['what', 'why', 'how', 'example', 'mistake', 'exercise', 'verify', 'next'] as const) expect(l[k], `${l.id}.${k}`).toBeTruthy()
      } else {
        expect(l.url).toMatch(/^https:\/\//)
        expect(l.guidance).toBeTruthy()
      }
    }
  })
  it('ids únicos', () => {
    for (const arr of [LESSONS, MODULES, RESOURCES, CHALLENGES, LABS, SEED_CARDS]) {
      const ids = arr.map((x) => x.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
  it('desafios têm gabarito coerente com o tipo', () => {
    for (const c of CHALLENGES) {
      if (['mcq', 'tf', 'error'].includes(c.type)) expect(c.options![c.answer!], c.id).toBeDefined()
      if (c.type === 'fill') expect(c.accept!.length, c.id).toBeGreaterThan(0)
      if (c.type === 'order') expect(c.items!.length, c.id).toBeGreaterThan(2)
      if (c.type === 'match') expect(c.pairs!.length, c.id).toBeGreaterThan(1)
    }
  })
  it('o roadmap não tem ciclos de dependência', () => {
    const seen = new Set<string>()
    const visit = (id: string, stack: string[]) => {
      expect(stack).not.toContain(id)
      if (seen.has(id)) return
      for (const p of moduleById.get(id)!.prereqs) visit(p, [...stack, id])
      seen.add(id)
    }
    for (const m of MODULES) visit(m.id, [])
  })
})

describe('correção de desafios', () => {
  it('normaliza acentos, caixa e espaços', () => {
    expect(checkText('  Ação ', ['acao'])).toBe(true)
    expect(checkText('', [''])).toBe(false)
  })
  it('corrige cada tipo', () => {
    const order = CHALLENGES.find((c) => c.type === 'order')!
    expect(grade(order, { kind: 'order', items: order.items! })).toBe(true)
    expect(grade(order, { kind: 'order', items: [...order.items!].reverse() })).toBe(false)
    const match = CHALLENGES.find((c) => c.type === 'match')!
    expect(grade(match, { kind: 'match', map: Object.fromEntries(match.pairs!) })).toBe(true)
    const mcq = CHALLENGES.find((c) => c.type === 'mcq')!
    expect(grade(mcq, { kind: 'option', index: mcq.answer! })).toBe(true)
    expect(grade(mcq, { kind: 'option', index: (mcq.answer! + 1) % mcq.options!.length })).toBe(false)
  })
  it('embaralhamento é determinístico e nunca entrega a ordem correta', () => {
    const items = ['a', 'b', 'c', 'd']
    expect(seededShuffle(items, 'x')).toEqual(seededShuffle(items, 'x'))
    for (const seed of ['a', 'b', 'c', 'z', 'c-lx-3']) expect(seededShuffle(items, seed)).not.toEqual(items)
  })
})

describe('repetição espaçada', () => {
  const now = new Date(2026, 9, 20, 10)
  it('acertos aumentam o intervalo; erro volta para 1 dia', () => {
    let s = review(NEW_CARD('2026-10-20'), 'bom', now)
    expect(s.interval).toBe(1)
    s = review(s, 'bom', now)
    expect(s.interval).toBe(3)
    s = review(s, 'bom', now)
    expect(s.interval).toBe(8)
    s = review(s, 'errei', now)
    expect(s.interval).toBe(1)
    expect(s.lapses).toBe(1)
    expect(s.ease).toBeCloseTo(2.3)
    expect(s.due).toBe('2026-10-21')
  })
  it('ease nunca cai abaixo de 1.3 e intervalo é limitado', () => {
    let s = NEW_CARD()
    for (let i = 0; i < 20; i++) s = review(s, 'errei', now)
    expect(s.ease).toBe(1.3)
    for (let i = 0; i < 20; i++) s = review(s, 'facil', now)
    expect(s.interval).toBeLessThanOrEqual(180)
  })
})

describe('progresso e recomendação', () => {
  it('usuário novo: recomenda o início da Fase 1', () => {
    const d = emptyData()
    const r = recommend(d)!
    expect(r.module.id).toBe('m-logica-1')
    expect(r.lessonId).toBe('l-algoritmos')
    expect(roadmapPercent(d)).toBe(0)
  })
  it('módulo com pré-requisito pendente fica "bloqueado", mas visível', () => {
    const d = emptyData()
    expect(moduleStatus(d, moduleById.get('m-logica-2')!)).toBe('bloqueado')
  })
  it('prefere módulo em andamento e respeita a última lição', () => {
    const d = emptyData()
    d.lessonProgress['l-ipv4'] = { done: true }
    d.moduleProgress['m-redes-1'] = { checklist: {}, notes: '', startedAt: '2026-10-01', lastLessonId: 'l-ipv4' }
    const r = recommend(d)!
    expect(r.module.id).toBe('m-redes-1')
    expect(r.lessonId).toBe('l-modelos-camadas')
  })
  it('não permite concluir módulo com lições pendentes', () => {
    const d = emptyData()
    const m = moduleById.get('m-logica-1')!
    expect(canComplete(d, m)).toBe(false)
    for (const l of m.lessons) d.lessonProgress[l] = { done: true }
    expect(canComplete(d, m)).toBe(true)
  })
  it('distribuição por categoria vai de 0 a 100', () => {
    const d = emptyData()
    for (const m of MODULES) d.moduleProgress[m.id] = { checklist: {}, notes: '', completedAt: 'x' }
    expect(categoryDistribution(d).every((c) => c.value === 100)).toBe(true)
    expect(roadmapPercent(d)).toBe(100)
  })
})

describe('gamificação', () => {
  it('XP zero sem eventos', () => {
    expect(totalXp(emptyData())).toBe(0)
  })
  it('limita sessões longas (máx. 120 min/sessão, 180 min/dia)', () => {
    const d = emptyData()
    const s = (id: string, min: number) => ({ id, title: 'x', date: '2026-10-20', plannedMin: min, actualMin: min, priority: 'media' as const, status: 'concluida' as const })
    d.sessions = [s('a', 600), s('b', 600)]
    const sess = xpBreakdown(d).find((x) => x.source === 'Sessões de estudo')!
    expect(sess.xp).toBe(36) // 180 min / 5
  })
  it('desafio só conta uma vez e vale metade com dica', () => {
    const d = emptyData()
    const c = CHALLENGES[0]
    d.attempts = [
      { id: '1', challengeId: c.id, at: '2026-10-20T10:00:00Z', correct: true, answer: '', hintUsed: true },
      { id: '2', challengeId: c.id, at: '2026-10-20T11:00:00Z', correct: true, answer: '', hintUsed: false },
    ]
    expect(xpBreakdown(d).find((x) => x.source === 'Desafios')!.xp).toBe(Math.floor(c.points / 2))
  })
  it('níveis: 0, 100, 300, 600', () => {
    expect(levelFor(0).level).toBe(1)
    expect(levelFor(99).level).toBe(1)
    expect(levelFor(100).level).toBe(2)
    expect(levelFor(300).level).toBe(3)
    expect(levelFor(650).level).toBe(4)
  })
  it('sequência tolera o dia de hoje ainda sem atividade', () => {
    const d = emptyData()
    const today = dayKey()
    d.activity = [1, 2, 3].map((n) => {
      const [y, m, dd] = addDays(today, -n).split('-').map(Number)
      return { id: String(n), at: new Date(y, m - 1, dd, 12).toISOString(), type: 'licao' as const, label: '' }
    })
    expect(activeDays(d).size).toBe(3)
    expect(streak(d, today)).toBe(3)
  })
  it('semana começa na segunda', () => {
    expect(weekStart('2026-10-20')).toBe('2026-10-19') // terça → segunda
    expect(weekStart('2026-10-25')).toBe('2026-10-19') // domingo → segunda anterior
  })
})

describe('exportação e importação', () => {
  it('ida e volta preserva dados', () => {
    const d = emptyData()
    d.settings.name = 'Athos'
    d.notes = [{ id: 'n1', title: 'T', body: 'B', category: 'Conceito', tags: ['a'], favorite: false, createdAt: 'x', updatedAt: 'x' }]
    const { data, summary } = parseImport(JSON.stringify(buildExport(d)))
    expect(data.settings.name).toBe('Athos')
    expect(data.notes).toHaveLength(1)
    expect(summary.notes).toBe(1)
  })
  it('rejeita arquivos inválidos com mensagens claras', () => {
    expect(() => parseImport('não é json')).toThrow(ImportError)
    expect(() => parseImport('{"app":"outro"}')).toThrow(/não parece/)
    expect(() => parseImport(JSON.stringify({ app: 'cyberstart', version: EXPORT_VERSION + 1, data: {} }))).toThrow(/mais nova/)
    expect(() => parseImport(JSON.stringify({ app: 'cyberstart', version: 1, data: { notes: [{ title: 'sem id' }] } }))).toThrow(/identificador/)
    expect(() => parseImport(JSON.stringify({ app: 'cyberstart', version: 1, data: { notes: [{ id: 'a' }, { id: 'a' }] } }))).toThrow(/duplicados/)
  })
  it('ignora configurações desconhecidas ou com tipo errado', () => {
    const { data } = parseImport(JSON.stringify({ app: 'cyberstart', version: 1, data: { settings: { name: 5, hacker: true, weeklyHours: 10 } } }))
    expect(data.settings.name).toBe('')
    expect((data.settings as unknown as Record<string, unknown>).hacker).toBeUndefined()
    expect(data.settings.weeklyHours).toBe(10)
  })
  it('CSV escapa aspas e neutraliza fórmulas', () => {
    const csv = toCsv([{ a: '=HYPERLINK("x")', b: 'diz "oi"' }], ['a', 'b'])
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`)
    expect(csv).toContain('"diz ""oi"""')
  })
})

describe('persistência IndexedDB', () => {
  it('salva, recarrega e substitui', async () => {
    db.__resetDbHandle()
    await db.putMeta('settings', { ...emptyData().settings, name: 'Teste' })
    await db.putItem('notes', { id: 'n1' })
    let d = await db.loadAll()
    expect(d.settings.name).toBe('Teste')
    expect(d.notes).toHaveLength(1)
    await db.deleteItem('notes', 'n1')
    d = await db.loadAll()
    expect(d.notes).toHaveLength(0)
    const fresh = emptyData()
    fresh.jobs = [{ id: 'j1' } as never]
    await db.replaceAll(fresh)
    d = await db.loadAll()
    expect(d.settings.name).toBe('')
    expect(d.jobs).toHaveLength(1)
  })
})
