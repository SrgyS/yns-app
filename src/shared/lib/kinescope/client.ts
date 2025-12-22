import { TRPCError } from '@trpc/server'
import { kinescopeConfig } from '@/shared/config/kinescope'

export type KinescopePoster = {
  original?: string
  md?: string
  sm?: string
  xs?: string
  [k: string]: unknown
}

export type KinescopeVideo = {
  id: string
  title?: string
  description?: string | null
  duration?: number | null
  progress?: number | null
  poster?: KinescopePoster | null
  created_at?: string
}

type ListVideosParams = {
  folderId?: string
  projectId?: string
  apiKey?: string
}

export async function listKinescopeVideos({
  folderId,
  projectId = kinescopeConfig.projectId,
  apiKey = kinescopeConfig.apiKey,
}: ListVideosParams = {}): Promise<KinescopeVideo[]> {
  if (!apiKey || !projectId) {
    throw new TRPCError({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Kinescope config is missing',
    })
  }

  const perPage = 100
  let page = 1
  const all: KinescopeVideo[] = []

  while (true) {
    const searchParams = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
      order: 'created_at.desc,title.asc',
    })
    searchParams.set('project_id', projectId)
    if (folderId) {
      searchParams.set('folder_id', folderId)
    }

    const url = `https://api.kinescope.io/v1/videos?${searchParams.toString()}`

    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    })

    if (!resp.ok) {
      console.error('[kinescope:listVideos] fetch failed', {
        status: resp.status,
        statusText: resp.statusText,
        url,
      })
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Не удалось получить список видео: ${resp.status} ${resp.statusText}`,
      })
    }

    const payload = await resp.json()
    const data: KinescopeVideo[] = payload.data ?? payload ?? []
    all.push(...data)

    const pagination =
      payload.meta?.pagination ?? payload.pagination ?? payload.meta

    const total = Number(pagination?.total ?? Number.NaN)
    const perPageResp = Number(pagination?.per_page ?? perPage)

    const hasMore =
      Number.isFinite(total) && Number.isFinite(perPageResp)
        ? page * perPageResp < total
        : data.length === perPageResp

    if (!hasMore) break
    page += 1
  }

  if (all.length === 0) {
    console.warn('[kinescope:listVideos] empty result', {
      folderId,
      projectId,
    })
  }

  return all
}

export function mapVideoToKnowledgeCard(video: KinescopeVideo) {
  const poster = video.poster as KinescopePoster | undefined
  return {
    id: video.id,
    title: video.title || video.id,
    description: video.description ?? null,
    duration:
      typeof video.duration === 'number'
        ? Math.max(0, Math.round(video.duration))
        : null,
    posterUrl: poster?.md ?? poster?.original ?? null,
    createdAt:
      typeof video.created_at === 'string' ? video.created_at : undefined,
  }
}
