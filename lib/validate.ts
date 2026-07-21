const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ZIP_RE = /^\d{5}$/;

export function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s);
}
export function isValidZip(s: string): boolean {
  return ZIP_RE.test(s);
}

export type WaitlistParse =
  | { ok: true; email: string; zip: string | null }
  | { ok: false; error: string };

export function parseWaitlist(body: unknown): WaitlistParse {
  if (typeof body !== "object" || body === null) return { ok: false, error: "invalid_body" };
  const b = body as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) return { ok: false, error: "invalid_email" };
  if (b.zip !== undefined && b.zip !== "") {
    if (typeof b.zip !== "string" || !isValidZip(b.zip)) return { ok: false, error: "invalid_zip" };
    return { ok: true, email, zip: b.zip };
  }
  return { ok: true, email, zip: null };
}
