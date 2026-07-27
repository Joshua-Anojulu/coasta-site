import "server-only"

import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import type { ValidatedWaitlistSubmission } from "./validation"

const DatabaseUrlSchema = z.string().min(1)

export type WaitlistInsertResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "unconfigured" }

export class WaitlistRepositoryError extends Error {
  readonly name = "WaitlistRepositoryError"

  constructor(options: ErrorOptions) {
    super("Waitlist insert failed", options)
  }
}

export async function insertWaitlistSubmission(
  submission: ValidatedWaitlistSubmission,
): Promise<WaitlistInsertResult> {
  const databaseUrl = DatabaseUrlSchema.safeParse(process.env["DATABASE_URL"])
  if (!databaseUrl.success) {
    return { ok: false, reason: "unconfigured" }
  }

  try {
    const sql = neon(databaseUrl.data)
    await sql`
      INSERT INTO waitlist (email, zip)
      VALUES (${submission.email}, ${submission.zip})
      ON CONFLICT (email) DO NOTHING
    `
    return { ok: true }
  } catch (error) {
    throw new WaitlistRepositoryError({ cause: error })
  }
}
