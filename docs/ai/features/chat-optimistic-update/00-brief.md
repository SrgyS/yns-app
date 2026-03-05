
# Support Chat — Optimistic Send with clientMessageId

## Goal

Улучшить UX чата поддержки: убрать паузу после нажатия **Send**.

После клика сообщение должно **появляться мгновенно**, без ожидания ответа сервера.

Реализовать:

- Optimistic UI
- статусы сообщения  
  sending -> sent -> failed
- механизм **clientMessageId** для устранения дублей между:
  - optimistic UI
  - SSE событиями
  - refetch React Query

Текущая архитектура должна остаться совместимой с:

- tRPC
- React Query
- SSE realtime updates

---

# UX Requirements

## Immediate feedback

После клика **Send**:

- сообщение появляется **мгновенно**
- сообщение отображается со статусом `sending`
- пользователь может продолжать писать следующее сообщение

Если есть вложения:

- preview отображается сразу
- сообщение также имеет статус `sending`

---

# Message lifecycle states

## sending

UI отображение:

- opacity: **0.6**
- индикатор: **Clock icon**

Пример:

Привет! 🕒

UI правила:

- использовать **lucide Clock**
- размер: **16px**
- без анимации
- позиция: нижний правый угол bubble

Spinner **не использовать**.

---

## sent

После успешного ответа сервера:

- opacity возвращается к **1**
- clock indicator исчезает

---

## failed

Если запрос завершился ошибкой:

- сообщение остаётся в чате
- отображается **AlertCircle icon**
- появляется кнопка **Retry**

Пример:

Привет! ⚠  
[Повторить]

---

# Attachments UX

Если сообщение содержит вложения:

- preview отображается **сразу**
- рядом может отображаться upload progress
- статус сообщения остаётся `sending` до подтверждения сервера

---

# Technical Architecture

## Optimistic UI (React Query)

Использовать lifecycle mutation.

### onMutate

1. создать `clientMessageId`
2. создать optimistic message
3. добавить сообщение в cache

Пример optimistic DTO:

{
  id: clientMessageId
  clientMessageId: string
  text: string
  dialogId: string
  status: "sending"
  createdAt: now()
  attachments: [...]
}

### onSuccess

- найти сообщение по `clientMessageId`
- заменить `id` на серверный
- status -> `sent`

### onError

- status -> `failed`
- показать Retry

### onSettled

инвалидировать:

supportChat.userGetMessages  
supportChat.staffListDialogs  
supportChat.getUnansweredDialogsCount

---

# Correlation Pattern (Telegram-style)

Для устранения дублей используется **clientMessageId**.

Каждое сообщение имеет два идентификатора:

clientMessageId  
serverMessageId

---

# clientMessageId Flow

## 1 Client

При отправке сообщения генерируется:

clientMessageId = tmp_<uuid>

пример:

tmp_98f32f

Этот id:

- уникальный
- генерируется до отправки
- используется для retry

---

## 2 sendMessage mutation

В input добавить поле:

{
  dialogId: string
  text: string
  attachments?: []
  clientMessageId: string
}

---

## 3 Database

Сервер сохраняет `clientMessageId`.

Рекомендуемая модель:

ChatMessage {
  id
  dialogId
  text
  clientMessageId
}

Рекомендуемый constraint:

@@unique([dialogId, clientMessageId])

Это обеспечивает **idempotent send**.

---

## 4 Mutation response

Ответ сервера должен возвращать:

{
  id: string
  clientMessageId: string
}

---

## 5 SSE payload

Событие `message.created` должно включать:

{
  id
  dialogId
  clientMessageId
  text
}

---

# Reconciliation Rules

## Mutation success

если optimistic message найден:

tmp_id -> server_id  
status -> sent

---

## SSE event

если найден message с таким `clientMessageId`:

merge optimistic message

если нет:

append new message

---

## Refetch

если совпадает `clientMessageId`:

update existing message

не создавать новый элемент.

---

# Retry Behavior

если отправка не удалась:

status = failed

при Retry:

- использовать **тот же clientMessageId**
- status -> sending

---

# Acceptance Criteria

- сообщение появляется **мгновенно**
- отправка не вызывает паузы UI
- optimistic message корректно заменяется серверным
- дублей сообщений нет
- retry работает
- SSE не создаёт дубликаты
- порядок сообщений стабилен

---

# Test Plan

## Unit

- optimistic insert
- reconcile clientMessageId
- retry logic

## Integration

1. медленный network send
2. send message with attachment
3. server error -> retry
4. SSE arrival

## Manual QA

- быстрые повторные отправки
- несколько сообщений подряд
- refetch после отправки
- SSE приходит раньше mutation response

---

# Notes

clientMessageId является стандартным паттерном production messaging систем.

Используется в:

- Telegram
- Slack
- Discord
- WhatsApp

Он устраняет большинство проблем:

- optimistic duplicates
- SSE race conditions
- retry conflicts
- inconsistent ordering
