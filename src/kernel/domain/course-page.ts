
export type CourseBlockType =
  | 'hero'
  | 'text'
  | 'tariffs'
  | 'accordion'
  | 'list'
  | 'video'
  | 'equipment'
  | 'highlights'
  | 'fit-check'
  | 'system'
  | 'signature'
  | 'start-effects'
  | 'testimonials'

export interface CourseBlockBase {
  id: string
  type: CourseBlockType
  isVisible: boolean
}

export interface HeroBlock extends CourseBlockBase {
  type: 'hero'
  image?: string
  tagline?: string
  badges?: Array<{
    icon?: string
    label: string
  }>
  quickOutcomes?: string[]
  primaryAction?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  sideCard?: {
    title: string
    description: string
    mediaPlaceholders?: number
    items?: Array<{
      title: string
      description: string
    }>
  }
}

export interface HighlightsBlock extends CourseBlockBase {
  type: 'highlights'
  items: Array<{
    label: string
    value: string
  }>
}

export interface FitCheckBlock extends CourseBlockBase {
  type: 'fit-check'
  title?: string
  goodFor: string[]
  notGoodFor: string[]
  contactOptions?: {
    telegram?: string
    whatsapp?: string
  }
}

export interface SystemBlock extends CourseBlockBase {
  type: 'system'
  title?: string
  cards: Array<{
    title: string
    description: string
    icon?: string
  }>
}

export interface SignatureBlock extends CourseBlockBase {
  type: 'signature'
  title?: string
  variant: 'reboot' | 'edema' | 'antikorka' | 'club'
  content: {
    // Для Reboot
    entryLevels?: Array<{
      title: string
      description: string
    }>
    first7Days?: string[]
    // Для Edema
    keys?: Array<{
      title: string
      description: string
    }>
    selfTest?: string[]
    // Для Antikorka
    progressCriteria?: string[]
    workbookFeatures?: string[]
    // Для Club
    weekPlan?: Array<{
      day: string
      focus: string
      duration: string
    }>
    monthlyUpdates?: string[]
    libraryFeatures?: string[]
  }
}

export interface StartEffectsBlock extends CourseBlockBase {
  type: 'start-effects'
  title?: string
  effects: string[]
  nextStep?: {
    title: string
    description: string
    cta: string
  }
  videoPlaceholder?: boolean
}

export interface TestimonialsBlock extends CourseBlockBase {
  type: 'testimonials'
  title?: string
  items: Array<{
    title: string
    text: string
    author?: string
  }>
  showGallery?: boolean
}

export interface TextBlock extends CourseBlockBase {
  type: 'text'
  title?: string
  content: string // HTML or text
  align?: 'left' | 'center' | 'right'
  background?: 'default' | 'muted'
  image?: string
  imagePosition?: 'left' | 'right'
}

export interface TariffsBlock extends CourseBlockBase {
  type: 'tariffs'
  title?: string
  showComparison?: boolean
  trajectory?: {
    title: string
    description: string
  }
}

export interface AccordionBlock extends CourseBlockBase {
  type: 'accordion'
  title?: string
  items: Array<{
    title: string
    content: string
  }>
}

export interface ListBlock extends CourseBlockBase {
  type: 'list'
  title?: string
  layout?: 'vertical' | 'grid'
  items: Array<{
    title: string
    description: string
    image?: string
    icon?: string
    metadata?: Record<string, string>
  }>
}

export interface VideoBlock extends CourseBlockBase {
  type: 'video'
  title?: string
  videoId: string
}

export interface EquipmentBlock extends CourseBlockBase {
  type: 'equipment'
  title?: string
  itemIds?: string[]
}

export type CourseBlock =
  | HeroBlock
  | HighlightsBlock
  | FitCheckBlock
  | SystemBlock
  | SignatureBlock
  | StartEffectsBlock
  | TestimonialsBlock
  | TextBlock
  | TariffsBlock
  | AccordionBlock
  | ListBlock
  | VideoBlock
  | EquipmentBlock
