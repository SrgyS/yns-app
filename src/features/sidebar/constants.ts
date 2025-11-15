import { GraduationCap, LineChart, Users } from 'lucide-react'

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
    title: 'Аналитика',
    url: '/admin/analytics',
    icon: LineChart,
  },
]
