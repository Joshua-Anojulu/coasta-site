# Coasta Launch Checklist

All blocking items must be resolved before a public production deployment.

## Data and infrastructure

- [ ] Set the production `DATABASE_URL`.
- [ ] Run and verify the waitlist database migration.
- [ ] Confirm production backups and recovery ownership.

## API hardening

- [ ] Add the planned waitlist API abuse controls.
- [ ] Verify production error handling does not expose sensitive details.
- [ ] Confirm request logging and retention policy.

## Marketing assets

- [x] Replace the placeholder `cam-frame.jpg` with the approved camera image.
      Resolved 2026-07-24: Unsplash photo `1700706258027-8d46bb5acef4` by Aaron M
      ("a view of a highway intersection from the top of a building" - the High
      Five Interchange, US-75 at I-635, Dallas), Unsplash License (free for
      commercial use, no attribution required), fetched at 1600x900 crop.
- [x] Create and verify the production `og:image` (brand logo at
      `/brand/coasta-logo.jpg`, wired in layout metadata).
- [ ] Check social previews on the intended launch domains.
- [ ] Re-run Lighthouse on production hosting (local medians pass: LCP 1.82s,
      CLS 0.0000; local outliers attributed to machine contention).

## OpenStreetMap licensing

- [ ] Keep the visible `© OpenStreetMap contributors` credit linked to the copyright page.
- [ ] Review whether the public deployment triggers ODbL share alike obligations for the derived geometry database.
- [ ] If publication is required, publish the derived geometry and `data/PROVENANCE.md` at a stable public URL before launch.
- [ ] Record the licensing decision and reviewer.
