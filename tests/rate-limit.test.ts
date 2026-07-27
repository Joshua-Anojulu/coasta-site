import { describe, expect, it } from "vitest"
import {
  checkRateLimit,
  type TtlCounterStore,
  type TtlIncrement,
} from "@/lib/waitlist/rate-limit"

class MemoryTtlCounterStore implements TtlCounterStore {
  private readonly entries = new Map<string, { count: number; resetAt: number }>()

  async increment(input: {
    readonly key: string
    readonly ttlMs: number
    readonly nowMs: number
  }): Promise<TtlIncrement> {
    const current = this.entries.get(input.key)
    if (current === undefined || input.nowMs >= current.resetAt) {
      const resetAt = input.nowMs + input.ttlMs
      this.entries.set(input.key, { count: 1, resetAt })
      return { count: 1, resetAt }
    }

    current.count += 1
    return { count: current.count, resetAt: current.resetAt }
  }
}

const policy = { limit: 2, windowMs: 60_000 } as const
const subject = { clientIdentity: "203.0.113.4", email: "driver@example.com" } as const

describe("checkRateLimit", () => {
  it("blocks after the fixed-window allowance is consumed", async () => {
    // Given
    const store = new MemoryTtlCounterStore()

    // When
    const first = await checkRateLimit({ nowMs: 1_000, policy, store, subject })
    const second = await checkRateLimit({ nowMs: 1_001, policy, store, subject })
    const third = await checkRateLimit({ nowMs: 1_002, policy, store, subject })

    // Then
    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third).toEqual({ allowed: false, remaining: 0, resetAt: 61_000 })
  })

  it("opens a fresh allowance after the TTL window expires", async () => {
    // Given
    const store = new MemoryTtlCounterStore()
    await checkRateLimit({ nowMs: 1_000, policy, store, subject })
    await checkRateLimit({ nowMs: 1_001, policy, store, subject })
    await checkRateLimit({ nowMs: 1_002, policy, store, subject })

    // When
    const decision = await checkRateLimit({ nowMs: 61_000, policy, store, subject })

    // Then
    expect(decision).toEqual({ allowed: true, remaining: 1, resetAt: 121_000 })
  })

  it("uses both client identity and email in the durable key", async () => {
    // Given
    const store = new MemoryTtlCounterStore()
    await checkRateLimit({ nowMs: 1_000, policy, store, subject })
    await checkRateLimit({ nowMs: 1_001, policy, store, subject })

    // When
    const decision = await checkRateLimit({
      nowMs: 1_002,
      policy,
      store,
      subject: { ...subject, email: "other@example.com" },
    })

    // Then
    expect(decision.allowed).toBe(true)
  })
})
