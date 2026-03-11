---
date: 2026-03-10
researcher: Codex
branch: feat/react-compiler
commit: ebcd6e8
feature: subscription-tariff-cards
research_question: "How admins currently define tariffs for subscription courses, how those tariffs flow into the public course page, checkout, and access issuance, and what current code constraints exist for rendering two tariff cards with 1/3/6 month options and future discounted prices for prior fixed-course buyers."
---

# Research: subscription-tariff-cards

## Summary
The current system stores course tariffs as flat `CourseTariff` records linked to a `Course`, with per-row fields `price`, `durationDays`, `feedback`, and `isDefault` in Prisma at `prisma/schema.prisma:705-715`. In the domain layer, tariffs are exposed as flat `CourseTariff` objects with `id`, `access`, `price`, `durationDays`, and `feedback` in `src/kernel/domain/course.ts:7-13`.

Admins currently create and edit tariffs in the generic course form. The admin UI uses `useFieldArray` over `tariffs`, lets staff add any number of rows, and captures each row as one paid tariff with its own `price`, `durationDays`, and `feedback` checkbox in `src/features/admin-panel/courses/_ui/form-parts/access-section.tsx:43-218`. The form schema and tRPC input schema accept the same flat shape, without a higher-level grouping concept such as "tariff card", "variant", "duration preset", or "discount rule", in `src/features/admin-panel/courses/_ui/model/schema.ts:10-49` and `src/features/admin-panel/courses/_schemas.ts:3-73`.

When a course is saved, `CoursesWriteService.upsertCourse` validates the flat tariffs array and then replaces all existing tariffs with newly created rows under the course record using `deleteMany` plus `create`, in `src/features/admin-panel/courses/_services/courses-write.ts:24-86` and `src/features/admin-panel/courses/_services/courses-write.ts:149-320`. The admin read path returns the same flat array from Prisma to the form in `src/features/admin-panel/courses/_services/courses-read.ts:72-173` and `src/features/admin-panel/courses/_services/courses-read.ts:292-318`.

On the public course page, `TariffsBlockComponent` already groups paid tariffs by `feedback` for sectioning, but each tariff row still renders as a standalone purchase card. A distinct card is created for every `CourseTariff`, and the checkout link passes only one `tariffId` in the URL, in `src/app/(site)/courses/_ui/blocks/tariffs-block.tsx:148-279` and `src/kernel/lib/router.ts:3-20`. There is no current concept of one card containing multiple purchasable duration options.

Checkout and access issuance depend on the selected `tariffId`. `StartCourseOrderService` resolves either the requested tariff or the cheapest paid tariff, creates a `Payment` product with SKU `${course.id}:${selectedTariff.id}`, and sends the user to the payment flow in `src/features/course-order/_services/start-course-order.ts:32-149`. The payment webhook later parses that SKU, reloads the course, finds the tariff again by `tariffId`, derives `expiresAt` from `tariff.durationDays`, and grants access in `src/features/course-order/_services/receive-order-webhook.ts:33-110`.

The current pricing model has no inspected field for customer-segment pricing or historical-course discounting. The tariff persistence model includes only `price`, `durationDays`, `feedback`, and `isDefault` at `prisma/schema.prisma:705-715`; the admin course schemas accept only `price`, `durationDays`, and `feedback` for tariffs at `src/features/admin-panel/courses/_ui/model/schema.ts:21-34` and `src/features/admin-panel/courses/_schemas.ts:3-10`; and paid checkout products persist only final `price`, `sku`, `name`, `quantity`, and `type` at `prisma/schema.prisma:774-782`.

## Entry points (as-is)
- Next.js pages: `src/app/(admin)/admin/courses/new/page.tsx` and `src/app/(admin)/admin/courses/[slug]/page.tsx` render the admin course form that includes the tariff editor through the admin courses feature.
- UI component: `src/features/admin-panel/courses/_ui/form-parts/access-section.tsx:33-218` renders the tariff rows inside the admin course form.
- Client form model: `src/features/admin-panel/courses/_ui/model/use-course-form.tsx:14-198` loads admin course data into form state and submits the `tariffs` array to the upsert mutation.
- tRPC router: `src/features/admin-panel/courses/_controller.ts:70-111` exposes `adminCourses.course.get` and `adminCourses.course.upsert` for reading and saving course data.
- Service layer: `src/features/admin-panel/courses/_services/courses-write.ts:24-86` persists the full course payload including tariffs; `src/features/admin-panel/courses/_services/courses-read.ts:72-173` loads the same payload for editing.
- Public course page: `src/app/(site)/courses/[courseSlug]/page.tsx:16-63` loads the course via `GetCourseService` and renders `TariffsBlockComponent`.
- Tariff UI block: `src/app/(site)/courses/_ui/blocks/tariffs-block.tsx:215-279` filters/sorts paid tariffs and renders cards; `src/app/(site)/courses/_ui/blocks/tariffs-block.tsx:148-213` renders a single card per tariff.
- Checkout entrypoint: `src/app/platform/(authorized)/order/page.tsx:15-55` validates query params and calls `StartCourseOrderService`.
- Order router: `src/features/course-order/_controller.ts:20-50` exposes authorized `courseOrder.start` and `courseOrder.check`.
- Payment/access fulfillment: `src/features/course-order/_services/receive-order-webhook.ts:33-110` marks payment success and grants course access using the tariff duration.

## Detailed findings

### 1. Tariff data model is flat and course-scoped
- Location: `prisma/schema.prisma:705-715`
- What it does: `CourseTariff` stores one tariff row per record with `access`, `price`, `durationDays`, `feedback`, `isDefault`, and `courseId`.
- Dependencies: Prisma relation `CourseTariff.course -> Course`.
- Data flow: persisted `CourseTariff` row -> Prisma include on course queries -> domain `CourseTariff` mapping.

- Location: `src/kernel/domain/course.ts:7-13`
- What it does: the domain `CourseTariff` type mirrors the flat persistence model with no nesting for card groups or duration variants.
- Dependencies: used by course, checkout, admin, and access code paths.
- Data flow: Prisma tariff row -> `CoursesRepository.mapPrismaToDomain` -> domain `Course.tariffs`.

- Location: `src/entities/course/_repositories/course.ts:124-163`
- What it does: `mapPrismaToDomain` maps each Prisma tariff row 1:1 into a domain tariff; `CoursesRepository.create` also writes tariffs as a plain array of rows.
- Dependencies: `dbClient.course.findUnique/findMany/create`, `CourseTariff`.
- Data flow: Prisma `Course` with `tariffs: true` -> `mapPrismaToDomain` -> `Course` entity consumed by public pages and checkout.

### 2. Admin form lets staff create arbitrary tariff rows
- Location: `src/features/admin-panel/courses/_ui/form-parts/access-section.tsx:43-218`
- What it does: `useFieldArray({ name: 'tariffs' })` drives a repeatable tariff editor. Each row contains a hidden `access=paid`, a `feedback` checkbox, a numeric `price`, and a numeric `durationDays`. The "Добавить тариф" button appends another flat row.
- Dependencies: React Hook Form, `CourseFormValues`, `AccessType`, `CourseContentType`.
- Data flow: admin input -> React Hook Form `tariffs[index]` -> submit payload.

- Location: `src/features/admin-panel/courses/_ui/model/schema.ts:10-49`
- What it does: `courseFormSchema` validates `tariffs` as an array of objects containing only `access`, `price`, `durationDays`, and optional `feedback`.
- Dependencies: `zod`, Prisma enums `CourseContentType`, `AccessType`.
- Data flow: raw form values -> Zod parse -> `CourseFormValues`.

- Location: `src/features/admin-panel/courses/_ui/model/use-course-form.tsx:37-58`
- What it does: the default form state starts with a single paid tariff row.
- Dependencies: `useForm`, `courseFormSchema`.
- Data flow: initial form state -> rendered admin tariff rows.

- Location: `src/features/admin-panel/courses/_ui/model/use-course-form.tsx:61-129`
- What it does: when editing, existing persisted tariffs are loaded from `courseQuery.data.tariffs`, mapped into the same flat form structure, and reset into the form.
- Dependencies: `adminCourses.course.get`, `CourseTariff`.
- Data flow: tRPC query response -> `tariffsFormValues` -> `form.reset`.

- Location: `src/features/admin-panel/courses/_ui/model/use-course-form.tsx:131-183`
- What it does: on submit, the client maps each form tariff to `CourseUpsertInput['tariffs']` with fields `access`, `price`, `durationDays`, and `feedback`.
- Dependencies: `adminCourses.course.upsert`.
- Data flow: form state -> mutation payload -> admin upsert procedure.

### 3. Admin server contracts and persistence preserve the flat shape
- Location: `src/features/admin-panel/courses/_schemas.ts:3-73`
- What it does: `courseUpsertInputSchema` accepts `tariffs: z.array(courseTariffSchema).min(1)` where `courseTariffSchema` contains only `id?`, `access`, `price`, `durationDays`, and `feedback`.
- Dependencies: `zod`, admin controller.
- Data flow: mutation input -> server validation -> typed `CourseUpsertInput`.

- Location: `src/features/admin-panel/courses/_controller.ts:70-111`
- What it does: `adminCourses.course.get` returns a full editable course DTO, and `adminCourses.course.upsert` saves the validated input and then reloads the course detail.
- Dependencies: `checkAbilityProcedure`, `CoursesReadService`, `CoursesWriteService`.
- Data flow: `/api/trpc` request -> authorization -> schema parse -> service -> mapped DTO response.

- Location: `src/features/admin-panel/courses/_services/courses-read.ts:72-173`
- What it does: `findCourse` loads `tariffs: true` for the course together with weeks, dependencies, meal plans, and daily plans.
- Dependencies: `dbClient.course.findUnique`.
- Data flow: Prisma course query -> service DTO mapping.

- Location: `src/features/admin-panel/courses/_services/courses-read.ts:292-318`
- What it does: `mapCourseDetail` returns tariffs as a flat array of `{ id, access, price, durationDays, feedback }`.
- Dependencies: result of `findCourse`.
- Data flow: Prisma result -> admin course detail DTO -> form hydration.

- Location: `src/features/admin-panel/courses/_services/courses-write.ts:149-177`
- What it does: `validateTariffs` enforces only "at least one tariff", integer `price >= 1`, and integer `durationDays >= 1` for paid tariffs.
- Dependencies: `CourseUpsertInput`, `TRPCError`.
- Data flow: validated payload -> service-level business checks -> transaction.

- Location: `src/features/admin-panel/courses/_services/courses-write.ts:254-320`
- What it does: `buildTariffsData` copies tariff rows directly, and `upsertCourseRecord` deletes all existing tariffs for the course and recreates them on each save.
- Dependencies: Prisma nested writes under `tx.course.update/upsert`.
- Data flow: `input.tariffs` -> `tariffsData` -> Prisma nested `deleteMany/create`.

### 4. Public tariff rendering already distinguishes feedback and duration, but not nested purchase options
- Location: `src/app/(site)/courses/[courseSlug]/page.tsx:16-63`
- What it does: the public course page loads the course from the server and mounts `TariffsBlockComponent` either through fallback rendering or through layout blocks.
- Dependencies: `GetCourseService`, `COURSE_LAYOUTS`, `TariffsBlockComponent`.
- Data flow: route param `courseSlug` -> `GetCourseService.exec` -> page -> tariff block.

- Location: `src/kernel/domain/course-page.ts:147-167`
- What it does: `TariffsBlock.tariffPresentation` allows only display metadata keyed by `feedback`, namely `groupTitles`, `badge`, `cardTitle`, and `includes`.
- Dependencies: site layout config and tariff block renderer.
- Data flow: layout config -> presentational copy in tariff cards.

- Location: `src/app/(site)/courses/_content/layout-config.ts:7-55`
- What it does: `DEFAULT_TARIFF_PRESENTATION` and `CLUB_TARIFF_PRESENTATION` define separate copy for `feedback: false` and `feedback: true`, including support for `{duration}` interpolation in bullet text.
- Dependencies: `TariffsBlock['tariffPresentation']`.
- Data flow: static layout config -> tariff presentation copy on course pages.

- Location: `src/app/(site)/courses/_content/layout-config.ts:790-796`
- What it does: the `club`-style course layout sets `tariffPresentation: CLUB_TARIFF_PRESENTATION` but does not provide a separate structural model for duration options inside one card.
- Dependencies: `COURSE_LAYOUTS`.
- Data flow: course slug -> block config -> `TariffsBlockComponent`.

- Location: `src/app/(site)/courses/_ui/blocks/tariffs-block.tsx:53-90`
- What it does: duration is derived from `durationDays`; multiples of 30 are labeled as months.
- Dependencies: `durationDays` on each tariff row.
- Data flow: tariff row -> derived duration label text.

- Location: `src/app/(site)/courses/_ui/blocks/tariffs-block.tsx:101-145`
- What it does: tariffs are sorted first by `feedback`, then by `durationDays`, and tariff presentation copy is resolved only by `feedback`.
- Dependencies: `Course['tariffs']`, `TariffsBlock['tariffPresentation']`.
- Data flow: flat tariff list -> ordered list -> per-feedback copy lookup.

- Location: `src/app/(site)/courses/_ui/blocks/tariffs-block.tsx:148-213`
- What it does: `renderTariffCard` builds exactly one card per tariff row and exactly one buy button tied to that tariff's `id`.
- Dependencies: `getCourseOrderPath`.
- Data flow: `CourseTariff` -> card -> `/platform/order?...&tariffId=<tariff.id>`.

- Location: `src/app/(site)/courses/_ui/blocks/tariffs-block.tsx:223-279`
- What it does: paid tariffs are filtered and optionally grouped into two sections (`withoutFeedbackTariffs` and `withFeedbackTariffs`), but each section still maps every tariff row to a separate card.
- Dependencies: `renderTariffCard`.
- Data flow: `course.tariffs` -> filtered group arrays -> `map` to cards.

### 5. Checkout uses one selected tariff row as the pricing source of truth
- Location: `src/kernel/lib/router.ts:3-20`
- What it does: the order URL supports an optional `tariffId` query param alongside `courseSlug` and `urlReturn`.
- Dependencies: public tariff buttons and order page.
- Data flow: card buy action -> query string.

- Location: `src/app/platform/(authorized)/order/page.tsx:15-55`
- What it does: the authorized order page validates search params with `createCourseOrderSchema`, ensures the session exists, and delegates to `StartCourseOrderService`.
- Dependencies: `SessionService`, `StartCourseOrderService`.
- Data flow: `/platform/order` query params -> parse -> service call -> redirect to payment URL.

- Location: `src/features/course-order/_controller.ts:20-38`
- What it does: `courseOrder.start` is an authorized tRPC mutation with input `{ courseSlug, urlReturn, tariffId? }`.
- Dependencies: `authorizedProcedure`, `StartCourseOrderService`.
- Data flow: client mutation or server page -> tRPC/service command.

- Location: `src/features/course-order/_services/start-course-order.ts:51-69`
- What it does: if `tariffId` is present, checkout uses that exact tariff row; otherwise it falls back to the cheapest paid tariff.
- Dependencies: `course.tariffs`, `selectDefaultCourseTariff`.
- Data flow: order command -> selected tariff resolution.

- Location: `src/features/course-order/_services/start-course-order.ts:78-112`
- What it does: the service blocks purchase when the user already has access, and then creates a `Payment` with one product whose `sku` encodes `course.id` and `selectedTariff.id`, and whose `price` is the selected tariff price.
- Dependencies: `CheckCourseAccessService`, `CreatePaymentService`.
- Data flow: selected tariff -> payment product -> payment repository.

- Location: `prisma/schema.prisma:774-782`
- What it does: `Product` persists only `type`, `sku`, `name`, `price`, `quantity`, and `paymentId`.
- Dependencies: relation to `Payment`.
- Data flow: `CreatePaymentService` product payload -> Prisma `Product` row.

### 6. Access duration is recalculated from the purchased tariff row
- Location: `src/features/course-order/_services/receive-order-webhook.ts:63-105`
- What it does: after payment success, the webhook parses `payment.products[0].sku`, reloads the course, resolves the purchased tariff by `tariffId`, and computes `expiresAt = addDays(new Date(), tariff.durationDays)` when the tariff has a positive duration.
- Dependencies: `ReceivePaymentService`, `GetCourseService`, `GrandCourseAccessService`, `date-fns/addDays`.
- Data flow: payment webhook -> payment success -> SKU parse -> tariff lookup -> access expiration date.

- Location: `src/entities/user-access/_services/grand-course-access.ts:21-62`
- What it does: `GrandCourseAccessService` creates a new `UserAccess` record unless the user already has active access. For subscription content it forces `setupCompleted = true`.
- Dependencies: `UserAccessRepository`, `TRPCError`.
- Data flow: `(courseId, contentType, expiresAt)` -> `UserAccessRepository.save`.

- Location: `src/entities/user-access/_repository/user-access.ts:104-153`
- What it does: `UserAccessRepository.save` persists `expiresAt`, `reason`, `contentType`, `enrollmentId`, and `setupCompleted`, and logs access history.
- Dependencies: `db.userAccess.upsert`, `LogUserAccessHistoryService`.
- Data flow: access command -> Prisma `UserAccess` row.

- Location: `src/entities/user-access/_services/check-course-access.ts:22-42`
- What it does: purchase blocking checks only whether the user currently has active access for the same `courseId` and `contentType`; expired access returns `false`.
- Dependencies: `UserAccessRepository`, `UserFreezeRepository`.
- Data flow: order attempt -> active access lookup -> allow/deny purchase.

### 7. Manual admin access duration also derives from the default cheapest tariff
- Location: `src/features/admin-panel/users/_ui/grant-access-dialog.tsx:65-78`
- What it does: when an admin selects a course in the "Выдать доступ" dialog, the default expiry date is prefilled from `selectDefaultCourseTariff(course.tariffs)` and its `durationDays`.
- Dependencies: `coursesListApi`, `selectDefaultCourseTariff`, `date-fns/addDays`.
- Data flow: selected course -> cheapest tariff -> prefilled expiration date in UI.

- Location: `src/kernel/domain/course.ts:15-47`
- What it does: `selectDefaultCourseTariff` and `getMinPaidTariffPrice` both derive defaults from the lowest priced paid tariff, not from `isDefault`.
- Dependencies: used by admin grant dialog, course list pricing, and checkout fallback.
- Data flow: flat tariff list -> computed cheapest tariff / minimum price.

### 8. Current inspected pricing paths do not carry buyer-segment discount metadata
- Location: `prisma/schema.prisma:705-715`
- What it does: `CourseTariff` includes no fields for eligibility rules, source-course linkage, segment pricing, discount percentage, or discounted override amount.
- Dependencies: all tariff persistence paths.
- Data flow: tariff row persists only the base row attributes.

- Location: `src/features/admin-panel/courses/_ui/model/schema.ts:21-34`
- What it does: the admin form accepts only per-row `price`, `durationDays`, and `feedback` in addition to fixed `access`.
- Dependencies: admin course form.
- Data flow: admin input -> tariff form DTO.

- Location: `src/features/admin-panel/courses/_schemas.ts:3-10`
- What it does: the admin server contract accepts the same tariff fields and no buyer-segment pricing metadata.
- Dependencies: `courseUpsertInputSchema`.
- Data flow: request payload -> validated tariff DTO.

- Location: `prisma/schema.prisma:774-782`
- What it does: paid `Product` records store only the final charged `price`; there is no inspected column for original/base price, discount amount, discount source, or discount reason.
- Dependencies: payment/order persistence.
- Data flow: payment product -> stored checkout line item.

### 9. Current inspected payment lookup still assumes product SKU equals `courseId`
- Location: `src/entities/payment/_repository/payment.ts:96-116`
- What it does: `queryCoursePayment` searches `products.some({ sku: courseId })`, while new course purchases are written with SKU `${course.id}:${tariff.id}` in `src/features/course-order/_services/start-course-order.ts:101-112`.
- Dependencies: `findCoursePayment`, payment storage model.
- Data flow: courseId lookup -> product SKU comparison.

- Location: `src/features/course-order/_services/check-order-status.ts:20-41`
- What it does: order-status lookup compensates for the current SKU shape by splitting `payment.products[0].sku` on `:`, taking the first segment as `courseId`.
- Dependencies: `GetPaymentService`, `GetCourseService`.
- Data flow: orderId -> payment -> `sku.split(':')` -> `courseSlug`.

## Dependencies and constraints (as-is)
- Admin tariff editing is protected by `checkAbilityProcedure` with `ability.canManageCourses` in `src/features/admin-panel/courses/_controller.ts:73-111`.
- Tariffs are saved together with the whole course payload in one Prisma transaction in `src/features/admin-panel/courses/_services/courses-write.ts:30-84`.
- Existing tariff rows are not updated in place; they are deleted and recreated on each save in `src/features/admin-panel/courses/_services/courses-write.ts:294-320`.
- Public tariff presentation metadata in `TariffsBlock.tariffPresentation` is keyed only by `feedback`, not by duration or customer segment, in `src/kernel/domain/course-page.ts:155-166`.
- Order initiation, payment storage, webhook fulfillment, and manual access issuance all depend on the flat tariff row shape and especially on `tariff.id`, `price`, and `durationDays` in `src/features/course-order/_services/start-course-order.ts:51-112`, `src/features/course-order/_services/receive-order-webhook.ts:69-105`, and `src/features/admin-panel/users/_ui/grant-access-dialog.tsx:65-78`.
- Subscription-vs-fixed behavior is handled through `contentType` on the course and access records, not through different tariff models, in `src/features/admin-panel/courses/_ui/form-parts/access-section.tsx:52-82`, `src/features/admin-panel/courses/_schemas.ts:51-66`, and `src/entities/user-access/_services/grand-course-access.ts:44-57`.

## Open questions
- Status: answered by product clarification on 2026-03-10.
- Subscription purchase groups must be limited to exactly two groups: `Без обратной связи` and `С обратной связью`.
- Subscription tariff editing must keep explicit `durationDays` input; the implementation should not remove the ability to set access duration in days even if the public page groups purchase options into two cards.
- Future discount eligibility for users who previously bought a fixed course should be based on any historical `UserAccess`, not only active access. Product also expects future extension of these rules based on the number of days elapsed since access expiration.
- When a user qualifies for a future personal discount, the UI should show both the regular price and the personalized price for that user.
