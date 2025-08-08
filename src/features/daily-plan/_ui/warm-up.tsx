import { useState } from 'react'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import { KinescopePlayer } from './kinescope-player'
import { workoutApi } from '../_api'

interface WarmUpProps {
  title: string
  workoutId: string
}
export function WarmUp({ title, workoutId }: WarmUpProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  const { data } = workoutApi.getWorkout.useQuery({
    workoutId,
  })

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-medium">{title}</h3>
          <button onClick={toggleFavorite}>{isFavorite ? '❤️' : '🤍'}</button>
        </div>

        {data?.videoUrl && <KinescopePlayer videoId={data.videoUrl} />}

        <div className="flex gap-2 mt-3 flex-wrap">
          <Badge variant="secondary">{'40'} мин</Badge>
          <Badge variant="outline">{'зарядка'}</Badge>
          {workoutId && <Badge variant="outline">ID: {workoutId}</Badge>}
        </div>
      </CardContent>
    </Card>
  )
}
