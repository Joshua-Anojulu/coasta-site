// Emits the ODbL copy of the derived DFW geometry database to
// public/data/dfw-geometry.odbl.json.
//
// Why this exists: the site ships the derived geometry to every visitor in order
// to render the coverage map. Under ODbL that is Public Use of a Derivative
// Database, which obliges us to offer the database itself under ODbL, not merely
// to attribute OpenStreetMap. Attribution alone does not discharge share alike,
// and this repository is private, so the repo is not publication either. Serving
// the dataset from the site at a stable URL is what actually discharges it.
//
// Run: npm run export:geodata
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { createHash } from "node:crypto"

const SRC = "data/dfw-geometry.snapshot.ts"
const OUT_DIR = "public/data"
const OUT = `${OUT_DIR}/dfw-geometry.odbl.json`

const source = readFileSync(SRC, "utf8")

function extractConst(name) {
  // The snapshot is generated, never hand edited, and every export is a single
  // JSON literal on one line. Anchor on that rather than parsing TypeScript.
  // The literal is followed by a TypeScript suffix (`as const`, a trailing
  // semicolon, or both), which must be stripped before JSON.parse sees it.
  const match = source.match(new RegExp(`^export const ${name} = (.+)$`, "m"))
  if (match === null) {
    throw new Error(`could not extract ${name} from ${SRC}`)
  }
  const literal = match[1].replace(/\s*as\s+const\s*;?\s*$/, "").replace(/;\s*$/, "")
  try {
    return JSON.parse(literal)
  } catch (error) {
    throw new Error(`${name}: literal did not parse as JSON (${error.message})`)
  }
}

function extractHeaderField(label) {
  const match = source.match(new RegExp(`^${label}: (.+)$`, "m"))
  return match === null ? null : match[1].trim()
}

const roadSegments = extractConst("ROAD_SEGMENTS")
const water = extractConst("WATER")
const cameras = extractConst("CAMERAS")
const bounds = extractConst("BOUNDS")

const queryMatch = source.match(/Exact Overpass query:\n([\s\S]*?)\n\*\//)

const database = {
  license: {
    name: "Open Database License (ODbL) v1.0",
    url: "https://opendatacommons.org/licenses/odbl/1-0/",
    attribution: "© OpenStreetMap contributors",
    attributionUrl: "https://www.openstreetmap.org/copyright",
    notice:
      "This is a Derivative Database of OpenStreetMap data, offered under ODbL v1.0 " +
      "as required by the share alike term. You may copy, modify and use it, including " +
      "commercially, provided you attribute OpenStreetMap contributors and offer any " +
      "derivative database you publicly use under the same licence.",
  },
  source: {
    dataset: "OpenStreetMap",
    endpoint: extractHeaderField("Endpoint"),
    snapshotDate: extractHeaderField("Snapshot"),
    rawResponseSha256: extractHeaderField("Raw response sha256"),
    overpassQuery: queryMatch === null ? null : queryMatch[1].trim(),
    boundingBox: bounds,
  },
  derivation: {
    description:
      "Motorway and trunk ways plus water features were fetched from Overpass at the pinned " +
      "snapshot date, chained into continuous segments, simplified, and tagged with route " +
      "references. Camera positions are computed against these OpenStreetMap road coordinates " +
      "and are therefore part of the derivative database.",
    roadSegmentCount: roadSegments.length,
    waterRingCount: water.rings.length,
    cameraCount: cameras.length,
  },
  data: { roadSegments, water, cameras, bounds },
}

mkdirSync(OUT_DIR, { recursive: true })
const json = JSON.stringify(database, null, 1) + "\n"
writeFileSync(OUT, json)

const bytes = Buffer.byteLength(json)
console.log(`wrote ${OUT}`)
console.log(`  roads ${roadSegments.length}, water rings ${water.rings.length}, cameras ${cameras.length}`)
console.log(`  ${Math.round(bytes / 1024)} KB, sha256 ${createHash("sha256").update(json).digest("hex").slice(0, 16)}`)
