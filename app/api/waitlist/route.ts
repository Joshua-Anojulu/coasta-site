import { readJsonBody } from "@/lib/http/read-json-body"
import { recordWaitlistEvent } from "@/lib/observability"
import { normalizedClientIdentity } from "@/lib/waitlist/client-identity"
import { checkRateLimit } from "@/lib/waitlist/rate-limit"
import {
  insertWaitlistSubmission,
  WaitlistRepositoryError,
} from "@/lib/waitlist/repository"
import {
  createDurableRateLimitStore,
  RateLimitStoreError,
} from "@/lib/waitlist/upstash-store"
import { parseWaitlistSubmission } from "@/lib/waitlist/validation"

const MAXIMUM_BODY_BYTES = 8 * 1024
const RATE_LIMIT_POLICY = { limit: 5, windowMs: 60_000 } as const

export const runtime = "nodejs"

function failure(error: string, status: number, headers?: HeadersInit): Response {
  const init: ResponseInit = headers === undefined ? { status } : { headers, status }
  return Response.json({ error, ok: false }, init)
}

export async function POST(request: Request): Promise<Response> {
  const body = await readJsonBody(request, MAXIMUM_BODY_BYTES)
  if (!body.ok) {
    recordWaitlistEvent({ event: "waitlist_submit", outcome: "invalid" })
    const status = body.error === "body_too_large" ? 413 : 400
    return failure(body.error, status)
  }

  const submission = parseWaitlistSubmission(body.value)
  if (!submission.ok) {
    recordWaitlistEvent({ event: "waitlist_submit", outcome: "invalid" })
    return failure(submission.error, 400)
  }

  // A quiet success keeps basic bots from learning how the trap is wired.
  if (submission.value.company.length > 0) {
    recordWaitlistEvent({ event: "waitlist_submit", outcome: "bot_discarded" })
    return Response.json({ ok: true })
  }

  const store = createDurableRateLimitStore()
  if (store === null) {
    recordWaitlistEvent({ event: "waitlist_submit", outcome: "service_unconfigured" })
    return failure("service_unavailable", 503)
  }

  try {
    const decision = await checkRateLimit({
      nowMs: Date.now(),
      policy: RATE_LIMIT_POLICY,
      store,
      subject: {
        clientIdentity: normalizedClientIdentity(request.headers),
        email: submission.value.email,
      },
    })

    if (!decision.allowed) {
      recordWaitlistEvent({ event: "waitlist_submit", outcome: "rate_limited" })
      const retryAfter = Math.max(1, Math.ceil((decision.resetAt - Date.now()) / 1_000))
      return failure("rate_limited", 429, { "retry-after": String(retryAfter) })
    }
  } catch (error) {
    if (error instanceof RateLimitStoreError) {
      recordWaitlistEvent({ event: "waitlist_submit", outcome: "service_unconfigured" })
      return failure("service_unavailable", 503)
    }
    throw error
  }

  try {
    const insert = await insertWaitlistSubmission(submission.value)
    if (!insert.ok) {
      recordWaitlistEvent({ event: "waitlist_submit", outcome: "service_unconfigured" })
      return failure("service_unavailable", 503)
    }
    recordWaitlistEvent({ event: "waitlist_submit", outcome: "accepted" })
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof WaitlistRepositoryError) {
      recordWaitlistEvent({ event: "waitlist_submit", outcome: "database_failure" })
      return failure("server_error", 500)
    }
    throw error
  }
}
