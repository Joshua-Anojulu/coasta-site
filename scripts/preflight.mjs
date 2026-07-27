import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const root = process.cwd()
const publicRoot = path.resolve(root, "public")

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

await prepareBrandFormats()
await Promise.all([verifyCopy(), verifyPublicCameraFormats()])
