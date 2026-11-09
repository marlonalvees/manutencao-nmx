import { Computer, Keyboard, Laptop, Monitor, Mouse, Printer, Wrench, type LucideIcon } from 'lucide-react'
import { daysUntil, plural } from './date'

// a mesma lista que a API aceita (api/src/lib/validation.ts)
export const EQUIPMENT_TYPES = ['PC', 'Notebook', 'Teclado', 'Mouse', 'Monitor', 'Impressora', 'Outro']

const TYPE_ICONS: Record<string, LucideIcon> = {
  PC: Computer,
  Notebook: Laptop,
  Teclado: Keyboard,
  Mouse: Mouse,
  Monitor: Monitor,
  Impressora: Printer,
}

export function typeIcon(type: string) {
  return TYPE_ICONS[type] ?? Wrench
}

export const FREQUENCIES = [
  { days: 30, label: 'Mensal' },
  { days: 60, label: 'Bimestral' },
  { days: 90, label: 'Trimestral' },
  { days: 180, label: 'Semestral' },
  { days: 365, label: 'Anual' },
]

export function frequencyLabel(days: number) {
  return FREQUENCIES.find((f) => f.days === days)?.label ?? `A cada ${days} dias`
}

export type DueStatus = 'overdue' | 'today' | 'week' | 'ok'

/** "esta semana" = próximos 7 dias */
export function dueStatus(nextDate: string): DueStatus {
  const days = daysUntil(nextDate)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 7) return 'week'
  return 'ok'
}

export function dueLabel(nextDate: string) {
  const days = daysUntil(nextDate)
  if (days < 0) return `Atrasada há ${plural(-days, 'dia', 'dias')}`
  if (days === 0) return 'Vence hoje'
  if (days === 1) return 'Vence amanhã'
  return `Em ${days} dias`
}

export const DUE_STYLES: Record<DueStatus, string> = {
  overdue: 'bg-red-base/10 text-red-base',
  today: 'bg-orange-base/15 text-orange-base',
  week: 'bg-orange-base/10 text-orange-base',
  ok: 'bg-gray-base/10 text-gray-base',
}
