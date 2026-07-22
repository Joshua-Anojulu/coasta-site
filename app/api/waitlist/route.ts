import { neon } from "@neondatabase/serverless";
import { parseWaitlist } from "@/lib/validate";

// per-instance limiter: good enough for launch traffic, swap for a store later
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_HITS;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const honeypot = (body as Record<string, unknown> | null)?.company;
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return Response.json({ ok: true }); // bots get a quiet fake success
  }
  const parsed = parseWaitlist(body);
  if (!parsed.ok) {
    return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  }
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO waitlist (email, zip) VALUES (${parsed.email}, ${parsed.zip})
      ON CONFLICT (email) DO NOTHING
    `;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
