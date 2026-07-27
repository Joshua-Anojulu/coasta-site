import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const root = process.cwd()
const publicRoot = path.resolve(root, "public")
const manifestPath = path.resolve(root, "data/assets-manifest.json")

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? filesUnder(entryPath) : [entryPath]
    }),
  )
  return nested.flat()
}

function requireValue(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function publicFile(assetPath) {
  const resolved = path.resolve(publicRoot, assetPath.replace(/^\//, ""))
  requireValue(
    resolved.startsWith(`${publicRoot}${path.sep}`),
    `Asset path escapes public: ${assetPath}`,
  )
  return resolved
}

async function prepareBrandFormats() {
  const source = path.join(publicRoot, "brand", "coasta-logo.jpg")
  const avif = path.join(publicRoot, "brand", "coasta-logo.avif")
  const webp = path.join(publicRoot, "brand", "coasta-logo.webp")
  const pipeline = sharp(source).resize({ width: 360, withoutEnlargement: true })

  await Promise.all([
    pipeline.clone().avif({ quality: 62 }).toFile(avif),
    pipeline.clone().webp({ quality: 76 }).toFile(webp),
  ])
  console.info("Prepared brand formats: coasta-logo.avif, coasta-logo.webp")
}

async function verifyCopy() {
  const roots = ["app", "components"].map((directory) => path.resolve(root, directory))
  const files = (await Promise.all(roots.map(filesUnder)))
    .flat()
    .filter((file) => /\.(ts|tsx)$/.test(file))
  const bannedMagnitude = /\b(thousands|millions|hundreds)\b/i

  for (const file of files) {
    const source = await readFile(file, "utf8")
    requireValue(!/[\u2013\u2014]/u.test(source), `Banned dash in ${file}`)
    requireValue(!bannedMagnitude.test(source), `Unverified magnitude word in ${file}`)
  }
  console.info(`Copy preflight: ${files.length} source files clear`)
}

async function verifyPublicCameraFormats() {
  const files = await filesUnder(publicRoot)
  const cameraJpegs = files.filter(
    (file) =>
      /\.(jpe?g)$/i.test(file) &&
      !file.startsWith(`${path.join(publicRoot, "brand")}${path.sep}`),
  )
  requireValue(cameraJpegs.length === 0, "Camera source JPEG files may not ship")
}

async function verifyManifest() {
  const raw = JSON.parse(await readFile(manifestPath, "utf8"))
  requireValue(Array.isArray(raw.slots), "Asset manifest must contain slots")
  const ids = new Set()
  const totals = new Map()
  const unfilled = []
  let eagerAssets = 1

  for (const slot of raw.slots) {
    requireValue(typeof slot.id === "string", "Every asset slot needs an id")
    requireValue(!ids.has(slot.id), `Duplicate asset slot: ${slot.id}`)
    ids.add(slot.id)
    requireValue(Number.isInteger(slot.byteBudget), `Invalid budget: ${slot.id}`)
    totals.set(slot.chapter, (totals.get(slot.chapter) ?? 0) + slot.byteBudget)

    if (slot.status === "unfilled") {
      unfilled.push(slot)
      continue
    }

    requireValue(slot.status === "filled", `Invalid slot status: ${slot.id}`)
    requireValue(typeof slot.avifPath === "string", `Missing AVIF: ${slot.id}`)
    requireValue(typeof slot.webpPath === "string", `Missing WebP: ${slot.id}`)
    requireValue(typeof slot.credit === "string", `Missing credit: ${slot.id}`)
    const [avifStats, webpStats] = await Promise.all([
      stat(publicFile(slot.avifPath)),
      stat(publicFile(slot.webpPath)),
    ])
    requireValue(avifStats.size <= slot.byteBudget, `AVIF budget exceeded: ${slot.id}`)
    requireValue(webpStats.size <= slot.byteBudget, `WebP budget exceeded: ${slot.id}`)
    if (slot.loading === "eager") {
      eagerAssets += 1
    }
  }

  const limits = new Map([
    ["CH1", 256_000],
    ["CH2", 512_000],
    ["CH3", 204_800],
    ["CH4", 204_800],
    ["CH5", 204_800],
    ["CH6", 204_800],
  ])
  for (const [chapter, total] of totals) {
    requireValue(total <= limits.get(chapter), `Section budget exceeded: ${chapter}`)
  }
  const declaredTotal = [...totals.values()].reduce((sum, value) => sum + value, 0)
  requireValue(declaredTotal < 1_638_400, "Total camera asset budget must stay under 1.6 MB")
  requireValue(eagerAssets <= 2, "Initial viewport may load no more than two images")

  console.info(`Asset slot report: ${unfilled.length} unfilled`)
  for (const slot of unfilled) {
    console.info(`- ${slot.id} (${slot.chapter})`)
  }
  console.info("Unfilled slots render declared build gaps. Build continues.")
}

await prepareBrandFormats()
await Promise.all([verifyCopy(), verifyPublicCameraFormats(), verifyManifest()])
