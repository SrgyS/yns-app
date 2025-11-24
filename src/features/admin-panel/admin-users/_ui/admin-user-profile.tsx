'use client'

import type { AdminAbility } from '../_domain/ability'
import type { AdminUserProfile as AdminUserProfileData } from '../_domain/user-detail'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { ProfileAvatar } from '@/entities/user/client'
import { formatDate } from './utils/format-date'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { ROLE } from '@prisma/client'
import { useMemo } from 'react'
import { adminUsersApi } from '../_api'
import { toast } from 'sonner'

type AdminUserProfileProps = {
  userId: string
  profile: AdminUserProfileData
  viewerAbility: AdminAbility
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Администратор',
  STAFF: 'Сотрудник',
  USER: 'Пользователь',
}

export function AdminUserProfile({
  userId,
  profile,
  viewerAbility,
}: Readonly<AdminUserProfileProps>) {
  const utils = adminUsersApi.useUtils()
  const { mutate: updateUser, status } = adminUsersApi.admin.user.update.useMutation(
    {
      onSuccess: () => {
        utils.admin.user.detail.invalidate({ userId }).catch(() => undefined)
        toast.success('Данные обновлены')
      },
      onError: error => {
        toast.error(error.message ?? 'Не удалось сохранить изменения')
      },
    }
  )

  const canEditRole = viewerAbility.isAdmin
  const isStaff = profile.role === 'STAFF'
  const isSaving = status === 'pending'

  const permissionToggles = useMemo(
    () => [
      { key: 'canViewPayments', label: 'Просмотр платежей' },
      { key: 'canEditAccess', label: 'Управление доступами' },
      { key: 'canManageUsers', label: 'Управление пользователями' },
      { key: 'canGrantAccess', label: 'Выдача доступов' },
      { key: 'canLoginAsUser', label: 'Войти под пользователем' },
    ] as const,
    []
  )

  const handleRoleChange = (next: ROLE) => {
    if (!canEditRole) {
      return
    }
    if (next !== profile.role) {
      updateUser({ userId, role: next })
    }
  }

  const handlePermissionChange = (
    key: (typeof permissionToggles)[number]['key'],
    value: boolean
  ) => {
    if (!canEditRole || !isStaff) {
      return
    }

    updateUser({
      userId,
      permissions: {
        [key]: value,
      },
    })
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <ProfileAvatar profile={profile} className="size-20" />
          <div>
            <p className="text-lg font-semibold">
              {profile.name || 'Без имени'}
            </p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <Badge variant="secondary">
            {ROLE_LABELS[profile.role] ?? profile.role}
          </Badge>
        </div>
        {canEditRole ? (
          <>
            <div className="mt-6 space-y-2">
              <Label className="text-xs text-muted-foreground">Роль</Label>
              <Select
                value={profile.role}
                onValueChange={value => handleRoleChange(value as ROLE)}
                disabled={!canEditRole || isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Администратор</SelectItem>
                  <SelectItem value="STAFF">Сотрудник</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isStaff ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold">Права сотрудника</p>
                <div className="space-y-2">
                  {permissionToggles.map(toggle => (
                    <label
                      key={toggle.key}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-muted-foreground">{toggle.label}</span>
                      <Switch
                        checked={profile.staffPermissions[toggle.key]}
                        onCheckedChange={checked =>
                          handlePermissionChange(toggle.key, checked)
                        }
                        disabled={!canEditRole || isSaving}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex flex-col">
            <dt className="text-muted-foreground">Телефон</dt>
            <dd className="font-semibold">{profile.phone ?? '—'}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-muted-foreground">Дата регистрации</dt>
            <dd className="font-semibold">{formatDate(profile.createdAt)}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-muted-foreground">Последняя активность</dt>
            <dd className="font-semibold">
              {formatDate(profile.lastActivityAt)}
            </dd>
          </div>
        </dl>
        <div className="mt-6 space-y-2">
          <Button
            variant="outline"
            className="w-full cursor-pointer"
            disabled={!viewerAbility.canLoginAsUser}
          >
            Войти под пользователем
          </Button>
          <Button variant="outline" className="w-full cursor-pointer">
            Сбросить пароль
          </Button>
          <Button variant="outline" className="w-full cursor-pointer">
            Отправить сообщение
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
