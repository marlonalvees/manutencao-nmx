export const EQUIPMENT_TYPES = ['PC', 'Notebook', 'Teclado', 'Mouse', 'Monitor', 'Impressora', 'Outro']

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isDate(value: unknown): value is string {
    return typeof value === 'string' && DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value))
}

export function trimOrNull(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function today() {
    return new Date().toISOString().slice(0, 10)
}
