// As datas da API vêm como "AAAA-MM-DD" (sem hora). Tudo aqui trabalha no fuso local,
// pra "hoje" ser o hoje de quem está usando, não o de Londres.

const DAY_MS = 86_400_000

function parse(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toISO(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function todayISO() {
  return toISO(new Date())
}

export function addDays(value: string, days: number) {
  const date = parse(value)
  date.setDate(date.getDate() + days)
  return toISO(date)
}

/** dias entre duas datas: negativo quando "to" vem antes de "from" */
export function daysBetween(from: string, to: string) {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / DAY_MS)
}

/** dias até a data: negativo = já passou, 0 = hoje */
export function daysUntil(value: string) {
  return daysBetween(todayISO(), value)
}

export function formatDate(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}
