import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import Filters from '../components/Filters'
import { emptyFilters, matchesFilters, type FilterValues } from '../lib/filters'
import MaintenanceList from '../components/MaintenanceList'
import { useData } from '../context/DataContext'
import { api, errorMessage } from '../lib/api'
import { cardClass } from '../lib/ui'
import type { Maintenance } from '../types'

export default function Historico() {
  const { equipment } = useData()
  const [maintenances, setMaintenances] = useState<Maintenance[] | null>(null)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<FilterValues>(emptyFilters)

  const load = useCallback(() => {
    api
      .get<Maintenance[]>('/maintenances')
      .then(setMaintenances)
      .catch((err) => setError(errorMessage(err, 'Erro ao buscar o histórico.')))
  }, [])

  useEffect(load, [load])

  // a filial vem do equipamento (a manutenção só traz o nome dela)
  const branchOf = (equipmentId: number) => equipment.find((e) => e.id === equipmentId)?.branch_id ?? null

  const visible = (maintenances ?? []).filter((m) =>
    matchesFilters({ name: m.equipment_name, type: m.equipment_type, branchId: branchOf(m.equipment_id) }, filters),
  )

  return (
    <>
      <PageHeader title="Histórico" description="As últimas manutenções feitas, com quem fez e as fotos." />

      <Filters value={filters} onChange={setFilters} />

      {error ? (
        <p className="rounded-xl bg-red-base/10 px-3 py-2 text-sm font-semibold text-red-base">{error}</p>
      ) : maintenances === null ? (
        <div className="space-y-3">
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
        </div>
      ) : visible.length === 0 ? (
        <p className={`${cardClass} p-10 text-center text-sm text-gray-500`}>
          {maintenances.length === 0 ? 'Nenhuma manutenção registrada ainda.' : 'Nada com esses filtros.'}
        </p>
      ) : (
        <MaintenanceList maintenances={visible} showEquipment onChanged={load} />
      )}
    </>
  )
}
