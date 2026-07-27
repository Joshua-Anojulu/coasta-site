"use client"

import ky from "ky"
import { useState, type FormEvent } from "react"
import { z } from "zod"
import { parseWaitlistSubmission } from "@/lib/waitlist/validation"

const ApiResponseSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }),
  z.object({ error: z.string(), ok: z.literal(false) }),
])

type FormStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "sending" }
  | { readonly kind: "done" }
  | { readonly kind: "error"; readonly message: string }

function apiErrorMessage(error: string): string {
  switch (error) {
    case "invalid_body":
    case "invalid_email":
    case "invalid_zip":
      return "Check the email and ZIP, then try again."
    case "body_too_large":
      return "That submission is too large."
    case "rate_limited":
      return "Too many attempts. Wait a moment, then try again."
    case "service_unavailable":
      return "The waitlist service is not configured yet. Please try again later."
    default:
      return "That did not go through. Please try again."
  }
}

export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [zip, setZip] = useState("")
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" })

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const company = new FormData(event.currentTarget).get("company")
    const parsed = parseWaitlistSubmission({ company, email, zip })

    if (!parsed.ok) {
      setStatus({ kind: "error", message: apiErrorMessage(parsed.error) })
      return
    }

    setStatus({ kind: "sending" })
    try {
      const response = await ky.post("/api/waitlist", {
        json: parsed.value,
        retry: 0,
        throwHttpErrors: false,
        timeout: 10_000,
      })
      const payload: unknown = await response.json()
      const result = ApiResponseSchema.parse(payload)

      if (result.ok) {
        setStatus({ kind: "done" })
        return
      }
      setStatus({ kind: "error", message: apiErrorMessage(result.error) })
    } catch (error) {
      if (error instanceof Error) {
        setStatus({
          kind: "error",
          message: "The network did not respond. Please try again.",
        })
        return
      }
      throw error
    }
  }

  if (status.kind === "done") {
    return (
      <div className="waitlist-confirm" role="status">
        <span>CONFIRMED</span>
        <strong>You are on the list.</strong>
        <p>We will email you when Coasta reaches your area.</p>
      </div>
    )
  }

  return (
    <form className="waitlist-form" id="waitlist" onSubmit={submit}>
      <div className="field-group">
        <label htmlFor="waitlist-email">Email address</label>
        <input
          autoComplete="email"
          id="waitlist-email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div className="field-group">
        <label htmlFor="waitlist-zip">ZIP code, optional</label>
        <input
          autoComplete="postal-code"
          id="waitlist-zip"
          inputMode="numeric"
          maxLength={5}
          name="zip"
          onChange={(event) => setZip(event.target.value)}
          pattern="[0-9]{5}"
          type="text"
          value={zip}
        />
      </div>
      <div aria-hidden="true" className="honeypot-field">
        <label htmlFor="waitlist-company">Company</label>
        <input
          autoComplete="off"
          id="waitlist-company"
          name="company"
          tabIndex={-1}
          type="text"
        />
      </div>
      <button disabled={status.kind === "sending"} type="submit">
        {status.kind === "sending" ? "Joining..." : "Join the waitlist"}
      </button>
      {status.kind === "error" ? (
        <p className="form-error" role="alert">
          {status.message}
        </p>
      ) : null}
      <p className="form-note">Email and ZIP are sent to the Coasta waitlist.</p>
    </form>
  )
}
