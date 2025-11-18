import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatDate(value: string | null | Date | undefined) {
  if (!value) return '—'
  try {
    const date = value instanceof Date ? value : new Date(value)
    return format(date, 'd MMMM yyyy', { locale: ru })
  } catch {
    return typeof value === 'string' ? value : '—'
  }
}
