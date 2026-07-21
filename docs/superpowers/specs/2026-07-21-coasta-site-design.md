# Coasta Marketing Site — "Night Watch" Design

**Date:** 2026-07-21
**Status:** Approved by Josh (brainstorming session)
**Scope:** Public consumer-facing marketing website for Coasta, launched when the backend is complete.

## Context

Coasta is an AI roadway-intelligence platform that turns existing traffic cameras into
autonomous sensors (police, crash, and hazard detection). The company is in heavy
development. This site is **not** the product: it is a single-page consumer waitlist site
whose job is to make a driver believe the intelligence is real within ~15 seconds and
leave their email.

Decisions locked during brainstorming:

| Decision | Choice |
|---|---|
| Primary audience | Consumers (app waitlist) |
| Conversion mechanic | Email waitlist; site publishes when backend is complete |
| Brand assets | None exist — full identity designed from scratch |
| Launch region | DFW metroplex (TxDOT camera network) |
| Site scope | Single scrolling page |
| Design direction | **Night Watch** — dark mission-control aesthetic |

Explicitly out of scope: enterprise dashboard, API docs, real camera feeds, app-store
badges, multi-page marketing content, blog. Real product functionality lives behind a
future `app.coasta.com`; the website demonstrates via **scripted, simulated product
moments** (fast, reliable, legally safe — no real incident footage on a public page).

## 1. Brand identity

- **Wordmark:** COASTA in a wide industrial grotesque; the **O is drawn as a camera
  aperture / detection reticle**. Favicon and future app icon derive from the O.
- **Palette (semantic, dark-native):**
  - Base: near-black asphalt (`#0A0C0F` range)
  - **Signal amber** — primary accent; detections in progress (lane-paint yellow)
  - **Alert red** — reserved exclusively for confirmed incidents
  - Dim steel-blue — road geometry / infrastructure
  - Off-white — type
  - Color discipline is the brand: amber = detecting, red = confirmed, blue =
    infrastructure. Never decorative.
- **Type system:** expanded/industrial display face for headlines (wide, all-caps
  moments) + a monospace for every number, timestamp, camera ID, and confidence score.
  Monospace data readouts are the site's texture.
  Display candidates (pick one at build, in this order of preference): Archivo
  Expanded, Anton, Bricolage Grotesque. Mono candidates: IBM Plex Mono, Geist Mono.
  Explicitly banned: Inter-as-display, Space Grotesk (AI-default look).
- **Motifs:** bounding-box corner brackets as hover states; dashed lane-lines as section
  dividers; radar-sweep pulses on camera nodes; confidence bars as progress/loading
  indicators.

## 2. Page architecture — single scroll, seven beats

1. **Hero** — full-bleed stylized DFW highway map running the scripted detection replay
   (section 3). Headline + waitlist field float over it.
   Working headline: "Every camera. Now a sensor." / "See the road before you reach it."
2. **The blind spot** — the problem as a stat strip: "1,000+ TxDOT cameras in DFW.
   Almost nobody watching." Visual: a wall of tiny dark camera-feed tiles; one lights up.
3. **How it sees** — compact scroll-scrubbed AI pipeline: highway-cam frame → detection
   box draws on → classification label → confidence climbs → alert card. (The
   "Through the Lens" set-piece, demoted from hero to act three.)
4. **In your pocket** — phone mockup of the consumer app: "Police reported 0.3 mi
   ahead," route monitoring, alert feed.
5. **What it catches** — detection-category grid (police, crashes, stalled vehicles,
   debris, wrong-way drivers) styled as a live event ticker.
6. **DFW first** — coverage map + expansion tease; "your city is next" hook.
7. **Waitlist** — single large email field with DFW-early-access framing. Every CTA on
   the page scrolls here.

## 3. Hero centerpiece — scripted DFW detection replay

- **Not real map tiles.** A custom canvas rendering of the DFW highway network built
  from real highway GeoJSON (I-35E, I-635/LBJ, US-75, I-30, the High Five interchange).
  Real geometry = locals recognize it; custom rendering = full art direction, zero tile
  licensing, small payload.
- **Replay engine:** a JSON timeline of scripted events drives a loop —
  camera nodes breathe → one pulses → detection fires → confidence counts 42%→96% →
  alert card materializes → event pings a mini phone mock in the corner → loop with a
  different incident type.
- Pannable/hoverable, but the show runs itself. Deterministic: always the best 60
  seconds Coasta ever had.
- All demo data is clearly simulated; no real feeds, no real incidents.

## 4. Stack & waitlist mechanics

- **Next.js + Tailwind + Framer Motion, deployed on Vercel.** Map on raw canvas.
- **Waitlist:** one API route writing `{email, timestamp, zip?}` to Postgres (Neon).
  Rate-limited, honeypot spam field, basic email validation. Deliberately pluggable so
  the team's real backend can absorb it later.
- **Accessibility/perf:**
  - Full `prefers-reduced-motion` fallback — static hero frame with the alert card
    already present.
  - Map replay performance-budgeted for mid-range phones (consumer traffic is mostly
    mobile).
  - Semantic HTML, keyboard-reachable waitlist form.
- **Testing:** form validation unit tests; replay engine timeline unit tests
  (deterministic by design); Lighthouse pass on mobile before launch.

## 5. Project home

- Repo: `C:\Users\josha\OneDrive\Projects\coasta-site` (new, git-initialized).
- This spec: `docs/superpowers/specs/2026-07-21-coasta-site-design.md`.

## Success criteria

- A first-time visitor on a phone understands "AI watches traffic cameras and warns
  drivers" within one screen and can join the waitlist in one field.
- Hero replay runs smoothly (60fps target, no jank) on a mid-range Android device.
- The site never claims live functionality it doesn't have — all demo moments are
  scripted simulations.
