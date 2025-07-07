import { CircleCheck } from 'lucide-react'

export const FormSuccess = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <div className="bg-emerald-500/15 rounded-md flex items-center gap-2 text-sm text-emerald-500 py-2 px-3">
      <CircleCheck className="h-4 w-4 flex-shrink-0" />
      <p>{message}</p>
    </div>
  )
}
