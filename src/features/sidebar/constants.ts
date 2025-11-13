import { GraduationCap, LineChart, Users } from 'lucide-react'

export const adminNavItems = [
  {
    title: 'Пользователи',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Курсы',
    href: '/admin/courses',
    icon: GraduationCap,
  },
  {
    title: 'Аналитика',
    href: '/admin/analytics',
    icon: LineChart,
  },
]