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

- [ ] Replace the placeholder `cam-frame.jpg` with the approved camera image.
- [ ] Create and verify the production `og:image`.
- [ ] Check social previews on the intended launch domains.

## OpenStreetMap licensing

- [ ] Keep the visible `© OpenStreetMap contributors` credit linked to the copyright page.
- [ ] Review whether the public deployment triggers ODbL share alike obligations for the derived geometry database.
- [ ] If publication is required, publish the derived geometry and `data/PROVENANCE.md` at a stable public URL before launch.
- [ ] Record the licensing decision and reviewer.
