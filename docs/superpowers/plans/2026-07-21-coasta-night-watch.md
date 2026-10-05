# Coasta "Night Watch" Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) and check off increments as you go.

**Goal:** Build the single-page Coasta consumer waitlist site: a dark mission-control page whose hero is a scripted DFW detection replay on canvas, ending in an email waitlist backed by Neon Postgres.

**Architecture:** Next.js App Router site with all interactive state derived from a pure, unit-tested replay engine (`lib/replay`). The hero map is a custom canvas renderer over hand-simplified DFW freeway geometry. The waitlist API persists only a normalized email and optional zip.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, `motion` (Framer Motion successor) for scroll choreography, raw `<canvas>` for the map, Vitest for unit tests, `@neondatabase/serverless` for data storage.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-21-coasta-site-design.md`. House style: `~/.claude/skills/house-style/SKILL.md` (dials: VARIANCE 9, MOTION 8, DENSITY 4).
- **Palette (semantic, exact):** base `#0A0C0F`, surface `#11141A`, signal amber `#FFB000` (detections in progress, the page's single accent), alert red `#FF3B30` (confirmed incidents ONLY), steel `#4A6B8A`, fog `#E8EAED`, fog-dim `#8A919C`.
- **Fonts:** Archivo (variable, `wdth` axis, rendered expanded) for display; IBM Plex Mono for every number, timestamp, camera ID, confidence value. Inter, Roboto, Space Grotesk are banned.
- **Copy rules:** NO em dashes or en dashes in any user-visible string, zero exceptions. No invented statistics; every demo number carries a visible `SIM` tag. Headline max 2 lines; hero max 4 text lines. Use sentence case for body copy.
- **Layout rules:** each layout family appears at most once on the page. No three-equal-card rows. Max 2 uppercase-tracking eyebrows across the 7 sections. Use `min-h-[100dvh]`, never `h-screen`.
- **Motion rules:** `prefers-reduced-motion` support is mandatory everywhere (static hero frame with alert card already present). Never `window.addEventListener("scroll")`; use `motion`'s `useScroll`/`useTransform` as needed.
- **Commits:** commit after every task, message style `feat: ...` / `chore: ...`. NEVER add a Claude co-author trailer.
- All demo detections are fictional and scripted. The site must never claim live functionality.

## File Structure

```text
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
- Produces: CSS variables `--color-asphalt|surface|signal|alert|steel|fog|fog-dim`, font variables `--font-archivo`, `--font-plex-mono`, utility classes `.font-display`, `.grain`, `.lane-divider`.

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
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
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
- Produces: `isValidEmail(s: string): boolean`, `isValidZip(s: string): boolean`, `parseWaitlist(body: unknown): { ok: true; email: string; zip: string | null } | { ok: false; error: string }`.

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

Coordinates are hand-simplified approximations of real DFW freeway geometry (recognizable shape, not navigation data): I-35E, US-75, I-635 LBJ arc, I-30, I-20, and the Dallas North Tollway. The highways are intentionally stylized rather than geographically exact.

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
- Produces: `<MapCanvas epochRef={React.RefObject<number | null>} paused={boolean} className?={string} />`.

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
    const ring = ((tMs % 1400) / 1400) * 26;
    ctx.beginPath();
    ctx.arc(x, y, 6 + ring, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1 - ring / 26;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
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
Expected: glowing steel freeway network in a recognizable DFW arrangement (LBJ arc crossing US-75, I-30 east-west), cameras breathing, an amber ring firing at the High Five, turning red on confirmation.

- [ ] **Step 3: Commit.** `git add -A && git commit -m "feat: canvas DFW map renderer with detection replay"`

---

### Task 6: Hero (nav, headline, AlertCard, replay wiring)

**Files:**
- Create: `components/Nav.tsx`, `components/AlertCard.tsx`, `components/Hero.tsx`

**Interfaces:**
- Consumes: `MapCanvas` (Task 5), `getReplayState`/`TIMELINE` (Task 3).
- Produces: `<Hero />` (self-contained, includes `<Nav />`). `<AlertCard state={ReplayState} />` is reused by no one else; PhonePreview (Task 9) has its own mini feed.

Hero layout (VARIANCE 9): full-bleed map behind everything; headline block pinned to the BOTTOM-LEFT, not centered; AlertCard floats top-right; nav is a hairline bar. Hero text elements: headline and subhead are more compressed than standard body copy.

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

{% raw %}
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
{% endraw %}

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
      setState(getReplayState(TIMELINE, 12000));
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

- [ ] **Step 5: Visual check.** Run: `npm run dev`. Expected: full-bleed animated map; bottom-left two-line headline; alert card appearing top-right synced with the map marker (amber DETECTING without sliding or lag).

- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat: hero with live detection replay, nav, alert card"`

---

### Task 7: Blind Spot section

**Files:**
- Create: `components/BlindSpot.tsx`

**Interfaces:**
- Consumes: `CAMERAS` (Task 4) for realistic camera IDs.
- Produces: `<BlindSpot />`.

Layout family: full-width camera-wall grid with an offset text block (used nowhere else). A wall of dark "feed" tiles; every 1.6s one random tile lights amber for a beat (CSS-free, interval + state update only).

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

- [ ] **Step 2: Add below `<Hero />` in `app/page.tsx`, visual check.** Run: `npm run dev`. Expected: asymmetric two-column intro (stacks below 768px), 48-tile wall with a single tile pulsing amber every 1.6s.

- [ ] **Step 3: Commit.** `git add -A && git commit -m "feat: blind spot section with camera wall"`

---

### Task 8: Pipeline scroll-scrub section ("How it sees")

**Files:**
- Create: `components/Pipeline.tsx`, `public/cam-frame.jpg`

**Interfaces:**
- Consumes: `motion` package (`useScroll`, `useTransform`, `motion.div`).
- Produces: `<Pipeline />`. Sticky viewport inside a 300vh scroll container; scroll progress scrubs four stages: (1) raw camera frame, (2) detection box draws on, (3) classification and confidence overlay, (4) map returns to full road context.

- [ ] **Step 1: Produce `public/cam-frame.jpg`.** Preferred: generate a nighttime highway traffic-camera still (elevated fixed-camera angle, headlight streaks, slight motion blur, no readable plate data).

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
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.7, 1], [0.2, 1, 1, 0.2]);
  const focus = useTransform(scrollYProgress, [0, 0.2, 0.45, 0.75, 1], ["0%", "8%", "18%", "35%", "12%"]);
  const frameScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.08, 1.02]);

  if (reduced) {
    return (
      <section className="px-5 py-24 md:px-10 md:py-32">
        <div className="rounded-2xl border border-white/10 bg-surface p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-signal">How it sees</p>
          <h2 className="mt-4 font-display text-3xl uppercase md:text-5xl">A camera feed turns into a detection.</h2>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[300vh] px-5 py-16 md:px-10 md:py-24">
      <div className="sticky top-0 h-[100dvh] overflow-hidden rounded-none border-y border-white/10 bg-[#0a0c0f]">
        <motion.div style={{ opacity }} className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,176,0,0.18),_transparent_55%)]" />
        <motion.div style={{ scale: frameScale, x: focus }} className="absolute inset-0">
          <img src="/cam-frame.jpg" alt="" className="h-full w-full object-cover opacity-80 grayscale" />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,15,0.1),rgba(10,12,15,0.8))]" />
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <motion.div style={{ opacity: useTransform(scrollYProgress, [0, 0.25, 0.6, 1], [0, 1, 1, 0]) }} className="relative h-[70%] w-[85%] rounded-2xl border border-white/10 bg-black/20 backdrop-blur-[2px]">
            <div className="absolute inset-3 rounded-xl border border-signal/60" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,176,0,0.1)_20%,transparent_40%)]" />
            <div className="absolute left-[28%] top-[30%] h-20 w-28 rounded border border-signal bg-signal/10" />
            <div className="absolute left-[30%] top-[32%] h-16 w-24 border border-signal/70" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit.** `git add -A && git commit -m "feat: pipeline scroll-scrub section"`

---

### Task 9: PhonePreview and waitlist UI

**Files:**
- Create: `components/PhonePreview.tsx`, `components/Waitlist.tsx`

**Interfaces:**
- Consumes: `parseWaitlist`, `TIMELINE`, `getReplayState` (Task 3), `CAMERAS` (Task 4).
- Produces: a mobile mockup feed and a waitlist section with validation and success states.

- [ ] **Step 1: Implement `components/PhonePreview.tsx`**

```tsx
"use client";
import { TIMELINE } from "@/lib/replay/timeline";
import { getReplayState } from "@/lib/replay/engine";

export default function PhonePreview() {
  const state = getReplayState(TIMELINE, 12000);
  const { event } = state;
  return (
    <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-white/10 bg-surface p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
      <div className="rounded-[1.6rem] border border-white/10 bg-[#0a0c0f] p-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-fog-dim">
          <span>DFW</span>
          <span>SIM</span>
        </div>
        <div className="mt-6 text-xs text-fog-dim">watchlist</div>
        <div className="mt-2 font-display text-2xl uppercase text-signal">{event?.camId ?? "CAM-114"}</div>
        <div className="mt-5 rounded border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-fog-dim">alert</div>
          <div className="mt-2 text-sm text-fog">{event?.label ?? "Police vehicle"}</div>
          <div className="mt-1 text-[11px] text-fog-dim">{event?.road ?? "US-75 at I-635"}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `components/Waitlist.tsx`**

```tsx
"use client";
import { useState } from "react";
import { parseWaitlist } from "@/lib/validate";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = parseWaitlist({ email, zip });
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    setStatus("success");
    setMessage(`saved: ${result.email}`);
  }

  return (
    <section id="waitlist" className="px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-surface p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-signal">Waitlist</p>
        <h2 className="mt-4 font-display text-4xl uppercase md:text-5xl">Join the DFW rollout.</h2>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border border-white/10 bg-[#0a0c0f] px-4 py-3 text-fog outline-none" />
          <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP (optional)" className="w-full border border-white/10 bg-[#0a0c0f] px-4 py-3 text-fog outline-none" />
          <button type="submit" className="w-full bg-signal px-5 py-3 text-sm font-medium uppercase text-asphalt">Join the list</button>
        </form>
        {status !== "idle" && <p className="mt-4 text-sm text-fog-dim">{message}</p>}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit.** `git add -A && git commit -m "feat: mobile preview and waitlist form"`

---

### Task 10: Coverage and catches sections

**Files:**
- Create: `components/Catches.tsx`, `components/Coverage.tsx`

**Interfaces:**
- Produces: trust-building content and horizontal card lists, using the same design language as the hero.

- [ ] **Step 1: Implement both components**

- [ ] **Step 2: Add them to `app/page.tsx`**

- [ ] **Step 3: Commit.** `git add -A && git commit -m "feat: coverage and catch sections"`

---

### Task 11: Footer and final polish

**Files:**
- Create: `components/Footer.tsx`

**Interfaces:**
- Produces: final footer and final polish pass.

- [ ] **Step 1: Implement `components/Footer.tsx`**

- [ ] **Step 2: Run `npm test` and `npm run build`**

- [ ] **Step 3: Commit.** `git add -A && git commit -m "chore: final polish and build verification"`

---

### Task 12: API route (`app/api/waitlist/route.ts`)

**Files:**
- Create: `app/api/waitlist/route.ts`, `scripts/migrate.mjs`

**Interfaces:**
- Produces: `POST` endpoint validating body and writing to Neon if `DATABASE_URL` exists.

- [ ] **Step 1: Implement route and migration**

- [ ] **Step 2: Run `npm run build`**

- [ ] **Step 3: Commit.** `git add -A && git commit -m "feat: waitlist API and migration"`

---

### Task 13: Full page assembly and final pass

**Files:**
- Update: `app/page.tsx`

**Interfaces:**
- Produces: final single-page assembly of all sections with consistent spacing and typography.

- [ ] **Step 1: Assemble all sections**

- [ ] **Step 2: Visual QA**

- [ ] **Step 3: Commit.** `git add -A && git commit -m "feat: final single-page Coasta landing experience"`

---

This plan is the implementation blueprint for the Coasta Night Watch marketing site. The root problem from the failing Pages build is the Liquid parser being tripped by the JSX snippet in the AlertCard example, so the fix is to wrap the affected code fence in a `raw` block so Jekyll leaves it alone when generating the docs site.

The build should be re-run after the raw block is applied; the static Jekyll pipeline will then parse the markdown without treating `${}` / `{{ }}` sequences as Liquid variables.

In short: wrap the code block that contains `style={{ width: `${confidence}%` }}` with `{% raw %} ... {% endraw %}` literally, then push the change and trigger the Pages workflow again.
