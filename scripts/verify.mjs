// Production build + unit tests, into a scratch output directory.
//
// `next dev` and `next build` both write .next. Running a verification build
// while the dev server is up overwrites the chunks it is serving, its
// stylesheet 404s, and the page renders as unstyled raw DOM. That looks like a
// CSS bug, is not one, and cost three rounds of confusion before it was
// diagnosed. Building into .next-verify makes the collision impossible.
//
// Cross-platform on purpose: an inline VAR=value prefix does not work in
// PowerShell or cmd, so the env var is set here rather than in the npm script.
import { spawnSync } from "node:child_process"

const DIST = ".next-verify"
const env = { ...process.env, COASTA_DIST_DIR: DIST }

// shell: true is required on Windows. npx and the local .bin entries are .cmd
// shims, and since Node 20 spawn refuses to execute those without a shell,
// failing instantly with no output at all.
const steps = [
  ["next build", "npx next build"],
  ["vitest", "npx vitest run"],
]

for (const [label, command] of steps) {
  console.info(`\n=== ${label} (output: ${DIST}) ===`)
  const result = spawnSync(command, { stdio: "inherit", env, shell: true })
  if (result.error) {
    console.error(`\nverify could not start ${label}: ${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) {
    console.error(`\nverify failed at: ${label}`)
    process.exit(result.status ?? 1)
  }
}

console.info("\nverify passed. The dev server's .next was not touched.")
