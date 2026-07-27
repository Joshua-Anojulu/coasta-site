# Plan Review Log: Coasta site full redesign, "the camera's own eye"

Started 2026-07-26. Previous logs for the Night Watch and Clearsky builds are archived at
`docs/archive/PLAN-REVIEW-LOG-clearsky-2026-07-23.md`.

## Resolved caps

| Var | Value |
|-----|-------|
| `MAX_ROUNDS` | 5 |
| `MAX_ATTEMPTS` | 8 |
| `PLAN_FILE` | `C:\Users\josha\OneDrive\Documents\coasta-site\PLAN.md` |
| `LOG_FILE` | `C:\Users\josha\OneDrive\Documents\coasta-site\PLAN-REVIEW-LOG.md` |
| `reviewer` | auto-selected, see Round 1 header |

## Act 1 summary, the grill

The interview ran in two passes. The first pass was framed as a diff against the shipped Clearsky
build and Josh rejected that framing outright: he had asked for a full redesign owing nothing to
previous work, informed only by the product overview he supplied and the revamped design skills.
Everything sourced from the old build was discarded from the interview and the tree was re-derived.

Decisions carried out of the pre-reset pass (Josh's calls, not legacy constraints):

1. **Audience.** DFW consumer waitlist only. No enterprise band, no multi-page architecture, despite
   revenue coming from government and enterprise contracts. Enterprise sales run through outreach.
2. **Headline.** "Every camera. / Now a sensor." over the overview's longer specified version, on the
   grounds that 47 characters cannot hold display scale over a full-bleed frame.
3. **Rebuild scope.** Literally everything, a new Next app. Verified against the codebase that this
   costs almost nothing on the backend: no `.env*` files exist, `DATABASE_URL` was never configured,
   the waitlist table was never created, so there are zero signups to orphan.
4. **FAQ copy.** Carried forward verbatim, at Josh's explicit direction, over the recommendation to
   verify it first. See Risk 1, which escalated after the product overview arrived.

Decisions from the post-reset pass:

5. **World.** Diverged across five directions (night highway, the camera's own eye, dispatch console,
   sensor grid, road atlas), dropped the road atlas on the grounds that a static medium argues against
   a real-time promise, and converged on **the camera's own eye**. Chosen because the medium is the
   product: there is no invented place to assert and no gap between what the page shows and what
   Coasta does.
6. **Detection imagery.** Real public DOT camera frames with detection boxes drawn but persistently
   labelled illustrative, plus visible per-frame credit. Rejected generated frames (fabricates road
   and detection), real model output (no shipped detector), and no-boxes (gives up the idea).

What the grill changed versus the opening brief:

- Surfaced that the FAQ privacy claim is in direct tension with the overview's own data-moat
  strategy, escalating it from "unverified" to "contradicted by internal strategy" and making CEO
  sign-off a blocking pre-launch gate.
- Killed a phantom risk by reading the codebase instead of asking: the waitlist DB never went live.
- Forced the honesty question that the world choice created (what is the provenance of anything that
  looks like model output) before it could be papered over in the build.

## Rounds

## Round 1 — codex

- **model:** gpt-5.5, reasoning effort high
- **cli:** codex-cli/0.145.0
- **session:** 019fa1d8-420a-7c83-b9fe-a8107afe1e13
- **sandbox:** `-s read-only`, canary confirmed inside the target repo before launch. The canary
  produced structured policy-denial evidence (`Rejected("... blocked by policy")` on a PowerShell
  `Set-Content` attempt) with `git status --porcelain` byte-identical before and after. Note: the
  0.145.0 release was missing `codex-command-runner.exe` and `codex-windows-sandbox-setup.exe` from
  `bin/`; both were copied from `codex-resources/` before the run, per the known post-update trap.
- **verdict:** REVISE, 15 findings

### Critique (verbatim)

1. Phase 0 assumes public DFW cameras are reusable if terms allow, but TxDOT publishes live cameras
   for real-time monitoring and states feeds are not recorded, while photo-library reuse terms cover
   photo-library assets, not live ITS stills. Fix: treat silence or ambiguity as prohibited; use only
   written permission, photo-library/public-gallery assets, or paid licensed stock.
2. TxDOT, DalTrans/Dallas County and Fort Worth are listed as source classes without proving
   ownership, endpoint authority, or sublicensing rights. Fix: require source-owner identity,
   endpoint URL, permission basis, capture method, and reviewer sign-off per frame.
3. A detection box drawn on a real vehicle under "Every camera. Now a sensor." likely implies actual
   model output even with "illustrative" present. Fix: remove hero boxes or use only real output; if
   concept art ships, label it "concept visualization, not model output" on the focal visual itself.
   (FTC net-impression guidance.)
4. The plan admits the privacy claim contradicts retention strategy but allows the build to proceed
   with the claim intact. Fix: block implementation of privacy copy until a signed retention policy
   defines whether raw frames are stored, whether plates/faces are redacted, and what "store" means.
5. `components/Faq.tsx:18` and `components/TrustBand.tsx:10` already claim no faces, plates or
   tracking, yet the plan's raw-frame marketing assets and described learning corpus can contain
   plates and faces even if the model never extracts them. Fix: redact or discard raw frames before
   persistence and narrow the copy to the provable claim.
6. A 1.6MB total image budget alongside 8 to 12 photo frames does not survive arithmetic: the
   existing `public/cam-frame.jpg` is already 336KB. Fix: per-section byte budgets, AVIF/WebP,
   responsive `sizes`, a maximum initial-viewport image count, and CI/Lighthouse failure when
   exceeded.
7. `next.config.ts` has no image policy; agency-hosted endpoints would break `next/image` or push
   implementers to raw `<img>`. Fix: decide captured-local-optimized-only, or declare explicit
   `images.remotePatterns` after licensing review.
8. "thousands of cameras operate continuously" is itself a numeric claim while the plan says it
   asserts no count. Fix: substantiate from agency inventories or rewrite to "roadside cameras
   across DFW".
9. The per-instance rate limit is ineffective on multi-instance serverless and trivially bypassed.
   Fix: durable TTL-backed limiter keyed on normalized client identity plus email; cap body size.
10. `app/api/waitlist/route.ts:18` trusts `x-forwarded-for` with no trusted-proxy handling. Fix:
    derive IP only from the platform's trusted header, and never use IP as the sole abuse key.
11. "table never created" is asserted from the absence of `.env*`, which proves only that no local
    env file exists, not that Neon or Vercel never held production data. Fix: verify Vercel env vars
    and Neon project state before rebuilding on that assumption.
12. A pinned Overpass snapshot is treated as an availability fallback, but ODbL publication and
    share-alike review is a separate legal gate already open in `data/PROVENANCE.md`. Fix: publish
    the derived geometry and provenance, or remove OSM-derived geometry before launch.
13. Build, tests and Lighthouse are specified but no accessibility-tree, screen-reader or real-device
    decode testing is. Fix: Playwright/axe keyboard and reduced-motion scenarios at mobile and
    desktop, plus production Lighthouse against the deployed build.
14. Analytics and observability are excluded on a waitlist conversion site with a backend. Fix: add
    privacy-preserving event/error monitoring for form submit, API failures, rate limits, LCP/CLS and
    asset load failures, with a documented retention window.
15. Targeting an emergency-vehicle frame creates privacy, endorsement and sensitivity exposure from a
    real incident scene. Fix: avoid active incident imagery unless licensed and approved, or use a
    staged/stock frame with releases.

### Claude's response

**Accepted in full (13):** 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15.

- Phase 0 rewritten to **default-deny**, with a six-field per-frame licensing record and an explicit
  order of preference that excludes live ITS endpoints absent written permission. Finding 1 is the
  most valuable in the round: it inverts the likely answer, so the realistic outcome is now budgeted
  as paid licensed stock rather than discovered late.
- New Phase 0.4 content screening: reject or blur legible plates and faces, no active incident or
  emergency-response scenes, no agency markings implying endorsement. Finding 5 is the sharpest
  observation here, that the marketing assets are themselves a privacy surface capable of falsifying
  the very claim the page makes.
- **Detection boxes removed from CH1 entirely.** Depiction is confined to CH3 in an overtly
  diagrammatic style with "Concept visualization, not model output" adjacent to the visual. Net
  impression governs; a caption cannot undo what the focal visual asserts.
- Performance budget replaced with per-section byte budgets summing under 1.6MB, AVIF with WebP
  fallback, responsive `sizes`, a two-image initial-viewport cap, and CI failure on breach.
- Backend hardened: durable TTL limiter keyed on identity plus email, trusted-proxy IP derivation
  only, request body cap.
- Epistemic correction accepted: greenfield status must be verified against Vercel and Neon, not
  inferred from a missing local `.env`.
- ODbL promoted from a build detail to Risk 4, a launch gate with two acceptable resolutions.
- Testing expanded to Playwright/axe at two viewports plus production-build Lighthouse.

**Accepted with modification (2):**

- **Finding 4 (block the build on privacy policy).** Rejected as stated, accepted in substance. Josh
  explicitly directed that the existing FAQ wording carry forward; that is his decision to make about
  his own company's copy, and the grill records decisions rather than overriding them. The safety
  property Codex is protecting is preserved by a narrower gate: privacy copy is the **last** thing
  implemented and is blocked on a signed retention policy, while the rest of the build proceeds.
  Nothing ships unsigned, and no decision is silently reversed.
- **Finding 14 (observability).** Accepted at reduced scope. A full event/analytics stack with
  retention windows is disproportionate for a form collecting one email and one ZIP, and bolting
  third-party tracking onto a site whose pitch is privacy is self-defeating. Scoped to submit
  success/failure counts, API 4xx/5xx and rate-limit events, and image load failures, with no
  third-party analytics and a documented retention window.

Revised body sha256: `3b66456df02818c6831a7699a66d25772c79103e63bb68ac94dd12545671d04d`

---

## Round 2 — codex

- **session:** 019fa1d8-420a-7c83-b9fe-a8107afe1e13 (resumed, id echo verified)
- **reviewed body sha256:** `3b66456df02818c6831a7699a66d25772c79103e63bb68ac94dd12545671d04d`
- **verdict:** REVISE

### Critique

All 15 round-1 findings marked **ADDRESSED**, including both disputed ones. On finding 4: "I accept
'privacy copy implemented last and gated on signed retention policy' as equivalent launch
protection, provided no public preview ships the old wording." On finding 14: "reduced observability
scope is reasonable for this site; no third-party analytics is defensible."

Four new defects, all internal contradictions introduced by the round-1 revision:

1. The "Key decisions" table still read "boxes drawn but labelled illustrative", contradicting the
   new Phase 0 default-deny and the CH1 no-box rule. An implementer reading the table would be routed
   straight back into the behaviour the revision exists to prevent.
2. "Source JPEGs never ship" contradicts the deliberate preservation of `public/brand/coasta-logo.jpg`.
3. Duplicated risk numbering (two entries numbered 4) and stale "image payload versus LCP" wording
   left over from before the budget became enforceable.
4. Missed in round 1: CH4 depended on "a real phone screenshot" while mobile app screens are listed
   out of scope, so the default path assumed an artifact that does not exist.

### Claude's response

All four accepted; none rejected. Decision table rewritten and a new frame-sourcing row added;
"camera source JPEGs" narrowed with the brand logo brought into conversion scope; risks renumbered
with the stale entry rewritten as a residual design consequence; CH4 flipped so its **default** is
copy plus a real camera frame with no phone depiction, a real screenshot permitted only against a
signed existing artifact. Phase 4 items 4.4 and 4.5 were also found out of sequence and reordered.

Revised body sha256: `c7d0f3006106cfa8974fa35981608591ec7c89700d9e7deb5706108aeb503236`

---

## Round 3 — codex

- **session:** 019fa1d8-420a-7c83-b9fe-a8107afe1e13 (resumed, id echo verified)
- **reviewed body sha256:** `c7d0f3006106cfa8974fa35981608591ec7c89700d9e7deb5706108aeb503236`
- **verdict:** REVISE

### Critique

All four round-2 fixes confirmed "genuinely fixed, not just reworded". Three remaining
cross-section contradictions:

1. **The most consequential of the whole review.** Out-of-scope said "legal copy carries forward
   unchanged" while Risk 1 said privacy copy is gated on a signed retention policy. If privacy FAQ
   copy counts as legal copy, the two clauses conflict and an implementer could ship the unverified
   privacy wording under the carry-forward rule, defeating the gate entirely.
2. Phase 0.4 referenced "Phase 1 detection", but this plan's Phase 1 is scaffold; detection lives in
   CH3. The collision is with Coasta's *strategy document* Phase 1 (police detection).
3. Paid licensed stock permitted "real roadways" generally while the site presents a DFW-specific
   world, so non-Texas stock could silently stand in for DFW coverage.

### Claude's response

All three accepted; none rejected. Finding 1 is the single best catch in the review: the gate built
in round 1 had a hole in it that only appeared when two distant sections were read together, and it
is exactly the failure mode a cross-model reader catches that an author does not. Out-of-scope now
carries an explicit carve-out excluding privacy and data-retention claims. The Phase 1 reference now
points at CH3 with a note disambiguating the two "Phase 1" meanings. Stock sourcing gained a location
honesty rule: prefer DFW or Texas, and non-Texas stock must state its actual location in the credit
and never imply DFW coverage, which extends the same logic that ruled out generated frames.

Revised body sha256: `e88ee1066b59d1cdb67af99a6c9bac74a4be2b5e638fb8f0e55a63616a1aed9c`

---

## Round 4 — codex

- **session:** 019fa1d8-420a-7c83-b9fe-a8107afe1e13 (resumed, id echo verified)
- **reviewed body sha256:** `e88ee1066b59d1cdb67af99a6c9bac74a4be2b5e638fb8f0e55a63616a1aed9c`
- **verdict:** **APPROVED**

### Critique

All three round-3 fixes verified operative rather than reworded. Verbatim conclusion:

> I found no remaining internal contradiction that would route an implementer into misleading
> model-output visuals, unlicensed live-camera reuse, false DFW imagery, or unverified privacy
> claims. The remaining risks are named, gated, and have fallbacks. The plan is sound enough to
> implement.

### Provenance

The approved body hash `e88ee106…` was verified against the plan file after the round completed and
**matches**, so the approval binds to the final body, not to an earlier draft. Recorded as
`status: approved-final`, `final_body_cross_model_approved: true`. Front matter is excluded from the
hash by design, so writing this provenance block does not invalidate it.

Rounds used: 4 of `MAX_ROUNDS` 5. Attempts: 4 of `MAX_ATTEMPTS` 8. Zero failed launches, zero
degraded (same-model) rounds.

---

# Post-build decisions

Recorded here rather than in `PLAN.md`. That file is `approved-final` and its provenance is bound to
a body hash; editing it would silently falsify the recorded approval. The plan stays the frozen
artifact of what was approved, and this log carries what happened afterwards.

## Privacy copy removed entirely (2026-07-27)

Josh's direction: remove anything privacy related for now.

The FAQ item "Is my privacy protected?" and the `PRIVACY_ANSWER_AWAITING_SIGN_OFF` constant are both
deleted. This supersedes the earlier decision to carry the FAQ forward verbatim behind a sign-off
gate, and it is the stronger position: the original wording claimed Coasta stores no faces, plates
or location history, which is in tension with the retention the product overview describes as the
company's moat, and no signed retention policy exists to settle it. A gated placeholder still put a
privacy-shaped hole on the page inviting the claim back. Silence is the honest state. The item
returns when there is a policy to quote.

Risk 1 in `PLAN.md` is therefore no longer a launch blocker for the site copy. It remains an open
company question, not a site question.

## ODbL share alike: RESOLVED, publish rather than drop (2026-07-27)

Risk 4 in `PLAN.md`, and Codex's round 1 finding 12, offered two acceptable resolutions: publish the
derived geometry under ODbL, or drop OSM-derived geometry from CH5. **Publishing was chosen.**

The analysis that decided it:

- The coverage map is a **Produced Work**, which alone would require only attribution, and the
  footer already carried `Map data © OpenStreetMap contributors`.
- But the derived database itself is imported by `lib/geometry/snapshot.ts`, bundled, and shipped to
  every visitor. That is **Public Use of a Derivative Database**, which obliges us to offer the
  database under ODbL. Attribution does not discharge share alike.
- A private GitHub repository is not publication either, so nothing about the repo satisfied it.

Implementation:

- `scripts/export-geometry-odbl.mjs` (`npm run export:geodata`) emits
  `public/data/dfw-geometry.odbl.json`: 236 road segments, 10 water rings, 12 cameras, 126 KB,
  carrying the licence, attribution URL, exact Overpass query, pinned snapshot date
  (2026-07-20), raw response sha256, bounding box, and derivation description.
- Camera positions are included deliberately. They are computed against OpenStreetMap road
  coordinates, so they are part of the derivative database rather than independent data.
- The footer now attributes OpenStreetMap with a link to its copyright page, names the Open Database
  Licence with a link, and links the dataset download. A recipient of the Produced Work can reach
  the database it came from, which is what the licence actually requires.
- Verified served: `GET /data/dfw-geometry.odbl.json` returns 200 `application/json`, 128,788 bytes.

Standing obligation: re-run `npm run export:geodata` whenever the geometry snapshot changes. A stale
published dataset would be worse than none.

`data/PROVENANCE.md` and `docs/LAUNCH-CHECKLIST.md` are updated to match.
