import { useCallback, useEffect, useState } from 'react'
import Modal from './Modal'
import MaintenanceList from './MaintenanceList'
import { api, errorMessage } from '../lib/api'
import { frequencyLabel } from '../lib/maintenance'
import type { Equipment, Maintenance } from '../types'

interface EquipmentHistoryModalProps {
  equipment: Equipment | null
  onClose: () => void
}

/** Todas as manutenções já feitas num equipamento, da mais recente para a mais antiga. */
export default function EquipmentHistoryModal({ equipment, onClose }: EquipmentHistoryModalProps) {
  const [maintenances, setMaintenances] = useState<Maintenance[] | null>(null)
  const [error, setError] = useState('')
  const equipmentId = equipment?.id

  const load = useCallback(() => {
    if (!equipmentId) return
    api
      .get<Maintenance[]>(`/maintenances?equipment_id=${equipmentId}`)
      .then(setMaintenances)
      .catch((err) => setError(errorMessage(err, 'Erro ao buscar o histórico.')))
  }, [equipmentId])

  useEffect(load, [load])

  if (!equipment) return null

  const subtitle = [equipment.type, equipment.branch_name, frequencyLabel(equipment.interval_days)].filter(Boolean).join(' · ')

  return (
    <Modal open wide title={`Histórico — ${equipment.name}`} subtitle={subtitle} onClose={onClose}>
      {error ? (
        <p className="rounded-xl bg-red-base/10 px-3 py-2 text-sm font-semibold text-red-base">{error}</p>
      ) : maintenances === null ? (
        <div className="space-y-3">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      ) : maintenances.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">Nenhuma manutenção registrada ainda.</p>
      ) : (
        <MaintenanceList maintenances={maintenances} onChanged={load} />
      )}
    </Modal>
  )
}
