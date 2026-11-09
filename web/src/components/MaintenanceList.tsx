import { useState } from 'react'
import { Undo2 } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'
import PhotoLightbox from './PhotoLightbox'
import TypeIcon from './TypeIcon'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { api, errorMessage, photoUrl } from '../lib/api'
import { daysBetween, formatDate, plural } from '../lib/date'
import { cardClass, iconButton } from '../lib/ui'
import type { Maintenance } from '../types'

interface MaintenanceListProps {
  maintenances: Maintenance[]
  /** no histórico geral mostra de qual equipamento é; no histórico de um equipamento, não precisa */
  showEquipment?: boolean
  onChanged: () => void
}

/** Lista de manutenções feitas, com as fotos. O admin pode desfazer uma confirmação errada. */
export default function MaintenanceList({ maintenances, showEquipment = false, onChanged }: MaintenanceListProps) {
  const { user } = useAuth()
  const { reloadEquipment } = useData()
  const showToast = useToast()
  const [photo, setPhoto] = useState<{ src: string; caption: string } | null>(null)
  const [undoTarget, setUndoTarget] = useState<Maintenance | null>(null)
  const [undoing, setUndoing] = useState(false)

  async function confirmUndo() {
    if (!undoTarget) return
    setUndoing(true)

    try {
      await api.delete(`/maintenances/${undoTarget.id}`)
      showToast('Confirmação desfeita.')
      setUndoTarget(null)
      await reloadEquipment()
      onChanged()
    } catch (err) {
      showToast(errorMessage(err, 'Erro ao desfazer.'), 'error')
    } finally {
      setUndoing(false)
    }
  }

  return (
    <>
      <ul className="space-y-3">
        {maintenances.map((m) => {
          const lateDays = daysBetween(m.scheduled_date, m.done_date)

          return (
            <li key={m.id} className={`${cardClass} p-4`}>
              <div className="flex items-start gap-3">
                {showEquipment && <TypeIcon type={m.equipment_type} size="sm" />}

                <div className="min-w-0 flex-1">
                  {showEquipment && (
                    <p className="truncate text-sm font-extrabold text-gray-900">
                      {m.equipment_name}
                      {m.branch_name && <span className="font-medium text-gray-500"> · {m.branch_name}</span>}
                    </p>
                  )}
                  <p className="text-sm font-bold text-gray-900">
                    Feita em {formatDate(m.done_date)}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                        lateDays > 0 ? 'bg-red-base/10 text-red-base' : 'bg-gray-base/10 text-gray-base'
                      }`}
                    >
                      {lateDays > 0 ? `${plural(lateDays, 'dia', 'dias')} de atraso` : 'No prazo'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Prevista para {formatDate(m.scheduled_date)}
                    {m.done_by_name && ` · por ${m.done_by_name}`}
                  </p>
                </div>

                {user?.isAdmin && (
                  <button
                    type="button"
                    onClick={() => setUndoTarget(m)}
                    aria-label="Desfazer confirmação"
                    title="Desfazer confirmação"
                    className={`${iconButton} hover:bg-red-base/10 hover:text-red-base`}
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {m.notes && <p className="mt-3 whitespace-pre-line break-words text-sm text-gray-700">{m.notes}</p>}

              {m.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.photos.map((fileName, index) => (
                    <button
                      key={fileName}
                      type="button"
                      onClick={() =>
                        setPhoto({
                          src: photoUrl(fileName),
                          caption: `${m.equipment_name} · ${formatDate(m.done_date)} · foto ${index + 1} de ${m.photos.length}`,
                        })
                      }
                      className="press h-20 w-20 overflow-hidden rounded-xl bg-gray ring-orange-base transition hover:ring-2"
                    >
                      <img src={photoUrl(fileName)} alt={`Foto ${index + 1}`} loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <PhotoLightbox src={photo?.src ?? null} caption={photo?.caption ?? ''} onClose={() => setPhoto(null)} />

      <ConfirmDialog
        open={!!undoTarget}
        title="Desfazer confirmação?"
        message={`A manutenção de ${undoTarget ? formatDate(undoTarget.done_date) : ''} e as fotos dela serão apagadas. Se for a mais recente, a próxima data volta para ${undoTarget ? formatDate(undoTarget.scheduled_date) : ''}.`}
        confirmLabel="Desfazer"
        loading={undoing}
        onConfirm={confirmUndo}
        onCancel={() => setUndoTarget(null)}
      />
    </>
  )
}
