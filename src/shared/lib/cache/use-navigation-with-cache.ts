import { useRouter } from 'next/navigation'
import { invalidateCacheGroup, CACHE_GROUPS } from './cache-invalidation'

export const useNavigationWithCache = () => {
  const router = useRouter()
  
  const navigateWithCacheInvalidation = async (
    path: string,
    cacheGroups: Array<keyof typeof CACHE_GROUPS> = []
  ) => {
    // Инвалидируем указанные группы кешей
    for (const group of cacheGroups) {
      await invalidateCacheGroup(group)
    }
    
    // Переходим на указанный путь
    router.push(path)
  }
  
  return { navigateWithCacheInvalidation }
}