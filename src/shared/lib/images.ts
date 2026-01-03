import { publicConfig } from '@/shared/config/public'

export const getImageUrl = (bucket: string, path: string) =>
  `${publicConfig.STORAGE_BASE_URL}/${bucket}/${path}`
