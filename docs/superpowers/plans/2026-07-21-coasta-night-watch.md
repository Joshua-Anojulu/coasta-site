# Coasta "Night Watch" Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single-page Coasta consumer waitlist site: a dark mission-control page whose hero is a scripted DFW detection replay on canvas, ending in an email waitlist backed by Neon Postgres.

**Architecture:** Next.js App Router site with all interactive state derived from a pure, unit-tested replay engine (`lib/replay`). The hero map is a custom canvas renderer over hand-simplified DFW highway polylines (`lib/dfw`). Seven page sections compose in `app/page.tsx`; the only server code is one waitlist API route writing to Neon.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, `motion` (Framer Motion successor) for scroll choreography, raw `<canvas>` for the map, Vitest for unit tests, `@neondatabase/serverless` + Neon Postgres for the waitlist, deployed on Vercel.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-21-coasta-site-design.md`. House style: `~/.claude/skills/house-style/SKILL.md` (dials: VARIANCE 9, MOTION 8, DENSITY 4).
- **Palette (semantic, exact):** base `#0A0C0F`, surface `#11141A`, signal amber `#FFB000` (detections in progress, the page's single accent), alert red `#FF3B30` (confirmed incidents ONLY), steel blue `#4A6B8A` (road/infrastructure), fog `#E8EAED` (type), fog-dim `#8A919C`.
- **Fonts:** Archivo (variable, `wdth` axis, rendered expanded) for display; IBM Plex Mono for every number, timestamp, camera ID, confidence value. Inter, Roboto, Space Grotesk are banned.
- **Copy rules:** NO em dashes or en dashes in any user-visible string, zero exceptions. No invented statistics; every demo number carries a visible `SIM` tag. Headline max 2 lines; hero max 4 text elements; nav one line under 80px tall.
- **Layout rules:** each layout family appears at most once on the page. No three-equal-card rows. Max 2 uppercase-tracking eyebrows across the 7 sections. Use `min-h-[100dvh]`, never `h-screen`. Asymmetric layouts must collapse to full-width stacking below 768px.
- **Motion rules:** `prefers-reduced-motion` support is mandatory everywhere (static hero frame with alert card already present). Never `window.addEventListener("scroll")`; use `motion`'s `useScroll`. Custom easing only (`cubic-bezier(0.16, 1, 0.3, 1)`), never `linear` or `ease-in-out` on UI transitions.
- **Commits:** commit after every task, message style `feat: ...` / `chore: ...`. NEVER add a Claude co-author trailer.
- All demo detections are fictional and scripted. The site must never claim live functionality.

## File Structure

```
coasta-site/
  package.json, tsconfig.json, next.config.ts, postcss.config.mjs, vitest.config.ts
  app/
    layout.tsx            fonts, metadata, grain overlay
    page.tsx              assembles the seven sections
    globals.css           design tokens + utilities
    api/waitlist/route.ts POST endpoint -> Neon
  components/
    Nav.tsx  Hero.tsx  MapCanvas.tsx  AlertCard.tsx
    BlindSpot.tsx  Pipeline.tsx  PhonePreview.tsx
    Catches.tsx  Coverage.tsx  Waitlist.tsx  Footer.tsx
  lib/
    replay/engine.ts      pure replay state derivation (TDD)
    replay/timeline.ts    scripted event data
    dfw/geometry.ts       highway polylines + projection (TDD)
    validate.ts           shared email/zip validation (TDD)
  scripts/migrate.mjs     creates the waitlist table
  tests/                  engine.test.ts, geometry.test.ts, validate.test.ts
  public/cam-frame.jpg    highway camera still for the Pipeline section
```

---

### Task 1: Project scaffold, tokens, fonts

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`

**Interfaces:**
- Produces: CSS variables `--color-asphalt|surface|signal|alert|steel|fog|fog-dim`, font variables `--font-archivo`, `--font-plex-mono`, utility classes `.font-display`, `.grain`, `.lane-divider`. All later tasks use these.

- [ ] **Step 1: Author config files** (scaffold manually; `create-next-app` refuses non-empty dirs)

`package.json`:
```json
{
  "name": "coasta-site",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run --passWithNoTests",
    "migrate": "node scripts/migrate.mjs"
  },
  "dependencies": {
    "@neondatabase/serverless": "^1.0.0",
    "motion": "^12.9.0",
    "next": "^15.3.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

`postcss.config.mjs`:
```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

`next.config.ts`:
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: { include: ["tests/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname) } },
});
```

- [ ] **Step 2: Write `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-asphalt: #0a0c0f;
  --color-surface: #11141a;
  --color-signal: #ffb000;
  --color-alert: #ff3b30;
  --color-steel: #4a6b8a;
  --color-fog: #e8eaed;
  --color-fog-dim: #8a919c;
  --font-display: var(--font-archivo);
  --font-mono: var(--font-plex-mono);
  --ease-signal: cubic-bezier(0.16, 1, 0.3, 1);
}

body {
  background: var(--color-asphalt);
  color: var(--color-fog);
}

.font-display {
  font-family: var(--font-archivo);
  font-stretch: 125%;
  letter-spacing: -0.02em;
}

/* film grain over the whole page, kills the flat digital look */
.grain {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 50;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* dashed lane line used as the section divider motif */
.lane-divider {
  height: 1px;
  background-image: linear-gradient(90deg, var(--color-signal) 0 40px, transparent 40px 72px);
  background-size: 72px 1px;
  opacity: 0.35;
}
```

- [ ] **Step 3: Write `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Coasta | See the road before you reach it",
  description:
    "Coasta turns DFW traffic cameras into an AI detection network. Police, crashes, and hazards, spotted the moment a camera sees them. Join the waitlist.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body className="font-mono antialiased">
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Write placeholder `app/page.tsx`** (replaced in Task 13)

```tsx
export default function Page() {
  return (
    <main className="min-h-[100dvh] grid place-items-center">
      <h1 className="font-display text-6xl uppercase">Coasta</h1>
    </main>
  );
}
```

- [ ] **Step 5: Install and verify**

Run: `npm install` (background; may take minutes), then `npm run dev` (background), fetch `http://localhost:3000`.
Expected: page renders "COASTA" in expanded Archivo on near-black. Then `npm test` -> passes with no tests. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Night Watch tokens and fonts"
```

---

### Task 2: Shared validation (`lib/validate.ts`)

**Files:**
- Create: `lib/validate.ts`
- Test: `tests/validate.test.ts`

**Interfaces:**
- Produces: `isValidEmail(s: string): boolean`, `isValidZip(s: string): boolean`, `parseWaitlist(body: unknown): { ok: true; email: string; zip: string | null } | { ok: false; error: string }`. Used by Task 11 (API route) and Task 12 (form).

- [ ] **Step 1: Write failing tests** in `tests/validate.test.ts`

```ts
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
```

- [ ] **Step 2: Run to verify failure.** Run: `npm test`. Expected: FAIL, cannot resolve `@/lib/validate`.

- [ ] **Step 3: Implement `lib/validate.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify pass.** Run: `npm test`. Expected: all validate tests PASS.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: shared waitlist validation"`

---

### Task 3: Replay engine (`lib/replay`)

**Files:**
- Create: `lib/replay/engine.ts`, `lib/replay/timeline.ts`
- Test: `tests/engine.test.ts`

**Interfaces:**
- Produces:
  - `type EventKind = "police" | "crash" | "stall"`
  - `interface ReplayEvent { id: string; camId: string; kind: EventKind; label: string; road: string; startMs: number; durationMs: number; lonlat: [number, number] }`
  - `type Phase = "idle" | "pulse" | "detecting" | "confirmed"`
  - `interface ReplayState { event: ReplayEvent | null; phase: Phase; confidence: number; loopMs: number }`
  - `loopDuration(timeline: ReplayEvent[]): number`
  - `getReplayState(timeline: ReplayEvent[], tMs: number): ReplayState`
  - `TIMELINE: ReplayEvent[]` (from `timeline.ts`)
- Consumed by Tasks 5, 6, 9 (MapCanvas, Hero/AlertCard, PhonePreview).

- [ ] **Step 1: Write failing tests** in `tests/engine.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { getReplayState, loopDuration, type ReplayEvent } from "@/lib/replay/engine";

const T: ReplayEvent[] = [
  { id: "e1", camId: "CAM-114", kind: "police", label: "Police vehicle", road: "US-75 at I-635", startMs: 2000, durationMs: 10000, lonlat: [-96.769, 32.924] },
  { id: "e2", camId: "CAM-203", kind: "stall", label: "Stalled vehicle", road: "I-30 E", startMs: 16000, durationMs: 10000, lonlat: [-96.9, 32.75] },
];

describe("loopDuration", () => {
  it("is last event end plus 2s of idle", () => expect(loopDuration(T)).toBe(28000));
});

describe("getReplayState", () => {
  it("is idle before the first event", () => {
    const s = getReplayState(T, 500);
    expect(s.phase).toBe("idle");
    expect(s.event).toBeNull();
  });
  it("pulses during the first 15% of an event", () => {
    expect(getReplayState(T, 2500).phase).toBe("pulse");
  });
  it("ramps confidence from 42 while detecting", () => {
    const s = getReplayState(T, 2000 + 1500 + 1); // just past pulse
    expect(s.phase).toBe("detecting");
    expect(s.confidence).toBeGreaterThanOrEqual(42);
    expect(s.confidence).toBeLessThan(96);
  });
  it("confirms at 96 after 70% of the event", () => {
    const s = getReplayState(T, 2000 + 8000);
    expect(s.phase).toBe("confirmed");
    expect(s.confidence).toBe(96);
    expect(s.event?.id).toBe("e1");
  });
  it("loops: t + loopMs gives the same state", () => {
    expect(getReplayState(T, 5000)).toEqual(getReplayState(T, 5000 + 28000));
  });
});
```

- [ ] **Step 2: Run to verify failure.** Run: `npm test`. Expected: FAIL, cannot resolve `@/lib/replay/engine`.

- [ ] **Step 3: Implement `lib/replay/engine.ts`**

```ts
export type EventKind = "police" | "crash" | "stall";

export interface ReplayEvent {
  id: string;
  camId: string;
  kind: EventKind;
  label: string;
  road: string;
  startMs: number;
  durationMs: number;
  lonlat: [number, number];
}

export type Phase = "idle" | "pulse" | "detecting" | "confirmed";

export interface ReplayState {
  event: ReplayEvent | null;
  phase: Phase;
  confidence: number;
  loopMs: number;
}

const PULSE_END = 0.15;
const DETECT_END = 0.7;
const CONF_START = 42;
const CONF_END = 96;
const TAIL_MS = 2000;

export function loopDuration(timeline: ReplayEvent[]): number {
  return Math.max(...timeline.map((e) => e.startMs + e.durationMs)) + TAIL_MS;
}

export function getReplayState(timeline: ReplayEvent[], tMs: number): ReplayState {
  const loopMs = loopDuration(timeline);
  const t = ((tMs % loopMs) + loopMs) % loopMs;
  const event = timeline.find((e) => t >= e.startMs && t < e.startMs + e.durationMs) ?? null;
  if (!event) return { event: null, phase: "idle", confidence: 0, loopMs };
  const p = (t - event.startMs) / event.durationMs;
  if (p < PULSE_END) return { event, phase: "pulse", confidence: 0, loopMs };
  if (p < DETECT_END) {
    const ramp = (p - PULSE_END) / (DETECT_END - PULSE_END);
    return {
      event,
      phase: "detecting",
      confidence: Math.min(CONF_END - 1, Math.round(CONF_START + ramp * (CONF_END - CONF_START))),
      loopMs,
    };
  }
  return { event, phase: "confirmed", confidence: CONF_END, loopMs };
}
```

- [ ] **Step 4: Run to verify pass.** Run: `npm test`. Expected: all engine tests PASS.

- [ ] **Step 5: Write `lib/replay/timeline.ts`** (the production script: three incidents, varied kinds and roads)

```ts
import type { ReplayEvent } from "./engine";

export const TIMELINE: ReplayEvent[] = [
  {
    id: "evt-police-highfive", camId: "CAM-114", kind: "police",
    label: "Police vehicle", road: "US-75 at I-635 (High Five)",
    startMs: 2000, durationMs: 12000, lonlat: [-96.769, 32.924],
  },
  {
    id: "evt-stall-i30", camId: "CAM-207", kind: "stall",
    label: "Stalled vehicle, right shoulder", road: "I-30 E near Fair Park",
    startMs: 18000, durationMs: 12000, lonlat: [-96.76, 32.772],
  },
  {
    id: "evt-crash-i35e", camId: "CAM-052", kind: "crash",
    label: "Multi-vehicle crash", road: "I-35E N near Oak Lawn",
    startMs: 34000, durationMs: 12000, lonlat: [-96.83, 32.81],
  },
];
```

- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat: scripted replay engine with phase and confidence model"`

---

### Task 4: DFW highway geometry (`lib/dfw/geometry.ts`)

**Files:**
- Create: `lib/dfw/geometry.ts`
- Test: `tests/geometry.test.ts`

**Interfaces:**
- Produces:
  - `HIGHWAYS: { name: string; major: boolean; points: [number, number][] }[]` (lon/lat polylines)
  - `CAMERAS: { id: string; lonlat: [number, number] }[]` (12 static camera nodes)
  - `BOUNDS = { minLon, maxLon, minLat, maxLat }`
  - `project(lonlat: [number, number], w: number, h: number, pad?: number): [number, number]` (linear map into canvas pixels, y flipped)
- Consumed by Task 5 (MapCanvas). Timeline event `lonlat`s (Task 3) must fall inside `BOUNDS`.

Coordinates are hand-simplified approximations of real DFW freeway geometry (recognizable shape, not navigation data): I-35E, US-75, I-635 LBJ arc, I-30, I-20, and the Dallas North Tollway. The High Five sits at US-75 x I-635 near `[-96.769, 32.924]`.

- [ ] **Step 1: Write failing tests** in `tests/geometry.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { HIGHWAYS, CAMERAS, BOUNDS, project } from "@/lib/dfw/geometry";
import { TIMELINE } from "@/lib/replay/timeline";

describe("geometry data", () => {
  it("has the six named freeways", () =>
    expect(HIGHWAYS.map((h) => h.name).sort()).toEqual(
      ["DNT", "I-20", "I-30", "I-35E", "I-635", "US-75"].sort()
    ));
  it("keeps every polyline point inside BOUNDS", () => {
    for (const h of HIGHWAYS) for (const [lon, lat] of h.points) {
      expect(lon).toBeGreaterThanOrEqual(BOUNDS.minLon);
      expect(lon).toBeLessThanOrEqual(BOUNDS.maxLon);
      expect(lat).toBeGreaterThanOrEqual(BOUNDS.minLat);
      expect(lat).toBeLessThanOrEqual(BOUNDS.maxLat);
    }
  });
  it("keeps cameras and timeline events inside BOUNDS", () => {
    for (const { lonlat: [lon, lat] } of [...CAMERAS, ...TIMELINE]) {
      expect(lon).toBeGreaterThanOrEqual(BOUNDS.minLon);
      expect(lon).toBeLessThanOrEqual(BOUNDS.maxLon);
      expect(lat).toBeGreaterThanOrEqual(BOUNDS.minLat);
      expect(lat).toBeLessThanOrEqual(BOUNDS.maxLat);
    }
  });
});

describe("project", () => {
  it("maps the SW corner to bottom-left inside padding", () => {
    const [x, y] = project([BOUNDS.minLon, BOUNDS.minLat], 1000, 800, 40);
    expect(x).toBe(40);
    expect(y).toBe(760);
  });
  it("maps the NE corner to top-right inside padding", () => {
    const [x, y] = project([BOUNDS.maxLon, BOUNDS.maxLat], 1000, 800, 40);
    expect(x).toBe(960);
    expect(y).toBe(40);
  });
});
```

- [ ] **Step 2: Run to verify failure.** Run: `npm test`. Expected: FAIL, cannot resolve `@/lib/dfw/geometry`.

- [ ] **Step 3: Implement `lib/dfw/geometry.ts`**

```ts
export const BOUNDS = { minLon: -97.05, maxLon: -96.6, minLat: 32.6, maxLat: 33.05 };

type Highway = { name: string; major: boolean; points: [number, number][] };

export const HIGHWAYS: Highway[] = [
  { name: "I-35E", major: true, points: [
    [-96.994, 32.62], [-96.91, 32.68], [-96.87, 32.74], [-96.83, 32.79],
    [-96.828, 32.86], [-96.86, 32.93], [-96.9, 32.99], [-96.94, 33.05],
  ]},
  { name: "US-75", major: true, points: [
    [-96.79, 32.78], [-96.782, 32.83], [-96.77, 32.88], [-96.769, 32.924],
    [-96.765, 32.97], [-96.75, 33.02], [-96.74, 33.05],
  ]},
  { name: "I-635", major: true, points: [
    [-97.0, 32.9], [-96.94, 32.925], [-96.87, 32.93], [-96.8, 32.928],
    [-96.769, 32.924], [-96.71, 32.91], [-96.66, 32.87], [-96.63, 32.82],
    [-96.64, 32.76], [-96.67, 32.72],
  ]},
  { name: "I-30", major: true, points: [
    [-97.05, 32.755], [-96.95, 32.76], [-96.86, 32.77], [-96.8, 32.78],
    [-96.76, 32.772], [-96.68, 32.76], [-96.6, 32.75],
  ]},
  { name: "I-20", major: false, points: [
    [-97.05, 32.67], [-96.94, 32.665], [-96.83, 32.66], [-96.72, 32.66], [-96.6, 32.665],
  ]},
  { name: "DNT", major: false, points: [
    [-96.805, 32.79], [-96.807, 32.85], [-96.81, 32.91], [-96.82, 32.97], [-96.825, 33.05],
  ]},
];

export const CAMERAS: { id: string; lonlat: [number, number] }[] = [
  { id: "CAM-021", lonlat: [-96.91, 32.68] },
  { id: "CAM-052", lonlat: [-96.83, 32.81] },
  { id: "CAM-063", lonlat: [-96.828, 32.86] },
  { id: "CAM-114", lonlat: [-96.769, 32.924] },
  { id: "CAM-131", lonlat: [-96.87, 32.93] },
  { id: "CAM-142", lonlat: [-96.71, 32.91] },
  { id: "CAM-155", lonlat: [-96.63, 32.82] },
  { id: "CAM-207", lonlat: [-96.76, 32.772] },
  { id: "CAM-218", lonlat: [-96.86, 32.77] },
  { id: "CAM-233", lonlat: [-96.95, 32.76] },
  { id: "CAM-301", lonlat: [-96.765, 32.97] },
  { id: "CAM-317", lonlat: [-96.81, 32.91] },
];

export function project(
  [lon, lat]: [number, number], w: number, h: number, pad = 40
): [number, number] {
  const x = pad + ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * (w - pad * 2);
  const y = h - pad - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (h - pad * 2);
  return [x, y];
}
```

- [ ] **Step 4: Run to verify pass.** Run: `npm test`. Expected: all geometry tests PASS (including timeline-in-bounds cross-check).

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: stylized DFW highway geometry and projection"`

---

### Task 5: MapCanvas renderer

**Files:**
- Create: `components/MapCanvas.tsx`

**Interfaces:**
- Consumes: `HIGHWAYS`, `CAMERAS`, `project` (Task 4); `TIMELINE`, `getReplayState` (Task 3).
- Produces: `<MapCanvas epochRef={React.RefObject<number | null>} paused={boolean} className?={string} />`. Runs its own rAF loop reading `performance.now() - epochRef.current` so it stays in sync with any component sharing the same epoch. When `paused` (reduced motion), draws one static frame at t=12000ms (confirmed phase of event one).

- [ ] **Step 1: Implement `components/MapCanvas.tsx`**

```tsx
"use client";
import { useEffect, useRef } from "react";
import { HIGHWAYS, CAMERAS, project } from "@/lib/dfw/geometry";
import { TIMELINE } from "@/lib/replay/timeline";
import { getReplayState } from "@/lib/replay/engine";

const STEEL = "#4a6b8a";
const SIGNAL = "#ffb000";
const ALERT = "#ff3b30";

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, tMs: number) {
  ctx.clearRect(0, 0, w, h);
  const s = getReplayState(TIMELINE, tMs);

  for (const hw of HIGHWAYS) {
    ctx.beginPath();
    hw.points.forEach((p, i) => {
      const [x, y] = project(p, w, h);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    // glow pass then core pass gives roads a neon depth
    ctx.strokeStyle = STEEL;
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = hw.major ? 7 : 4;
    ctx.stroke();
    ctx.globalAlpha = hw.major ? 0.85 : 0.5;
    ctx.lineWidth = hw.major ? 2 : 1.25;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const cam of CAMERAS) {
    const [x, y] = project(cam.lonlat, w, h);
    const active = s.event?.camId === cam.id;
    // idle cameras breathe faintly, offset by position so they never sync
    const breathe = 0.35 + 0.2 * Math.sin(tMs / 900 + x * 0.13);
    ctx.beginPath();
    ctx.arc(x, y, active ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = active ? SIGNAL : STEEL;
    ctx.globalAlpha = active ? 1 : breathe;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (s.event && s.phase !== "idle") {
    const [x, y] = project(s.event.lonlat, w, h);
    const color = s.phase === "confirmed" ? ALERT : SIGNAL;
    // expanding radar ring
    const ring = ((tMs % 1400) / 1400) * 26;
    ctx.beginPath();
    ctx.arc(x, y, 6 + ring, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1 - ring / 26;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // bounding-box corner brackets around the event
    const r = 12, l = 5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      ctx.beginPath();
      ctx.moveTo(x + sx * r, y + sy * r - sy * l);
      ctx.lineTo(x + sx * r, y + sy * r);
      ctx.lineTo(x + sx * r - sx * l, y + sy * r);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

export default function MapCanvas({
  epochRef, paused, className,
}: {
  epochRef: React.RefObject<number | null>;
  paused: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (paused) {
      draw(ctx, canvas.clientWidth, canvas.clientHeight, 12000);
      return () => ro.disconnect();
    }
    let raf = 0;
    const tick = (now: number) => {
      if (epochRef.current === null) epochRef.current = now;
      draw(ctx, canvas.clientWidth, canvas.clientHeight, now - epochRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [paused, epochRef]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
```

- [ ] **Step 2: Smoke-test in the placeholder page.** Temporarily render in `app/page.tsx`:

```tsx
"use client";
import { useRef } from "react";
import MapCanvas from "@/components/MapCanvas";
export default function Page() {
  const epochRef = useRef<number | null>(null);
  return <main className="min-h-[100dvh]"><MapCanvas epochRef={epochRef} paused={false} className="h-[100dvh] w-full" /></main>;
}
```

Run: `npm run dev`, open `http://localhost:3000`.
Expected: glowing steel freeway network in a recognizable DFW arrangement (LBJ arc crossing US-75, I-30 east-west), cameras breathing, an amber ring firing at the High Five, turning red on confirm, then moving to I-30 and I-35E on the loop. Revert `app/page.tsx` to the Task 1 placeholder after checking.

- [ ] **Step 3: Commit.** `git add -A && git commit -m "feat: canvas DFW map renderer with detection replay"`

---

### Task 6: Hero (nav, headline, AlertCard, replay wiring)

**Files:**
- Create: `components/Nav.tsx`, `components/AlertCard.tsx`, `components/Hero.tsx`

**Interfaces:**
- Consumes: `MapCanvas` (Task 5), `getReplayState`/`TIMELINE` (Task 3).
- Produces: `<Hero />` (self-contained, includes `<Nav />`). `<AlertCard state={ReplayState} />` is reused by no one else; PhonePreview (Task 9) has its own mini feed.

Hero layout (VARIANCE 9): full-bleed map behind everything; headline block pinned to the BOTTOM-LEFT, not centered; AlertCard floats top-right; nav is a hairline bar. Hero text elements: headline, one subline, one CTA link. Max 2 headline lines at all breakpoints.

- [ ] **Step 1: Implement `components/Nav.tsx`**

```tsx
export default function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-[#0a0c0f]/70 px-5 backdrop-blur-md md:px-10">
      <a href="#" className="font-display text-lg uppercase tracking-tight">
        C<span className="text-signal">O</span>ASTA
      </a>
      <div className="flex items-center gap-6">
        <span className="hidden text-xs text-fog-dim sm:block">
          network: DFW <span className="text-signal">/ demo</span>
        </span>
        <a
          href="#waitlist"
          className="border border-signal/40 px-4 py-1.5 text-xs uppercase text-signal transition-colors duration-300 [transition-timing-function:var(--ease-signal)] hover:bg-signal hover:text-asphalt"
        >
          Join waitlist
        </a>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Implement `components/AlertCard.tsx`** (double-bezel card, mono readout, confidence bar)

```tsx
"use client";
import type { ReplayState } from "@/lib/replay/engine";

const KIND_LABEL = { police: "POLICE", crash: "CRASH", stall: "STALL" } as const;

export default function AlertCard({ state }: { state: ReplayState }) {
  const { event, phase, confidence } = state;
  if (!event || phase === "idle" || phase === "pulse") return null;
  const confirmed = phase === "confirmed";
  const color = confirmed ? "text-alert" : "text-signal";
  const barColor = confirmed ? "bg-alert" : "bg-signal";
  return (
    <div className="w-72 rounded-xl border border-white/10 bg-white/5 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="rounded-[calc(0.75rem-0.375rem)] bg-surface p-4">
        <div className="flex items-center justify-between text-[10px] text-fog-dim">
          <span>{event.camId}</span>
          <span className="border border-white/15 px-1.5 py-0.5">SIM</span>
        </div>
        <div className={`mt-3 font-display text-xl uppercase ${color}`}>
          {KIND_LABEL[event.kind]} {confirmed ? "CONFIRMED" : "DETECTING"}
        </div>
        <div className="mt-1 text-xs text-fog-dim">{event.label}</div>
        <div className="mt-0.5 text-xs text-fog">{event.road}</div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full ${barColor} transition-[width] duration-200 [transition-timing-function:var(--ease-signal)]`}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className={`text-xs tabular-nums ${color}`}>{confidence}%</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `components/Hero.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { getReplayState, type ReplayState } from "@/lib/replay/engine";
import { TIMELINE } from "@/lib/replay/timeline";
import MapCanvas from "./MapCanvas";
import AlertCard from "./AlertCard";
import Nav from "./Nav";

export default function Hero() {
  const epochRef = useRef<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const [state, setState] = useState<ReplayState>(() => getReplayState(TIMELINE, 0));

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduced(true);
      setState(getReplayState(TIMELINE, 12000)); // static confirmed frame
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (epochRef.current === null) epochRef.current = now;
      const next = getReplayState(TIMELINE, now - epochRef.current);
      setState((prev) =>
        prev.phase !== next.phase ||
        prev.confidence !== next.confidence ||
        prev.event?.id !== next.event?.id
          ? next
          : prev
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <header className="relative min-h-[100dvh] overflow-hidden">
      <Nav />
      <MapCanvas epochRef={epochRef} paused={reduced} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-asphalt via-transparent to-asphalt/60" />
      <div className="absolute right-5 top-24 md:right-10">
        <AlertCard state={state} />
      </div>
      <div className="absolute bottom-12 left-5 max-w-3xl md:left-10">
        <h1 className="font-display text-5xl uppercase leading-[0.95] md:text-8xl">
          Every camera.<br />Now a sensor.
        </h1>
        <p className="mt-5 max-w-md text-sm text-fog-dim">
          Coasta reads DFW traffic cameras with AI and warns you about police, crashes, and hazards before you reach them.
        </p>
        <a
          href="#waitlist"
          className="mt-8 inline-block bg-signal px-7 py-3 text-sm font-medium uppercase text-asphalt transition-transform duration-300 [transition-timing-function:var(--ease-signal)] hover:-translate-y-0.5"
        >
          Join the DFW waitlist
        </a>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Wire into `app/page.tsx`** (temporary until Task 13 assembles everything)

```tsx
import Hero from "@/components/Hero";
export default function Page() {
  return <main><Hero /></main>;
}
```

- [ ] **Step 5: Visual check.** Run: `npm run dev`. Expected: full-bleed animated map; bottom-left two-line headline; alert card appearing top-right synced with the map marker (amber DETECTING with climbing percentage, then red CONFIRMED at 96). Check 375px width: headline wraps to at most 2 lines, card does not overlap CTA. Emulate reduced motion in devtools: static map frame with red confirmed card, no animation.

- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat: hero with live detection replay, nav, alert card"`

---

### Task 7: Blind Spot section

**Files:**
- Create: `components/BlindSpot.tsx`

**Interfaces:**
- Consumes: `CAMERAS` (Task 4) for realistic camera IDs.
- Produces: `<BlindSpot />`.

Layout family: full-width camera-wall grid with an offset text block (used nowhere else). A wall of dark "feed" tiles; every 1.6s one random tile lights amber for a beat (CSS-free, interval + state; interval skipped under reduced motion). No invented statistics: the copy makes a qualitative claim only.

- [ ] **Step 1: Implement `components/BlindSpot.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { CAMERAS } from "@/lib/dfw/geometry";

const TILES = Array.from({ length: 48 }, (_, i) => {
  const cam = CAMERAS[i % CAMERAS.length];
  return `${cam.id.replace("CAM", "FEED")}-${String(i).padStart(2, "0")}`;
});

export default function BlindSpot() {
  const [lit, setLit] = useState(7);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setLit(Math.floor(Math.random() * TILES.length)), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative px-5 py-32 md:px-10 md:py-44">
      <p className="text-xs uppercase tracking-[0.25em] text-signal">The blind spot</p>
      <div className="mt-6 grid gap-12 md:grid-cols-[1.2fr_1fr]">
        <h2 className="font-display max-w-xl text-3xl uppercase leading-tight md:text-5xl">
          Texas roads are covered in cameras. Almost nobody is watching them.
        </h2>
        <p className="self-end text-sm leading-relaxed text-fog-dim">
          Traffic cameras stream around the clock, but a human control room can only
          look at a handful of feeds at a time. Crashes sit undiscovered. Stalled cars
          block lanes for miles of backup. Coasta watches every feed at once.
        </p>
      </div>
      <div className="mt-16 grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
        {TILES.map((id, i) => (
          <div
            key={id}
            className={`aspect-video border p-1.5 text-[9px] transition-colors duration-700 [transition-timing-function:var(--ease-signal)] ${
              i === lit
                ? "border-signal/60 bg-signal/10 text-signal"
                : "border-white/5 bg-surface text-fog-dim/40"
            }`}
          >
            {id}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add below `<Hero />` in `app/page.tsx`, visual check.** Run: `npm run dev`. Expected: asymmetric two-column intro (stacks below 768px), 48-tile wall with a single tile pulsing amber every 1.6s. Reduced motion: one tile statically lit.

- [ ] **Step 3: Commit.** `git add -A && git commit -m "feat: blind spot section with camera wall"`

---

### Task 8: Pipeline scroll-scrub section ("How it sees")

**Files:**
- Create: `components/Pipeline.tsx`, `public/cam-frame.jpg`

**Interfaces:**
- Consumes: `motion` package (`useScroll`, `useTransform`, `motion.div`).
- Produces: `<Pipeline />`. Sticky viewport inside a 300vh scroll container; scroll progress scrubs four stages: (1) raw camera frame, (2) detection box draws on, (3) classification and confidence readout, (4) alert card slides in.

- [ ] **Step 1: Produce `public/cam-frame.jpg`.** Preferred: generate a nighttime highway traffic-camera still (elevated fixed-camera angle, headlight streaks, slight motion blur, no readable plates or faces) with an available image-generation tool. Fallback if no image tool is available in the session:

Run: `curl -L -o public/cam-frame.jpg "https://picsum.photos/seed/dfw-highway-cam/1600/900"`

Either way the component treats the image with a steel-blue tint, scanlines, and a mono overlay so any photo reads as camera footage.

- [ ] **Step 2: Implement `components/Pipeline.tsx`**

```tsx
"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

export default function Pipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const boxOpacity = useTransform(scrollYProgress, [0.18, 0.3], [0, 1]);
  const labelOpacity = useTransform(scrollYProgress, [0.38, 0.5], [0, 1]);
  const conf = useTransform(scrollYProgress, [0.38, 0.62], [42, 96]);
  const confText = useTransform(conf, (v) => `${Math.round(v)}%`);
  const cardX = useTransform(scrollYProgress, [0.68, 0.82], ["120%", "0%"]);
  const cardOpacity = useTransform(scrollYProgress, [0.68, 0.8], [0, 1]);

  return (
    <section ref={ref} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-[100dvh] flex-col justify-center px-5 md:px-10">
        <p className="text-xs uppercase tracking-[0.25em] text-signal">How it sees</p>
        <div className="relative mt-6 max-w-4xl overflow-hidden rounded-xl border border-white/10">
          <img src="/cam-frame.jpg" alt="Simulated highway camera frame" className="w-full opacity-70 [filter:saturate(0.4)_hue-rotate(190deg)]" />
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_3px,rgba(0,0,0,0.25)_3px_4px)]" />
          <div className="absolute left-3 top-3 flex gap-2 text-[10px] text-fog-dim">
            <span>CAM-114 / US-75 at I-635</span>
            <span className="border border-white/20 px-1">SIM</span>
          </div>

          <motion.div
            style={reduced ? { opacity: 1 } : { opacity: boxOpacity }}
            className="absolute left-[18%] top-[42%] h-[26%] w-[22%] border-2 border-signal
              [clip-path:polygon(0_0,30%_0,30%_12%,70%_12%,70%_0,100%_0,100%_30%,88%_30%,88%_70%,100%_70%,100%_100%,70%_100%,70%_88%,30%_88%,30%_100%,0_100%,0_70%,12%_70%,12%_30%,0_30%)]"
          />
          <motion.div
            style={reduced ? { opacity: 1 } : { opacity: labelOpacity }}
            className="absolute left-[18%] top-[32%] bg-asphalt/85 px-2 py-1 text-[11px] text-signal"
          >
            POLICE VEHICLE <motion.span className="tabular-nums">{reduced ? "96%" : confText}</motion.span>
          </motion.div>

          <motion.div
            style={reduced ? { opacity: 1, x: 0 } : { x: cardX, opacity: cardOpacity }}
            className="absolute bottom-4 right-4 border border-alert/50 bg-asphalt/90 p-3 text-xs"
          >
            <span className="text-alert">ALERT CONFIRMED</span>
            <span className="ml-2 text-fog-dim">pushed to nearby drivers</span>
          </motion.div>
        </div>
        <p className="mt-6 max-w-md text-sm text-fog-dim">
          Frame in. Objects found. Vehicle classified. Confidence scored. Only
          high-confidence events ever become alerts.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Add below `<BlindSpot />`, visual check.** Run: `npm run dev`. Expected: section pins for 3 viewport heights; scrolling draws the bracket box on the frame, then label with confidence counting 42% to 96%, then the red alert chip slides in from the right. Reduced motion: no pinning animation needed, all elements visible at full opacity. Mobile 375px: image full width, no horizontal scroll.

- [ ] **Step 4: Commit.** `git add -A && git commit -m "feat: scroll-scrubbed detection pipeline section"`

---

### Task 9: Phone preview section ("In your pocket")

**Files:**
- Create: `components/PhonePreview.tsx`

**Interfaces:**
- Consumes: `MapCanvas` (Task 5, `paused` static mode), `TIMELINE` (Task 3).
- Produces: `<PhonePreview />`.

Layout family: split text-left / device-right (the ONLY left-right split on the page). The phone is a real component: CSS device shell containing a static MapCanvas and an alert feed built from `TIMELINE` data, so app UI and site demo always agree.

- [ ] **Step 1: Implement `components/PhonePreview.tsx`**

```tsx
"use client";
import { useRef } from "react";
import MapCanvas from "./MapCanvas";
import { TIMELINE } from "@/lib/replay/timeline";

const KIND_COLOR = { police: "text-signal", crash: "text-alert", stall: "text-signal" } as const;

export default function PhonePreview() {
  const epochRef = useRef<number | null>(null);
  return (
    <section className="grid gap-16 px-5 py-32 md:grid-cols-2 md:items-center md:px-10 md:py-44">
      <div>
        <h2 className="font-display max-w-md text-3xl uppercase leading-tight md:text-5xl">
          The road, briefed to your pocket
        </h2>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-fog-dim">
          Open Coasta before you drive. Police sightings, crashes, and stalled
          vehicles on your route show up as alerts with distance and direction,
          sourced from cameras, not crowd reports.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          <li><span className="text-signal">01</span> Live hazard map of DFW</li>
          <li><span className="text-signal">02</span> Route monitoring with push alerts</li>
          <li><span className="text-signal">03</span> Camera-verified, confidence-scored</li>
        </ul>
      </div>
      <div className="justify-self-center md:-rotate-2">
        <div className="w-72 rounded-[2.5rem] border border-white/15 bg-surface p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-asphalt">
            <div className="flex items-center justify-between px-4 pt-4 text-[10px] text-fog-dim">
              <span>COASTA</span><span className="text-signal">DFW / demo</span>
            </div>
            <MapCanvas epochRef={epochRef} paused className="h-56 w-full" />
            <div className="space-y-2 px-3 pb-5">
              {TIMELINE.map((e) => (
                <div key={e.id} className="rounded-lg border border-white/10 bg-surface p-2.5 text-[11px]">
                  <span className={KIND_COLOR[e.kind]}>{e.label}</span>
                  <div className="mt-0.5 text-fog-dim">{e.road}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add below `<Pipeline />`, visual check.** Run: `npm run dev`. Expected: slightly rotated phone shell with concentric radii, static map inside, three feed rows matching hero incidents. Below 768px: stacks, rotation acceptable, no overflow.

- [ ] **Step 3: Commit.** `git add -A && git commit -m "feat: phone preview section"`

---

### Task 10: Catches ticker + Coverage sections

**Files:**
- Create: `components/Catches.tsx`, `components/Coverage.tsx`
- Modify: `app/globals.css` (marquee keyframes)

**Interfaces:**
- Consumes: `MapCanvas` (static) for Coverage.
- Produces: `<Catches />`, `<Coverage />`.

- [ ] **Step 1: Add marquee keyframes to `app/globals.css`**

```css
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.marquee-track {
  display: flex;
  width: max-content;
  animation: marquee 36s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
}
```

(`linear` is correct here: a conveyor-belt ticker, not a UI transition.)

- [ ] **Step 2: Implement `components/Catches.tsx`** (full-width ticker + staggered editorial list; NOT a card grid)

```tsx
const CATEGORIES = [
  { name: "Police vehicles", detail: "Marked units, light bars, department patterns", tone: "text-signal" },
  { name: "Crashes", detail: "Multi-vehicle patterns, lane blockage, debris fields", tone: "text-alert" },
  { name: "Stalled vehicles", detail: "Shoulder stops, hazard geometry, lane position", tone: "text-signal" },
  { name: "Road debris", detail: "Objects where objects should not be", tone: "text-signal" },
  { name: "Wrong-way drivers", detail: "Direction versus expected flow", tone: "text-alert" },
];

const TICKER = [
  "POLICE / US-75 N / SIM", "CRASH / I-30 E / SIM", "STALL / I-635 W / SIM",
  "DEBRIS / DNT S / SIM", "POLICE / I-35E N / SIM", "WRONG-WAY / I-20 W / SIM",
];

export default function Catches() {
  return (
    <section className="py-32 md:py-44">
      <div className="overflow-hidden border-y border-white/5 py-3 text-xs text-fog-dim">
        <div className="marquee-track gap-10">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="whitespace-nowrap">{t}</span>
          ))}
        </div>
      </div>
      <div className="px-5 pt-20 md:px-10">
        <h2 className="font-display text-3xl uppercase md:text-5xl">What it catches</h2>
        <ol className="mt-12 max-w-3xl">
          {CATEGORIES.map((c, i) => (
            <li
              key={c.name}
              className="grid grid-cols-[3rem_1fr] items-baseline gap-4 border-b border-white/5 py-6 md:grid-cols-[3rem_1fr_1.2fr]"
              style={{ marginLeft: `${Math.min(i * 4, 16)}%` }}
            >
              <span className="text-xs text-fog-dim">0{i + 1}</span>
              <span className={`font-display text-xl uppercase md:text-2xl ${c.tone}`}>{c.name}</span>
              <span className="col-start-2 text-sm text-fog-dim md:col-start-3">{c.detail}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Implement `components/Coverage.tsx`**

```tsx
"use client";
import { useRef } from "react";
import MapCanvas from "./MapCanvas";

const QUEUE = [
  { city: "Dallas / Fort Worth", status: "BUILDING NOW", live: true },
  { city: "Houston", status: "QUEUED", live: false },
  { city: "Austin", status: "QUEUED", live: false },
  { city: "San Antonio", status: "QUEUED", live: false },
];

export default function Coverage() {
  const epochRef = useRef<number | null>(null);
  return (
    <section className="grid gap-12 px-5 py-32 md:grid-cols-[1.4fr_1fr] md:px-10 md:py-44">
      <div className="relative min-h-72 overflow-hidden rounded-xl border border-white/5 bg-surface/50">
        <MapCanvas epochRef={epochRef} paused className="absolute inset-0 h-full w-full" />
        <span className="absolute left-4 top-4 text-[10px] uppercase text-fog-dim">DFW metroplex</span>
      </div>
      <div className="self-center">
        <h2 className="font-display text-3xl uppercase leading-tight md:text-5xl">DFW first. Then your city.</h2>
        <ul className="mt-10 space-y-4 text-sm">
          {QUEUE.map((q) => (
            <li key={q.city} className="flex items-center justify-between border-b border-white/5 pb-3">
              <span>{q.city}</span>
              <span className={q.live ? "text-signal" : "text-fog-dim"}>{q.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add both to the page, visual check.** Run: `npm run dev`. Expected: ticker scrolls continuously (frozen under reduced motion); category list stair-steps right with amber/red tones by severity; coverage map framed with the city queue beside it. All grids stack below 768px.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: catches ticker and coverage sections"`

---

### Task 11: Waitlist API + database

**Files:**
- Create: `app/api/waitlist/route.ts`, `scripts/migrate.mjs`, `.env.local` (untracked; `.env*` already gitignored)

**Interfaces:**
- Consumes: `parseWaitlist` (Task 2), `DATABASE_URL` env var (Neon connection string; obtain from the user or Vercel/Neon integration; do not invent one).
- Produces: `POST /api/waitlist` accepting JSON `{ email, zip?, company? }`. `company` is the honeypot: if non-empty, return fake success without inserting. Responses: `200 {ok:true}`, `400 {ok:false,error}`, `429 {ok:false,error:"rate_limited"}`, `500 {ok:false,error:"server_error"}`. Consumed by Task 12's form.

- [ ] **Step 1: Write `scripts/migrate.mjs`**

```js
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set"); process.exit(1); }
const sql = neon(url);
await sql`
  CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    zip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
console.log("waitlist table ready");
```

- [ ] **Step 2: Implement `app/api/waitlist/route.ts`**

```ts
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
```

- [ ] **Step 3: Provision and verify.** Ask the user for (or create via Vercel/Neon integration) a `DATABASE_URL`; write it to `.env.local`. Run: `npm run migrate`. Expected: `waitlist table ready`. Then with dev server running:

```bash
curl -s -X POST http://localhost:3000/api/waitlist -H "content-type: application/json" -d '{"email":"test@coasta.dev","zip":"75201"}'
```

Expected: `{"ok":true}`. Repeat with `-d '{"email":"bad"}'` expecting `{"ok":false,"error":"invalid_email"}` and `-d '{"email":"x@y.co","company":"spam"}'` expecting `{"ok":true}` with no new row (verify: `SELECT count(*)` stays unchanged via a quick node -e check or Neon console). If no DATABASE_URL is obtainable this session, note it, verify the 400 paths only, and flag the migration as a launch blocker in the final report.

- [ ] **Step 4: Commit.** `git add -A && git commit -m "feat: waitlist API with honeypot and rate limiting"` (confirm `.env.local` is NOT in the commit).

---

### Task 12: Waitlist section + footer

**Files:**
- Create: `components/Waitlist.tsx`, `components/Footer.tsx`

**Interfaces:**
- Consumes: `POST /api/waitlist` (Task 11), `isValidEmail` (Task 2).
- Produces: `<Waitlist />` (has `id="waitlist"`, the anchor every CTA targets), `<Footer />`.

- [ ] **Step 1: Implement `components/Waitlist.tsx`**

```tsx
"use client";
import { useState } from "react";
import { isValidEmail } from "@/lib/validate";

type Status = "idle" | "sending" | "done" | "error";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("That email does not look right.");
      return;
    }
    setStatus("sending");
    const company = (new FormData(e.currentTarget).get("company") as string) ?? "";
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, zip, company }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("done");
      } else {
        setStatus("error");
        setMessage(data.error === "rate_limited" ? "Too many tries. Wait a minute." : "That did not go through. Check the fields.");
      }
    } catch {
      setStatus("error");
      setMessage("Network hiccup. Try again.");
    }
  }

  return (
    <section id="waitlist" className="px-5 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.25em] text-signal">Early access</p>
        <h2 className="font-display mt-6 text-4xl uppercase leading-tight md:text-7xl">
          Drive DFW with eyes everywhere
        </h2>
        {status === "done" ? (
          <div className="mt-10 border border-signal/40 bg-signal/5 p-6">
            <span className="text-signal">You are on the list.</span>
            <p className="mt-2 text-sm text-fog-dim">We will email you when Coasta goes live in DFW.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" aria-label="Email address"
                className="flex-1 border border-white/15 bg-surface px-5 py-4 text-sm outline-none transition-colors duration-300 [transition-timing-function:var(--ease-signal)] placeholder:text-fog-dim/50 focus:border-signal"
              />
              <input
                type="text" inputMode="numeric" value={zip} onChange={(e) => setZip(e.target.value)}
                placeholder="ZIP (optional)" aria-label="ZIP code, optional" maxLength={5}
                className="border border-white/15 bg-surface px-5 py-4 text-sm outline-none transition-colors duration-300 [transition-timing-function:var(--ease-signal)] placeholder:text-fog-dim/50 focus:border-signal sm:w-40"
              />
              <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <button
                type="submit" disabled={status === "sending"}
                className="bg-signal px-8 py-4 text-sm font-medium uppercase text-asphalt transition-transform duration-300 [transition-timing-function:var(--ease-signal)] hover:-translate-y-0.5 disabled:opacity-60"
              >
                {status === "sending" ? "Joining..." : "Join waitlist"}
              </button>
            </div>
            {status === "error" && <p className="mt-3 text-sm text-alert">{message}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Implement `components/Footer.tsx`**

```tsx
export default function Footer() {
  return (
    <footer className="border-t border-white/5 px-5 py-10 md:px-10">
      <div className="flex flex-col items-start justify-between gap-4 text-xs text-fog-dim sm:flex-row sm:items-center">
        <span className="font-display text-sm uppercase text-fog">
          C<span className="text-signal">O</span>ASTA
        </span>
        <span>All detections shown on this page are simulated demonstrations.</span>
        <span>&copy; 2026 Coasta</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Add to page, verify the form.** Run: `npm run dev`. Submit a valid email: success panel appears (or a clear error if no DATABASE_URL yet, which is acceptable at this task). Submit garbage: inline error, no navigation. Keyboard-only pass: tab order reaches email, zip, button; honeypot is skipped.

- [ ] **Step 4: Commit.** `git add -A && git commit -m "feat: waitlist form and footer"`

---

### Task 13: Final assembly, SEO, polish pass

**Files:**
- Modify: `app/page.tsx`, `app/layout.tsx`

**Interfaces:**
- Consumes: every component from Tasks 6 through 12.

- [ ] **Step 1: Assemble `app/page.tsx`**

```tsx
import Hero from "@/components/Hero";
import BlindSpot from "@/components/BlindSpot";
import Pipeline from "@/components/Pipeline";
import PhonePreview from "@/components/PhonePreview";
import Catches from "@/components/Catches";
import Coverage from "@/components/Coverage";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <main>
      <Hero />
      <div className="lane-divider" />
      <BlindSpot />
      <Pipeline />
      <div className="lane-divider" />
      <PhonePreview />
      <Catches />
      <div className="lane-divider" />
      <Coverage />
      <Waitlist />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Extend metadata in `app/layout.tsx`** (add inside the existing `metadata` object)

```ts
metadataBase: new URL("https://coasta.app"),
openGraph: {
  title: "Coasta | See the road before you reach it",
  description: "AI reads DFW traffic cameras and warns you about police, crashes, and hazards. Join the waitlist.",
  type: "website",
},
```

(Swap `coasta.app` for the real domain when the user provides it; if unknown at execution time, ask once and use the answer.)

- [ ] **Step 3: Pre-flight checks (all must pass)**

```bash
npm test                       # all unit tests green
npm run build                  # production build succeeds
grep -rnP "[\x{2014}\x{2013}]" app components lib   # em/en dash scan: MUST return nothing
```

Manual sweep with the dev server:
- Read every visible string aloud for grammar and AI tells.
- Count uppercase-tracking eyebrows: must be at most 2 ("The blind spot", "How it sees", "Early access" is 3; demote one, e.g. render "Early access" without tracking/uppercase).
- Devtools reduced-motion emulation: hero static with confirmed card, pipeline fully visible, ticker frozen, no rAF-driven canvas loop running in Hero.
- 375px viewport: no horizontal scrollbar anywhere; headline 2 lines max; nav one line.
- Lighthouse (mobile, production build via `npm run start`): LCP under 2.5s, CLS under 0.1. If LCP fails, the usual fix is `priority` on the Pipeline image and reducing initial canvas work.

- [ ] **Step 4: Fix everything Step 3 surfaced, then commit.**

```bash
git add -A
git commit -m "feat: assemble Night Watch page with SEO and polish pass"
```

- [ ] **Step 5 (optional, if user confirms): preview deploy.** `npx vercel` for a preview URL. Do NOT deploy to production; the site publishes when the backend is complete.

---

## Self-Review Notes

- Spec coverage: identity tokens (Task 1), seven beats (Tasks 6-12 map 1:1: hero, blind spot, pipeline, pocket, catches, coverage, waitlist), canvas DFW replay (Tasks 3-5), stack and waitlist mechanics (Tasks 1, 11), reduced motion + mobile budget (every UI task's check + Task 13), success criteria (Task 13 Step 3).
- Known deviation: spec's font preference order kept (Archivo first); Anton/Bricolage fallbacks are NOT scaffolded, YAGNI.
- Eyebrow count is flagged as a Task 13 check because Tasks 7, 8, 12 each introduce one; the third gets demoted at assembly.
- Task 11 degrades gracefully if no DATABASE_URL exists this session; migration is then a launch blocker, reported, not silently skipped.
