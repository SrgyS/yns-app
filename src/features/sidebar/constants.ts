import {
  GraduationCap,
  LineChart,
  Users,
  Dumbbell,
  BookOpen,
  ChefHat,
  MessageCircle,
} from 'lucide-react'

export const adminNavItems = [
  {
    title: 'Пользователи',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'Курсы',
    url: '/admin/courses',
    icon: GraduationCap,
  },
  {
    title: 'Тренировки',
    url: '/admin/workouts',
    icon: Dumbbell,
  },
  {
    title: 'Аналитика',
    url: '/admin/analytics',
    icon: LineChart,
  },
  {
    title: 'База знаний',
    url: '/admin/knowledge',
    icon: BookOpen,
  },
  {
    title: 'Рецепты',
    url: '/admin/recipes',
    icon: ChefHat,
  },
  {
    title: 'Support чат',
    url: '/admin/support-chat',
    icon: MessageCircle,
    badgeKey: 'support-chat-unanswered',
  },
]
