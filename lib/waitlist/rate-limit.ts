import { createHash } from "node:crypto"

export type TtlIncrement = {
  readonly count: number
  readonly resetAt: number
}

export interface TtlCounterStore {
  increment(input: {
    readonly key: string
    readonly ttlMs: number
    readonly nowMs: number
  }): Promise<TtlIncrement>
}

export type RateLimitPolicy = {
  readonly limit: number
  readonly windowMs: number
}

export type RateLimitSubject = {
  readonly clientIdentity: string
  readonly email: string
}

export type RateLimitDecision =
  | { readonly allowed: true; readonly remaining: number; readonly resetAt: number }
  | { readonly allowed: false; readonly remaining: 0; readonly resetAt: number }

export async function checkRateLimit(input: {
  readonly store: TtlCounterStore
  readonly policy: RateLimitPolicy
  readonly subject: RateLimitSubject
  readonly nowMs: number
}): Promise<RateLimitDecision> {
  const normalizedSubject = [
    input.subject.clientIdentity.trim().toLowerCase(),
    input.subject.email.trim().toLowerCase(),
  ].join("\u0000")
  const key = `waitlist:${createHash("sha256").update(normalizedSubject).digest("hex")}`
  const counter = await input.store.increment({
    key,
    nowMs: input.nowMs,
    ttlMs: input.policy.windowMs,
  })
  const remaining = Math.max(0, input.policy.limit - counter.count)

  if (counter.count > input.policy.limit) {
    return { allowed: false, remaining: 0, resetAt: counter.resetAt }
  }

  return { allowed: true, remaining, resetAt: counter.resetAt }
}
