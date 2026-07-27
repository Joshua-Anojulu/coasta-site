import { z } from "zod"

export type ValidatedWaitlistSubmission = {
  readonly email: string
  readonly zip: string | null
  readonly company: string
}

export type WaitlistValidationResult =
  | { readonly ok: true; readonly value: ValidatedWaitlistSubmission }
  | {
      readonly ok: false
      readonly error: "invalid_body" | "invalid_email" | "invalid_zip"
}

const WaitlistBodySchema = z.object({
  company: z.unknown().optional(),
  email: z.unknown(),
  zip: z.unknown().optional(),
})

const EmailSchema = z.string().trim().toLowerCase().max(254).email()
const ZipSchema = z.union([z.literal(""), z.string().regex(/^\d{5}$/)])
const HoneypotSchema = z.string().max(200).optional().default("")

export function parseWaitlistSubmission(input: unknown): WaitlistValidationResult {
  const body = WaitlistBodySchema.safeParse(input)
  if (!body.success) {
    return { error: "invalid_body", ok: false }
  }

  const email = EmailSchema.safeParse(body.data.email)
  if (!email.success) {
    return { error: "invalid_email", ok: false }
  }

  const zip = ZipSchema.safeParse(body.data.zip ?? "")
  if (!zip.success) {
    return { error: "invalid_zip", ok: false }
  }

  const company = HoneypotSchema.safeParse(body.data.company)
  if (!company.success) {
    return { error: "invalid_body", ok: false }
  }

  return {
    ok: true,
    value: {
      company: company.data,
      email: email.data,
      zip: zip.data === "" ? null : zip.data,
    },
  }
}
