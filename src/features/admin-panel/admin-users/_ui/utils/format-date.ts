import { format } from 'date-fns'

export function formatDate(value: string | null | Date | undefined) {
  if (!value) return '—'
  try {
    const date = value instanceof Date ? value : new Date(value)
    return format(date, 'dd.MM.yyyy')
  } catch {
    return typeof value === 'string' ? value : '—'
  }
}
