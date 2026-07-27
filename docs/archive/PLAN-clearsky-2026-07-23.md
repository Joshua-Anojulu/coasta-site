# Plan: Clearsky redesign (light blue/white professional re-theme + interactivity)
_Locked via grill — by Claude + Josh (CEO direction: professionalism first).
Revised after Codex Round 1._

## Goal

Re-theme the entire Coasta site from the dark "Night Watch" identity to a light,
blue-and-white, professional identity ("Clearsky") per CEO direction, while keeping
the site's substance: the real DFW map with detection replay, the seven-section
structure, the waitlist funnel, and all honesty constraints (SIM tags, no live
claims). Add restrained dynamism: calm blue gradients, scroll-reveals, and one
flagship interaction (hover/tap a hero-map camera to spotlight it with an info
card). Fix the audited defects: the unrelated rock-cliff Pipeline image (replace
with a generated real-looking elevated highway traffic-camera still), the
left-pinned Pipeline composition, the lifeless BlindSpot wall, and wide-viewport
sprawl. Budgets hold: Lighthouse mobile LCP <= 2.5s, CLS <= 0.1, all tests green.

## Design system (locked)

- **Palette (contrast-checked):** ground `#FFFFFF` / cool near-white `#F7F9FC`;
  ink `#0B1B33` (navy), secondary ink `#4A5A73`; brand blue `#1D5BD8` (detections
  in progress, primary actions; white-on-blue buttons pass AA); deep blue
  `#123C8C`; soft blue tints `#DCE8FB` and `#DDEBFC` (hero sky deep stop);
  **status red `#B93535`** (>= 4.5:1 on
  white and on the waitlist tint) split into TWO tokens with one initial value:
  `--color-confirmed` (confirmed incidents only) and `--color-error` (form
  errors) so the semantics can diverge later; map tones (decorative, aria-hidden
  layer, tuned for legibility not AA): panel `#F7F9FC`, interstate roads
  `#5A7FBC`, lesser roads `#8AA6CE`, water `#CBDDF2`; canvas map labels use
  secondary ink `#4A5A73`. Amber `#FFB000` and alert `#FF3B30` fully retired.
- **Token migration table (decision-complete):**
  | old | new | consumers to migrate |
  |---|---|---|
  | `--color-asphalt` #0a0c0f | `--color-ground` #FFFFFF | body, Nav bg, Hero gradient, Pipeline card bg, CTA text-on-blue |
  | `--color-surface` #11141a | `--color-panel` #F7F9FC | AlertCard inner, inputs, phone shell, map panel variant |
  | `--color-signal` #ffb000 | `--color-signal` #1D5BD8 (blue) | every `text-signal`/`bg-signal`/`border-signal` use (Nav, Hero CTA, AlertCard, BlindSpot, Pipeline, PhonePreview, Catches, Waitlist) |
  | `--color-alert` #ff3b30 | `--color-confirmed` #B93535 | AlertCard confirmed, Pipeline confirmed card |
  | (new) | `--color-error` #B93535 | Waitlist error text |
  | `--color-fog` #e8eaed | `--color-ink` #0B1B33 | all primary text |
  | `--color-fog-dim` #8a919c | `--color-ink-2` #4A5A73 | all secondary text, mono chips |
  | `--color-steel` #4a6b8a | RETIRED (canvas roles replace it) | MapCanvas only |
  | (new) | `--color-border` = ink at 10% | every `border-white/*` use (all cards, chips, inputs, footer rule) |
  | (new) | elevation: soft shadow tokens | replaces white inset-shadow treatments that vanish on light surfaces (AlertCard, phone shell) |
  | (new) | `--color-placeholder` = full-opacity `#4A5A73` | input placeholders (the current `/50` opacity pattern fails AA on white) |
  | (new) | `--color-input-border` = `#4A5A73` | Waitlist input borders (ink@10% computes 1.23:1 vs white - invisible; field boundaries need >= 3:1 per WCAG 1.4.11; focus state stays blue) |
  | (new) | map role tokens | MapCanvas typed role palette (below) |
  **Consumer lists are representative and SCAN-ENFORCED, not exhaustive** (the
  scans are the completeness guarantee); known additional consumers: Coverage
  status color, Footer wordmark O, PhonePreview's `bg-asphalt` phone screen +
  feed cards, BlindSpot tiles. Every `text-alert`, `bg-surface`,
  `text-steel`-family and `-white/`-suffixed utility consumer (`bg-white/5`,
  `bg-white/10`, `decoration-white/20`, `border-white/*` - ALL invisible on
  light ground) is migrated (Catches categorical red -> blue per the
  retired-categorical-red decision; PhonePreview KIND_COLOR -> blue tones);
  the retirement scan covers `alert`, `surface`, `steel`, `asphalt`, `fog`,
  the broad term `-white/` (any utility prefix), and `shadow-[inset` alongside
  the raw hex values; the bar for `text-alert` is ZERO survivors (the
  error/confirmed roles use the new token names).
- **Gradients (calm, the user's requested visual signature - ENUMERATED so
  they actually register on uncalibrated sRGB laptop panels):** soft linear
  washes only - hero sky `#DDEBFC -> #FFFFFF` (deep stop in the #DCE8FB family;
  the earlier #EAF2FE start computes 1.09:1 vs white and would read flat);
  BlindSpot->Pipeline seam wash `#F2F7FE -> #FFFFFF`; Coverage panel ambient
  `#F7F9FC`; waitlist band `#DCE8FB -> #F7F9FC`; footer plain white. Browser
  QA verifies each band is visible on a standard laptop panel. No mesh
  gradients, no purple, no dark washes.
- **Type:** Plus Jakarta Sans (next/font/google, 400/500/600/700, `display:
  "swap"` with `adjustFontFallback` for CLS safety) becomes the BODY family -
  sentence case headlines with a LOCKED scale - hero clamp(2.4rem,5vw,4.2rem)
  w700; h2 clamp(1.75rem,3.2vw,2.75rem) w600; h3 1.25rem w600; body 1rem w400;
  small 0.875rem; headings letter-spacing -0.01em - normal width, and
  `.font-display`'s `font-stretch: 125%` declaration is explicitly DELETED
  from globals.css (not merely unused). **Kickers/eyebrows (the current
  `text-xs uppercase tracking-[0.25em]` openers in BlindSpot/Pipeline/
  Waitlist): re-specced as sentence case, normal tracking, `font-medium
  text-signal` - the 0.25em tracking is removed with the uppercase, never
  combined with sentence case.** **Variable wiring (decision-complete):** the Plus
  Jakarta next/font variable maps to BOTH `--font-sans` and `--font-display` in
  the Tailwind theme (existing `.font-display` classes keep working and resolve
  to Jakarta), the Archivo variable and import are deleted, and the body
  switches from `font-mono` to `font-sans`. **Critical coupling:** the body is currently
  `font-mono` sitewide, so flipping it to sans silently de-monos every data
  surface; the migration includes an explicit inventory that retags EVERY data
  surface with `font-mono`: AlertCard camId/SIM/confidence, Pipeline cam-label/
  confidence/alert-card chrome, PhonePreview header + feed rows + SIM chips,
  BlindSpot tile IDs, Catches numerals + ticker, Coverage statuses, Nav
  "network: DFW / demo", Waitlist nothing (no data), footer nothing. IBM Plex
  Mono stays for exactly those surfaces. Archivo removed from the pipeline.
- **Uppercase exceptions (enumerated):** the COASTA wordmark, mono data chips
  and statuses (SIM, camera/feed IDs, coverage statuses, ticker entries). All
  other display/headline/CTA text is sentence case; verification includes a
  `uppercase`-class + visible-copy audit against this list.
- **Voice/copy:** existing copy stays except where treatment changes force edits;
  NO em dashes or en dashes anywhere; sentence case replaces uppercase in
  headlines/CTAs (mono data chips may stay uppercase); no invented statistics;
  every demo number keeps its co-located SIM chip; the site never claims live
  functionality; the OSM credit stays in the footer.
- **Composition:** one container discipline - `max-w-6xl mx-auto` for section
  content (map hero stays full-bleed); the Pipeline frame is CENTERED
  (`mx-auto`); no section may pin content to the left half of viewports >= 1280px
  wide.
- **Motion:** scroll-reveals via a single client-leaf `<Reveal>` primitive
  (fade + 14px rise, once, 0.5-0.7s, existing `--ease-signal` cubic-bezier which
  stays as the easing token) wrapping only safe descendants - **never a sticky
  ancestor**: Pipeline's 300vh sticky container is exempt (only its inner copy
  block reveals), and server components are not converted wholesale (Reveal is
  the only new client boundary). Modest stagger for lists/tiles; the Catches
  marquee stays; ALL motion including reveals disabled under
  `prefers-reduced-motion` (content visible statically); never
  `window.addEventListener("scroll")`; no `linear`/`ease-in-out` on UI
  transitions.

## Approach

0. **`docs/DESIGN.md` first:** commit the Clearsky design system as an artifact
   (tokens incl. the migration table, type scale + mono inventory, spacing,
   elevation, motion rules, uppercase exceptions, contrast table, component
   state colors) PLUS a primitives-and-accessibility section: the `Reveal`
   primitive contract, the hotspot/card/controlled-spotlight architecture and
   its keyboard behavior map, and an accepted-debt note for the decorative
   road-contrast exception - so the system outlives this plan file.
1. **Token layer (`app/globals.css` + `app/layout.tsx`):** replace the Night Watch
   custom-property palette with the Clearsky tokens above (keep the same custom
   property NAMES where semantics map 1:1 - e.g. `--color-signal` becomes the
   brand blue value - so component class churn is minimized; rename only where
   semantics changed, e.g. `--color-asphalt` -> `--color-ground`). Swap Archivo
   for Plus Jakarta Sans via next/font. ADD a theme-color via Next 15's
   `viewport` export (none exists today) plus explicit `color-scheme: light`;
   body classes updated; the grain overlay is REMOVED entirely (decision:
   film grain is a dark-theme device and reads as noise on white).
   `.lane-divider` re-tuned for light (soft blue rule).
2. **MapCanvas light atlas re-skin (`components/MapCanvas.tsx`):** same two-canvas
   architecture, arcs, dots, and props contract; the single STEEL constant is
   replaced by a **typed canvas role palette** (`MAP_COLORS: {panel, grid,
   water, roadInterstate, roadMinor, label, cameraIdle, cameraActive,
   spotlight, dot, detect, confirmed}` - `panel` backs the background="panel"
   variant, `spotlight` is the hover/focus highlight, distinct from the
   replay's `cameraActive`). **Each role is a complete paint definition
   `{color, alpha, width?}` - the dark theme's alphas do NOT carry over** (0.05
   grid / 0.08 water are invisible on `#F7F9FC`): grid `#6B8CC4` a0.18; water
   `#CBDDF2` a1.0 solid; roadInterstate `#5A7FBC` a0.9 w2.2 over a soft wide
   understroke; roadMinor `#8AA6CE` a0.8 w1.2; label ink-2 a1.0; **signal
   hierarchy rule: event markers (detect/confirmed/spotlight/cameraActive)
   always carry the highest visual weight on the canvas; infrastructure stays
   quiet:** cameraIdle solid `#5A7FBC` (~3.3:1 vs panel - AT the floor, not
   far above it, so idle nodes never outshout events) 2.5px node **over a thin
   1px white casing ring (nodes sit ON same-color interstate strokes; the
   casing keeps them visible against the road, while their small size and
   road-family hue keep them quieter than event markers)**, with breathing
   moved to a surrounding halo (radius/alpha of the HALO animates, never the
   node's own opacity); dot `#123C8C` a0.3; **cameraActive
   (explicit): `#1D5BD8` filled 4px node over a 2px white casing ring**;
   detect ring `#1D5BD8` w2 with a white casing understroke (cartography
   style, separating it from same-hue roads); confirmed `#B93535` with the
   same white casing; **spotlight: `#1D5BD8` double OUTLINE ring (unfilled,
   two thin concentric strokes) - structurally distinct from cameraActive's
   filled node**; exact values tunable in the visual pass within these
   contrast floors and the hierarchy rule, so each draw layer is independently
   tunable and reviewable; glow
   passes become subtle depth strokes (stroke-weight hierarchy, minimal glow on
   light ground; +0.25px width tuning allowance at DPR 1); ambient dots deep
   blue low alpha; detection ring/brackets `detect` blue while detecting,
   `confirmed` red when confirmed; camera nodes per the cameraIdle/cameraActive
   paint specs above (halo breathing - the current node-opacity breathing is
   retired). **New optional prop `background?: "transparent" |
   "panel"` (default "panel"):** Hero passes "transparent" so its CSS sky
   gradient shows through; PhonePreview/Coverage keep the opaque panel fill.
   `createTrafficDots` export and all geometry tests remain untouched.
3. **Flagship interaction - camera spotlight (Hero + MapCanvas):**
   - **Single state owner, controlled renderer:** Hero owns `spotlightCameraId:
     string | null` and passes it to MapCanvas as a new optional controlled
     prop `spotlightId?: string | null` (additive - existing consumers
     unaffected). MapCanvas is a PURE RENDERER for the spotlight: it draws the
     highlight for `spotlightId` in every draw path (running and paused) and
     handles NO pointer input for it. ALL input - hover, tap, focus, keyboard -
     lives in Hero's hotspot layer (below), so keyboard selection reliably
     drives the same canvas redraw as mouse. Hero owns the card UI (white card:
     camera ID in mono, road name, status line "Simulated feed" with SIM chip).
   - **Road-name helper (pure, tested):** `nearestRouteRef(lonlat)` in
     `lib/dfw/` resolves the closest ROAD_SEGMENT within ~150m and formats its
     `routes[]` deterministically (fixed priority order, first match); cameras
     carry no road field so this helper is the source of truth. **Null
     fallback:** when no segment is within range it returns null and the card
     shows the generic "DFW metroplex" instead of a road line.
   - **Hotspot layer owns all input (canvas stays aria-hidden):** Hero renders
     one focusable DOM hotspot button per VISIBLE camera, absolutely positioned
     from the same `project()` output. **State model:** separate `hoveredId`,
     `focusedId`, `pinnedId` with derived `spotlightId = pinnedId ?? hoveredId
     ?? focusedId`; native button `onClick` is the ONLY activation path (no
     keydown toggles - native buttons already click on Enter/Space; keydown
     handles Escape only) and toggles `pinnedId`; pointerenter/leave set/clear
     `hoveredId` ONLY for mouse-type pointers (touch pointers never set hover,
     so scrolling cannot open a card); `pointercancel` clears transient state;
     blur clears `focusedId`; leave/blur never clear a pinned selection;
     outside-tap and Escape clear `pinnedId`. The canvas has zero spotlight
     pointer handling. **Target geometry:** hotspot buttons are >= 44x44 CSS px
     centered on the node with a high-contrast 2px blue `focus-visible` ring.
     **Occlusion:** hotspots whose rects intersect the nav bar, the RESERVED
     alert-card rect (a fixed w-72 x max-card-height region anchored at
     right-5/top-24, used for exclusion regardless of whether AlertCard is
     currently rendered - the card mounts/unmounts with replay phase, so a
     measured rect would be 0x0 for much of the loop), the headline block, or
     the CTA are excluded (not rendered), recomputed with positions on resize.
     **Group semantics + order:** the hotspot layer renders AFTER the CTA in
     DOM order inside a `role="group"` labeled "Camera network (simulated)" so
     keyboard users reach the primary CTA before the eight-odd camera stops.
     Accessible names ("Camera CAM-114, simulated feed"), card associated via
     aria-describedby.
   - **Resize/visibility contract:** Hero computes hotspot positions with its
     own ResizeObserver on the map container (same dimensions MapCanvas
     renders into) and recomputes on resize; cameras whose projected position
     falls outside the visible canvas (portrait focus window crops Fort Worth)
     are NOT rendered as hotspots (out of tab order) - the accessible
     experience is the visible map's cameras.
   - **Card mechanics:** rAF-throttled position updates; hotspots do the
     hit-testing natively (no separate pure hit-test - the previously planned
     nearest-camera hit-test unit test is obsolete and NOT written); card
     placement clamps and flips at viewport edges via a pure, tested
     `placeCard` helper; card is pointer-events-none and never shifts layout.
     Keyboard QA is part of verification.
   - **Paused/reduced-motion:** spotlight selection triggers a one-shot redraw
     of the paused canvas so the highlight ring appears without animation;
     card show/hide is non-animated in that mode.
   - **New logic gets unit tests** (this plan DOES add tests): the spotlight
     state reducer (hover/focus/pin/dismiss transitions incl. the
     pinned-survives-leave rule), `nearestRouteRef`, and `placeCard` clamp/flip
     - all as pure functions in lib.
4. **Section re-themes (all seven + nav/footer),** preserving structure and copy:
   - Nav: white translucent bar, navy wordmark (blue O accent kept), blue CTA.
   - Hero: sky gradient wash over the light map, navy sentence-case headline
     ("Every camera. Now a sensor." stays), blue CTA button, alert card as white
     elevated card (soft shadow, blue/red state colors).
   - BlindSpot wall relit: light tiles with soft borders and a faint animated
     blue static/scan texture (CSS only), the periodic detection tile gets a
     visible blue ring pulse + mono label brightening; wall is aria-hidden
     (already) and the interval remains reduced-motion gated.
   - Pipeline: frame centered with `mx-auto`; **the dark-theme image treatment
     is DELETED, not inherited** - the current `opacity-70
     [filter:saturate(0.4)_hue-rotate(190deg)]` stack would render the new
     photographic still as washed-out teal on white; replacement treatment:
     full opacity, no hue rotation, a gentle `contrast(1.02) brightness(0.98)`
     normalization at most, scanline overlay softened to low-alpha and thinner
     for light chrome, thin `--color-border` frame edge; stage overlays
     re-colored (blue detect, red confirmed card); copy block centered under
     the frame at readable measure.
   - PhonePreview: light phone shell, light map (focus window), white feed cards
     with blue kind-colors; **categorical red is retired with the amber palette**
     (the prior "keep categorical red" decision was scoped to Night Watch; on a
     white page red category labels read as alarm) - crash rows use deep blue
     like the rest, red appears only on active simulated confirmed states
     (Hero/Pipeline cards). Flagged here for Josh's final sign-off.
   - Catches: light list, mono numerals in blue, marquee ticker restyled light.
   - Coverage: light map panel + copy, same layout, centered discipline.
   - Waitlist: white inputs on the soft-blue gradient band with
     `--color-input-border` borders (>= 3:1 field boundaries), navy labels,
     blue button; **disabled/sending state uses solid tokens (bg `#DCE8FB`,
     text `#4A5A73`), never `disabled:opacity-*`** (white-on-60%-blue computes
     ~2.7:1 and escapes every scan); hover/disabled button states are
     enumerated in DESIGN.md's component-states section; error text uses
     `--color-error`; `role="alert"` stays.
   - Footer: light, keeps simulated-demonstrations line + OSM credit + (c) line.
5. **Pipeline camera still (`public/cam-frame.jpg`):** replaced with a GENERATED
   photorealistic elevated fixed-position highway traffic-camera still (daytime
   or dusk, DFW-plausible multi-lane highway, no readable plates or faces, no
   real signage text). If the builder session has a native image tool (Codex
   does), generate at 1600x900 and save over the file; otherwise this step is a
   named deliverable gap reported for the controller to fill. **Delivery:** the
   frame moves to `next/image` with explicit `width`/`height` (1600x900),
   `sizes`, and the aspect ratio reserved in layout (zero CLS); below the fold
   so lazy loading stays, no `priority`. The detection overlay anchor
   coordinates are re-tuned to a plausible vehicle region of the new image.
5b. **Copy honesty + treatment sweep:** the plan's own language and the site's
   copy drop every live-operation claim: PhonePreview's "Live hazard map of
   DFW" becomes "Hazard map of DFW, briefed before you drive"; PhonePreview's
   "Route monitoring with push alerts" becomes "Route alerts pushed before you
   drive"; the spotlight card status is "Simulated feed"; internal plan wording
   uses "active confirmed states" not "live". **Detection-state labels
   (AlertCard's "POLICE DETECTING/CONFIRMED", Pipeline's "POLICE VEHICLE"/
   "ALERT CONFIRMED") move to sentence case ("Police detecting", "Alert
   confirmed") per the professional type direction - they are NOT in the
   uppercase exception list.** Verification greps visible copy
   case-insensitively for "live" AND "monitoring" and requires each hit to be
   justified or removed.
6. **Verification:**
   - `npm test` fully green: existing 42 untouched (geometry/extract/replay/
     validate)
     PLUS the new interaction unit tests (spotlight reducer, nearestRouteRef,
     placeCard) from step 3.
   - `npm run build` clean; em/en dash scan clean; **case-insensitive**
     retirement scan over app/components/lib using the FULL term list from the
     token-migration section (raw legacy hexes any case, `alert`, `surface`,
     `steel`, `asphalt`, `fog`, the broad `-white/` term, `shadow-[inset`,
     arbitrary Tailwind color classes, `Archivo`), with ZERO `text-alert`
     survivors; plus the "live"/"monitoring" copy grep from 5b and the
     uppercase audit from the type rules. The token section's list is the
     single authoritative scan definition.
   - Lighthouse mobile production, 3-run median: LCP <= 2.5s, CLS <= 0.1.
   - Browser QA (visible browser, mobile AND desktop widths 375/768/1512):
     light theme cohesive; Pipeline centered; BlindSpot wall alive; reveals
     fire once and stay; reduced-motion shows everything statically INCLUDING a
     static spotlight on selection. Interaction scenarios: mouse hover/leave,
     touch tap/outside-tap/scroll-does-not-open, keyboard Tab order (offscreen
     cameras absent), Enter/Space toggle, Escape dismiss, card follows
     aria-describedby in the accessibility tree, card clamps/flips at viewport
     edges.
   - Contrast: all text pairs >= WCAG AA on their grounds (navy on white, ink on
     tints, white on blue buttons).
7. **Commits (no Claude co-author trailers, hard rule):**
   (a) `feat: clearsky light theme tokens and typography`
   (b) `feat: light atlas map render and camera spotlight interaction`
   (c) `feat: re-theme sections for clearsky with scroll reveals`
   (d) `feat: generated highway camera still for pipeline` (or folded into c if
   generated in-session).

## Key decisions & tradeoffs

- **Full re-theme over incremental tinting:** the gamer feel is systemic (dark
  ground + amber + stretched uppercase); only a coordinated palette/type/
  treatment swap reads professional. Structure and logic are preserved to keep
  the change reviewable; existing tests stay untouched while the NEW interaction
  logic ships with its own unit tests (step 3) - no test is weakened.
- **Token-name reuse (`--color-signal` = blue):** minimizes class churn across
  seven components at the cost of a slightly stale token name; renames limited
  to semantic breaks. Tradeoff accepted for diff size and review focus.
- **Categorical red retired (reverses a Night Watch-scoped decision):** red on
  white reads as alarm; blue categories + red-for-confirmed-only is the
  professional severity language. Explicitly resurfaced for Josh's sign-off.
- **Light map needs contrast discipline, not glow:** heavy glow on white looks
  smeared; depth comes from stroke-weight hierarchy and the soft panel ground.
- **Generated (not stock) camera still:** matches the frame's overlay geometry
  needs, avoids licensing and "readable plate" risks; clearly SIM-tagged in the
  overlay chrome as today.
- **Uppercase retired except the enumerated exceptions (wordmark, mono data
  chips/statuses):** the single biggest de-gamering lever after the palette
  itself.

## Risks / open questions

- Plus Jakarta Sans at large sizes has a distinct personality; if the CEO wants
  even plainer, weight/size tuning is the lever (not a font swap).
- The camera-spotlight hit-test must not fight the replay's active-camera
  highlight; spotlight visuals are additive (outline + card), never recolor the
  replay state.
- Light-theme canvas anti-aliasing can make 1px strokes look faint on non-retina
  screens; stroke widths may need +0.25px tuning at DPR 1 during the visual pass.
- theme-color/meta and any OS-level dark-mode interaction: the site is a single
  light theme; `color-scheme: light` is set explicitly so form controls match.

## Out of scope

- Backend/waitlist/API logic, database, launch-checklist infra items.
- Geometry data, extraction pipeline, replay engine logic (visual consumers only).
- New sections, copy rewrites beyond treatment-driven edits, routing, nav items.
- Dark-mode variant of Clearsky (single light theme only).
- Map pan/zoom or any interactivity beyond the camera spotlight.
