import { WorkoutSection, WorkoutSubsection } from '@prisma/client'

import {
  type PracticeType,
  type PracticeSubcategory,
  type PracticeTypeKey,
} from '../_domain/practice-types'
import { resolvePracticeImagePath } from '../_lib/image-path'

const image = resolvePracticeImagePath

export const PRACTICE_TYPES: PracticeType[] = [
  {
    key: 'warmup',
    title: 'Зарядки',
    description: 'Короткие комплексы для мягкого запуска дня.',
    imagePath: image('practices/top-5.3a575ebf.webp'),
    section: WorkoutSection.WARMUP,
    subcategories: [
      {
        key: 'anti-edema',
        title: 'От отеков',
        description: 'Мягкие движения для улучшения кровообращения.',
        imagePath: image('practices/warmup-sub-swelling.webp'),
        value: WorkoutSubsection.ANTI_EDEMA,
      },
      {
        key: 'pelvic-floor',
        title: 'Мышцы тазового дна (МТД)',
        description: 'Укрепление мышц ядра и стабилизация корпуса.',
        imagePath: image('practices/warmup-sub-pelvic-floor.webp'),
        value: WorkoutSubsection.PELVIC_FLOOR,
      },
      {
        key: 'pelvis-spine',
        title: 'Таз + позвоночник',
        description: 'Освобождаем зажимы и возвращаем гибкость.',
        imagePath: image('practices/warmup-sub-pelvis-spine.webp'),
        value: WorkoutSubsection.PELVIS_SPINE,
      },
      {
        key: 'breathing',
        title: 'Дыхание',
        description: 'Учимся дышать глубоко и ровно для энергии на день.',
        imagePath: image('practices/warmup-sub-breath.webp'),
        value: WorkoutSubsection.BREATHING,
      },
      {
        key: 'abdomen',
        title: 'Убираем живот',
        description: 'Активные упражнения для тонуса пресса.',
        imagePath: image('practices/warmup-sub-belly.webp'),
        value: WorkoutSubsection.ABDOMEN,
      },
      {
        key: 'energy',
        title: 'Зарядись энергией',
        description: 'Бодрящие комплексы для отличного самочувствия.',
        imagePath: image('practices/warmup-sub-energy.webp'),
        value: WorkoutSubsection.ENERGY_BOOST,
      },
      {
        key: 'joint',
        title: 'Суставная гимнастика',
        description:
          'Работаем над подвижностью суставов и профилактикой травм.',
        imagePath: image('practices/warmup-sub-energy.webp'),
        value: WorkoutSubsection.JOINT,
      },
    ],
  },
  {
    key: 'strength',
    title: 'Силовые',
    description: 'Тренировки на укрепление мышц и развитие силы.',
    imagePath: image('practices/course3.7eca204b.webp'),
    section: WorkoutSection.STRENGTH,
    subcategories: [
      {
        key: 'full-body',
        title: 'Все тело',
        description: 'Силовые тренировки на все группы мышц.',
        imagePath: image('practices/strength-full-body.webp'),
        value: WorkoutSubsection.FULL_BODY,
      },
      {
        key: 'lower-body',
        title: 'Нижняя часть тела',
        description: 'Укрепляем ноги и ягодицы.',
        imagePath: image('practices/strength-lower-body.webp'),
        value: WorkoutSubsection.LOWER_BODY,
      },
      {
        key: 'upper-body',
        title: 'Верхняя часть тела',
        description: 'Работаем над плечами, спиной и руками.',
        imagePath: image('practices/strength-upper-body.webp'),
        value: WorkoutSubsection.UPPER_BODY,
      },
    ],
  },
  {
    key: 'functional',
    title: 'Функциональные',
    description: 'Поддерживаем гибкость, баланс и выносливость.',
    imagePath: image('practices/functional-cover.webp'),
    section: WorkoutSection.FUNCTIONAL,
    subcategories: [
      {
        key: 'stretching',
        title: 'Растяжка',
        description: 'Мягкая работа на гибкость и мобильность.',
        imagePath: image('practices/functional-stretching.webp'),
        value: WorkoutSubsection.STRETCHING,
      },
      {
        key: 'anti-edema',
        title: 'От отеков',
        description: 'Дренажные функциональные комплексы.',
        imagePath: image('practices/functional-swelling.webp'),
        value: WorkoutSubsection.ANTI_EDEMA,
      },
      {
        key: 'inertial',
        title: 'Инерционные',
        description: 'Ритмичные функциональные тренировки.',
        imagePath: image('practices/functional-inertial.webp'),
        value: WorkoutSubsection.INERTIAL,
      },
      {
        key: 'pilates',
        title: 'Силовой пилатес',
        description: 'Ритмичные функциональные тренировки.',
        imagePath: image('practices/functional-inertial.webp'),
        value: WorkoutSubsection.PILATES,
      },
    ],
  },
  {
    key: 'correction',
    title: 'Коррекция осанки',
    description: 'Забота об осанке, балансе и подвижности.',
    imagePath: image('practices/top-5.3a575ebf.webp'),
    section: WorkoutSection.CORRECTION,
    subcategories: [
      {
        key: 'spine',
        title: 'Позвоночник',
        description: 'Упражнения для поддержания здорового позвоночника.',
        imagePath: image('practices/functional-inertial.webp'),
        value: WorkoutSubsection.SPINE,
      },
      {
        key: 'joint',
        title: 'Суставы',
        description: 'Ритмичные функциональные тренировки.',
        imagePath: image('practices/functional-inertial.webp'),
        value: WorkoutSubsection.JOINT,
      },
      {
        key: 'anti-edema',
        title: 'От отеков',
        description: 'Убираем отеки.',
        imagePath: image('practices/functional-inertial.webp'),
        value: WorkoutSubsection.ANTI_EDEMA,
      },
      {
        key: 'anti-tension',
        title: 'От зажимов',
        description: 'Ритмичные функциональные тренировки.',
        imagePath: image('practices/functional-inertial.webp'),
        value: WorkoutSubsection.ANTI_TENSION,
      },
      {
        key: 'pelvic-floor',
        title: 'Мышцы тазового дна',
        description: 'Ритмичные функциональные тренировки.',
        imagePath: image('practices/functional-inertial.webp'),
        value: WorkoutSubsection.PELVIC_FLOOR,
      },
    ],
  },
  {
    key: 'favorite',
    title: 'Избранное',
    description: 'Собранные любимые тренировки в одном месте.',
    imagePath: image('practices/course4-2.f43f5b9e.webp'),
    section: WorkoutSection.WARMUP,
    subcategories: [],
  },
  {
    key: 'pain',
    title: 'Бонусные тренировки',
    description: 'Дополнительные занятия для разнообразия программы.',
    section: WorkoutSection.PAIN,
    subcategories: [],
  },
]

export { type PracticeType, type PracticeTypeKey, type PracticeSubcategory }
