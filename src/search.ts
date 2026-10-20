import { CHALLENGES, LABS, LESSONS, MODULES, RESOURCES } from './data'
import { normalize } from './lib/grading'
import type { AppData } from './types'

export interface SearchItem {
  id: string
  group: 'Ações' | 'Páginas' | 'Módulos' | 'Lições' | 'Recursos' | 'Desafios' | 'Laboratórios' | 'Notas' | 'Projetos' | 'Tarefas' | 'Vagas'
  title: string
  meta?: string
  to: string
  text: string
}

export const PAGES: { title: string; to: string; keywords: string }[] = [
  { title: 'Overview', to: '/', keywords: 'inicio dashboard painel' },
  { title: 'Meu roadmap', to: '/roadmap', keywords: 'fases trilha modulos' },
  { title: 'Cursos e recursos', to: '/recursos', keywords: 'biblioteca cursos links' },
  { title: 'Laboratórios', to: '/laboratorios', keywords: 'labs pratica' },
  { title: 'Desafios', to: '/desafios', keywords: 'exercicios quiz' },
  { title: 'Revisão (flashcards)', to: '/revisao', keywords: 'cartoes memoria repeticao espacada' },
  { title: 'Meu plano de estudos', to: '/plano', keywords: 'agenda sessoes planejador semana' },
  { title: 'Notas técnicas', to: '/notas', keywords: 'anotacoes base conhecimento' },
  { title: 'Projetos e portfólio', to: '/projetos', keywords: 'github portfolio' },
  { title: 'Carreira e vagas', to: '/carreira', keywords: 'emprego estagio entrevista competencias' },
  { title: 'Conquistas', to: '/conquistas', keywords: 'xp nivel missoes' },
  { title: 'Relatórios', to: '/relatorios', keywords: 'estatisticas graficos exportar' },
  { title: 'Configurações', to: '/configuracoes', keywords: 'preferencias tema backup importar exportar' },
]

export function buildIndex(d: AppData): SearchItem[] {
  const items: SearchItem[] = []
  for (const p of PAGES) items.push({ id: `p-${p.to}`, group: 'Páginas', title: p.title, to: p.to, text: `${p.title} ${p.keywords}` })
  for (const m of MODULES) items.push({ id: m.id, group: 'Módulos', title: m.title, meta: `Fase ${m.phase}`, to: `/roadmap/${m.id}`, text: `${m.title} ${m.description} ${m.objectives.join(' ')}` })
  for (const l of LESSONS) items.push({ id: l.id, group: 'Lições', title: l.title, meta: l.kind === 'external' ? 'Externo' : `${l.minutes} min`, to: `/estudar/${l.id}`, text: `${l.title} ${l.what ?? ''} ${l.guidance ?? ''}` })
  for (const r of [...RESOURCES, ...d.customResources]) items.push({ id: r.id, group: 'Recursos', title: r.title, meta: r.org, to: `/recursos?q=${encodeURIComponent(r.title)}`, text: `${r.title} ${r.org} ${r.description}` })
  for (const c of CHALLENGES) items.push({ id: c.id, group: 'Desafios', title: c.title, meta: `${c.points} pts`, to: `/desafios/${c.id}`, text: `${c.title} ${c.prompt}` })
  for (const l of LABS) items.push({ id: l.id, group: 'Laboratórios', title: l.title, to: `/laboratorios/${l.id}`, text: `${l.title} ${l.objective}` })
  for (const n of d.notes) items.push({ id: n.id, group: 'Notas', title: n.title || 'Sem título', meta: n.category, to: `/notas?id=${n.id}`, text: `${n.title} ${n.body} ${n.tags.join(' ')}` })
  for (const p of d.projects) items.push({ id: p.id, group: 'Projetos', title: p.name, to: `/projetos/${p.id}`, text: `${p.name} ${p.description} ${p.tech.join(' ')}` })
  for (const s of d.sessions) if (s.status === 'planejada') items.push({ id: s.id, group: 'Tarefas', title: s.title, meta: s.date.split('-').reverse().join('/'), to: `/plano?id=${s.id}`, text: s.title })
  for (const j of d.jobs) items.push({ id: j.id, group: 'Vagas', title: `${j.role} — ${j.company}`, to: `/carreira?vaga=${j.id}`, text: `${j.role} ${j.company} ${j.requirements}` })
  return items
}

export function searchItems(items: SearchItem[], q: string, limit = 40): SearchItem[] {
  const terms = normalize(q).split(' ').filter(Boolean)
  if (!terms.length) return []
  const scored: [number, SearchItem][] = []
  for (const it of items) {
    const title = normalize(it.title)
    const text = normalize(it.text)
    if (!terms.every((t) => text.includes(t) || title.includes(t))) continue
    let score = 0
    for (const t of terms) {
      if (title.startsWith(t)) score += 6
      else if (title.includes(t)) score += 3
      else score += 1
    }
    if (it.group === 'Páginas') score += 2
    scored.push([score, it])
  }
  return scored
    .sort((a, b) => b[0] - a[0])
    .slice(0, limit)
    .map((s) => s[1])
}
