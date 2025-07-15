import { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { KinescopePlayer } from "./kinescope-player";

interface WarmUpProps {
  title: string;
}
export function WarmUp({ title }: WarmUpProps) {

const [isFavorite, setIsFavorite] = useState(false)

const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
}

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-medium">{title}</h3>
          <button onClick={toggleFavorite}>{isFavorite ? '❤️' : '🤍'}</button>
        </div>

        <KinescopePlayer videoId={'https://kinescope.io/mGQYnNqTyjmNQid3qGHXW1'} />

        <div className="flex gap-2 mt-3 flex-wrap">
          <Badge variant="secondary">{'40'} мин</Badge>
          <Badge variant="outline">{'зарядка'}</Badge>
          {/* {workout.tags.map(tag => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))} */}
        </div>
      </CardContent>
    </Card>
  )
}
