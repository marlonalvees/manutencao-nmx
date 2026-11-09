import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { useData } from '../context/DataContext'
import type { FilterValues } from '../lib/filters'
import { EQUIPMENT_TYPES } from '../lib/maintenance'
import { inputClass, selectClass } from '../lib/ui'

interface FiltersProps {
  value: FilterValues
  onChange: (value: FilterValues) => void
  /** filtros extras da tela, na mesma linha */
  children?: ReactNode
}

/** Busca + filial + tipo, usados nas três telas. */
export default function Filters({ value, onChange, children }: FiltersProps) {
  const { branches } = useData()

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder="Buscar equipamento"
          aria-label="Buscar equipamento"
          className={`${inputClass} pl-10`}
        />
      </div>
      <select
        value={value.branchId}
        onChange={(e) => onChange({ ...value, branchId: e.target.value })}
        aria-label="Filial"
        className={`${selectClass} flex-1 sm:flex-none`}
      >
        <option value="">Todas as filiais</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      <select
        value={value.type}
        onChange={(e) => onChange({ ...value, type: e.target.value })}
        aria-label="Tipo"
        className={`${selectClass} flex-1 sm:flex-none`}
      >
        <option value="">Todos os tipos</option>
        {EQUIPMENT_TYPES.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      {children}
    </div>
  )
}
