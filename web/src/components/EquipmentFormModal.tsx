import { useState, type FormEvent } from 'react'
import Modal from './Modal'
import { useData } from '../context/DataContext'
import { api, errorMessage } from '../lib/api'
import { todayISO } from '../lib/date'
import { EQUIPMENT_TYPES, FREQUENCIES } from '../lib/maintenance'
import { btnPrimary, btnSecondary, inputClass, labelClass, selectClass } from '../lib/ui'
import type { Equipment, EquipmentPayload } from '../types'

interface EquipmentFormModalProps {
  /** null = cadastro novo */
  equipment: Equipment | null
  onClose: () => void
  onSaved: (message: string) => void
}

function initialForm(equipment: Equipment | null): EquipmentPayload {
  return {
    name: equipment?.name ?? '',
    type: equipment?.type ?? 'PC',
    branch_id: equipment?.branch_id ?? null,
    location: equipment?.location ?? '',
    interval_days: equipment?.interval_days ?? 90,
    next_date: equipment?.next_date ?? todayISO(),
    notes: equipment?.notes ?? '',
    active: equipment?.active ?? true,
  }
}

export default function EquipmentFormModal({ equipment, onClose, onSaved }: EquipmentFormModalProps) {
  const { branches } = useData()
  const [form, setForm] = useState(() => initialForm(equipment))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // frequência que não está na lista (ex.: cadastrada pela API) continua aparecendo
  const frequencies = FREQUENCIES.some((f) => f.days === form.interval_days)
    ? FREQUENCIES
    : [...FREQUENCIES, { days: form.interval_days, label: `A cada ${form.interval_days} dias` }]

  function update<K extends keyof EquipmentPayload>(key: K, value: EquipmentPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (equipment) {
        await api.put(`/equipment/${equipment.id}`, form)
        onSaved('Equipamento atualizado.')
      } else {
        await api.post('/equipment', form)
        onSaved('Equipamento cadastrado.')
      }
    } catch (err) {
      setError(errorMessage(err, 'Erro ao salvar o equipamento.'))
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title={equipment ? 'Editar equipamento' : 'Novo equipamento'}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancelar
          </button>
          <button type="submit" form="equipment-form" disabled={saving} className={btnPrimary}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      }
    >
      <form id="equipment-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="eq-name" className={labelClass}>
            Nome
          </label>
          <input
            id="eq-name"
            required
            autoFocus
            maxLength={100}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Ex.: PC Caixa 01, Teclado Financeiro"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="eq-type" className={labelClass}>
            Tipo
          </label>
          <select id="eq-type" value={form.type} onChange={(e) => update('type', e.target.value)} className={`${selectClass} w-full`}>
            {EQUIPMENT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="eq-branch" className={labelClass}>
            Filial
          </label>
          <select
            id="eq-branch"
            value={form.branch_id ?? ''}
            onChange={(e) => update('branch_id', e.target.value ? Number(e.target.value) : null)}
            className={`${selectClass} w-full`}
          >
            <option value="">Sem filial</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="eq-location" className={labelClass}>
            Local (opcional)
          </label>
          <input
            id="eq-location"
            maxLength={100}
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Ex.: Caixa 2, Sala do financeiro"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="eq-frequency" className={labelClass}>
            Frequência
          </label>
          <select
            id="eq-frequency"
            value={form.interval_days}
            onChange={(e) => update('interval_days', Number(e.target.value))}
            className={`${selectClass} w-full`}
          >
            {frequencies.map((f) => (
              <option key={f.days} value={f.days}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="eq-next" className={labelClass}>
            Próxima manutenção
          </label>
          <input
            id="eq-next"
            type="date"
            required
            value={form.next_date}
            onChange={(e) => update('next_date', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="eq-notes" className={labelClass}>
            Observações (opcional)
          </label>
          <textarea
            id="eq-notes"
            rows={2}
            maxLength={500}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Ex.: patrimônio 0123, usuário principal"
            className={`${inputClass} resize-y`}
          />
        </div>

        {equipment && (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-3.5 py-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => update('active', e.target.checked)}
              className="h-4 w-4 accent-orange-base"
            />
            <span className="text-sm font-semibold text-gray-800">Ativo</span>
            <span className="text-xs text-gray-500">Desmarque se o equipamento saiu de uso: ele some da agenda.</span>
          </label>
        )}

        {error && (
          <p className="rounded-xl bg-red-base/10 px-3 py-2 text-sm font-semibold text-red-base sm:col-span-2">{error}</p>
        )}
      </form>
    </Modal>
  )
}
