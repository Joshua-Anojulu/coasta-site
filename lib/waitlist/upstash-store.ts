import "server-only"

import { Redis } from "@upstash/redis"
import { z } from "zod"
import type { TtlCounterStore, TtlIncrement } from "./rate-limit"

const INCREMENT_WITH_TTL = `
local value = redis.call("INCR", KEYS[1])
if value == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return {value, ttl}
`

const CounterResultSchema = z.tuple([z.number().int().positive(), z.number().int()])

export class RateLimitStoreError extends Error {
  readonly name = "RateLimitStoreError"

  constructor(options: ErrorOptions) {
    super("Durable rate-limit store failed", options)
  }
}

class UpstashTtlCounterStore implements TtlCounterStore {
  constructor(private readonly redis: Redis) {}

  async increment(input: {
    readonly key: string
    readonly ttlMs: number
    readonly nowMs: number
  }): Promise<TtlIncrement> {
    try {
      const raw: unknown = await this.redis.eval(
        INCREMENT_WITH_TTL,
        [input.key],
        [input.ttlMs],
      )
      const [count, remainingTtl] = CounterResultSchema.parse(raw)
      const effectiveTtl = remainingTtl > 0 ? remainingTtl : input.ttlMs
      return { count, resetAt: input.nowMs + effectiveTtl }
    } catch (error) {
      throw new RateLimitStoreError({ cause: error })
    }
  }
}

const StoreEnvironmentSchema = z.object({
  token: z.string().min(1),
  url: z.string().url(),
})

export function createDurableRateLimitStore(): TtlCounterStore | null {
  const environment = StoreEnvironmentSchema.safeParse({
    token: process.env["UPSTASH_REDIS_REST_TOKEN"],
    url: process.env["UPSTASH_REDIS_REST_URL"],
  })
  if (!environment.success) {
    return null
  }

  return new UpstashTtlCounterStore(
    new Redis({
      token: environment.data.token,
      url: environment.data.url,
    }),
  )
}
