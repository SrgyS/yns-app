import { TriangleAlert } from 'lucide-react'

export const FormError = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <div className="bg-destructive/15 rounded-md flex items-center gap-2 text-sm text-destructive py-2 px-3">
      <TriangleAlert className="h-4 w-4 flex-shrink-0" />
      <p className="flex-1 break-words">{message}</p>
    </div>
  )
}
