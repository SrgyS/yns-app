import { RecipeDetail } from '@/features/user-recipes/_ui/recipe-detail'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params
  return <RecipeDetail slug={slug} />
}
