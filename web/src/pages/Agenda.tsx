import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarClock, CircleCheck, Computer, History, TriangleAlert, type LucideIcon } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Filters from '../components/Filters'
import { emptyFilters, matchesFilters, type FilterValues } from '../lib/filters'
import TypeIcon from '../components/TypeIcon'
import DueBadge from '../components/DueBadge'
import ConfirmMaintenanceModal from '../components/ConfirmMaintenanceModal'
import EquipmentHistoryModal from '../components/EquipmentHistoryModal'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../lib/date'
import { dueStatus, frequencyLabel, type DueStatus } from '../lib/maintenance'
import { btnGhost, btnPrimary, cardClass } from '../lib/ui'
import type { Equipment } from '../types'

type StatusFilter = 'all' | 'overdue' | 'week' | 'ok'

function statusGroup(status: DueStatus): Exclude<StatusFilter, 'all'> {
  return status === 'today' ? 'week' : status
}

interface StatCardProps {
  icon: LucideIcon
  iconClass: string
  label: string
  value: number
  hint: string
  active: boolean
  onClick: () => void
}

function StatCard({ icon: Icon, iconClass, label, value, hint, active, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${cardClass} press flex items-start gap-3 p-3 text-left transition sm:gap-4 sm:p-4 lg:p-5 ${
        active ? 'ring-2 ring-orange-base' : 'hover:shadow-float'
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white sm:h-11 sm:w-11 ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-bold tracking-wide text-gray-600 uppercase sm:text-xs">{label}</span>
        <span className="block text-2xl font-extrabold text-gray-900 sm:text-3xl">{value}</span>
        <span className="hidden truncate text-xs text-gray-500 sm:block">{hint}</span>
      </span>
    </button>
  )
}

export default function Agenda() {
  const { user } = useAuth()
  const { equipment, loading, error, reloadEquipment } = useData()
  const showToast = useToast()
  const [filters, setFilters] = useState<FilterValues>(emptyFilters)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [confirmTarget, setConfirmTarget] = useState<Equipment | null>(null)
  const [historyTarget, setHistoryTarget] = useState<Equipment | null>(null)

  const active = useMemo(() => equipment.filter((e) => e.active), [equipment])

  const counts = useMemo(() => {
    const result = { overdue: 0, week: 0, ok: 0 }
    for (const item of active) result[statusGroup(dueStatus(item.next_date))]++
    return result
  }, [active])

  const visible = active.filter(
    (e) =>
      (status === 'all' || statusGroup(dueStatus(e.next_date)) === status) &&
      matchesFilters({ name: e.name, type: e.type, branchId: e.branch_id, location: e.location }, filters),
  )

  function toggleStatus(next: StatusFilter) {
    setStatus((current) => (current === next ? 'all' : next))
  }

  async function handleDone(nextDate: string) {
    setConfirmTarget(null)
    showToast(`Manutenção registrada. Próxima em ${formatDate(nextDate)}.`)
    await reloadEquipment()
  }

  return (
    <>
      <PageHeader title="Agenda de manutenção" description="Limpezas e revisões dos equipamentos, da mais urgente para a mais tranquila." />

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          icon={TriangleAlert}
          iconClass="bg-red-base"
          label="Atrasadas"
          value={counts.overdue}
          hint="passaram da data"
          active={status === 'overdue'}
          onClick={() => toggleStatus('overdue')}
        />
        <StatCard
          icon={CalendarClock}
          iconClass="bg-orange-base"
          label="Próximos 7 dias"
          value={counts.week}
          hint="incluindo hoje"
          active={status === 'week'}
          onClick={() => toggleStatus('week')}
        />
        <StatCard
          icon={CircleCheck}
          iconClass="bg-green-base"
          label="Em dia"
          value={counts.ok}
          hint="mais de 7 dias pela frente"
          active={status === 'ok'}
          onClick={() => toggleStatus('ok')}
        />
        <StatCard
          icon={Computer}
          iconClass="bg-blue-base"
          label="Ativos"
          value={active.length}
          hint="mostrar todos"
          active={status === 'all'}
          onClick={() => setStatus('all')}
        />
      </div>

      <Filters value={filters} onChange={setFilters} />

      {error && <p className="mb-4 rounded-xl bg-red-base/10 px-3 py-2 text-sm font-semibold text-red-base">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
        </div>
      ) : active.length === 0 ? (
        <div className={`${cardClass} p-10 text-center`}>
          <CalendarCheck className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">Nenhum equipamento cadastrado ainda.</p>
          {user?.isAdmin && (
            <Link to="/equipamentos" className={`${btnPrimary} mt-4`}>
              Cadastrar equipamentos
            </Link>
          )}
        </div>
      ) : visible.length === 0 ? (
        <p className={`${cardClass} p-10 text-center text-sm text-gray-500`}>Nada por aqui com esses filtros.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <li
              key={item.id}
              className={`${cardClass} flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${
                dueStatus(item.next_date) === 'overdue' ? 'border-l-4 border-red-base' : ''
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <TypeIcon type={item.type} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-gray-900">{item.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {[item.type, item.branch_name, item.location].filter(Boolean).join(' · ')}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {frequencyLabel(item.interval_days)} · {item.last_done_date ? `última em ${formatDate(item.last_done_date)}` : 'nunca registrada'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="sm:w-40">
                  <DueBadge date={item.next_date} />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHistoryTarget(item)}
                    aria-label={`Histórico de ${item.name}`}
                    title="Histórico"
                    className={btnGhost}
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setConfirmTarget(item)} className={btnPrimary}>
                    <CircleCheck className="h-4 w-4" />
                    Confirmar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmMaintenanceModal
        key={confirmTarget?.id}
        equipment={confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onDone={handleDone}
      />
      <EquipmentHistoryModal key={`h-${historyTarget?.id}`} equipment={historyTarget} onClose={() => setHistoryTarget(null)} />
    </>
  )
}
