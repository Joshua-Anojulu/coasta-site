# Coasta camera asset slots

All 10 slots are filled with licensed photographs of real Dallas-Fort Worth roadways.

**These are photographs, not stills captured from a live traffic camera.** TxDOT publishes its
cameras for real-time monitoring and states the feeds are not recorded, so genuine camera stills are
not obtainable from the source. Every frame therefore states its road and city in the chapter chrome
and names its photographer, licence and source in the visible credit. No frame implies a capture
that did not happen, and no frame is generated.

Source of truth is `data/assets-manifest.json`. The typed boundary is `lib/assets/manifest.ts`,
which rejects a half-filled slot at parse time. Camera source JPEG files may not enter `public/`;
only the AVIF and WebP derivatives ship.

| Slot | Chapter | Credit or intended subject | Dimensions | Budget | Actual (AVIF) |
|---|---|---|---:|---:|---:|
| `ch1-hero-01` | CH1 | I-30 at TX161, Grand Prairie · Photograph by formulanone · CC BY-SA 2.0 · Wikimedia Commons | 1920 x 1080 | 250 KB | 250 KB |
| `ch2-wall-dawn-01` | CH2 | US-175 at I-20 and I-635, Dallas · Photograph by formulanone · CC BY-SA 2.0 · Wikimedia Commons | 960 x 540 | 100 KB | 27 KB |
| `ch2-wall-day-02` | CH2 | I-635 at the Galleria, Dallas · Photograph by Robertb-dc · Public domain · Wikimedia Commons | 960 x 540 | 100 KB | 33 KB |
| `ch2-wall-overpass-03` | CH2 | I-635 at I-30, Mesquite · Photograph by formulanone · CC BY-SA 2.0 · Wikimedia Commons | 960 x 540 | 100 KB | 33 KB |
| `ch2-wall-rain-04` | CH2 | President George Bush Turnpike · Photograph by Gbauer8946 · CC BY-SA 3.0 · Wikimedia Commons | 960 x 540 | 100 KB | 20 KB |
| `ch2-wall-night-05` | CH2 | Fort Worth at dusk · Photograph by Andreas Praefcke · CC BY 3.0 · Wikimedia Commons | 960 x 540 | 100 KB | 23 KB |
| `ch3-read-01` | CH3 | High Five Interchange, Dallas · Photograph by Danazar · CC BY-SA 3.0 · Wikimedia Commons | 1280 x 720 | 200 KB | 96 KB |
| `ch4-alert-01` | CH4 | I-30 from Reunion Tower, Dallas · Photograph by Michael Barera · CC BY-SA 4.0 · Wikimedia Commons | 1280 x 720 | 200 KB | 175 KB |
| `ch5-resolve-west-01` | CH5 | Las Colinas, Irving · Photograph by La Citta Vita · CC BY-SA 2.0 · Wikimedia Commons | 960 x 540 | 100 KB | 96 KB |
| `ch5-resolve-east-02` | CH5 | I-30 from Reunion Tower, Dallas · Photograph by Michael Barera · CC BY-SA 4.0 · Wikimedia Commons | 960 x 540 | 100 KB | 92 KB |

Total AVIF payload: **845 KB** against the frozen 1600 KB ceiling.

## Provenance

Every frame comes from Wikimedia Commons under an explicit per-file licence with a named author.
Licences in use: Public domain, CC BY 3.0, CC BY-SA 2.0, CC BY-SA 3.0, CC BY-SA 4.0. None is
NonCommercial. Attribution is carried in the visible credit beneath each frame, which satisfies the
BY term; the SA term applies to the cropped derivatives shipped here.

Screening applied per Phase 0.4: no active incident or emergency-response scene, no legible licence
plate, no identifiable face, and no agency marking positioned so as to imply endorsement.

## Replacing a frame

1. Record the six provenance fields in `data/PROVENANCE.md`.
2. Screen for plates, faces, incidents and endorsement cues.
3. Encode AVIF and WebP inside the byte budget declared for that slot.
4. Set `status`, `avifPath`, `webpPath` and `credit` together. The schema rejects partial fills.
