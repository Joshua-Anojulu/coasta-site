# Clearsky design system

Coasta's design system, replacing the dark "Night Watch" identity with a
light, blue-and-white, professional identity per CEO direction. This is the
living artifact for the palette, type, spacing, motion, and primitive
contracts introduced by the Clearsky redesign (see `PLAN.md` at the repo
root for the full redesign plan and `PLAN-REVIEW-LOG.md` for its review
history). Where this document and `PLAN.md` ever disagree, `PLAN.md` is the
locked spec; this document should be updated to match it, not the reverse.

Status: tokens and type (this document, `app/globals.css`, `app/layout.tsx`)
land in commit (a). The map re-skin, spotlight interaction, and section
retagging land in later commits per `PLAN.md`'s commit sequence. Anything
below describing component or canvas behavior not yet built is a forward
specification, not a claim about the current state of `components/*.tsx`.

## 1. Tokens

### 1.1 Core palette

| Token | Value | Role |
|---|---|---|
| `--color-ground` | `#FFFFFF` | Page background, primary surface |
| `--color-panel` | `#F7F9FC` | Cool near-white; cards, inputs, phone shell, map panel variant |
| `--color-ink` | `#0B1B33` | Navy; primary text |
| `--color-ink-2` | `#4A5A73` | Secondary ink; secondary text, mono chips |
| `--color-signal` | `#1D5BD8` | Brand blue; detections in progress, primary actions, links |
| `--color-signal-deep` (documented, not yet a CSS token) | `#123C8C` | Deep blue; white-on-blue high-contrast surfaces |
| `--color-confirmed` | `#B93535` | Confirmed incidents only (AlertCard, Pipeline confirmed card) |
| `--color-error` | `#B93535` | Form errors (Waitlist). Same initial value as `--color-confirmed`, separate token so the two semantics can diverge later |
| `--color-border` | `rgba(11, 27, 51, 0.1)` (ink @ 10%) | Hairline borders on cards, chips, inputs, footer rule |
| `--color-placeholder` | `#4A5A73` (full opacity) | Input placeholder text |
| `--color-input-border` | `#4A5A73` | Waitlist input borders (>= 3:1 field boundary per WCAG 1.4.11; focus state stays blue) |

Soft blue tints used in gradients and decorative fills (not all promoted to
named CSS tokens; see 1.3): `#DCE8FB`, `#DDEBFC` (hero sky deep stop),
`#F2F7FE` (BlindSpot -> Pipeline seam wash light stop).

Map-canvas decorative tones (aria-hidden layer, tuned for legibility, not
AA -- see section 8's accepted-debt note): panel `#F7F9FC`, interstate roads
`#5A7FBC`, lesser roads `#8AA6CE`, water `#CBDDF2`; canvas labels use
`--color-ink-2`.

Amber `#FFB000` and alert `#FF3B30` are fully retired; no consumer may
reference either hex or the `--color-alert` semantic of "amber/red as a
default status color" going forward (the `--color-alert` CSS *name* survives
only as a temporary migration alias, see 1.2).

### 1.2 Token migration table (decision-complete)

| old | new | consumers to migrate |
|---|---|---|
| `--color-asphalt` `#0a0c0f` | `--color-ground` `#FFFFFF` | body, Nav bg, Hero gradient, Pipeline card bg, CTA text-on-blue |
| `--color-surface` `#11141a` | `--color-panel` `#F7F9FC` | AlertCard inner, inputs, phone shell, map panel variant |
| `--color-signal` `#ffb000` | `--color-signal` `#1D5BD8` (blue) | every `text-signal`/`bg-signal`/`border-signal` use (Nav, Hero CTA, AlertCard, BlindSpot, Pipeline, PhonePreview, Catches, Waitlist) |
| `--color-alert` `#ff3b30` | `--color-confirmed` `#B93535` | AlertCard confirmed, Pipeline confirmed card |
| (new) | `--color-error` `#B93535` | Waitlist error text |
| `--color-fog` `#e8eaed` | `--color-ink` `#0B1B33` | all primary text |
| `--color-fog-dim` `#8a919c` | `--color-ink-2` `#4A5A73` | all secondary text, mono chips |
| `--color-steel` `#4a6b8a` | RETIRED (canvas roles replace it) | MapCanvas only |
| (new) | `--color-border` = ink @ 10% | every `border-white/*` use (all cards, chips, inputs, footer rule) |
| (new) | elevation: soft shadow tokens (`--shadow-card`, `--shadow-card-inset`) | replaces white inset-shadow treatments that vanish on light surfaces (AlertCard, phone shell) |
| (new) | `--color-placeholder` = full-opacity `#4A5A73` | input placeholders (the prior `/50`-opacity pattern fails AA on white) |
| (new) | `--color-input-border` = `#4A5A73` | Waitlist input borders (ink @ 10% computes ~1.24:1 vs white -- invisible; field boundaries need >= 3:1 per WCAG 1.4.11; focus state stays blue) |
| (new) | map role tokens | MapCanvas typed role palette (`MAP_COLORS`, commit (b)) |

Consumer lists above are representative and **scan-enforced, not
exhaustive**; the retirement scan (section 11) is the completeness
guarantee. Known additional consumers: Coverage status color, Footer
wordmark "O", PhonePreview's `bg-asphalt` phone screen + feed cards,
BlindSpot tiles. Every `text-alert`, `bg-surface`, `text-steel`-family, and
`-white/`-suffixed utility consumer (`bg-white/5`, `bg-white/10`,
`decoration-white/20`, `border-white/*` -- all invisible on light ground) is
migrated in commit (c): Catches' categorical red moves to blue per the
retired-categorical-red decision, and PhonePreview's `KIND_COLOR` moves to
blue tones. The retirement scan covers `alert`, `surface`, `steel`,
`asphalt`, `fog`, the broad term `-white/` (any utility prefix), and
`shadow-[inset`, alongside the raw legacy hex values. The bar for
`text-alert` is **zero survivors** post-commit (c): the error/confirmed
roles use the new token names exclusively.

### 1.3 Temporary aliases (this commit only)

To keep every unmigrated component compiling while only the token layer
lands, `app/globals.css` keeps the OLD custom property names as aliases
resolving to the new values:

| alias (old name) | resolves to |
|---|---|
| `--color-asphalt` | `var(--color-ground)` |
| `--color-surface` | `var(--color-panel)` |
| `--color-alert` | `var(--color-confirmed)` |
| `--color-fog` | `var(--color-ink)` |
| `--color-fog-dim` | `var(--color-ink-2)` |

`--color-steel` has **no alias**: it was a canvas-only JS constant
(`components/MapCanvas.tsx`), never a Tailwind utility, so nothing depends
on its CSS custom property surviving. It is retired outright and replaced by
the typed `MAP_COLORS` role palette in commit (b).

All five aliases above are removed in commit (c) once their listed
consumers retag to the Clearsky names. Their presence means commit (a)'s
visual output is intentionally incoherent in places (e.g. a dark navbar over
a white body) -- expected until later commits, per `PLAN.md`.

### 1.4 Gradients

Soft linear washes only -- no mesh gradients, no purple, no dark washes:

| Band | Value | Section |
|---|---|---|
| Hero sky | `#DDEBFC -> #FFFFFF` (180deg) | Hero, over the light map |
| BlindSpot -> Pipeline seam | `#F2F7FE -> #FFFFFF` (180deg) | seam wash between sections |
| Coverage panel ambient | flat `#F7F9FC` | Coverage map panel |
| Waitlist band | `#DCE8FB -> #F7F9FC` (180deg) | Waitlist section background |
| Footer | plain white | Footer |

Declared as CSS custom properties in `app/globals.css` (`--gradient-hero-sky`,
`--gradient-blindspot-pipeline`, `--gradient-waitlist-band`); applied to
section backgrounds when those components are retagged in commit (c). The
earlier `#EAF2FE` hero-sky candidate was rejected: it computes ~1.09:1
against white and reads flat on uncalibrated sRGB laptop panels. Browser QA
verifies each band is visible on a standard laptop panel before commit (c)
ships.

## 2. Type

Plus Jakarta Sans (`next/font/google`, weights 400/500/600/700,
`display: "swap"` with `adjustFontFallback` for CLS safety) is the BODY
family, wired to both `--font-sans` and `--font-display` so existing
`.font-display` classes keep resolving without a rename. Headlines are
sentence case.

### 2.1 Locked type scale

| Role | Size | Weight | Notes |
|---|---|---|---|
| Hero | `clamp(2.4rem, 5vw, 4.2rem)` | 700 | letter-spacing -0.01em |
| H2 | `clamp(1.75rem, 3.2vw, 2.75rem)` | 600 | letter-spacing -0.01em |
| H3 | `1.25rem` | 600 | letter-spacing -0.01em |
| Body | `1rem` | 400 | normal tracking |
| Small | `0.875rem` | 400 | normal tracking |

Headings carry `-0.01em` letter-spacing; body/small do not. Normal font
width throughout -- `.font-display`'s `font-stretch: 125%` declaration
(a device that made Archivo read as a stretched, gamer-adjacent display
face) is explicitly **deleted** from `app/globals.css`, not merely left
unused.

Kickers/eyebrows (the `text-xs uppercase tracking-[0.25em]` openers in
BlindSpot/Pipeline/Waitlist) are re-specced as sentence case, normal
tracking, `font-medium text-signal`. The `0.25em` tracking is removed
together with the uppercase -- it is never combined with sentence case.

### 2.2 Mono-surface inventory

The body font flips from `font-mono` to `font-sans` in this commit. Every
data surface below is retagged with `font-mono` (IBM Plex Mono) in the
component commit (c) so data never silently de-monos:

- AlertCard: cam ID, SIM chip, confidence percentage
- Pipeline: cam label, confidence, alert-card chrome
- PhonePreview: header, feed rows, SIM chips
- BlindSpot: tile IDs
- Catches: numerals, ticker
- Coverage: status labels
- Nav: "network: DFW / demo"
- Waitlist: nothing (no data surfaces)
- Footer: nothing

IBM Plex Mono stays for exactly those surfaces; Archivo is fully removed
from the font pipeline (import, variable, and CSS variable all deleted).

## 3. Spacing / elevation

Spacing follows Tailwind's default scale (no custom spacing tokens
introduced by Clearsky); the one container discipline is `max-w-6xl
mx-auto` for section content (the map hero stays full-bleed), with the
Pipeline frame centered (`mx-auto`) and no section pinned to the left half
of viewports >= 1280px wide.

Elevation moves from Night Watch's white inset-shadow tricks (which vanish
against a light background) to soft, ink-tinted shadow tokens:

| Token | Value | Use |
|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(11,27,51,.06), 0 8px 24px rgba(11,27,51,.08)` | AlertCard, phone shell -- ambient card lift |
| `--shadow-card-inset` | `inset 0 1px 0 rgba(11,27,51,.04)` | inner top-edge highlight replacing `shadow-[inset_0_1px_0_rgba(255,255,255,...)]` |

## 4. Motion

Scroll-reveals ship via a single client-leaf `<Reveal>` primitive (see
section 9.1 for its contract). General rules:

- Fade + 14px rise, once, 0.5-0.7s duration, using the existing
  `--ease-signal` cubic-bezier (`cubic-bezier(0.16, 1, 0.3, 1)`), which is
  **unchanged** by Clearsky and stays the sitewide easing token.
- Modest stagger for lists/tiles.
- The Catches marquee stays (`@keyframes marquee`, `.marquee-track`,
  unchanged in this commit).
- ALL motion, including reveals, is disabled under
  `prefers-reduced-motion: reduce` -- content shows statically.
- Never `window.addEventListener("scroll")`.
- No `linear` / `ease-in-out` on UI transitions.

## 5. Uppercase exceptions (enumerated)

Sentence case replaces uppercase everywhere **except**:

- The COASTA wordmark.
- Mono data chips and statuses: SIM, camera/feed IDs, coverage statuses,
  ticker entries.

All other display/headline/CTA text is sentence case, including detection-
state labels (AlertCard's "POLICE DETECTING/CONFIRMED" -> "Police
detecting"/"Police confirmed", Pipeline's "POLICE VEHICLE"/"ALERT
CONFIRMED" -> "Police vehicle"/"Alert confirmed") -- these are NOT in the
exception list above. Verification (commit c) includes a `uppercase`-class
plus visible-copy audit against this exact list.

## 6. Contrast table

Computed against the WCAG 2.1 relative-luminance formula (sRGB, no
alpha-compositing assumptions unless noted):

| Pair | Ratio | Verdict |
|---|---|---|
| `--color-ink` on `--color-ground` | 17.2:1 | AA/AAA, body & headline text |
| `--color-ink` on `--color-panel` | 16.3:1 | AA/AAA |
| `--color-ink-2` on `--color-ground` | 7.0:1 | AA/AAA, secondary text |
| `--color-ink-2` on `--color-panel` | 6.6:1 | AA/AAA |
| White text on `--color-signal` (`#1D5BD8`) | 5.9:1 | AA (buttons, chips) |
| White text on deep blue `#123C8C` | 10.2:1 | AAA |
| `--color-confirmed`/`--color-error` (`#B93535`) on white | 5.8:1 | AA |
| `--color-confirmed`/`--color-error` on waitlist tint `#DCE8FB` | 4.7:1 | AA (>= 4.5:1 floor per plan) |
| `--color-input-border`/`--color-placeholder` (`#4A5A73`) on white | 7.0:1 | AA/AAA |
| `--color-border` (ink @ 10%) on white | ~1.2:1 | **Decorative only** -- never used for text; hairline dividers/card edges, not a contrast-bearing pair |
| Map role `roadInterstate`/`cameraIdle` (`#5A7FBC`) on map `panel` | ~3.3-3.8:1 | Decorative, aria-hidden canvas -- see section 8 accepted-debt note |

Every text pair used for legible copy clears WCAG AA (4.5:1 body, 3:1
large text/UI boundaries); the two sub-3:1 rows are both decorative,
aria-hidden layers by design (hairline dividers and the canvas map), not
oversights.

## 7. Component state colors

### 7.1 Buttons

| State | Primary (filled blue CTA) | Secondary (outline nav CTA) |
|---|---|---|
| Default | `bg-signal` (`#1D5BD8`), white text | transparent bg, `border-signal` `text-signal` |
| Hover | unchanged bg; `-translate-y-0.5` lift (motion-only, no color shift) | `hover:bg-signal hover:text-ground` (fills solid on hover) |
| Focus-visible | 2px blue focus ring (see section 9.3 for the hotspot-specific ring) | 2px blue focus ring |
| Disabled / sending | **solid tokens**: `bg` `#DCE8FB`, `text` `--color-ink-2` -- never `disabled:opacity-*` (white text over 60%-opacity blue computes ~2.7:1 and escapes every automated contrast scan) | n/a (nav CTA has no disabled state) |

The disabled-state rule above is the Waitlist submit button's explicit
requirement from `PLAN.md` step 4 and is enumerated here as the single
authoritative component-state spec; component commit (c) implements it.

### 7.2 Form fields (Waitlist)

| State | Treatment |
|---|---|
| Default | white/`--color-panel` bg, `--color-input-border` border (`#4A5A73`, >= 3:1 boundary) |
| Placeholder | `--color-placeholder` (full-opacity `#4A5A73`), never a `/50`-opacity utility |
| Focus | border becomes `--color-signal` |
| Error | `role="alert"` text in `--color-error` |

### 7.3 Status/event colors (AlertCard, Pipeline)

| State | Color |
|---|---|
| Detecting (in progress) | `--color-signal` (blue) |
| Confirmed | `--color-confirmed` (red `#B93535`) |

## 8. Accepted-debt note: decorative road contrast

The MapCanvas role palette (commit (b)) intentionally runs some
infrastructure tones below AA text-contrast floors against the map panel:
`roadInterstate` (`#5A7FBC`) and `cameraIdle` sit around 3.3-3.8:1 against
`#F7F9FC`. This is an **accepted trade-off, not an oversight**: the canvas
is `aria-hidden` (it is a decorative backdrop, not a text or control
surface), and the signal hierarchy rule requires event markers
(detect/confirmed/spotlight/cameraActive) to always carry the highest
visual weight -- pushing idle infrastructure any brighter would compete
with events for attention. `cameraIdle` is deliberately placed AT the
contrast floor, not meaningfully above it, so idle nodes never outshout
active ones. No further contrast remediation is planned for this layer;
legibility, not AA, is the design goal here.

## 9. Primitives and accessibility

### 9.1 `Reveal` primitive contract

`Reveal` is the **only** new client boundary Clearsky introduces for
motion. Contract:

- Fade + 14px rise, plays once, 0.5-0.7s, `--ease-signal` easing.
- Wraps only safe descendants -- **never a sticky ancestor**: Pipeline's
  300vh sticky container is exempt; only its inner copy block is wrapped.
- Server components are not converted wholesale to client components;
  `Reveal` is the sole new client leaf, composed around existing server
  markup rather than requiring its ancestors to become client components.
- Supports a stagger prop for lists/tiles (modest, not a per-item delay
  cascade that reads as slow).
- Under `prefers-reduced-motion: reduce`, `Reveal` renders its children in
  their final, fully-visible state with no animation -- content is never
  gated behind motion.

### 9.2 Hotspot / card / controlled-spotlight architecture

(Forward spec for commit (b)/(c)'s Hero + MapCanvas interaction; not built
in this commit.)

- **Single state owner, controlled renderer:** Hero owns
  `spotlightCameraId: string | null` and passes it to MapCanvas as an
  additive, optional controlled prop `spotlightId?: string | null`.
  MapCanvas is a pure renderer for the spotlight -- it draws the highlight
  for `spotlightId` in every draw path (running and paused) and handles no
  pointer input for it.
- **All input lives in Hero's hotspot layer:** hover, tap, focus, and
  keyboard are handled by one focusable DOM hotspot `<button>` per visible
  camera, absolutely positioned from the same `project()` output the canvas
  uses. The canvas itself stays `aria-hidden` and has zero spotlight pointer
  handling.
- **State model:** separate `hoveredId`, `focusedId`, `pinnedId`, with
  `spotlightId = pinnedId ?? hoveredId ?? focusedId` derived from them.
- **Road-name helper:** `nearestRouteRef(lonlat)` (pure, tested, in
  `lib/dfw/`) resolves the closest road segment within ~150m and formats
  its routes deterministically; returns `null` when nothing is in range, in
  which case the card shows the generic "DFW metroplex" line instead of a
  road name.
- **Card mechanics:** rAF-throttled position updates; a pure, tested
  `placeCard` helper clamps and flips card placement at viewport edges; the
  card is `pointer-events-none` and never shifts layout.
- **Occlusion:** hotspots whose rects intersect the nav bar, the reserved
  AlertCard rect (fixed, anchored regardless of whether AlertCard is
  currently mounted), the headline block, or the CTA are excluded outright
  (not rendered), recomputed on resize.
- **Group semantics:** the hotspot layer renders after the CTA in DOM order,
  inside a `role="group"` labeled "Camera network (simulated)", so keyboard
  users reach the primary CTA before the camera stops. Accessible names
  follow the pattern "Camera CAM-114, simulated feed"; the card associates
  via `aria-describedby`.
- **Paused / reduced-motion:** selecting a spotlight triggers a one-shot
  redraw of the paused canvas so the highlight appears without animation;
  card show/hide is non-animated in that mode.

### 9.3 Keyboard behavior map

| Input | Effect |
|---|---|
| `Tab` / `Shift+Tab` | Moves focus between hotspot buttons (in DOM order, after the CTA); sets `focusedId` |
| `Enter` / `Space` (native button activation) | Toggles `pinnedId` for the focused camera -- the **only** activation path; no separate `keydown` toggle handler |
| `Escape` | Clears `pinnedId` (and, transitively, dismisses the card if nothing else is hovered/focused) |
| Mouse `pointerenter` / `pointerleave` | Sets/clears `hoveredId`, mouse-type pointers only |
| Touch tap | Native click toggles `pinnedId`; touch pointers never set `hoveredId`, so scrolling cannot open a card |
| Outside tap | Clears `pinnedId` |
| Blur | Clears `focusedId` only -- leave/blur never clear a pinned selection |
| `pointercancel` | Clears transient (hover) state |

Hotspot buttons are >= 44x44 CSS px, centered on their map node, with a
high-contrast 2px blue `focus-visible` ring.

## 10. Verification hooks this document supports

- The retirement scan (section 1.2/1.3) and the uppercase audit
  (section 5) are grep-enforced in commit (c)'s verification pass.
- The contrast table (section 6) is the reference for the manual/automated
  contrast spot-check in `PLAN.md`'s verification section.
- The component-state table (section 7) is the acceptance criteria for
  Waitlist's button and field treatment in commit (c).
