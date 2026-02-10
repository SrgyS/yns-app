jest.mock('@/shared/api/query-client', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
}))

import { queryClient } from '@/shared/api/query-client'
import { CACHE_GROUPS, invalidateCacheGroup } from './cache-invalidation'

describe('invalidateCacheGroup', () => {
  test('invalidates each key in the group', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    const invalidateQueries = queryClient
      .invalidateQueries as jest.MockedFunction<
      typeof queryClient.invalidateQueries
    >

    await invalidateCacheGroup('WORKOUT_DATA')

    const keys = CACHE_GROUPS.WORKOUT_DATA.keys
    expect(invalidateQueries).toHaveBeenCalledTimes(keys.length)
    keys.forEach(key => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: [key] })
    })
  })
})
