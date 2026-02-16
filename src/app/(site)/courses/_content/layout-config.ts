
import { CourseBlock, TariffsBlock } from '@/kernel/domain/course-page'

const DEFAULT_TARIFF_PRESENTATION: NonNullable<
  TariffsBlock['tariffPresentation']
> = {
  options: [
    {
      feedback: false,
      badge: 'Без обратной связи',
      includes: [
        'Полный доступ к материалам курса',
        'Пошаговый план занятий',
        'Доступ в личный кабинет на весь срок тарифа',
      ],
    },
    {
      feedback: true,
      badge: 'С обратной связью',
      includes: [
        'Полный доступ к материалам курса',
        'Пошаговый план занятий',
        'Проверка и комментарии от куратора',
      ],
    },
  ],
}

const CLUB_TARIFF_PRESENTATION: NonNullable<
  TariffsBlock['tariffPresentation']
> = {
  options: [
    {
      feedback: false,
      badge: 'Без обратной связи',
      includes: [
        'Доступ ко всем материалам клуба на {duration}',
        'Ежемесячные обновления тренировок',
        'Библиотека «от боли», зарядки и самотесты',
      ],
    },
    {
      feedback: true,
      badge: 'С обратной связью',
      includes: [
        'Доступ ко всем материалам клуба на {duration}',
        'Ежемесячные обновления тренировок',
        'Обратная связь и рекомендации по прогрессу',
      ],
    },
  ],
}

export const COURSE_LAYOUTS: Record<string, CourseBlock[]> = {
  // Перезагрузка движений
  reload: [
    // Hero
    {
      id: 'hero-1',
      type: 'hero',
      isVisible: true,
      badges: [
        { icon: 'shield', label: 'Без жести и перегруза' },
        { icon: 'heart', label: 'Подходит для новичков или после перерыва' },
        { icon: 'dumbbell', label: 'Готовая программа' },
      ],
      primaryAction: {
        label: 'Выбрать тариф',
        href: '#tariffs',
      },
    },

    // Видео - пробная тренировка
    {
      id: 'video-trial',
      type: 'video',
      isVisible: true,
      title: 'Попробуйте прямо сейчас - мягкая коррекционная тренировка',
      videoId: 'fZffoSFor5rCL1qV78ZRn7',
    },

    // Кому подойдет
    {
      id: 'list-audience-good',
      type: 'list',
      isVisible: true,
      title: 'Кому подходит этот курс',
      layout: 'grid',
      items: [
        {
          title: 'Давно не тренировались',
          description: 'Или после паузы - нужен мягкий старт',
        },
        {
          title: 'Лишний вес, отёчность',
          description: '«Живот стоит» - нужна система без перегруза',
        },
        {
          title: 'Грыжи, протрузии, сколиоз',
          description: 'Ограничения по спине - работаем безопасно',
        },
      ],
    },

    // Что включено
    {
      id: 'list-included',
      type: 'list',
      isVisible: true,
      title: 'Что вы получаете',
      layout: 'grid',
      items: [
        {
          title: '20 тренировок',
          description: 'По 30 минут, с разбором техники',
        },
        {
          title: '30 зарядок',
          description: 'По 5–15 минут для ежедневного ритма',
        },
        {
          title: 'Папка «от боли»',
          description: 'Тренировки при обострениях',
        },
        {
          title: 'Конструктор питания',
          description: 'И мини-лекции по восстановлению',
        },
      ],
    },

    // Система работы
    {
      id: 'text-system-explained',
      type: 'text',
      isVisible: true,
      title: 'Почему это работает',
      content: `
        <p>Мы не просто даём упражнения. Мы работаем с <strong>миофасциальными линиями</strong>, чтобы снять компенсации и вернуть телу симметрию.</p>
        <p>Плюс акцент на дыхание, диафрагму и ритм питания - это снижает стресс и улучшает переносимость нагрузки.</p>
        <p>Каждая неделя с целью - вы понимаете, что и зачем делаете.</p>
      `,
      background: 'default',
    },

    // Быстрые результаты
    {
      id: 'list-outcomes',
      type: 'list',
      isVisible: true,
      title: 'Что вы почувствуете уже на старте',
      items: [
        {
          title: 'Уходит тяжесть и зажимы',
          description: 'Тело начинает лучше отдавать воду, меньше отёчности',
        },
        {
          title: 'Стабилизируется таз и корпус',
          description: 'Меньше боли в спине и шее',
        },
        {
          title: 'Появляется отклик на нагрузку',
          description: 'Мышцы держат форму',
        },
      ],
    },

    // Программа курса
    // {
    //   id: 'accordion-curriculum',
    //   type: 'accordion',
    //   isVisible: true,
    //   title: 'Программа: 4 недели пошагово',
    //   items: [
    //     {
    //       title: 'Неделя 1: Снять зажимы, включить дыхание и опору',
    //       content:
    //         'Мягкие коррекционные тренировки. Тесты: таз, грудная клетка, стопы. Зарядки 5–10 минут.',
    //     },
    //     {
    //       title: 'Неделя 2: Стабилизация корпуса',
    //       content:
    //         'Меньше боли и отёков. Силовые без жести. Работа с плечами и тазом. Дыхание в движении.',
    //     },
    //     {
    //       title: 'Неделя 3: Усиление ягодиц и спины',
    //       content:
    //         'Форма и лёгкость. Силовые 3 раза. Зарядки ежедневно. Папка «от боли».',
    //     },
    //     {
    //       title: 'Неделя 4: Сборка системы',
    //       content:
    //         'Закрепление привычек. Комбинированные тренировки. План питания-конструктор. Стратегия перехода в клуб.',
    //     },
    //   ],
    // },

    // Оборудование
    {
      id: 'equipment-1',
      type: 'equipment',
      isVisible: true,
      title: 'Оборудование для курса',
    },

    // Тарифы
    {
      id: 'tariffs-1',
      type: 'tariffs',
      isVisible: true,
      title: 'Выберите свой тариф',
      tariffPresentation: DEFAULT_TARIFF_PRESENTATION,
    },

    // FAQ
    {
      id: 'accordion-faq',
      type: 'accordion',
      isVisible: true,
      title: 'Частые вопросы',
      items: [
        {
          title: 'Нужен ли инвентарь?',
          content:
            'На старте можно начать с минимумом. Дальше вы докупаете постепенно, чтобы улучшать качество нагрузки.',
        },
        {
          title: 'Если есть грыжи/протрузии?',
          content:
            'Курс спроектирован как мягкий старт. Если есть сильная боль или диагноз в острой стадии, нужен допуск врача.',
        },
        {
          title: 'Когда увижу результат?',
          content:
            'Первые ощущения чаще приходят в течение 7–14 дней при регулярности. Устойчивые изменения требуют 4–6 недель.',
        },
      ],
    },
  ],

  // Тело без отёков
  noedema: [
    // Hero
    {
      id: 'hero-1',
      type: 'hero',
      isVisible: true,
      primaryAction: {
        label: 'Выбрать тариф',
        href: '#tariffs',
      },
    },

    // Быстрые результаты
    {
      id: 'list-outcomes',
      type: 'list',
      isVisible: true,
      title: 'Что изменится',
      layout: 'vertical',
      items: [
        {
          title: 'Меньше отёков утром и вечером',
          description: 'Легче ноги и лицо',
        },
        {
          title: 'Меньше вздутия',
          description: 'Живот «садится»',
        },
        {
          title: 'Ритм питания',
          description: 'Меньше тяги к сладкому и перекусов',
        },
      ],
    },

    // 3 ключа курса
    {
      id: 'text-keys',
      type: 'text',
      isVisible: true,
      title: 'Отёки: ритм, ЖКТ, лимфа',
      content: `
        <p><strong>Белок + 3 приёма пищи</strong> → меньше перекусов и «заливов»</p>
        <p><strong>Клетчатка и вода</strong> → поддержка стула и слизистой</p>
        <p><strong>Ежедневные зарядки</strong> → лимфа включается через мышцы</p>
        <p>Физиология воды связана с воспалительным фоном, режимом питания и активностью мышц.</p>
      `,
      background: 'muted',
    },

    // Кому подойдет
    {
      id: 'list-audience',
      type: 'list',
      isVisible: true,
      title: 'Кому подходит',
      layout: 'grid',
      items: [
        {
          title: 'Отёчность, тяжесть, «пухлость»',
          description: 'Особенно утром и вечером',
        },
        {
          title: 'Перекусы и нестабильный режим',
          description: 'Нужна структура питания',
        },
        {
          title: 'Живот и рыхлость после 30',
          description: 'Даже при нормальном весе',
        },
      ],
    },

    // Программа
    {
      id: 'accordion-curriculum',
      type: 'accordion',
      isVisible: true,
      title: 'Программа курса',
      items: [
        {
          title: 'Неделя 1: Ритм и базовая разгрузка ЖКТ',
          content:
            'Конструктор питания. Вода и соль без крайностей. Зарядки ежедневно.',
        },
        {
          title: 'Неделя 2: Усиление лимфотока через движение',
          content: 'Тренировки 5 раз. Дыхание. Мини-лекции.',
        },
        {
          title: 'Неделя 3: Плотность тела',
          content: 'Силовые блоки. Белок и овощи. Контроль перекусов.',
        },
        {
          title: 'Неделя 4: Закрепление',
          content:
            'Переход в клуб. Сборка недельного ритма. Стратегия на месяц. План поддержания.',
        },
      ],
    },

    // Что включено
    {
      id: 'list-included',
      type: 'list',
      isVisible: true,
      title: 'Что включено',
      layout: 'grid',
      items: [
        {
          title: 'Тренировки + зарядки',
          description: 'Полный комплекс для лимфодренажа',
        },
        {
          title: 'Конструктор питания',
          description: 'Без жёстких диет',
        },
        {
          title: 'Готовые схемы при вздутии',
          description: 'Практические протоколы',
        },
        {
          title: 'Материалы по восстановлению',
          description: 'Сон, стресс, режим',
        },
      ],
    },

    // Видео
    {
      id: 'video-trial',
      type: 'video',
      isVisible: true,
      title: 'Пример тренировки для лимфодренажа',
      videoId: 'fZffoSFor5rCL1qV78ZRn7',
    },

    // Оборудование
    {
      id: 'equipment-1',
      type: 'equipment',
      isVisible: true,
      title: 'Оборудование для курса',
    },

    // Тарифы
    {
      id: 'tariffs-1',
      type: 'tariffs',
      isVisible: true,
      title: 'Тарифы курса',
      tariffPresentation: DEFAULT_TARIFF_PRESENTATION,
    },

    // FAQ
    {
      id: 'accordion-faq',
      type: 'accordion',
      isVisible: true,
      title: 'Частые вопросы',
      items: [
        {
          title: 'Это диета?',
          content:
            'Нет. Это система питания с нормальным объёмом еды и акцентом на нутритивную плотность.',
        },
        {
          title: 'Если я ем солёное?',
          content:
            'Соль сама по себе не проблема. Важнее общий ритм, белок, вода и воспалительный фон слизистой.',
        },
      ],
    },
  ],

  // Антикорка
  antikorka: [
    // Hero
    {
      id: 'hero-1',
      type: 'hero',
      isVisible: true,
      primaryAction: {
        label: 'Выбрать тариф',
        href: '#tariffs',
      },
    },

    // Результаты
    {
      id: 'list-outcomes',
      type: 'list',
      isVisible: true,
      title: 'Что получите',
      layout: 'vertical',
      items: [
        {
          title: 'Более плотное тело визуально',
          description: 'Меньше рыхлости, лучше тонус',
        },
        {
          title: 'Лучше тонус ягодиц и бедра',
          description: 'Видимый подтянутый эффект',
        },
        {
          title: 'Меньше рыхлости',
          description: 'При сохранении еды',
        },
      ],
    },

    // Система
    {
      id: 'text-system',
      type: 'text',
      isVisible: true,
      title: 'Антикорка: плотность через прогрессию и ресурс',
      content: `
        <p>Плотность меняется, когда есть <strong>рост нагрузки</strong> и достаточный <strong>ресурс питания</strong>.</p>
        <p>Соединительная ткань любит ресурс - плотность зависит от питания (белок + микроэлементы).</p>
        <p>Мышца работает - жидкость уходит легче. Тонус и лимфоток взаимосвязаны.</p>
      `,
      background: 'default',
    },

    // Кому подойдет
    {
      id: 'list-audience',
      type: 'list',
      isVisible: true,
      title: 'Кому подходит',
      layout: 'grid',
      items: [
        {
          title: 'Рыхлость, целлюлит, птоз',
          description: 'Хотите плотности и формы',
        },
        {
          title: 'Низкий тонус при нормальном весе',
          description: 'Нужна силовая база',
        },
        {
          title: 'Хотите силовую базу без травм',
          description: 'Безопасная прогрессия',
        },
      ],
    },

    // Программа
    // {
    //   id: 'accordion-curriculum',
    //   type: 'accordion',
    //   isVisible: true,
    //   title: 'Программа курса',
    //   items: [
    //     {
    //       title: 'Неделя 1: Техника + включение ягодиц',
    //       content: 'База движения. Самотесты. Зарядки.',
    //     },
    //     {
    //       title: 'Неделя 2: Сила и объём',
    //       content: 'Силовые 3 раза. МФР и мобилизация. Питание-конструктор.',
    //     },
    //     {
    //       title: 'Неделя 3: Плотность',
    //       content:
    //         'Комбо-тренировки. Работа с дыханием. Контроль восстановления.',
    //     },
    //     {
    //       title: 'Неделя 4: Стабилизация + клуб',
    //       content: 'Сборка недели. Поддерживающий план. Переход в клуб.',
    //     },
    //   ],
    // },

    // Что включено
    {
      id: 'list-included',
      type: 'list',
      isVisible: true,
      title: 'Что включено',
      layout: 'grid',
      items: [
        {
          title: 'Тренировки',
          description: 'Силовые с прогрессией',
        },
        {
          title: 'Зарядки',
          description: 'Ежедневная активация',
        },
        {
          title: 'Рабочая тетрадь',
          description: 'Самотесты и контроль прогресса',
        },
        {
          title: 'Питание по системе',
          description: 'Конструктор для плотности',
        },
      ],
    },

    // Видео
    {
      id: 'video-trial',
      type: 'video',
      isVisible: true,
      title: 'Пример силового блока',
      videoId: 'fZffoSFor5rCL1qV78ZRn7',
    },

    // Оборудование
    {
      id: 'equipment-1',
      type: 'equipment',
      isVisible: true,
      title: 'Оборудование для курса',
    },

    // Тарифы
    {
      id: 'tariffs-1',
      type: 'tariffs',
      isVisible: true,
      title: 'Выберите формат',
      tariffPresentation: DEFAULT_TARIFF_PRESENTATION,
    },

    // FAQ
    {
      id: 'accordion-faq',
      type: 'accordion',
      isVisible: true,
      title: 'Вопросы',
      items: [
        {
          title: 'Это только про целлюлит?',
          content:
            'Нет. Это про плотность ткани и отклик мышц - эстетика становится следствием.',
        },
      ],
    },
  ],

  // Клуб
  club: [
    // Hero
    {
      id: 'hero-1',
      type: 'hero',
      isVisible: true,
      primaryAction: {
        label: 'Вступить в клуб',
        href: '#tariffs',
      },
    },

    // Что даёт клуб
    {
      id: 'list-outcomes',
      type: 'list',
      isVisible: true,
      title: 'Зачем клуб',
      layout: 'vertical',
      items: [
        {
          title: 'Результат закрепляется',
          description: 'Регулярность без откатов',
        },
        {
          title: 'Нагрузка растёт без травм',
          description: 'Периодизация и прогрессия',
        },
        {
          title: 'Меньше откатов по питанию',
          description: 'Поддержка ритма и режима',
        },
      ],
    },

    // План клуба
    {
      id: 'text-plan',
      type: 'text',
      isVisible: true,
      title: 'Клуб: контент + план на месяцы',
      content: `
        <p><strong>Недельный план:</strong> 5 тренировок + варианты замены</p>
        <p><strong>Обновления:</strong> 30–50% контента ежемесячно - тело не «привыкает»</p>
        <p><strong>Библиотека:</strong> Папки от боли + самотесты для диагностики</p>
        <p>Ключ - структура. Недельный план, обновления и библиотека инструментов удерживают регулярность.</p>
      `,
      background: 'muted',
    },

    // Что обновляется
    {
      id: 'list-updates',
      type: 'list',
      isVisible: true,
      title: 'Что обновляется каждый месяц',
      layout: 'vertical',
      items: [
        {
          title: 'Новые зарядки',
          description: 'Шея, грудной отдел, таз',
        },
        {
          title: 'Новая неделя тренировок',
          description: 'Прогрессия по нагрузке',
        },
        {
          title: 'Папка от боли',
          description: 'Например: поясница',
        },
        {
          title: 'Самотест',
          description: 'Таз и стопы для диагностики',
        },
      ],
    },

    // Кому подойдет
    {
      id: 'list-audience',
      type: 'list',
      isVisible: true,
      title: 'Кому подходит',
      layout: 'grid',
      items: [
        {
          title: 'Прошли базовую программу',
          description: 'И хотите продолжать',
        },
        {
          title: 'Нужен план и регулярность',
          description: 'Чтобы не выпадать из системы',
        },
        {
          title: 'Хотите усложнение',
          description: 'Периодизация и прогрессия',
        },
      ],
    },

    // Библиотека
    {
      id: 'list-library',
      type: 'list',
      isVisible: true,
      title: 'Библиотека под задачи',
      layout: 'grid',
      items: [
        {
          title: 'Папки от боли',
          description: 'Поясница, шея, колени',
        },
        {
          title: 'Самотесты',
          description: 'Таз, стопы, грудная клетка',
        },
        {
          title: 'Зарядки',
          description: '5–15 минут под ритм дня',
        },
      ],
    },

    // Оборудование
    {
      id: 'equipment-1',
      type: 'equipment',
      isVisible: true,
      title: 'Оборудование для курса',
    },

    // Тарифы
    {
      id: 'tariffs-1',
      type: 'tariffs',
      isVisible: true,
      title: 'Вступить в',
      tariffPresentation: CLUB_TARIFF_PRESENTATION,
    },

    // FAQ
    {
      id: 'accordion-faq',
      type: 'accordion',
      isVisible: true,
      title: 'Вопросы',
      items: [
        {
          title: 'Можно ли войти без базового курса?',
          content:
            'Можно, но если вы новичок, лучше начать с «Перезагрузка движений», так прогресс будет безопаснее.',
        },
        {
          title: 'Что с обновлениями?',
          content:
            'Контент обновляется ежемесячно, а неделя открывается по плану. Это помогает удерживать ритм.',
        },
      ],
    },
  ],
}
