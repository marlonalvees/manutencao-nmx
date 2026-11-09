import { useState } from 'react'
import { History, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Filters from '../components/Filters'
import { emptyFilters, matchesFilters, type FilterValues } from '../lib/filters'
import TypeIcon from '../components/TypeIcon'
import DueBadge from '../components/DueBadge'
import EquipmentFormModal from '../components/EquipmentFormModal'
import EquipmentHistoryModal from '../components/EquipmentHistoryModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { api, errorMessage } from '../lib/api'
import { frequencyLabel } from '../lib/maintenance'
import { btnPrimary, cardClass, iconButton, selectClass } from '../lib/ui'
import type { Equipment } from '../types'

type ActiveFilter = 'active' | 'inactive' | 'all'

export default function Equipamentos() {
  const { user } = useAuth()
  const { equipment, loading, error, reloadEquipment } = useData()
  const showToast = useToast()
  const [filters, setFilters] = useState<FilterValues>(emptyFilters)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active')
  // undefined = fechado, null = cadastro novo
  const [formTarget, setFormTarget] = useState<Equipment | null | undefined>(undefined)
  const [historyTarget, setHistoryTarget] = useState<Equipment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = !!user?.isAdmin

  const visible = equipment
    .filter((e) => activeFilter === 'all' || e.active === (activeFilter === 'active'))
    .filter((e) => matchesFilters({ name: e.name, type: e.type, branchId: e.branch_id, location: e.location }, filters))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  async function handleSaved(message: string) {
    setFormTarget(undefined)
    showToast(message)
    await reloadEquipment()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      await api.delete(`/equipment/${deleteTarget.id}`)
      showToast('Equipamento excluído.')
      setDeleteTarget(null)
      await reloadEquipment()
    } catch (err) {
      showToast(errorMessage(err, 'Erro ao excluir.'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  function actions(item: Equipment) {
    return (
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setHistoryTarget(item)} aria-label="Histórico" title="Histórico" className={iconButton}>
          <History className="h-4 w-4" />
        </button>
        {isAdmin && (
          <>
            <button type="button" onClick={() => setFormTarget(item)} aria-label="Editar" title="Editar" className={iconButton}>
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(item)}
              aria-label="Excluir"
              title="Excluir"
              className={`${iconButton} hover:bg-red-base/10 hover:text-red-base`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Equipamentos"
        description="O que entra na agenda de manutenção, de onde é e de quanto em quanto tempo."
        action={
          isAdmin && (
            <button type="button" onClick={() => setFormTarget(null)} className={`${btnPrimary} self-start`}>
              <Plus className="h-4 w-4" />
              Novo equipamento
            </button>
          )
        }
      />

      <Filters value={filters} onChange={setFilters}>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
          aria-label="Situação"
          className={`${selectClass} flex-1 sm:flex-none`}
        >
          <option value="active">Ativos</option>
          <option value="inactive">Fora de uso</option>
          <option value="all">Todos</option>
        </select>
      </Filters>

      {error && <p className="mb-4 rounded-xl bg-red-base/10 px-3 py-2 text-sm font-semibold text-red-base">{error}</p>}

      {loading ? (
        <div className="skeleton h-64" />
      ) : visible.length === 0 ? (
        <p className={`${cardClass} p-10 text-center text-sm text-gray-500`}>
          {equipment.length === 0 ? 'Nenhum equipamento cadastrado ainda.' : 'Nenhum equipamento com esses filtros.'}
        </p>
      ) : (
        <>
          {/* computador: tabela */}
          <div className={`${cardClass} hidden overflow-x-auto md:block`}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold tracking-wide text-gray-500 uppercase">
                  <th className="px-4 py-3">Equipamento</th>
                  <th className="px-4 py-3">Filial</th>
                  <th className="px-4 py-3">Frequência</th>
                  <th className="px-4 py-3">Próxima</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className={`border-b border-gray-100 last:border-0 ${item.active ? '' : 'opacity-60'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <TypeIcon type={item.type} size="sm" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900">
                            {item.name}
                            {!item.active && <span className="ml-2 text-xs font-semibold text-gray-500">(fora de uso)</span>}
                          </p>
                          <p className="text-xs text-gray-500">{[item.type, item.location].filter(Boolean).join(' · ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.branch_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{frequencyLabel(item.interval_days)}</td>
                    <td className="px-4 py-3">
                      <DueBadge date={item.next_date} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">{actions(item)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* celular: cartões */}
          <ul className="space-y-3 md:hidden">
            {visible.map((item) => (
              <li key={item.id} className={`${cardClass} p-4 ${item.active ? '' : 'opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <TypeIcon type={item.type} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-gray-900">{item.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {[item.type, item.branch_name, frequencyLabel(item.interval_days)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <DueBadge date={item.next_date} />
                  {actions(item)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {formTarget !== undefined && (
        <EquipmentFormModal
          key={formTarget?.id ?? 'novo'}
          equipment={formTarget}
          onClose={() => setFormTarget(undefined)}
          onSaved={handleSaved}
        />
      )}
      <EquipmentHistoryModal key={`h-${historyTarget?.id}`} equipment={historyTarget} onClose={() => setHistoryTarget(null)} />
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Excluir ${deleteTarget?.name ?? ''}?`}
        message="O histórico de manutenções e as fotos dele também serão apagados. Se ele só saiu de uso, prefira editar e desmarcar “Ativo”."
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
