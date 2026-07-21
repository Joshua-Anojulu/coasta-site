import { describe, it, expect } from "vitest";
import { isValidEmail, isValidZip, parseWaitlist } from "@/lib/validate";

describe("isValidEmail", () => {
  it("accepts a normal address", () => expect(isValidEmail("a@b.co")).toBe(true));
  it("rejects missing at-sign", () => expect(isValidEmail("ab.co")).toBe(false));
  it("rejects spaces", () => expect(isValidEmail("a b@c.co")).toBe(false));
  it("rejects single-letter TLD", () => expect(isValidEmail("a@b.c")).toBe(false));
});

describe("isValidZip", () => {
  it("accepts 5 digits", () => expect(isValidZip("75201")).toBe(true));
  it("rejects letters", () => expect(isValidZip("7520a")).toBe(false));
  it("rejects wrong length", () => expect(isValidZip("752013")).toBe(false));
});

describe("parseWaitlist", () => {
  it("parses a valid body", () =>
    expect(parseWaitlist({ email: " A@B.co ", zip: "75201" })).toEqual({
      ok: true, email: "a@b.co", zip: "75201",
    }));
  it("allows missing zip", () =>
    expect(parseWaitlist({ email: "a@b.co" })).toEqual({ ok: true, email: "a@b.co", zip: null }));
  it("rejects bad email", () =>
    expect(parseWaitlist({ email: "nope" })).toEqual({ ok: false, error: "invalid_email" }));
  it("rejects bad zip", () =>
    expect(parseWaitlist({ email: "a@b.co", zip: "abc" })).toEqual({ ok: false, error: "invalid_zip" }));
  it("rejects non-object body", () =>
    expect(parseWaitlist("x")).toEqual({ ok: false, error: "invalid_body" }));
});
