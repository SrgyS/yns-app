# Brief: preview-img-support-chat

## Goal
Укрепить и масштабировать поток preview/download вложений support-chat для private bucket с учетом производительности, безопасности и provider-agnostic интеграции.

## Plan
1. Attachment metadata как отдельная сущность (Single Source of Truth)
- Добавить таблицу `ChatAttachment`:
  - `id`, `dialogId`, `messageId`, `storagePath`, `mimeType`, `sizeBytes`, `originalName`, `createdByUserId`, `createdAt`
- Индексы:
  - `id` (PK)
  - `(dialogId, id)`
  - `(messageId)`
- Цель: убрать scan сообщений и делать O(1) lookup вложения.

2. Upload flow через staged pattern (anti-orphan)
- Паттерн: `stage -> commit -> cleanup`.
- При загрузке:
  - файл кладется во временный префикс `support-chat/staged/<userId>/...`
  - в БД создается staged-запись (status=`UPLOADED`)
- При успешном `sendMessage/createDialog`:
  - staged attachments связываются с `messageId`, status=`LINKED`
- Фоновый cleanup job удаляет `UPLOADED` старше N минут.
- Цель: контролируемая консистентность и cleanup.

3. Чтение private файлов через stream-first endpoint
- В `/api/support-chat/attachments/...`:
  - authn + authz + ownership
  - fetch attachment по `attachmentId + dialogId` из `ChatAttachment`
  - отдача стримом (не `Uint8Array`/`Blob` целиком)
- Цель: снизить память/CPU и стоимость проксирования.

4. Кэш/conditional requests (private-safe caching)
- Заголовки:
  - `Cache-Control: private, max-age=300`
  - `ETag` или `Last-Modified`
  - `X-Content-Type-Options: nosniff`
  - `Content-Disposition: inline; filename*=UTF-8''...`
- Обработка `If-None-Match` / `If-Modified-Since` -> `304`.
- Цель: меньше трафика и быстрее повторные открытия.

5. Range support roadmap (для PDF/video)
- Фаза 1: ограничить крупные файлы и задокументировать отсутствие `Range`.
- Фаза 2: поддержка `Range` (`206`, `Content-Range`, `Accept-Ranges`) в endpoint/storage adapter.
- Цель: корректный UX для preview больших файлов.

6. Rate limiting и abuse controls
- Per user + IP лимит для attachment endpoint.
- Concurrency cap на одновременные скачивания пользователя.
- Size guard на отдачу и timeout storage read.
- Цель: защита от DoS и непредсказуемой стоимости.

7. Storage abstraction v2 (provider-agnostic)
- Контракт:
  - `uploadFile(file, key, { accessLevel })`
  - `downloadStreamByPath(path)` (stream + metadata)
  - опционально `createSignedReadUrl(path, ttlSec)` (fallback для CDN/offload)
- Цель: одинаковая логика для S3/Timeweb/Supabase/CDN.

8. Observability
- Метрики:
  - `attachment_download_count`, `download_bytes_total`, `download_4xx/5xx`, `download_latency_ms`
- Логи: только технические поля (без PII/secrets).
- Цель: управляемость и быстрая диагностика.

9. Тестовый контур
- Unit:
  - authz matrix (USER owner/non-owner, STAFF permission/no permission, ADMIN)
  - header policy, 404 cloaking
- Integration:
  - lookup через `ChatAttachment`
  - `304` по ETag/Last-Modified
  - rate-limit сценарии
- E2E:
  - upload -> preview/open -> read on both user/admin
- Цель: регрессии и безопасность под контролем.

10. Порядок внедрения (минимальный риск)
1. Prisma `ChatAttachment` + dual-write (JSON + table временно)
2. Route read-switch на table lookup
3. Stream отдача + rate limit
4. ETag/304
5. Cleanup job staged attachments
6. Remove legacy JSON-dependence
