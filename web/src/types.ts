export interface AuthUser {
  id: number
  name: string | null
  access: string
  isAdmin: boolean
}

export interface Branch {
  id: number
  name: string
}

export interface Equipment {
  id: number
  name: string
  type: string
  branch_id: number | null
  branch_name: string | null
  location: string | null
  interval_days: number
  /** "AAAA-MM-DD" */
  next_date: string
  notes: string | null
  active: boolean
  last_done_date: string | null
}

export interface EquipmentPayload {
  name: string
  type: string
  branch_id: number | null
  location: string
  interval_days: number
  next_date: string
  notes: string
  active: boolean
}

export interface Maintenance {
  id: number
  equipment_id: number
  equipment_name: string
  equipment_type: string
  branch_name: string | null
  scheduled_date: string
  done_date: string
  notes: string | null
  created_at: string
  done_by_name: string | null
  /** nomes dos arquivos; a URL sai de photoUrl() */
  photos: string[]
}
