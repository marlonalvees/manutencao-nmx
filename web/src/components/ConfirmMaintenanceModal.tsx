import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Camera, X } from 'lucide-react'
import Modal from './Modal'
import DueBadge from './DueBadge'
import { api, errorMessage } from '../lib/api'
import { addDays, formatDate, todayISO } from '../lib/date'
import { compressImage } from '../lib/image'
import { frequencyLabel } from '../lib/maintenance'
import { btnPrimary, btnSecondary, inputClass, labelClass } from '../lib/ui'
import type { Equipment } from '../types'

const MAX_PHOTOS = 5

interface Photo {
  file: File
  preview: string
}

interface ConfirmMaintenanceModalProps {
  equipment: Equipment | null
  onClose: () => void
  onDone: (nextDate: string) => void
}

/** Confirma que a limpeza/manutenção foi feita: data, observação e fotos. */
export default function ConfirmMaintenanceModal({ equipment, onClose, onDone }: ConfirmMaintenanceModalProps) {
  const [doneDate, setDoneDate] = useState(todayISO)
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [preparing, setPreparing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const photosRef = useRef(photos)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  // libera da memória as prévias quando a janela fecha
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), [])

  if (!equipment) return null

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setError('')

    const room = MAX_PHOTOS - photos.length
    const selected = Array.from(files).slice(0, room)
    if (files.length > room) setError(`Dá para enviar no máximo ${MAX_PHOTOS} fotos.`)

    setPreparing(true)
    const compressed = await Promise.all(selected.map(compressImage))
    setPhotos((prev) => [...prev, ...compressed.map((file) => ({ file, preview: URL.createObjectURL(file) }))])
    setPreparing(false)
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photos[index].preview)
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!equipment) return

    setSaving(true)
    setError('')

    const formData = new FormData()
    formData.append('done_date', doneDate)
    formData.append('notes', notes)
    photos.forEach((photo) => formData.append('photos', photo.file))

    try {
      const result = await api.upload<{ next_date: string }>(`/equipment/${equipment.id}/maintenances`, formData)
      onDone(result.next_date)
    } catch (err) {
      setError(errorMessage(err, 'Erro ao registrar a manutenção.'))
      setSaving(false)
    }
  }

  const subtitle = [equipment.type, equipment.branch_name, equipment.location].filter(Boolean).join(' · ')

  return (
    <Modal
      open
      title={`Confirmar manutenção — ${equipment.name}`}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancelar
          </button>
          <button type="submit" form="confirm-maintenance" disabled={saving || preparing || !doneDate} className={btnPrimary}>
            {saving ? 'Enviando...' : 'Confirmar que foi feita'}
          </button>
        </>
      }
    >
      <form id="confirm-maintenance" onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-gray-500">Estava prevista para</p>
            <DueBadge date={equipment.next_date} />
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500">Próxima ({frequencyLabel(equipment.interval_days).toLowerCase()})</p>
            <p className="text-sm font-bold text-gray-900">{doneDate ? formatDate(addDays(doneDate, equipment.interval_days)) : '—'}</p>
          </div>
        </div>

        <div>
          <label htmlFor="done-date" className={labelClass}>
            Data em que foi feita
          </label>
          <input
            id="done-date"
            type="date"
            required
            max={todayISO()}
            value={doneDate}
            onChange={(e) => setDoneDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            O que foi feito (opcional)
          </label>
          <textarea
            id="notes"
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: limpeza interna, troca da pasta térmica, teclado higienizado"
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <p className={labelClass}>
            Fotos ({photos.length}/{MAX_PHOTOS})
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {photos.map((photo, index) => (
              <div key={photo.preview} className="relative aspect-square overflow-hidden rounded-xl bg-gray">
                <img src={photo.preview} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label={`Remover foto ${index + 1}`}
                  className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={preparing}
                className="press flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 text-xs font-semibold text-gray-500 transition hover:border-orange-base hover:text-orange-base disabled:opacity-50"
              >
                <Camera className="h-6 w-6" />
                {preparing ? 'Preparando...' : 'Adicionar'}
              </button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <p className="mt-1.5 text-xs text-gray-500">No celular dá para tirar a foto na hora ou escolher da galeria.</p>
        </div>

        {error && <p className="rounded-xl bg-red-base/10 px-3 py-2 text-sm font-semibold text-red-base">{error}</p>}
      </form>
    </Modal>
  )
}
