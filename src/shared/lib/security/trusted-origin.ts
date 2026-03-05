const toOrigin = (value: string | null | undefined): string | null => {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

type TrustedOriginInput = {
  requestUrl?: string
  originHeader?: string | null
  refererHeader?: string | null
  hostHeader?: string | null
  forwardedHostHeader?: string | null
  forwardedProtoHeader?: string | null
  publicAppUrl?: string | null
}

const collectAllowedOrigins = (input: TrustedOriginInput) => {
  const allowed = new Set<string>()

  const publicOrigin = toOrigin(input.publicAppUrl)
  if (publicOrigin) {
    allowed.add(publicOrigin)
  }

  const requestOrigin = toOrigin(input.requestUrl)
  if (requestOrigin) {
    allowed.add(requestOrigin)
  }

  const host = input.forwardedHostHeader ?? input.hostHeader
  if (!host) {
    return allowed
  }

  let preferredProtocol: string | null = null
  if (input.forwardedProtoHeader) {
    preferredProtocol = `${input.forwardedProtoHeader}:`
  } else if (publicOrigin) {
    preferredProtocol = new URL(publicOrigin).protocol
  } else if (requestOrigin) {
    preferredProtocol = new URL(requestOrigin).protocol
  }

  if (!preferredProtocol) {
    return allowed
  }

  allowed.add(`${preferredProtocol}//${host}`)
  return allowed
}

export const isTrustedRequestOrigin = (input: TrustedOriginInput): boolean => {
  const allowedOrigins = collectAllowedOrigins(input)
  if (allowedOrigins.size === 0) {
    return false
  }

  const origin = toOrigin(input.originHeader)
  if (origin) {
    return allowedOrigins.has(origin)
  }

  const refererOrigin = toOrigin(input.refererHeader)
  if (refererOrigin) {
    return allowedOrigins.has(refererOrigin)
  }

  return false
}
