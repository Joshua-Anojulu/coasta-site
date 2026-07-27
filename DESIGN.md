# Coasta design system

This document implements the frozen world in `PLAN.md`. If this file and the
plan differ, the plan wins.

## 0. Research Log

- Embedded refs: shortlisted Tesla, Vercel, and Bugatti. Picked the cinematic
  execution reference plus Tesla because full-viewport framing and near-zero
  chrome support the frozen camera-eye world without changing its palette.
- Lazyweb: skipped because the frozen, already-reviewed plan prohibits a new
  design-direction pass.
- Imagen drafts: skipped because generated imagery is explicitly prohibited.
- Reference limits: the plan supplies the palette, type roles, chapter order,
  motion level, and content decisions. Reference guidance that asks for
  gradients, stock imagery, random layouts, GSAP, or alternate accents is not
  applicable.

## 1. Atmosphere & Identity

The page feels like stepping inside a roadside camera network, then receiving
its printed readout. Dark monitor stages carry field data. Light plates slow
the experience down for explanation and action. The signature is the scan
wipe between stages, a thin horizontal sweep that makes each chapter feel
assembled by the camera system itself.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---:|---|
| Stage ground | `--color-ground` | `#08090B` | CH1, CH2, CH5, nav, footer |
| Stage ink | `--color-phosphor` | `#E6EAEE` | Primary text on dark stages |
| Stage ink dim | `--color-phosphor-dim` | `#8A939E` | Credits, metadata, secondary text |
| Plate | `--color-plate` | `#F4F6F8` | CH3, CH4, CH6 |
| Plate ink | `--color-plate-ink` | `#0B0D10` | Primary text on plates |
| Plate ink dim | `--color-plate-dim` | `#525A64` | Secondary plate text |
| Hairline dark | `--color-line-dark` | `#25292F` | Dark-stage dividers |
| Hairline light | `--color-line-light` | `#C9CED4` | Plate dividers and fields |
| Detection | `--color-detection` | `#FF3B30` | Active CH3 detection box only |
| Confirm | `--color-confirm` | `#FFB000` | Confirmed state only |

Rules:

- Detection red appears only on the active diagrammatic box in CH3.
- Confirm amber appears only after the waitlist form confirms success.
- Missing assets use neutral ink and hairlines. They never borrow status color.
- No additional decorative accent is introduced.

## 3. Typography

| Level | Size | Weight | Line height | Tracking | Usage |
|---|---|---:|---:|---:|---|
| Display | `clamp(3rem, 8vw, 5.25rem)` | 650 | 0.94 | `-0.035em` | Hero and chapter statements |
| H2 | `clamp(2.5rem, 6vw, 4.5rem)` | 620 | 0.98 | `-0.03em` | Chapter headings |
| H3 | `clamp(1.5rem, 3vw, 2.25rem)` | 600 | 1.05 | `-0.02em` | Dense content headings |
| Lead | `clamp(1.1rem, 2vw, 1.35rem)` | 450 | 1.55 | `-0.01em` | Primary explanation |
| Body | `1rem` | 430 | 1.65 | `0` | Body and FAQ copy |
| Small | `0.875rem` | 450 | 1.5 | `0` | Secondary copy |
| Mono | `0.75rem` | 500 | 1.4 | `0.08em` | Timecodes, camera ids, credits, data |

- Display and body: Archivo Variable, a tight grotesque.
- Diegetic data: IBM Plex Mono.
- Maximum two families.
- Headline copy stays within two or three lines at every breakpoint.

## 4. Spacing & Layout

Base unit: 4px.

| Token | Value | Usage |
|---|---:|---|
| `--space-1` | 4px | Tight inline separation |
| `--space-2` | 8px | Compact clusters |
| `--space-3` | 12px | Labels and field gaps |
| `--space-4` | 16px | Standard inner padding |
| `--space-6` | 24px | Component spacing |
| `--space-8` | 32px | Related content groups |
| `--space-12` | 48px | Major content gap |
| `--space-16` | 64px | Section rhythm |
| `--space-24` | 96px | Large-screen chapter rhythm |

- Content max width: 1440px.
- Reading column max width: 720px.
- Twelve-column desktop grid, six-column tablet grid, one-column mobile flow.
- Horizontal page gutters use `clamp(1rem, 4vw, 4rem)`.
- Every chapter has `min-height: 150dvh`. CH1 also clears one viewport before
  its scroll cue.
- Full-height sections use dynamic viewport units, never `100vh`.

## 5. Components

### Primary action

- Structure: text link or submit button with one exact label.
- Variants: dark-stage filled, light-plate filled, loading, confirmed.
- States: default, hover, active, focus-visible, disabled.
- Accessibility: minimum 44px target, visible two-color focus ring.
- Motion: two-pixel press and release using transform only.

### Camera frame slot

- Structure: framed region, slot id, subject requirement, missing-state notice,
  and source-credit line.
- Variants: hero, wall tile, explanatory frame.
- States: unfilled, filled, wall-active, wall-dimmed, load-error.
- Accessibility: the unfilled state is live text, not an image substitute.
- Motion: wall tiles change opacity only when their active state changes.

### Data chip

- Structure: mono label and value.
- Variants: dark and light.
- States: static, focused when attached to an interactive camera.
- Accessibility: never the only carrier of meaning.

### Camera point

- Structure: native button over the map with camera id as its accessible name.
- States: idle, hover, focus, active, escaped.
- Accessibility: 44px target, keyboard reachable, road reference in a live
  status region, Escape clears the reading.
- Motion: point scale and status opacity only.

### Form field

- Structure: visible label, input, hint or error.
- States: default, hover, focus, invalid, disabled.
- Accessibility: no placeholder-only labels, errors use `role="alert"`.

### FAQ row

- Structure: native `details`, `summary`, answer.
- States: closed, open, focus-visible.
- Accessibility: native disclosure semantics and full keyboard support.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|---|---:|---|---|
| Micro | 140ms | `ease-out` | Buttons and camera points |
| Standard | 320ms | `cubic-bezier(0.16, 1, 0.3, 1)` | State changes and reveals |
| Emphasis | 720ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Scan wipe |
| Ambient | 8s | `linear` | Scanline drift and wall shimmer |

- Ambient animation runs only while its region intersects the viewport.
- Timecodes tick once per second only while visible.
- No scroll event listeners and no heavy animation loop.
- Reduced motion renders the assembled end state: timecode static, one wall
  tile active, detection diagram complete, and every reveal visible.
- Only transform, opacity, and filter animate.

## 7. Depth & Surface

Strategy: tonal shift plus structural hairlines.

- Monitor depth comes from nested near-black tones, scanlines, optical glass
  sheen, and the photographic frame slot when licensed assets arrive.
- Printout depth comes from the plate against the dark scan boundary.
- Controls are rectangular with restrained two-pixel corners.
- No card-shadow system, gradient decoration, glass pills, or ornamental glow.

## 8. Accessibility Constraints & Accepted Debt

Target: WCAG 2.2 AA.

- Body contrast at least 4.5:1 and large text at least 3:1.
- Every interactive control has a visible focus indicator and 44px target.
- Full keyboard path includes every CH5 camera point and Escape reset.
- Motion preferences produce complete content, never blank staging.
- Every real image must have an accessible name, fixed dimensions, responsive
  sizing, a source credit, and a load-error state.

Accepted debt:

| Item | Location | Why accepted | Owner / Exit |
|---|---|---|---|
| Camera photographs absent | All declared asset slots | Licensing and human review are Phase 0 and outside this build | Fill only after `data/PROVENANCE.md` has all required fields |
| Privacy answer pending | FAQ | Signed retention policy does not exist in the build context | Replace the single gated constant after written sign-off |
| DFW geometry launch gate | CH5 | The preserved snapshot remains subject to ODbL review | Resolve per `data/PROVENANCE.md` before public launch |

