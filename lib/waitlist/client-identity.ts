import { isIP } from "node:net"

const TRUSTED_CLIENT_HEADER = "x-vercel-forwarded-for"

export function normalizedClientIdentity(headers: Headers): string {
  const forwarded = headers.get(TRUSTED_CLIENT_HEADER)
  const candidate = forwarded?.split(",")[0]?.trim().toLowerCase()

  if (candidate === undefined || isIP(candidate) === 0) {
    return "unknown-client"
  }

  return candidate
}
