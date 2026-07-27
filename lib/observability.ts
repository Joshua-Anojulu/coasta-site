type WaitlistEvent = {
  readonly event: "waitlist_submit"
  readonly outcome:
    | "accepted"
    | "bot_discarded"
    | "database_failure"
    | "invalid"
    | "rate_limited"
    | "service_unconfigured"
}

// PII stays out of these records because platform logs can outlive a request.
export function recordWaitlistEvent(event: WaitlistEvent): void {
  console.info(JSON.stringify(event))
}

export function recordImageFailure(slotId: string): void {
  console.warn(JSON.stringify({ event: "image_load_failure", slotId }))
}
