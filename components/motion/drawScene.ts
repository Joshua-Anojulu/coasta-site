/**
 * Scene primitives for the night drive.
 *
 * Split out of DriveRoad so the render loop stays readable and each object can
 * be reasoned about on its own. Everything here is drawn geometry: no sprites,
 * no images, no gradients standing in for a subject.
 */

export type Projector = (lateral: number, z: number) => { x: number; y: number }

export type VehicleKind = "car" | "truck" | "police" | "stalled" | "wreck"

type Ctx = CanvasRenderingContext2D

const BODY = "rgba(16, 20, 27, "
const ROOF_LIGHT = "rgba(155, 190, 220, "

/**
 * A vehicle seen from behind. A trapezoid body with a narrower roof, a glass
 * band, taillights and a ground shadow is enough to read as a car at this
 * scale, and it costs nothing to draw.
 */
export function drawVehicle(
  ctx: Ctx,
  opts: {
    x: number
    ground: number
    halfW: number
    bodyH: number
    fade: number
    kind: VehicleKind
    /** 0..1, drives the alternating flash on police and hazard lights. */
    phase?: number
  },
): void {
  const { x, ground, halfW, bodyH, fade, kind } = opts
  const phase = opts.phase ?? 0
  const roofInset = kind === "truck" ? 0.1 : 0.26
  const roofY = ground - bodyH

  ctx.globalCompositeOperation = "source-over"

  // Ground shadow. Without it the vehicle floats above the tarmac.
  const shadow = ctx.createRadialGradient(x, ground, 0, x, ground, halfW * 1.6)
  shadow.addColorStop(0, `rgba(0, 0, 0, ${0.6 * fade})`)
  shadow.addColorStop(1, "rgba(0, 0, 0, 0)")
  ctx.fillStyle = shadow
  ctx.beginPath()
  ctx.ellipse(x, ground, halfW * 1.6, halfW * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Wheels first, so the body sits over them and only the tyre bottoms show.
  // A car with no visible contact patch reads as a floating box no matter how
  // good the rest of the silhouette is.
  if (bodyH > 5) {
    ctx.fillStyle = `rgba(6, 8, 11, ${0.9 * fade})`
    for (const side of [-1, 1]) {
      const wx = x + side * halfW * 0.78
      ctx.beginPath()
      ctx.ellipse(wx, ground, halfW * 0.2, bodyH * 0.13, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Body as a curved silhouette rather than a trapezoid: tapered shoulders, a
  // rounded roof, and a slight tuck at the sills. Straight edges are what made
  // the earlier version read as geometry instead of a vehicle.
  const shoulderY = roofY + bodyH * 0.42
  const sillY = ground - bodyH * 0.06
  ctx.fillStyle = `${BODY}${Math.min(1, 0.7 + fade * 0.3)})`
  ctx.beginPath()
  ctx.moveTo(x - halfW * 0.96, sillY)
  ctx.lineTo(x - halfW, shoulderY + bodyH * 0.14)
  // Shoulder into roof, both sides, with the roof crowned slightly.
  ctx.quadraticCurveTo(x - halfW * 0.99, roofY + bodyH * 0.06, x - halfW * (1 - roofInset), roofY)
  ctx.quadraticCurveTo(x, roofY - bodyH * 0.07, x + halfW * (1 - roofInset), roofY)
  ctx.quadraticCurveTo(x + halfW * 0.99, roofY + bodyH * 0.06, x + halfW, shoulderY + bodyH * 0.14)
  ctx.lineTo(x + halfW * 0.96, sillY)
  ctx.quadraticCurveTo(x, ground + bodyH * 0.04, x - halfW * 0.96, sillY)
  ctx.closePath()
  ctx.fill()

  // Rear glass, following the same curve as the roof.
  if (kind !== "truck" && bodyH > 6) {
    ctx.fillStyle = `rgba(44, 58, 76, ${0.55 * fade})`
    ctx.beginPath()
    ctx.moveTo(x - halfW * 0.78, shoulderY)
    ctx.quadraticCurveTo(x, roofY + bodyH * 0.06, x + halfW * 0.78, shoulderY)
    ctx.lineTo(x + halfW * 0.7, shoulderY + bodyH * 0.05)
    ctx.quadraticCurveTo(x, shoulderY + bodyH * 0.14, x - halfW * 0.7, shoulderY + bodyH * 0.05)
    ctx.closePath()
    ctx.fill()
  }

  // Bumper line: one hairline across the lower body. Cheap, and it breaks up
  // the mass the way a real rear end does.
  if (bodyH > 8) {
    ctx.strokeStyle = `rgba(120, 140, 165, ${0.18 * fade})`
    ctx.lineWidth = Math.max(0.5, bodyH * 0.03)
    ctx.beginPath()
    ctx.moveTo(x - halfW * 0.9, ground - bodyH * 0.24)
    ctx.lineTo(x + halfW * 0.9, ground - bodyH * 0.24)
    ctx.stroke()
  }

  // Roof edge catching the gantry light overhead.
  ctx.strokeStyle = `${ROOF_LIGHT}${0.34 * fade})`
  ctx.lineWidth = Math.max(0.6, 1.3 * fade)
  ctx.beginPath()
  ctx.moveTo(x - halfW * (1 - roofInset), roofY)
  ctx.lineTo(x + halfW * (1 - roofInset), roofY)
  ctx.stroke()

  // Taillights.
  ctx.globalCompositeOperation = "lighter"
  const lampY = ground - bodyH * (kind === "truck" ? 0.24 : 0.46)
  const lampW = Math.max(1.2, halfW * 0.3)
  const lampH = Math.max(0.9, bodyH * 0.14)
  const bloomR = Math.min(Math.max(3, halfW * 0.9), 26)

  for (const side of [-1, 1]) {
    const lx = x + side * halfW * 0.66
    const bloom = ctx.createRadialGradient(lx, lampY, 0, lx, lampY, bloomR)
    bloom.addColorStop(0, `rgba(255, 66, 52, ${0.44 * fade})`)
    bloom.addColorStop(1, "rgba(255, 66, 52, 0)")
    ctx.fillStyle = bloom
    ctx.beginPath()
    ctx.arc(lx, lampY, bloomR, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(255, 94, 76, ${Math.min(1, 0.78 + fade * 0.22)})`
    ctx.fillRect(lx - lampW / 2, lampY - lampH / 2, lampW, lampH)
  }

  // Hazard flashers on a stopped vehicle: both corners, in unison, amber.
  if (kind === "stalled" || kind === "wreck") {
    const on = phase % 1 < 0.5
    if (on) {
      for (const side of [-1, 1]) {
        const hx = x + side * halfW * 0.92
        const hazard = ctx.createRadialGradient(hx, lampY, 0, hx, lampY, bloomR * 1.3)
        hazard.addColorStop(0, `rgba(255, 176, 0, ${0.75 * fade})`)
        hazard.addColorStop(1, "rgba(255, 176, 0, 0)")
        ctx.fillStyle = hazard
        ctx.beginPath()
        ctx.arc(hx, lampY, bloomR * 1.3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // Police light bar: blue and red alternating across the roof. This is the
  // thing a driver actually recognises from distance, so it is drawn as a bar
  // rather than as a generic glow.
  if (kind === "police") {
    const barY = roofY - Math.max(1.5, bodyH * 0.16)
    const barHalf = halfW * 0.62
    const barH = Math.max(1.4, bodyH * 0.14)
    ctx.fillStyle = `rgba(30, 38, 50, ${0.9 * fade})`
    ctx.fillRect(x - barHalf, barY - barH / 2, barHalf * 2, barH)

    const blueLeft = phase % 1 < 0.5
    const lamps: Array<[number, string]> = [
      [-barHalf * 0.5, blueLeft ? "60, 130, 255" : "18, 30, 55"],
      [barHalf * 0.5, blueLeft ? "70, 20, 24" : "255, 60, 48"],
    ]
    for (const [dx, rgb] of lamps) {
      const g = ctx.createRadialGradient(x + dx, barY, 0, x + dx, barY, bloomR * 2.1)
      g.addColorStop(0, `rgba(${rgb}, ${0.85 * fade})`)
      g.addColorStop(1, `rgba(${rgb}, 0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x + dx, barY, bloomR * 2.1, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(${rgb}, ${Math.min(1, 0.8 + fade * 0.2)})`
      ctx.fillRect(x + dx - lampW * 0.6, barY - barH * 0.35, lampW * 1.2, barH * 0.7)
    }
  }
}

/**
 * Debris: a few angular fragments low on the surface with a faint scatter of
 * smaller pieces. Deterministic shapes so it does not shimmer between frames.
 */
export function drawDebris(
  ctx: Ctx,
  opts: { x: number; ground: number; scale: number; fade: number },
): void {
  const { x, ground, scale, fade } = opts
  ctx.globalCompositeOperation = "source-over"

  const pieces: Array<[number, number, number]> = [
    [-0.9, 0, 0.5],
    [-0.1, -0.12, 0.72],
    [0.7, 0.04, 0.42],
    [1.35, -0.05, 0.3],
    [-1.6, 0.06, 0.26],
  ]

  for (const [dx, dy, size] of pieces) {
    const px = x + dx * scale
    const py = ground + dy * scale
    const s = Math.max(0.8, size * scale * 0.5)

    ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * fade})`
    ctx.beginPath()
    ctx.ellipse(px, py + s * 0.4, s * 1.5, s * 0.42, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(96, 108, 122, ${Math.min(1, 0.5 + fade * 0.5)})`
    ctx.beginPath()
    ctx.moveTo(px - s, py)
    ctx.lineTo(px - s * 0.2, py - s * 0.85)
    ctx.lineTo(px + s * 0.9, py - s * 0.15)
    ctx.lineTo(px + s * 0.25, py + s * 0.3)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = `rgba(170, 195, 220, ${0.35 * fade})`
    ctx.lineWidth = Math.max(0.5, s * 0.12)
    ctx.stroke()
  }
}

/** A short row of cones tapering a closed lane. */
export function drawCones(
  ctx: Ctx,
  opts: { proj: Projector; lateral: number; z: number; count: number; fade: number },
): void {
  const { proj, lateral, z, count, fade } = opts
  ctx.globalCompositeOperation = "source-over"
  for (let i = 0; i < count; i += 1) {
    const cz = z + i * 7
    const p = proj(lateral + i * 0.22, cz)
    const scale = Math.max(1.2, (0.55 * (proj(0, 1).y - proj(0, 2).y)) / cz)
    const h = scale * 3.2
    const w = scale * 1.5
    ctx.fillStyle = `rgba(226, 96, 30, ${Math.min(1, 0.55 + fade * 0.45)})`
    ctx.beginPath()
    ctx.moveTo(p.x, p.y - h)
    ctx.lineTo(p.x + w, p.y)
    ctx.lineTo(p.x - w, p.y)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = `rgba(240, 240, 240, ${0.6 * fade})`
    ctx.fillRect(p.x - w * 0.62, p.y - h * 0.58, w * 1.24, h * 0.16)
  }
}

/**
 * Smooth 0..1 ramp. Used for the lane change so the car eases across rather
 * than snapping, which is the difference between reading as a driver and
 * reading as a teleport.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
