export function formatDuration(seconds?: number | null): string {
  if (
    seconds === null ||
    seconds === undefined ||
    Number.isNaN(seconds) ||
    seconds < 0
  ) {
    return '00:00'
  }

  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60

  const mm = String(mins).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')

  return `${mm}:${ss}`
}
