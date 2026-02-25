import React from 'react'
import { render } from '@testing-library/react'

import { CheckAccessGuard } from './check-access-guard'

const useAppSession = jest.fn()
const usePaidAccess = jest.fn()
const useCheckAccessByCourseSlugQuery = jest.fn()
const toastError = jest.fn()

jest.mock('@/kernel/lib/next-auth/client', () => ({
  useAppSession: () => useAppSession(),
}))

jest.mock('./paid-access-context', () => ({
  usePaidAccess: () => usePaidAccess(),
}))

jest.mock('./use-course-enrollment', () => ({
  isCourseAccessState: (value: unknown) =>
    Boolean(value && typeof value === 'object' && 'hasAccess' in value),
  useCheckAccessByCourseSlugQuery: (...args: unknown[]) =>
    useCheckAccessByCourseSlugQuery(...args),
}))

jest.mock('sonner', () => ({
  toast: {
    error: (message: string) => toastError(message),
  },
}))

jest.mock('@/shared/ui/full-page-spinner', () => ({
  FullPageSpinner: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="spinner">{isLoading ? 'loading' : 'idle'}</div>
  ),
}))

describe('CheckAccessGuard', () => {
  beforeEach(() => {
    useAppSession.mockReset()
    usePaidAccess.mockReset()
    useCheckAccessByCourseSlugQuery.mockReset()
    toastError.mockReset()
  })

  test('renders children when access already present in paidAccess', () => {
    useAppSession.mockReturnValue({
      status: 'authenticated',
      data: { user: { id: 'user-1' } },
    })
    usePaidAccess.mockReturnValue({
      accessibleCourses: [{ enrollment: { course: { slug: 'course-1' } } }],
    })
    useCheckAccessByCourseSlugQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isSuccess: false,
      isPending: false,
      error: null,
    })

    const { getByText, getByTestId } = render(
      <CheckAccessGuard courseSlug="course-1">
        <div>content</div>
      </CheckAccessGuard>
    )

    expect(getByText('content')).toBeInTheDocument()
    expect(getByTestId('spinner').textContent).toBe('idle')
    expect(useCheckAccessByCourseSlugQuery).toHaveBeenCalledWith(
      'user-1',
      'course-1',
      { enabled: false }
    )
  })

  test('renders spinner while loading and hides children', () => {
    useAppSession.mockReturnValue({ status: 'loading', data: null })
    usePaidAccess.mockReturnValue({ accessibleCourses: [] })
    useCheckAccessByCourseSlugQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isSuccess: false,
      isPending: false,
      error: null,
    })

    const { queryByText, getByTestId } = render(
      <CheckAccessGuard courseSlug="course-1">
        <div>content</div>
      </CheckAccessGuard>
    )

    expect(getByTestId('spinner').textContent).toBe('loading')
    expect(queryByText('content')).toBeNull()
  })

  test('shows error toast when request fails', () => {
    useAppSession.mockReturnValue({
      status: 'authenticated',
      data: { user: { id: 'user-1' } },
    })
    usePaidAccess.mockReturnValue({ accessibleCourses: [] })
    useCheckAccessByCourseSlugQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isSuccess: false,
      isPending: false,
      error: new Error('Oops'),
    })

    render(
      <CheckAccessGuard courseSlug="course-1">
        <div>content</div>
      </CheckAccessGuard>
    )

    expect(toastError).toHaveBeenCalledWith('Oops')
  })

  test('shows access denied when server says no access', () => {
    useAppSession.mockReturnValue({
      status: 'authenticated',
      data: { user: { id: 'user-1' } },
    })
    usePaidAccess.mockReturnValue({ accessibleCourses: [] })
    useCheckAccessByCourseSlugQuery.mockReturnValue({
      data: {
        hasAccess: false,
        enrollment: null,
      },
      isError: false,
      isSuccess: true,
      isPending: false,
      error: null,
    })

    render(
      <CheckAccessGuard courseSlug="course-1">
        <div>content</div>
      </CheckAccessGuard>
    )

    expect(toastError).toHaveBeenCalledWith('У вас нет доступа к этому курсу')
  })
})
