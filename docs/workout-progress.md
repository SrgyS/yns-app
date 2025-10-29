# Отслеживание прогресса тренировок

## Статус «Выполнено»
- UI использует хук `useWorkoutCompletions` (`src/features/daily-plan/_vm/use-workout-completions.ts`), который обращается к tRPC-процедурам `workout.updateWorkoutCompletion` и `workout.getWorkoutCompletionStatus`.
- Контроллер (`src/features/daily-plan/_controller.ts`) пробрасывает вызовы в сервисы `UpdateWorkoutCompletionService` и `GetWorkoutCompletionStatusService`.
- При генерации `UserDailyPlan` каждому дню присваиваются стабильные порядковые номера шагов: `warmupStepIndex` и, при наличии основной тренировки, `mainWorkoutStepIndex` (`src/entities/planning/_services/plan-generation.ts`).
- Репозиторий `UserWorkoutCompletionRepository` (`src/entities/workout/_repositories/user-workout-completion.ts`) хранит прогресс по связке `(userId, enrollmentId, contentType, stepIndex)`, где `contentType` — `DailyContentType.WARMUP` или `DailyContentType.MAIN`. `workoutId` и `workoutType` сохраняются для справки, но уникальность обеспечивается только шагом.
- Обновление статуса — это `upsert` по указанной связке; удаление — `deleteMany` по тем же ключам.

## Сохранение прогресса при смене тренировочных дней
- После выбора новых дней UI вызывает мутацию `course.updateWorkoutDays` (`src/features/select-training-days/_vm/use-update-workout-days.ts`).
- `UpdateWorkoutDaysService` (`src/entities/course/_services/update-selected-workout-days.ts`) обновляет выбранные дни, пересобирает `UserDailyPlan` и, если пользователь не хочет сохранять прогресс, удаляет все `UserWorkoutCompletion` для данного `enrollmentId`.
- При опции «Сохранить прогресс» удаления не происходит: после пересборки расписания сервис перепривязывает отметки к новым индексам, сохраняя соответствие «контент → порядковый номер появления» для каждой зарядки и тренировки. Благодаря этому не требуется переносить данные между `userDailyPlanId`, и уникальный индекс больше не зависит от конкретного календарного дня.
