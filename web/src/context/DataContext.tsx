import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, errorMessage } from '../lib/api'
import type { Branch, Equipment } from '../types'

// Equipamentos e filiais ficam aqui porque a Agenda, os Equipamentos e o menu (contador de
// atrasadas) usam a mesma lista. Quem muda algo chama reloadEquipment().
interface DataContextValue {
  equipment: Equipment[]
  branches: Branch[]
  loading: boolean
  error: string
  reloadEquipment: () => Promise<void>
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reloadEquipment = useCallback(async () => {
    try {
      setEquipment(await api.get<Equipment[]>('/equipment'))
      setError('')
    } catch (err) {
      setError(errorMessage(err, 'Erro ao buscar equipamentos.'))
    }
  }, [])

  useEffect(() => {
    Promise.all([reloadEquipment(), api.get<Branch[]>('/branches').then(setBranches).catch(() => {})]).finally(() =>
      setLoading(false),
    )
  }, [reloadEquipment])

  return (
    <DataContext.Provider value={{ equipment, branches, loading, error, reloadEquipment }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider')
  return ctx
}
