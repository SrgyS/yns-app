import { useAppearanceDelay } from '../lib/react'
import { Spinner } from './spinner'

export const SmallSpinner = ({ isLoading }: { isLoading?: boolean }) => {
  const show = useAppearanceDelay(isLoading)

  if (show) {
    return (
      <Spinner
        className="mr-2 h-4 w-4 animate-spin"
        aria-label="Обновление профиля"
      />
    )
  }
  return null
}
