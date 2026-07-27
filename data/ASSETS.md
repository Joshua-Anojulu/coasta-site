# Coasta camera asset slots

No camera photography is included in this build. Every slot below is
intentionally unfilled until Phase 0 licensing, content screening, and named
sign-off are complete.

The source of truth is `data/assets-manifest.json`. The typed application
boundary is `lib/assets/manifest.ts`. A filled slot must provide an AVIF, a
WebP fallback, and the exact source plus permission-basis credit. Camera source
JPEG files may not enter `public/`.

| Slot | Chapter | Intended subject | Dimensions | Byte budget | Status |
|---|---|---|---:|---:|---|
| `ch1-hero-01` | CH1 | Clear DFW or Texas roadway approach, screened for incidents, plates, faces, and endorsement cues | 1920 x 1080 | 250 KB | Unfilled |
| `ch2-wall-dawn-01` | CH2 | DFW or Texas interstate near dawn | 960 x 540 | 100 KB | Unfilled |
| `ch2-wall-day-02` | CH2 | DFW or Texas daytime freeway | 960 x 540 | 100 KB | Unfilled |
| `ch2-wall-overpass-03` | CH2 | DFW or Texas overpass | 960 x 540 | 100 KB | Unfilled |
| `ch2-wall-rain-04` | CH2 | DFW or Texas wet roadway without an active incident | 960 x 540 | 100 KB | Unfilled |
| `ch2-wall-night-05` | CH2 | DFW or Texas night interchange | 960 x 540 | 100 KB | Unfilled |
| `ch3-read-01` | CH3 | Licensed or staged roadway frame cleared for the diagrammatic concept | 1280 x 720 | 200 KB | Unfilled |
| `ch4-alert-01` | CH4 | Roadway frame supporting the alert explanation without a phone | 1280 x 720 | 200 KB | Unfilled |
| `ch5-resolve-west-01` | CH5 | DFW or Texas corridor resolving into western geometry | 960 x 540 | 100 KB | Unfilled |
| `ch5-resolve-east-02` | CH5 | DFW or Texas corridor resolving into eastern geometry | 960 x 540 | 100 KB | Unfilled |

## Section totals

| Chapter | Declared total | Frozen limit |
|---|---:|---:|
| CH1 | 250 KB | 250 KB |
| CH2 | 500 KB | 500 KB |
| CH3 | 200 KB | 200 KB |
| CH4 | 200 KB | 200 KB |
| CH5 | 200 KB | 200 KB |
| CH6 | 0 KB | 200 KB |
| Total | 1,350 KB | Under 1,600 KB |

## Fill procedure

1. Complete all six provenance fields in `data/PROVENANCE.md`.
2. Reject or blur every legible plate and identifiable face.
3. Reject active incidents, emergency-response scenes, and endorsement cues.
4. Convert the cleared source to the slot dimensions and budget.
5. Add AVIF and WebP paths plus the exact visible credit to the manifest.
6. Run `npm run build`. The preflight fails on a missing file, non-approved
   format, or byte-budget overage.

