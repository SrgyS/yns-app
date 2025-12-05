# TODO: Поддержка нескольких основных тренировок в дне

- Схема данных: DailyPlan — заменить mainWorkoutId на список основных (таблица DailyPlanMainWorkout { id, dailyPlanId, workoutId, order } предпочтительнее); UserDailyPlan — хранить список основных (связь UserDailyMainWorkout с order/stepIndex). UserWorkoutCompletion — привязывать к workoutId и порядку/stepIndex.
- API/Zod: обновить dailyPlanSchema/dailyPlanUpdateSchema на массив основных с порядком; upsert/update сохраняют список; course.get возвращает массив основных; валидация — минимум одна основная, если not onlyWarmup.
- Админ UI: в карточке дня показывать список основных с add/remove/reorder; диалог выбора с мультивыбором; “только зарядка” выключает список; сохранение недели отправляет массив {workoutId, order}.
- Валидация плана: PlanValidationService считает тренировочным день, если mainWorkouts.length > 0; warmup-only иначе; allowedWorkoutDaysPerWeek — по количеству дней с основными.
- Генерация UserDailyPlan: использовать массив основных; для тренировочных дней заполнять все основные по порядку; warmup-only — только разминка; stepIndex для каждого основного.
- Сохранение статуса выполнения: UserWorkoutCompletion хранит workoutId + order/stepIndex; чтение/запись прогресса поддерживает несколько основных; при изменении расписания — сопоставление по workoutId или сброс несоответствующих completion.
- Миграции: перенести mainWorkoutId в новый список с order=0; обновить upload-content и схемы контента под массив; прогнать тесты (генерация плана, валидация allowedWorkoutDaysPerWeek, UI множественных основных, прогресс выполнения).
