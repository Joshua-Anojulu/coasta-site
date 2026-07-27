import { describe, expect, it } from "vitest"
import { parseWaitlistSubmission } from "@/lib/waitlist/validation"

describe("parseWaitlistSubmission", () => {
  it("normalizes the email and accepts an optional ZIP", () => {
    // Given
    const input = { company: "", email: "  Driver@Example.COM ", zip: "75201" }

    // When
    const result = parseWaitlistSubmission(input)

    // Then
    expect(result).toEqual({
      ok: true,
      value: {
        company: "",
        email: "driver@example.com",
        zip: "75201",
      },
    })
  })

  it("maps an empty ZIP to null", () => {
    // Given
    const input = { company: "", email: "driver@example.com", zip: "" }

    // When
    const result = parseWaitlistSubmission(input)

    // Then
    expect(result).toEqual({
      ok: true,
      value: {
        company: "",
        email: "driver@example.com",
        zip: null,
      },
    })
  })

  it.each([
    [{ email: "missing-at.example.com", zip: "" }, "invalid_email"],
    [{ email: "driver@example.com", zip: "7500" }, "invalid_zip"],
    [null, "invalid_body"],
  ])("rejects invalid boundary input", (input, error) => {
    // Given
    const boundaryInput: unknown = input

    // When
    const result = parseWaitlistSubmission(boundaryInput)

    // Then
    expect(result).toEqual({ ok: false, error })
  })
})
