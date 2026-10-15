# Coasta site

The waitlist website for Coasta, a Dallas-Fort Worth startup that reads roadside traffic
cameras and alerts drivers to changing road conditions.

**Status: in development, not launched.** There is no public deployment yet. The open
items are listed in [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md).

I am the sole frontend engineer on this site: the design system, layout, motion, the
waitlist flow and its tests. Coasta's models, cameras and data pipeline are not in this
repository.

## The idea

The page is built as "the camera's own eye." Instead of a marketing page about a traffic
camera product, the visitor looks through the same kind of view Coasta's models see: dark
monitor stages carry the field footage, light plates slow down for explanation, and a thin
scan wipe moves between chapters. It targets DFW drivers only and asks for one action,
joining the waitlist.

The design system is in [`DESIGN.md`](DESIGN.md), and the locked plan it implements is
[`PLAN.md`](PLAN.md). `docs/DESIGN.md` and `docs/archive/` hold the earlier "Clearsky"
direction, kept for the record.

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4, with Motion for the scroll-linked chapter animation
- Neon serverless Postgres for the waitlist, Upstash Redis for rate limiting, Zod for input
  validation
- Vitest for unit tests, Playwright with axe-core for accessibility tests

## Layout

```text
app/          routes, layout, global styles and the waitlist API
components/   chapters, navigation, footer, waitlist form, motion helpers
styles/       foundation, chapter, interaction and drive styles
lib/          waitlist logic, HTTP helpers, observability
data/         provenance, licensing and observability notes
scripts/      preflight, migration and verification scripts
tests/        unit tests and accessibility tests
docs/         launch checklist and the archived earlier design
```

## Running it locally

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit tests (Vitest)
npm run test:a11y    # accessibility tests (Playwright + axe-core)
npm run typecheck
```

`npm run build` runs a preflight first. It prepares the brand image formats and refuses to
build if the copy contains unverified magnitude words or if raw camera JPEG files are about
to ship.

## Imagery and licensing

Image use is default-deny: a frame is used only when its source, permission basis and
terms are recorded in [`data/PROVENANCE.md`](data/PROVENANCE.md). Live state traffic-camera
stills are not reused without written permission.

The Coasta name and brand marks belong to Coasta. No open-source license is granted for
this repository.
