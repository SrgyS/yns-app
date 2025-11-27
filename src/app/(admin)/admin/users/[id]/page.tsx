import { AdminUserDetailPage } from '@/features/admin-panel/users/_ui/admin-user-detail-page'

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AdminUserDetailPage userId={id} />
}
