'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { adminKnowledgeApi } from '../_api'
import { toast } from 'sonner'
import { useUploadKnowledgeFile } from '../_vm/use-upload-knowledge-file'
import { Loader2, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'

const attachmentSchema = z.object({
  name: z.string(),
  url: z.string(),
})

const articleSchema = z.object({
  title: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  content: z.string().optional(),
  videoId: z.string().optional(),
  videoTitle: z.string().optional(),
  videoDurationSec: z.number().optional(),
  order: z.number().optional(),
  attachments: z.array(attachmentSchema).optional(),
})

type ArticleFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: string
  article?: any
  onSuccess: () => void
}

export function ArticleForm({
  open,
  onOpenChange,
  categoryId,
  article,
  onSuccess,
}: Readonly<ArticleFormProps>) {
  const [videoPickerOpen, setVideoPickerOpen] = useState(false)
  const [videoOptions, setVideoOptions] = useState<
    {
      id: string
      title: string
      duration: number | null
      posterUrl: string | null
    }[]
  >([])
  const videoQuery = adminKnowledgeApi.adminKnowledge.videos.list.useQuery(
    undefined,
    {
      enabled: false,
    }
  )
  const isLoadingVideos = videoQuery.isFetching || videoQuery.isLoading

  const form = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      videoId: '',
      videoTitle: '',
      videoDurationSec: undefined,
      order: undefined,
      attachments: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'attachments',
  })

  const { upload, isPending: isUploading } = useUploadKnowledgeFile()

  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        description: article.description || '',
        content: article.content || '',
        videoId: article.videoId || '',
        videoTitle: article.videoTitle || '',
        videoDurationSec: article.videoDurationSec ?? undefined,
        order: article.order,
        // Ensure attachments is treated as an array, Prisma Json defaults to any
        attachments: Array.isArray(article.attachments)
          ? article.attachments
          : [],
      })
    } else {
      form.reset({
        title: '',
        description: '',
        content: '',
        videoId: '',
        videoTitle: '',
        videoDurationSec: undefined,
        order: undefined,
        attachments: [],
      })
    }
  }, [article, form, open])

  const createMutation =
    adminKnowledgeApi.adminKnowledge.articles.create.useMutation({
      onSuccess: () => {
        toast.success('Статья создана')
        onSuccess()
      },
      onError: err => toast.error(err.message),
    })

  const updateMutation =
    adminKnowledgeApi.adminKnowledge.articles.update.useMutation({
      onSuccess: () => {
        toast.success('Статья обновлена')
        onSuccess()
      },
      onError: err => toast.error(err.message),
    })

  const onSubmit = (values: z.infer<typeof articleSchema>) => {
    if (article) {
      updateMutation.mutate({
        id: article.id,
        ...values,
      })
    } else {
      createMutation.mutate({
        categoryId,
        ...values,
      })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    upload({
      file,
      onSuccess: result => {
        append({ name: result.name, url: result.path })
        toast.success('Файл загружен')
        // Clear input
        e.target.value = ''
      },
      onError: err => {
        toast.error('Ошибка загрузки: ' + err)
        e.target.value = ''
      },
    })
  }

  const openVideoPicker = () => {
    setVideoPickerOpen(true)
    videoQuery
      .refetch()
      .then(res => {
        if (res.data?.length === 0) {
          console.warn(
            '[knowledge:videos] Kinescope вернул пустой список для knowledge-папки'
          )
        }
        setVideoOptions(res.data ?? [])
      })
      .catch(error => {
        console.error(error)
        toast.error('Не удалось загрузить список видео из Kinescope')
      })
  }

  const handleSelectVideo = (videoId: string) => {
    form.setValue('videoId', videoId)
    const meta = videoOptions.find(v => v.id === videoId)
    if (meta) {
      form.setValue('videoTitle', meta.title)
      form.setValue('videoDurationSec', meta.duration ?? undefined)
    }
    setVideoPickerOpen(false)
    toast.success('Видео выбрано')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {article ? 'Редактировать статью' : 'Новая статья'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Заголовок</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="videoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Видео Kinescope</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} placeholder="ID видео" />
                      </FormControl>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={openVideoPicker}
                        disabled={isLoadingVideos}
                      >
                        {isLoadingVideos ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Выбрать'
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Порядок</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => {
                          const val = e.target.value
                          field.onChange(val === '' ? undefined : Number(val))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Краткое описание</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Текст статьи</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[200px]" />
                    </FormControl>
                    <FormDescription>Поддерживается Markdown</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Вложения (PDF)</FormLabel>
              <div className="flex flex-col gap-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 rounded border p-2"
                  >
                    <span className="flex-1 text-sm truncate" title={field.url}>
                      {field.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="relative"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}

                  {isUploading ? 'Загрузка...' : 'Загрузить PDF'}
                  <input
                    type="file"
                    accept=".pdf"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  isUploading
                }
              >
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      <Dialog open={videoPickerOpen} onOpenChange={setVideoPickerOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Выбрать видео для статьи</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingVideos && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка списка видео...
              </div>
            )}
            {!isLoadingVideos && videoOptions.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Нет доступных видео в Knowledge-папке Kinescope.
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {videoOptions.map(video => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => handleSelectVideo(video.id)}
                  className="group flex flex-col gap-2 rounded-lg border p-3 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded bg-muted">
                    {video.posterUrl ? (
                      <Image
                        src={video.posterUrl}
                        alt={video.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        Нет превью
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold line-clamp-2">
                      {video.title}
                    </div>
                    {video.duration ? (
                      <div className="text-xs text-muted-foreground">
                        Длительность: {video.duration} сек.
                      </div>
                    ) : null}
                  </div>
                  <div className="text-xs text-primary font-medium">
                    Выбрать
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
