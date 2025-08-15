// Определяем тип для настроек кеширования
type CacheSettings = {
  staleTime: number;
  gcTime: number;
  refetchOnMount: boolean | 'always';
  refetchOnWindowFocus: boolean;
  refetchOnReconnect: boolean;
}

export const CACHE_SETTINGS: Record<string, CacheSettings> = {
  // Настройки для часто обновляемых данных
  FREQUENT_UPDATE: {
    staleTime: 1 * 60 * 1000, // 1 минута
    gcTime: 5 * 60 * 1000, // 5 минут
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  },
  
  // Настройки для редко обновляемых данных
  RARE_UPDATE: {
    staleTime: 30 * 60 * 1000, // 30 минут
    gcTime: 60 * 60 * 1000, // 1 час
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  },
  
  // Настройки для статических данных
  STATIC: {
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000, // 24 часа
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  }
}