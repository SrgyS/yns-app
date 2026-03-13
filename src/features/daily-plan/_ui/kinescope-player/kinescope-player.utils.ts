import '@kinescope/player-iframe-api-loader'

type CreateOptions = Kinescope.IframePlayer.CreateOptions

export type KinescopePlayerOptions = {
  url?: string
  size?: {
    width?: number | string
    height?: number | string
  }
  behavior?: {
    autoPlay?: boolean | 'viewable'
    autoPause?: boolean | 'reset'
    preload?: boolean | 'none' | 'metadata' | 'auto'
    localStorage?:
      | boolean
      | {
          quality?: 'item' | 'global' | boolean
          time?: boolean
          textTrack?: 'item' | 'global' | boolean
        }
    loop?: boolean
    playsInline?: boolean
    muted?: boolean
    textTrack?: boolean | string
    playlist?: {
      autoSwitch?: boolean
      initialItem?: string
      loop?: boolean
    }
  }
  ui?: {
    language?: 'ru' | 'en'
    controls?: boolean
    mainPlayButton?: boolean
    playbackRateButton?: boolean
    watermark?: {
      text: string
      mode?: 'stripes' | 'random'
      scale?: number
      displayTimeout?: number | { visible: number; hidden: number }
    }
  }
  theme?: unknown
  settings?: {
    externalId?: string
  }
  autoplay?: boolean
}

export const DEFAULT_HEIGHT = 300
export const DEFAULT_IFRAME_ALLOW =
  'autoplay; fullscreen; picture-in-picture; encrypted-media;'

export const toStyleSize = (
  value: number | string | undefined,
  fallback: string
): string => {
  if (typeof value === 'number') return `${value}px`
  if (typeof value === 'string') return value
  return fallback
}

export const buildEmbedUrl = (videoId: string): string => {
  return `https://kinescope.io/embed/${videoId}`
}

export const getSourceUrl = (
  videoId?: string,
  options?: KinescopePlayerOptions
): string | undefined => {
  if (options?.url) {
    return options.url
  }

  if (videoId) {
    return buildEmbedUrl(videoId)
  }

  return undefined
}

export const buildCreateOptions = (
  sourceUrl: string,
  options?: KinescopePlayerOptions
): CreateOptions => {
  const settings = options?.settings?.externalId
    ? { externalId: options.settings.externalId }
    : undefined

  return {
    url: sourceUrl,
    size: options?.size,
    behavior: {
      autoPlay: options?.behavior?.autoPlay ?? options?.autoplay,
      autoPause: options?.behavior?.autoPause,
      preload: options?.behavior?.preload,
      localStorage: options?.behavior?.localStorage,
      loop: options?.behavior?.loop,
      playsInline: options?.behavior?.playsInline,
      muted: options?.behavior?.muted,
      textTrack: options?.behavior?.textTrack,
      playlist: options?.behavior?.playlist,
    },
    ui: {
      language: options?.ui?.language,
      controls: options?.ui?.controls,
      mainPlayButton: options?.ui?.mainPlayButton,
      playbackRateButton: options?.ui?.playbackRateButton,
      watermark: options?.ui?.watermark,
    },
    theme: options?.theme as CreateOptions['theme'],
    settings,
  }
}

export const createPlayerIframe = (
  host: HTMLDivElement,
  title = 'Kinescope player'
): HTMLIFrameElement => {
  host.replaceChildren()

  const iframe = document.createElement('iframe')
  iframe.className = 'h-full w-full border-0'
  iframe.title = title
  iframe.allow = DEFAULT_IFRAME_ALLOW

  host.appendChild(iframe)

  return iframe
}

export const normalizePlayerError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error
  }

  return new Error('Failed to initialize Kinescope player')
}
