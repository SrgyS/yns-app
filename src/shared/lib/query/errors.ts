function hasAbortName(error: Error): boolean {
  return error.name === 'AbortError' || error.message === 'AbortError'
}

function getErrorCause(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return null
  }

  return 'cause' in error ? error.cause : null
}

export function isAbortLikeError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return hasAbortName(error)
  }

  if (error instanceof Error) {
    if (hasAbortName(error)) {
      return true
    }

    const cause = getErrorCause(error)
    if (cause && cause !== error) {
      return isAbortLikeError(cause)
    }
  }

  return false
}

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isAbortLikeError(error)) {
    return false
  }

  return failureCount < 3
}
