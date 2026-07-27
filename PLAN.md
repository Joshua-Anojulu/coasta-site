---
review_provenance:
  status: approved-final
  rounds:
    - round: 1
      reviewer: codex
      model: gpt-5.5
      effort: high
      cli_version: codex-cli/0.145.0
      session: 019fa1d8-420a-7c83-b9fe-a8107afe1e13
      verdict: REVISE
      findings: 15
      body_sha256: "not retained — the reviewed draft was revised before hashing; a REVISE
        verdict licenses no provenance claim, so nothing is inflated by the omission"
      revised_body_sha256: 3b66456df02818c6831a7699a66d25772c79103e63bb68ac94dd12545671d04d
    - round: 2
      reviewer: codex
      model: gpt-5.5
      effort: high
      cli_version: codex-cli/0.145.0
      session: 019fa1d8-420a-7c83-b9fe-a8107afe1e13
      verdict: REVISE
      body_sha256: 3b66456df02818c6831a7699a66d25772c79103e63bb68ac94dd12545671d04d
      note: all 15 round-1 findings marked ADDRESSED; 4 new internal-consistency defects
      revised_body_sha256: c7d0f3006106cfa8974fa35981608591ec7c89700d9e7deb5706108aeb503236
    - round: 3
      reviewer: codex
      model: gpt-5.5
      effort: high
      cli_version: codex-cli/0.145.0
      session: 019fa1d8-420a-7c83-b9fe-a8107afe1e13
      verdict: REVISE
      body_sha256: c7d0f3006106cfa8974fa35981608591ec7c89700d9e7deb5706108aeb503236
      note: round-2 fixes confirmed genuine; 3 remaining cross-section contradictions
      revised_body_sha256: e88ee1066b59d1cdb67af99a6c9bac74a4be2b5e638fb8f0e55a63616a1aed9c
    - round: 4
      reviewer: codex
      model: gpt-5.5
      effort: high
      cli_version: codex-cli/0.145.0
      session: 019fa1d8-420a-7c83-b9fe-a8107afe1e13
      verdict: APPROVED
      body_sha256: e88ee1066b59d1cdb67af99a6c9bac74a4be2b5e638fb8f0e55a63616a1aed9c
  historical_cross_model_review: true
  final_body_cross_model_approved: true
  final_body_sha256: e88ee1066b59d1cdb67af99a6c9bac74a4be2b5e638fb8f0e55a63616a1aed9c
  degraded_rounds: []
---

# Plan: Coasta site full redesign, "the camera's own eye"
_Locked via grill, by Claude + Josh, 2026-07-26_

## Goal

Rebuild the Coasta consumer waitlist site from scratch as a new Next application, committing to a
single aesthetic world: **the camera's own eye**. The page is not a marketing site *about* a traffic
camera product; the page *is* the feed. Visitors read the product thesis by looking through the same
lens Coasta's models look through. The site targets DFW drivers only, drives one action (join the
waitlist), and carries a content layer dense enough to answer the questions a driver actually
arrives with. Nothing is carried forward from the previous Night Watch or Clearsky builds except the
company's real brand mark and the FAQ copy, the latter by explicit decision and with a blocking
caveat recorded below.

## Approach

### Phase 0, assets and licensing (blocking, do first)

**Default-deny.** Silence or ambiguity in a source's terms reads as *prohibited*, never as permitted.
TxDOT publishes live cameras for real-time monitoring and states the feeds are not recorded; its
photo library operates under separate terms that cover photo-library assets, **not** live ITS stills.
Assume live-camera reuse is disallowed until a written permission says otherwise.

0.1 Enumerate candidate DFW sources (TxDOT statewide, DalTrans / Dallas County, City of Fort Worth).
0.2 **Per-frame licensing record** in `data/PROVENANCE.md`, all six fields required before a frame may
    be used: source-owner identity, endpoint URL, permission basis (written grant / photo-library
    terms / paid licence), capture method, capture date, and named sign-off. A frame missing any
    field does not ship.
0.3 **Permitted-source order of preference:** (a) written permission from the operating agency,
    (b) agency photo-library or public-gallery assets whose terms explicitly allow reuse,
    (c) paid licensed stock of real roadways. Live ITS still endpoints are excluded unless (a) exists.
    **Location honesty rule for (c):** prefer DFW or Texas roadways. If non-Texas stock is used, its
    actual location must appear in the credit and it must never be positioned so as to imply DFW
    coverage. The page asserts a specific coverage area, so imagery that silently stands in for it
    repeats the defect that ruled out generated frames.
0.4 **Content screening, every frame, before it enters the repo:**
    - Reject or blur any legible licence plate or identifiable face. The shipped marketing assets are
      themselves a privacy surface, independent of what the model does or does not extract.
    - **No active incident or emergency-response scenes.** A real crash or a real police response
      carries subject-privacy, sensitivity, and implied-endorsement exposure. If any detection
      depiction requires one (CH3 is the only chapter that depicts detection at all), use a licensed
      or staged frame with releases. Note: "Phase 1" elsewhere in Coasta's strategy documents means
      police-vehicle detection, and is unrelated to this plan's Phase 1, which is scaffold.
    - No agency markings positioned so as to imply that agency endorses Coasta.
0.5 Target 8 to 12 frames across varied roads and times of day, subject to 0.2 through 0.4.
0.6 **Stated fallback if no source clears 0.3:** paid licensed stock only. Under no circumstance
    substitute generated imagery; the world's honesty depends on real frames.
0.7 Visible credit line per frame (source + permission basis), in the diegetic mono style so
    attribution reads as part of the world rather than as legal furniture.

### Phase 1, scaffold

1.1 New Next 15 app in place: React 19, TypeScript, Tailwind 4, vitest. Preserve `.git`, `docs/`,
    and `public/brand/` (the real Coasta mark). Everything else under `app/`, `components/`, `lib/`,
    `tests/`, `public/` is deleted and rewritten.
1.2 **Verify production state before assuming anything is safe to rebuild.** The absence of `.env*`
    locally proves only that no local env file exists; it does not prove Vercel never held
    `DATABASE_URL` or that the Neon project has no rows. Check the Vercel project's environment
    variables and the Neon project directly, and record the result. Only then treat the backend as
    greenfield. If rows exist, export them before any migration runs.
1.3 Rebuild the waitlist backend fresh: `POST /api/waitlist`, email + ZIP validation, honeypot field,
    Neon insert with `ON CONFLICT (email) DO NOTHING`, and a migration script creating
    `waitlist (id, email UNIQUE, zip, created_at)`.
    - **Durable rate limiting**, not the per-instance `Map` the old route used: a serverless
      deployment runs many instances, so an in-memory counter is close to no limit at all. Use a
      TTL-backed store keyed on normalized client identity **plus** submitted email.
    - **Do not trust raw `x-forwarded-for`.** Derive client IP only from the deployment platform's
      trusted header, and never use IP as the sole abuse key.
    - **Cap request body size** before parsing.

### Phase 2, design system derived from the world

2.1 **Palette from the monitor, not from a trend list.** Ground `#08090B`. Cold phosphor ink
    `#E6EAEE` with a dimmed `#8A939E`. One detection red `#FF3B30` used exclusively for an active
    detection box, never decoratively. One confirm amber `#FFB000` for confirmed state only. Content
    plates near-white `#F4F6F8` with ink `#0B0D10`.
2.2 **Chapter lock derived from the world, three bands.** The wall of monitors is dark; the printout
    is light. CH1/CH2/CH5 run dark stage, CH3/CH4/CH6 run light plates. Each band clears the 1.5
    viewport minimum. Boundary device: a horizontal scan wipe, the world's own transition.
2.3 **Type is mono-forward as brand voice.** Display: a tight grotesque at large scale
    (clamp 3rem to 5.25rem, tracking -0.035em). Diegetic layer: IBM Plex Mono for timecodes, camera
    ids, detection labels, confidence readouts, credits. Body: the grotesque at normal weight.
2.4 Dials: WORLD 8, MOTION 8, VARIANCE 7, DENSITY 4 on the stage and 7 in the content layer.
2.5 Overriding one default: **scroll cue in CH1**, because the hero is a full-bleed camera frame with
    no content edge visible below the fold.

### Phase 3, the six chapters

- **CH1 approach.** One real camera frame, full-bleed, faint scanline drift, live-ticking timecode.
  Headline "Every camera. / Now a sensor." at full display scale. One CTA. Source credit visible.
  **No detection box in the hero.** A box drawn on a real vehicle beneath that headline creates the
  net impression of captured model output, and a caption does not undo an impression the focal
  visual creates. The hero establishes the lens; it does not depict a detection.
- **CH2 the wall.** Many frames tile the viewport; one lights up as the others dim. Copy reads
  "roadside cameras across DFW", not "thousands": an unsourced magnitude word is a numeric claim.
- **CH3 the read.** Light plate, and the **only** chapter that depicts detection. Presented explicitly
  as a diagram of the pipeline rather than as a screenshot: the frame is real, the overlay is drawn
  in a deliberately diagrammatic style that cannot be mistaken for captured UI, and it is captioned
  **"Concept visualization, not model output"** adjacent to the visual itself, not in a footnote.
  Plain container, body font, high contrast, no texture behind text.
- **CH4 the alert.** Light plate. **Default: copy plus a real camera frame, no phone depiction.**
  Mobile app screens are out of scope for this project, so no screenshot artifact is assumed to
  exist. A real screenshot may be substituted only if a signed, existing app-build artifact is
  supplied. A div-built phone is never acceptable (hard ban 2).
- **CH5 coverage.** Dark. Camera frames resolve outward into DFW: cameras as points on real road
  geometry, freshly derived from a live Overpass/OSM query with the snapshot pinned and committed,
  ODbL credit in the footer. Interaction: hover or keyboard focus surfaces a camera's road ref.
  **Fallback if the Overpass query rate-limits or returns degraded geometry:** ship CH5 as a static
  pinned snapshot captured in a single successful query, treated as a build artifact.
- **CH6 ground level.** Light plate. FAQ and waitlist form, density 7, high contrast, the primary CTA
  label repeated exactly as it appears in CH1 and the nav.

### Phase 4, motion, a11y, performance

4.1 Ambient life: scanline drift, timecode tick, a slow monitor-wall shimmer. Budgeted, not infinite
    heavy rAF; pause offscreen via IntersectionObserver.
4.2 `prefers-reduced-motion` shows the **assembled end state** of every scene: boxes already drawn,
    timecode static, no blank frames. Required by MOTION > 3.
4.3 Performance budget, required by WORLD > 6. The naive version of this plan does not survive
    arithmetic: the existing `public/cam-frame.jpg` is 336KB, so 8 to 12 comparable stills exceed a
    1.6MB total before the hero, logo, and fonts are counted. The budget is therefore per-section and
    mechanically enforced, not a single aspirational number.
    - LCP under 2.5s on mobile, CLS under 0.05.
    - **Per-section byte budgets**, summing to under 1.6MB total: CH1 hero 250KB, CH2 wall 500KB
      across all tiles, CH3 to CH6 200KB each.
    - **AVIF with WebP fallback**, generated at build time. **Camera** source JPEGs never ship. The
      preserved brand asset `public/brand/coasta-logo.jpg` is in scope for the same conversion.
    - Responsive `sizes` on every image; CH2's tiles served at tile resolution, never full-size
      downscaled in the browser.
    - **Maximum 2 images in the initial viewport.** CH2's wall lazy-loads below the fold.
    - **CI fails the build when a budget is exceeded.** A budget nothing enforces is a wish.
4.4 Full keyboard path through every interactive camera, 44px minimum hit targets, visible focus
    rings, `min-h-[100dvh]` never `h-screen`.
4.5 `next.config.ts` image policy: **locally captured and optimized assets only.** No
    `images.remotePatterns`, no agency-hosted endpoints at runtime. Hotlinking a live ITS endpoint
    would be both a licensing exposure and an availability dependency on someone else's uptime.

### Phase 5, verification

5.1 Unit tests for validation, geometry projection, and detection-label placement.
5.2 Interaction tests for the CH5 camera focus/hover/escape model.
5.3 **Accessibility and motion testing, not just unit tests.** Playwright + axe scenarios at both
    mobile and desktop viewports covering: full keyboard traversal of every interactive camera, the
    `prefers-reduced-motion` path rendering assembled end-states, focus visibility, and the accessible
    name of every image and control. A photo-heavy animated page fails accessibility in ways vitest
    cannot observe.
5.4 Proof command run by Claude, not asserted from a subagent's claim: `npm run build && npm test`,
    plus Playwright/axe, plus Lighthouse mobile against the budget in 4.3.
    **Lighthouse must run against a production build**, not `next dev`, and per the box's known
    LH11 trap, check `largest-contentful-paint-element` for `score:null` before trusting a simulated
    LCP regression.
5.5 Copy pre-flight: mechanical scan for em dashes and en dashes in all user-visible strings (hard
    ban 6), and a scan for any unlabelled numeric claim including magnitude words like "thousands"
    (hard ban 3).
5.6 **Minimal observability**, scoped to what a waitlist site actually needs and no further: waitlist
    submit success/failure counts, API 4xx/5xx and rate-limit events, and image load failures. No
    third-party analytics, no per-user tracking, and a documented retention window. Deliberately not a
    full analytics stack; the site collects one email and one ZIP.

## Key decisions and tradeoffs

| Decision | Chosen | Rejected, and why |
|---|---|---|
| World | The camera's own eye | Night highway (expected for a traffic product, so generic by default), sensor grid (nearest neighbour to generic tech-blue), dispatch console (skeuomorphism reads as costume), road atlas (paper is static, the promise is real-time) |
| Detection imagery | **No boxes in CH1.** Depiction confined to CH3, drawn diagrammatically, captioned "Concept visualization, not model output" adjacent to the visual | Boxes in the hero (net impression of captured output, which a caption cannot undo), generated frames (fabricates road and detection both), real model output (no shipped detector to draw from), no depiction anywhere (gives up the idea that makes this world Coasta's) |
| Frame sourcing | Default-deny. Written agency permission, or reusable-terms photo-library assets, or paid licensed stock | Live ITS still endpoints absent written permission: TxDOT publishes these for real-time monitoring and states feeds are not recorded |
| Audience | DFW consumer waitlist only | Enterprise band, enterprise-primary, multi-page. Revenue is enterprise, but the site stays one focused story and enterprise sales run through direct outreach |
| Headline | "Every camera. / Now a sensor." | The overview's 47-character version, which cannot hold display scale over a full-bleed frame without wrapping to four lines |
| Rebuild scope | Literally everything, new Next app | Keeping the working backend. Josh's explicit call; cost is real but small, since the API is one route and the schema is six lines |
| Chapter theming | Dark stage, light content plates | A single flat theme. The world genuinely has two surfaces, the monitor and the printout, so the lock is derived rather than imposed |

## Risks and open questions

1. **The privacy claim contradicts the strategy document, and the site's own assets widen the gap.**
   The FAQ asserts "We do not store faces, plates, or personal location history." The product overview
   describes a Continuous Learning System retaining labelled examples from every analyzed frame and
   names that corpus as the company's primary moat. Worse, the marketing frames this plan ships are
   themselves raw roadway imagery that can contain legible plates and identifiable faces, so the claim
   can be falsified by the page making it. Three requirements follow:
   - Phase 0.4 screening (blur or reject legible plates and faces) is mandatory, not advisory.
   - **Privacy copy is implemented last**, and is the final thing written into the build. Everything
     else may proceed; this specific copy is gated on a signed retention policy answering what "store"
     means, whether raw frames persist, and whether plates and faces are redacted before persistence.
   - Copy then narrows to the provable claim rather than the broad one.
   Josh's explicit direction is to carry the existing wording forward. That decision stands and is
   recorded here rather than silently reversed, but it is gated as above rather than shipped as-is.
2. **Public DOT camera reuse is probably not permitted.** TxDOT publishes live cameras for real-time
   monitoring and states feeds are not recorded; the photo library's reuse terms cover photo-library
   assets, not live ITS stills. Phase 0 now defaults to deny. Realistic outcome: paid licensed stock.
   Budget for that rather than discovering it late.
3. **A drawn detection box can misrepresent product capability regardless of labelling.** Net
   impression is what governs, not the caption. Mitigated by removing boxes from the CH1 hero entirely
   and confining depiction to CH3 in an overtly diagrammatic style with adjacent "Concept
   visualization, not model output". If review still finds this insufficient, CH3 degrades to
   no-boxes and the pipeline is carried by copy alone.
4. **ODbL share-alike on the derived DFW geometry is an open legal gate, not a build detail.** It is
   already flagged unresolved in `data/PROVENANCE.md`. Either publish the derived geometry and its
   provenance under ODbL, or drop OSM-derived geometry from CH5 before launch. A pinned snapshot
   addresses availability, not licensing.
5. **Low-resolution frames may read as low quality rather than as intentional.** The aesthetic depends
   on the viewer parsing 640x480 as authenticity. Mitigation: frame them deliberately in diegetic
   chrome so the low fidelity is obviously the point. This is the main *aesthetic* risk in the plan
   and it has no mechanical check; it is judged by eye at the tweak-bar stage.
6. **Residual image-weight risk.** The budget in 4.3 is now per-section and CI-enforced, so this can
   no longer fail silently. What remains is a design consequence rather than an unresolved risk: if
   CH2's wall cannot fit 500KB at acceptable quality, the wall loses tiles. Accept fewer, better
   frames over more, worse ones.
7. **The overview's confidence figures (96%, 95/70/40) are illustrative examples, not measured
   results.** They must not ship as if measured. Hard ban 3.
8. Open: `~/.claude/design-library/` does not exist, so divergence was seeded by named references
   rather than by Josh's saved taste entries.

## Out of scope

- Enterprise dashboard, analytics platform, and API surfaces. Context only, not content.
- Any production deployment. The launch checklist gate ("no production deploy until Coasta's backend
  is done") stands.
- Real model integration or live camera ingestion.
- Mobile app screens.
- SEO migration concerns: this is a pre-launch site with no ranking to protect, so slug changes are
  unconstrained. Nav labels, form field names, and the logo carry forward unchanged.
  **Legal copy carries forward unchanged with one carve-out: privacy and data-retention claims are
  explicitly excluded from that carry-forward** and are governed by the Risk 1 gate instead. Without
  this carve-out the two clauses conflict and an implementer could ship the unverified privacy
  wording under the "unchanged legal copy" rule.
