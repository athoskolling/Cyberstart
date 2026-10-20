// Datas sempre no fuso local do usuário. Chaves de dia no formato YYYY-MM-DD.

export const pad = (n: number) => String(n).padStart(2, '0')

export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const d = parseDay(key)
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseDay(a).getTime() - parseDay(b).getTime()) / 86_400_000)
}

/** Segunda-feira da semana de `key`. */
export function weekStart(key: string): string {
  const d = parseDay(key)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return dayKey(d)
}

const fmtLong = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const fmtShort = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
const fmtWeekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const fmtDateTime = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export const fmt = {
  long: (d: Date) => fmtLong.format(d),
  short: (key: string) => fmtShort.format(parseDay(key)).replace('.', ''),
  weekday: (key: string) => fmtWeekday.format(parseDay(key)).replace('.', ''),
  dateTime: (iso: string) => fmtDateTime.format(new Date(iso)),
}

export function relative(iso: string, now = new Date()): string {
  const s = Math.round((now.getTime() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  const m = Math.round(s / 60)
  if (m < 60) return `há ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  if (d === 1) return 'ontem'
  if (d < 30) return `há ${d} dias`
  return fmt.dateTime(iso)
}

export function minutesLabel(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const r = min % 60
  return r ? `${h} h ${r} min` : `${h} h`
}

export function greeting(d = new Date()): string {
  const h = d.getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
