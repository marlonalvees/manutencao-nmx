import { formatDate } from '../lib/date'
import { DUE_STYLES, dueLabel, dueStatus } from '../lib/maintenance'

/** Próxima data + quanto falta (ou há quanto tempo atrasou), na cor da situação. */
export default function DueBadge({ date }: { date: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-sm font-bold text-gray-900">{formatDate(date)}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${DUE_STYLES[dueStatus(date)]}`}>{dueLabel(date)}</span>
    </div>
  )
}
