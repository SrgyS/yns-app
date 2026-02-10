import { allSuccess } from './promise'

describe('allSuccess', () => {
  test('returns only fulfilled values and calls logger for each', async () => {
    const log = jest.fn()
    const result = await allSuccess(
      [Promise.resolve(1), Promise.reject(new Error('fail')), Promise.resolve(3)],
      log
    )

    expect(result).toEqual([1, 3])
    expect(log).toHaveBeenCalledTimes(3)
  })
})
