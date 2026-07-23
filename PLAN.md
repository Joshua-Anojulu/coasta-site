# Plan: Hero map demo overhaul (real DFW geometry + neon glow render)
_Locked via grill — by Claude + Josh. Revised after Codex Rounds 1-2._

## Goal

Replace the hero MapCanvas's crude hand-drawn map (6 angular polylines, uniform thin
strokes, invisible camera nodes) with a recognizable, beautiful DFW freeway network:
real OpenStreetMap-derived geometry baked into the repo as static data, rendered in a
"neon glow network" style (layered-stroke glow hierarchy, faint dot grid, mono freeway
labels, faint water silhouettes, sparse ambient traffic dots), while preserving the
consumer-facing interfaces (`CAMERAS`, `BOUNDS`, `project`, MapCanvas props), the
Night Watch palette, reduced-motion behavior, 60fps animation, OSM licensing
obligations, and the Lighthouse budget (LCP <= 2.5s currently 2.11s, CLS <= 0.1).

## Approach

1. **One-time data extraction script `scripts/extract-geometry.mjs`** (dev-only, never
   in the app bundle, output committed so CI/build never touches the network):
   - Bbox **(32.55, -97.55, 33.05, -96.55)** — the full metroplex INCLUDING Fort
     Worth (I-35W, I-820, downtown FW), fixing the Dallas-only bounds mismatch with
     the site's DFW branding. Wide ~2:1 aspect suits the hero canvas.
   - Query Overpass for `highway=motorway|trunk` ways (links excluded), grouped by
     **canonicalized ref tokens** (normalize "I 35E"/"IH-35E"/"I-35E" etc.) into a
     fixed route whitelist. **REQUIRED set (non-droppable, test-asserted):** I-35E,
     I-35W, I-30, I-20, I-635, I-820, US-75, DNT. **Optional set (droppable only as
     the last size lever):** US-175, SH-183, SH-114, Loop-12, PGBT. Ways matching
     neither are dropped. Class taxonomy: `cls: "interstate" | "us" | "state" |
     "loop" | "tollway"`. **Concurrency handling:** each physical segment is stored
     ONCE with an array of canonical route refs (`routes: ["I-20", "I-820"]`) —
     rendered/dotted/shipped once, but route membership stays complete for every
     required route (an I-20/I-820 shared way counts toward both corridors);
     completeness tests check membership, not just presence.
   - **Road clipping:** Overpass bbox selection returns whole intersecting ways, so
     every polyline is explicitly clipped to the bbox after download — segment-aware
     (a way exiting and re-entering the bbox splits into separate segments) — before
     simplification and invariant checks.
   - **Segmented, normalized model — no flattening, no duplication:**
     `ROAD_SEGMENTS: {id, routes: string[], cls, points: [lon, lat][]}[]` — each
     physical segment stored exactly once, owning its coordinates, carrying its
     route-membership array. `ROUTE_INDEX: Record<routeName, segmentId[]>` is NOT
     part of the shipped artifact: it is derived exclusively from
     `ROAD_SEGMENTS[].routes` at test time (single source of truth, no divergence
     possible) for membership/completeness checks. The renderer iterates
     `ROAD_SEGMENTS` once with `moveTo` per segment: no fictional connector lines,
     no traffic-dot jumps, no double-drawn concurrencies. Dual carriageways kept
     (parallel strokes naturally thicken the glow at hero scale).
   - Water: `WATER: {rings: [lon, lat][][]}` — **outer rings only, holes deliberately
     dropped** (fills render at ~8% alpha where holes are visually undetectable at
     hero scale; logged tradeoff). Sources: `natural=water` polygons AND water
     relations (lakes, `water=river` corridors) > 2 km^2, outer members assembled and
     deduplicated, clipped to bbox, aggressively simplified (<= ~10KB).
   - Douglas-Peucker simplification tuned so the whole generated module stays
     <= ~70KB raw; **hard gate at measurement time** (step 5). Size levers in order:
     coarser simplification tolerance (hard cap: max geodesic deviation from the
     raw geometry <= 120m - beyond that a freeway's shape visibly lies) ->
     coordinate quantization to 5 decimals -> drop optional-set routes. The
     REQUIRED route set is never dropped, and each required corridor must retain a
     minimum geographic span: the raw-vs-simplified comparison (>= 80% of the raw
     clipped corridor's bbox diagonal) is enforced INSIDE the extraction script
     before writing (it holds the raw data), and the script emits each corridor's
     measured span into `data/PROVENANCE.md`; CI tests then assert committed
     ABSOLUTE per-corridor span thresholds (recorded from those measurements) so
     `npm test` needs no raw geometry.
   - **Extraction logic is testable:** the transformation steps (ref
     canonicalization, relation ring assembly, bbox clipping, dedup, simplification,
     deterministic serialization) live as pure exported functions in the script
     module, covered by one small offline fixture test (`tests/extract.test.ts`)
     with a handcrafted mini Overpass response — no network in tests.
   - **Reproducible, injection-safe artifact:** the emitted schema is explicit and
     validated field-by-field — `ROAD_SEGMENTS[].{id, routes, cls, points}`,
     `WATER.rings`, `CAMERAS[].{id, lonlat}`, `BOUNDS` — exactly these enumerated
     fields and no others are emitted; no free-form OSM tag passes through;
     all values serialized exclusively via `JSON.stringify`; **one total sort
     order:** (primary route name, canonical OSM way ID, clipped-part index), with
     each segment's point orientation canonicalized (lexicographically smaller
     endpoint first); the Overpass query embeds a fixed `[date:"..."]` snapshot
     clause so re-extraction is reproducible, and a mirror that cannot serve that
     snapshot is a hard failure, never a silent substitute; file header records the
     exact query, endpoint, snapshot date, and a sha256 of the raw response. The
     script asserts all invariants in step 5's test list before writing; a failed
     assertion writes nothing. **Module split:** all transformation steps live as
     pure functions in `scripts/geometry-transform.mjs` (no network, no fs);
     `scripts/extract-geometry.mjs` is a thin CLI wrapper that is never imported by
     tests — `tests/extract.test.ts` imports only the pure module.
   - Regenerate `CAMERAS`: 12 nodes with stable `CAM-###` IDs snapped onto whitelist
     route points — 9 Dallas-side near current positions, 3 on Fort Worth freeways
     (metroplex coverage credibility). Recompute `BOUNDS` from data.
   - **Timeline/camera alignment:** each `TIMELINE` event's `lonlat` is set EXACTLY
     to its referenced camera's coordinate (the ring and the highlighted camera are
     the same point by construction); test asserts every `event.camId` exists in
     `CAMERAS` and coordinates are identical.
2. **`lib/dfw/geometry.ts`:** exports `ROAD_SEGMENTS`, `WATER`, `CAMERAS`,
   `BOUNDS`,
   `project`. Only the geometry CONSTANTS (`ROAD_SEGMENTS`, `WATER`, `CAMERAS`,
   `BOUNDS`) come from generated `lib/dfw/geometry-data.ts`; `project`
   is handwritten, manually maintained code in `geometry.ts` (the generator emits
   JSON-serialized data only, per its serializer contract). The old
   `HIGHWAYS` flat export is REMOVED — its only consumers are MapCanvas and
   geometry tests, both updated in this plan. Frozen interfaces: `CAMERAS`, `BOUNDS`,
   `project`, and MapCanvas's props (`epochRef`, `paused`, `className`, static frame
   at t=12000, redraw-on-resize). **Consumer impact inventory (complete):** Hero,
   PhonePreview, Coverage (MapCanvas paused mode) and **BlindSpot** (imports
   `CAMERAS` at module init for FEED tile labels — needs nonempty array, unique
   stable `CAM-###`-format IDs; covered by tests). `lib/replay/timeline.ts` event
   lonlats re-snapped onto real road coordinates.
3. **MapCanvas render overhaul** (`components/MapCanvas.tsx`), same props/contract:
   - **Two-canvas architecture:** truly static layers — dot grid, water fills (steel
     ~8% alpha), road glow passes (interstate: 3 layered strokes wide->narrow, low
     alpha; us/state/loop/tollway: 2 layers; **no shadowBlur** — layered strokes
     only), road core lines, mono labels — rasterized ONCE into an offscreen
     size-specific background canvas, re-rasterized only on resize and on
     font-ready. Per frame: blit background + **all 12 camera nodes drawn
     dynamically** (idle breathing preserved from the current renderer; active
     camera highlighted; fixed opacity when paused) + ambient traffic dots +
     detection ring/brackets (existing amber treatment). Paused mode blits the same
     background + static cameras + static detection frame, no dots.
   - **Aspect-correct projection with per-aspect focus windows:** `project` keeps
     its signature and always uses a single uniform scale (never independent
     lon/lat stretch), but selects its lon/lat viewport from the canvas aspect:
     canvases with aspect >= 1.5 (desktop Hero, desktop Coverage) show the full
     metroplex bbox with contain/letterbox; canvases below 1.5 (portrait Hero on
     mobile, PhonePreview's ~288x224 shell at aspect ~1.29, mobile Coverage) use a
     Dallas-centered focus window (~-97.05..-96.55) with cover-crop, so the map
     fills the frame instead of collapsing into a thin
     horizontal band. Acceptance: the drawn road envelope covers >= 60% of canvas
     area in every consumer; verified visually in all three.
   - Ambient traffic: ~40 dots precomputed as `(segmentId, arcOffset, speed,
     direction)` records resolved through `ROAD_SEGMENTS` only, distributed over
     interstate-class segments, advancing along per-segment
     arc-length (never crossing segment gaps); dim steel ~35% alpha, 1.5px;
     deterministic layout (seeded by index, no Math.random at module scope) so tests
     and renders are stable; skipped entirely when `paused`.
   - Labels: 5 canvas-drawn labels (US-75, I-635, I-30, I-35W, DNT) in IBM Plex Mono
     ~10px fog-dim at hand-picked anchors; suppressed below 480px canvas width.
     **Font readiness:** resolve the `next/font` family from computed style, await
     `document.fonts.ready`, then invalidate the background canvas for one redraw —
     fixes permanent-fallback-font on paused canvases.
   - Colors: existing STEEL/SIGNAL/ALERT + fog-dim constants, alpha layering only; a
     comment cross-references `globals.css` tokens.
4. **OSM licensing (ODbL):** add the standard visible credit to
   `components/Footer.tsx` — the literal standard string "© OpenStreetMap
   contributors" (the © glyph; the no-dash rule bans dashes, not ©) linking to
   openstreetmap.org/copyright — plus a committed `data/PROVENANCE.md` (query,
   endpoint, snapshot date, response hash, ODbL notice, transformation summary)
   that survives builds, unlike a comment in a bundled module. If/when the site
   ships publicly, publish the derived geometry + provenance at a stable public URL
   if ODbL's share-alike is triggered for the derived database. To make that gate
   durable, this task also creates a committed `docs/LAUNCH-CHECKLIST.md`
   consolidating the existing pre-launch items (DATABASE_URL/migration, cam-frame
   photo, API hardening, og:image) plus the ODbL publication decision as a blocking
   deployment item. (No em/en dashes anywhere in the copy.)
5. **Verification:**
   - Unit tests (replacing the current geometry value tests, keeping the rest):
     the full REQUIRED route set present (I-35E, I-35W, I-30, I-20, I-635, I-820,
     US-75, DNT - hard assertion, not just the original six's successors); every
     segment has >= 2 points; all points inside BOUNDS; water rings closed
     (first == last) and >= 4 points; 12 cameras, unique, `CAM-\d{3}` format, each
     within ~300m of a whitelisted route point; every TIMELINE `camId` exists in
     CAMERAS and event lonlat EQUALS that camera's coordinate; no physical segment
     shipped twice (dedup check on segment coordinates); ambient-dot precomputation
     deterministic (same input -> same layout); `loopDuration`/replay tests
     untouched; **projection tests** at the four real consumer dimensions (portrait
     Hero 390x844, PhonePreview 288x224, mobile Coverage, desktop Coverage)
     asserting focus-window selection, uniform scale, and >= 60% envelope coverage;
     each required corridor's span >= its committed absolute threshold (recorded
     in PROVENANCE.md at extraction time; raw-vs-simplified 80% rule enforced
     in-script); plus
     the offline extraction fixture suite (`tests/extract.test.ts`: ref
     canonicalization, ring assembly, bbox clipping/splitting, dedup, deterministic
     serialization, max-deviation cap).
   - `npm test` green, `npm run build` clean, em-dash scan clean.
   - **Bundle gate:** compare `next build` First Load JS for `/` before/after; the
     geometry data module must add <= 25KB gzipped, else re-run extraction through
     the ordered size levers (coarser tolerance -> 5-decimal quantization ->
     optional-route drop). REQUIRED routes are never dropped by any lever.
   - **Perf protocol (mobile, per spec):** Chrome DevTools mobile emulation 390x844
     DPR 2 with 4x CPU throttle, 3s warm-up then 15s sample; p95 frame cost <= 14ms
     and < 5% dropped frames (no physical Android available — emulated throttle is
     the stand-in, noted as such); Lighthouse mobile on production build, median of
     3 runs, LCP <= 2.5s, CLS <= 0.1.
   - Visual pass in a visible browser: desktop + <= 768px; glow legible, labels not
     colliding, dots moving between events, reduced-motion static frame correct
     (fonts loaded), Fort Worth side populated, camera breathing/highlight intact,
     no aspect distortion in Hero/PhonePreview/Coverage, island-bearing lakes look
     acceptable with outer-ring-only fills.
6. **Commit sequence:** (a) `feat: real DFW freeway geometry data and extraction
   script` (script + generated data + geometry.ts + timeline/tests + footer
   attribution), (b) `feat: neon glow map render with ambient traffic` (MapCanvas +
   any test additions). No Claude co-author trailers (hard rule).

## Key decisions & tradeoffs

- **Real OSM data over hand-drawn density:** recognizability is the point; accepts a
  one-time network-dependent dev script + bounded (<= 25KB gzip) bundle growth with a
  measured gate rather than an assumption.
- **Full-metroplex bbox including Fort Worth:** fixes the DFW-branding mismatch at
  the cost of ~2x geographic area; size stays bounded by the ordered levers
  (tolerance -> quantization -> optional-route drop); REQUIRED routes are never
  dropped and their absence fails the build's tests.
- **Segmented ROAD_SEGMENTS over flat polylines:** eliminates fictional connector lines and
  dot jumps; `HIGHWAYS` removed instead of adapter-preserved because its only two
  consumers are updated in-plan (less dead API surface).
- **Water outer-rings-only:** topological holes are invisible at 8% alpha hero
  scale; a full multipolygon+evenodd implementation is complexity without pixels.
- **Layered strokes + background-canvas rasterization over shadowBlur/Path2D-only:**
  glow cost paid once per resize, per-frame work is blit + dots + ring.
- **Emulated mobile perf protocol:** spec targets a mid-range phone; no physical
  device is available, so a defined, repeatable 4x-throttle emulation with p95/dropped
  -frame thresholds replaces an undefined "mid laptop" check.
- **Extraction validated three ways:** in-script assertions (fail = write nothing),
  invariant unit tests on the committed output, AND an offline fixture suite
  (`tests/extract.test.ts`) over the pure transformation module — the fixture suite
  is a required deliverable (Codex R1 position adopted in R2).

## Risks / open questions

- OSM ref-tag consistency across the metroplex may complicate whitelist matching
  (e.g. concurrencies like I-30/US-67); mitigation: match on any of ref/name/alt
  ref. If a route's data is irreparably noisy: OPTIONAL routes may be dropped;
  REQUIRED routes may never be - a noisy required route halts implementation for a
  human decision instead of shipping a gutted corridor.
- Label anchors are hand-picked; collision at odd aspect ratios mitigated by the
  480px suppression and the visual pass.
- Overpass downtime affects only the dev script (mirror endpoints; output committed).
- LCP headroom is ~0.4s; the bundle gate + 3-run median guards regression.

## Out of scope

- Any change to the page's overall design direction, palette, copy (beyond the
  required OSM attribution line), or other sections (Night Watch re-confirmed).
- The Pipeline section's cam-frame.jpg replacement (separate launch-checklist item).
- Runtime map interactivity (pan/zoom/hover), real traffic data, live anything.
- PhonePreview/Coverage/BlindSpot visual changes beyond inheriting the new render.
- Backend/waitlist/API work.
