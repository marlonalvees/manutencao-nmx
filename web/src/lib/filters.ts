export interface FilterValues {
  search: string
  branchId: string
  type: string
}

export const emptyFilters: FilterValues = { search: '', branchId: '', type: '' }

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** busca sem acento e sem diferenciar maiúsculas, no nome e no local */
export function matchesFilters(
  item: { name: string; type: string; branchId: number | null; location?: string | null },
  filters: FilterValues,
) {
  if (filters.branchId && String(item.branchId ?? '') !== filters.branchId) return false
  if (filters.type && item.type !== filters.type) return false
  const term = normalize(filters.search.trim())
  return !term || normalize(`${item.name} ${item.location ?? ''}`).includes(term)
}
