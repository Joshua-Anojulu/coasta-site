/**
 * Scene primitives for the night drive.
 *
 * Split out of DriveRoad so the render loop stays readable and each object can
 * be reasoned about on its own. Everything here is drawn geometry: no sprites,
 * no images, no gradients standing in for a subject.
 */

export type Projector = (lateral: number, z: number) => { x: number; y: number }

/**
 * The silhouette. Separate from `kind` on purpose: a stalled vehicle can be any
 * shape, and a lorry can be moving or wrecked. Conflating the two is what made
 * every vehicle on the road the same cutout.
 */
export type BodyType = "sedan" | "hatch" | "suv" | "pickup" | "van" | "lorry"

/** The behaviour layered on top of a silhouette: lights, flashers, damage. */
export type VehicleKind = "moving" | "police" | "stalled" | "wreck"

type Ctx = CanvasRenderingContext2D

type LampStyle = "block" | "tall" | "corner" | "cluster"

type Profile = {
  /** Real dimensions, in metres. Everything else is a fraction of these, so a
   *  vehicle can never end up wider than it is long or squatter than it is. */
  widthM: number
  heightM: number
  /** Only used off-canvas, to check that no two vehicles occupy the same
   *  stretch of the same lane. See tests/drive-traffic.test.ts. */
  lengthM: number
  /** Roof half-width as a fraction of body half-width. 1 is a box. */
  roof: number
  /** Beltline height, as a fraction of total height above the road. */
  belt: number
  /** Roof crown, as a fraction of height. */
  crown: number
  /** Greenhouse depth above the beltline, as a fraction of height. 0 = none. */
  glass: number
  lamp: LampStyle
  /** Lamp centre height, as a fraction of total height. */
  lampY: number
  /** How much of the beam this body returns. A van or a trailer is a big flat
   *  slab well outside the hot spot of a dipped beam, so it comes back darker
   *  than a car does however pale it is painted. Without this a white van at
   *  ten metres is the brightest thing on the page. */
  reflect: number
}

/**
 * Six real body types with their real proportions.
 *
 * The previous version drew every vehicle at 1.84m wide by 0.72m tall, which is
 * a car half the height it should be. That is why near traffic read as dark
 * slabs: nothing about the outline said "car", so all that was left was two red
 * rectangles on a rounded box.
 */
export const PROFILES: Record<BodyType, Profile> = {
  sedan: { belt: 0.52, crown: 0.05, glass: 0.34, heightM: 1.46, lamp: "block", lampY: 0.34, lengthM: 4.7, reflect: 1, roof: 0.54, widthM: 1.84 },
  hatch: { belt: 0.5, crown: 0.04, glass: 0.36, heightM: 1.52, lamp: "tall", lampY: 0.46, lengthM: 4.1, reflect: 1, roof: 0.62, widthM: 1.76 },
  suv: { belt: 0.5, crown: 0.03, glass: 0.38, heightM: 1.78, lamp: "tall", lampY: 0.5, lengthM: 4.8, reflect: 0.88, roof: 0.78, widthM: 1.94 },
  pickup: { belt: 0.62, crown: 0.02, glass: 0.22, heightM: 1.9, lamp: "corner", lampY: 0.3, lengthM: 5.8, reflect: 0.82, roof: 0.58, widthM: 2.02 },
  van: { belt: 0.62, crown: 0.02, glass: 0.16, heightM: 2.4, lamp: "tall", lampY: 0.32, lengthM: 5.4, reflect: 0.72, roof: 0.9, widthM: 2 },
  lorry: { belt: 0.9, crown: 0.01, glass: 0, heightM: 3.9, lamp: "cluster", lampY: 0.08, lengthM: 16.5, reflect: 0.66, roof: 0.97, widthM: 2.55 },
}

/**
 * Real paint colours, not night colours.
 *
 * At night a car's colour is not a property of the car, it is a property of how
 * much light is falling on it. At two hundred metres everything is a black
 * shape with red lights on it; the paint only arrives when your headlights
 * reach it. So these are the colours in daylight and the renderer multiplies
 * them by the light actually landing on the vehicle, which means colour blooms
 * as traffic comes towards you and drains away again behind.
 *
 * Weighted the way a real car park is: silver, white, grey and black are most
 * of the road, and the saturated ones are the exception that makes you notice.
 */
const PAINTS: ReadonlyArray<readonly [number, number, number]> = [
  [214, 217, 220], // silver
  [38, 41, 46], // graphite
  [236, 238, 240], // white
  [30, 44, 72], // deep navy
  [70, 74, 80], // gunmetal
  [104, 40, 42], // dark red
  [216, 219, 222], // silver again, so the saturated ones stay rare
  [32, 58, 50], // bottle green
  [46, 48, 52], // near black
  [92, 76, 58], // bronze
]

/** Ambient sky and sodium spill, before our headlights reach anything. */
const AMBIENT = 0.14
/** How much of a paint colour a full dipped beam returns. Deliberately short
 *  of the daylight value: a headlight is one hard light from one direction, so
 *  even a lit car reads as a darker version of its colour, never as itself. */
const BEAM = 0.5

const ROOF_LIGHT = "rgba(155, 190, 220, "

/**
 * Pixels per metre for a vehicle at this distance, clamped so a near one cannot
 * fill the frame.
 *
 * The clamp is a single uniform factor rather than separate width and height
 * caps. Capping each axis on its own means they bind at different distances, so
 * a close vehicle stops growing wider while it is still growing taller and the
 * silhouette visibly distorts.
 */
export function vehicleScale(
  pxPerMetre: number,
  body: BodyType,
  viewport: { w: number; h: number },
): number {
  const p = PROFILES[body]
  // A quarter of the frame's width, or a bit under half its height. Anything
  // larger and the vehicle you are passing becomes the subject of the page
  // instead of the road and the hazard on it.
  return Math.min(pxPerMetre, (viewport.w * 0.26) / p.widthM, (viewport.h * 0.46) / p.heightM)
}

/**
 * A vehicle seen from behind, built from its real proportions.
 *
 * The silhouette, the greenhouse and the lamp signature all come from the body
 * type, because at night a lamp signature is most of how you tell one vehicle
 * from another. Everything is drawn from `scale` (pixels per metre) so the
 * caller cannot get the aspect ratio wrong.
 */
export function drawVehicle(
  ctx: Ctx,
  opts: {
    x: number
    ground: number
    /** Pixels per metre at this vehicle's distance. */
    scale: number
    fade: number
    body: BodyType
    kind?: VehicleKind
    /** 0..1, drives the alternating flash on police and hazard lights. */
    phase?: number
    /** Any integer; picks the body tint so consecutive vehicles differ. */
    variant?: number
    /** 0..1 wash from our own headlights. 1 is directly in front of you. */
    lit?: number
  },
): void {
  const { x, ground, scale, fade, body } = opts
  const kind = opts.kind ?? "moving"
  const phase = opts.phase ?? 0
  const lit = opts.lit ?? 0
  const p = PROFILES[body]

  const halfW = (p.widthM / 2) * scale
  const height = p.heightM * scale
  const roofY = ground - height
  const beltY = ground - height * p.belt
  const sillY = ground - height * 0.07
  const roofHalf = halfW * p.roof
  const paint = PAINTS[Math.abs(opts.variant ?? 0) % PAINTS.length] ?? PAINTS[0]!
  // The whole colour model: paint times the light landing on it.
  const k = AMBIENT + BEAM * lit * p.reflect
  const body0 = Math.round(paint[0] * k)
  const body1 = Math.round(paint[1] * k)
  const body2 = Math.round(paint[2] * k)

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
  // A vehicle with no visible contact patch reads as a floating box no matter
  // how good the rest of the silhouette is.
  if (height > 8) {
    const track = body === "lorry" ? 0.86 : 0.8
    ctx.fillStyle = `rgba(6, 8, 11, ${0.9 * fade})`
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(x + side * halfW * track, ground, halfW * 0.2, height * 0.05, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Body: flank up to the beltline, shoulders curving into the roof, a slight
  // tuck at the sills. Straight edges are what made the earlier version read as
  // geometry instead of a vehicle.
  // Shaded top to bottom rather than filled flat. One headlight from one
  // direction does not light a car evenly: the roof stays close to ambient and
  // the lower body takes the beam. Filled flat, a silver car at ten metres came
  // out as a pale bar of soap with no form in it at all.
  const shade = ctx.createLinearGradient(x, roofY, x, ground)
  const roofK = AMBIENT + BEAM * lit * p.reflect * 0.28
  shade.addColorStop(0, `rgb(${Math.round(paint[0] * roofK)}, ${Math.round(paint[1] * roofK)}, ${Math.round(paint[2] * roofK)})`)
  shade.addColorStop(0.62, `rgb(${body0}, ${body1}, ${body2})`)
  shade.addColorStop(1, `rgb(${Math.round(body0 * 0.7)}, ${Math.round(body1 * 0.7)}, ${Math.round(body2 * 0.7)})`)
  ctx.globalAlpha = Math.min(1, 0.72 + fade * 0.28)
  ctx.fillStyle = shade
  ctx.beginPath()
  ctx.moveTo(x - halfW * 0.97, sillY)
  ctx.lineTo(x - halfW, beltY)
  ctx.quadraticCurveTo(x - halfW * 0.995, roofY + height * 0.05, x - roofHalf, roofY)
  ctx.quadraticCurveTo(x, roofY - height * p.crown, x + roofHalf, roofY)
  ctx.quadraticCurveTo(x + halfW * 0.995, roofY + height * 0.05, x + halfW, beltY)
  ctx.lineTo(x + halfW * 0.97, sillY)
  ctx.quadraticCurveTo(x, ground + height * 0.02, x - halfW * 0.97, sillY)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  // Rear glass, following the roof curve. A lorry has none, which is most of
  // why it reads as a lorry.
  if (p.glass > 0 && height > 10) {
    const glassBottom = beltY
    const glassTop = beltY - height * p.glass
    ctx.fillStyle = `rgba(44, 58, 76, ${0.55 * fade})`
    ctx.beginPath()
    ctx.moveTo(x - halfW * 0.78, glassBottom)
    ctx.quadraticCurveTo(x, glassTop - height * 0.02, x + halfW * 0.78, glassBottom)
    ctx.quadraticCurveTo(x, glassBottom + height * 0.05, x - halfW * 0.78, glassBottom)
    ctx.closePath()
    ctx.fill()
  }

  // A lorry's rear doors: the vertical split and its hinges. Two lines, and the
  // shape stops being a plain box.
  if (body === "lorry" && height > 24) {
    ctx.strokeStyle = `rgba(118, 138, 160, ${0.22 * fade})`
    ctx.lineWidth = Math.max(0.6, scale * 0.02)
    ctx.beginPath()
    ctx.moveTo(x, roofY + height * 0.04)
    ctx.lineTo(x, ground - height * 0.14)
    ctx.stroke()
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(x + side * halfW * 0.93, roofY + height * 0.06)
      ctx.lineTo(x + side * halfW * 0.93, ground - height * 0.16)
      ctx.stroke()
    }
    // Underrun bar and mudflaps, the things that actually sit at eye level.
    ctx.fillStyle = `rgba(9, 11, 15, ${0.85 * fade})`
    ctx.fillRect(x - halfW * 0.9, ground - height * 0.13, halfW * 1.8, height * 0.03)
  }

  // Bumper line: one hairline across the lower body. Cheap, and it breaks up
  // the mass the way a real rear end does.
  if (height > 14 && body !== "lorry") {
    ctx.strokeStyle = `rgba(120, 140, 165, ${0.18 * fade})`
    ctx.lineWidth = Math.max(0.5, height * 0.014)
    ctx.beginPath()
    ctx.moveTo(x - halfW * 0.9, ground - height * 0.2)
    ctx.lineTo(x + halfW * 0.9, ground - height * 0.2)
    ctx.stroke()
  }

  // Number plate, lit by its own lamp. Only worth drawing when it would be more
  // than a couple of pixels, but at that size it is unmistakably a vehicle.
  if (height > 30) {
    const plateW = halfW * 0.44
    const plateH = height * 0.055
    const plateY = ground - height * (body === "lorry" ? 0.19 : 0.15)
    ctx.fillStyle = `rgba(228, 232, 226, ${0.5 * fade})`
    ctx.fillRect(x - plateW / 2, plateY - plateH, plateW, plateH)
  }

  // Roof edge catching the gantry light overhead.
  ctx.strokeStyle = `${ROOF_LIGHT}${0.34 * fade})`
  ctx.lineWidth = Math.max(0.6, 1.3 * fade)
  ctx.beginPath()
  ctx.moveTo(x - roofHalf, roofY)
  ctx.lineTo(x + roofHalf, roofY)
  ctx.stroke()

  drawLamps(ctx, { body, fade, ground, halfW, height, p, scale, x })

  ctx.globalCompositeOperation = "lighter"
  const bloomR = Math.min(Math.max(3, halfW * 0.9), 26)
  const lampY = ground - height * p.lampY

  // Hazard flashers on a stopped vehicle: both corners, in unison, amber.
  if (kind === "stalled" || kind === "wreck") {
    if (phase % 1 < 0.5) {
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
    // Rear chevrons. The light bar says "emergency" but the chevrons are what
    // says "stopped, on the shoulder, walk around it", and they hold their
    // read at sizes where nothing else on the bodywork survives.
    if (height > 20) {
      ctx.globalCompositeOperation = "source-over"
      ctx.save()
      ctx.beginPath()
      ctx.rect(x - halfW * 0.88, ground - height * 0.34, halfW * 1.76, height * 0.17)
      ctx.clip()
      const bandY = ground - height * 0.34
      const bandH = height * 0.17
      const step = halfW * 0.42
      for (let i = -4; i <= 4; i += 1) {
        ctx.fillStyle =
          i % 2 === 0
            ? `rgba(${Math.round(226 * (k + 0.2))}, ${Math.round(150 * (k + 0.2))}, ${Math.round(24 * (k + 0.2))}, ${fade})`
            : `rgba(${Math.round(232 * (k + 0.2))}, ${Math.round(236 * (k + 0.2))}, ${Math.round(238 * (k + 0.2))}, ${fade})`
        ctx.beginPath()
        ctx.moveTo(x + i * step, bandY)
        ctx.lineTo(x + i * step + step * 0.6, bandY)
        ctx.lineTo(x + i * step + step * 0.6 - bandH * 0.55, bandY + bandH)
        ctx.lineTo(x + i * step - bandH * 0.55, bandY + bandH)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    }

    const barY = roofY - Math.max(1.5, height * 0.07)
    const barHalf = halfW * 0.62
    const barH = Math.max(1.4, height * 0.06)
    const lampW = Math.max(1.2, halfW * 0.3)
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = `rgba(30, 38, 50, ${0.9 * fade})`
    ctx.fillRect(x - barHalf, barY - barH / 2, barHalf * 2, barH)

    ctx.globalCompositeOperation = "lighter"
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

  ctx.globalCompositeOperation = "source-over"
}

/**
 * Taillight signatures.
 *
 * At night this is nearly all you see of a vehicle, so it carries most of the
 * work of telling one apart from another: a saloon's wide low blocks, a hatch's
 * tall corner lamps, a lorry's small clusters under a row of amber markers.
 */
function drawLamps(
  ctx: Ctx,
  a: {
    x: number
    ground: number
    halfW: number
    height: number
    scale: number
    fade: number
    body: BodyType
    p: Profile
  },
): void {
  const { x, ground, halfW, height, fade, body, p } = a
  const lampY = ground - height * p.lampY

  const geom: Record<LampStyle, { w: number; h: number; inset: number }> = {
    block: { h: 0.1, inset: 0.6, w: 0.34 },
    tall: { h: 0.22, inset: 0.76, w: 0.19 },
    corner: { h: 0.19, inset: 0.81, w: 0.17 },
    cluster: { h: 0.05, inset: 0.56, w: 0.15 },
  }
  const g = geom[p.lamp]
  const lampW = Math.max(1.2, halfW * g.w)
  const lampH = Math.max(0.9, height * g.h)
  const bloomR = Math.min(Math.max(3, halfW * 0.9), 26)

  for (const side of [-1, 1]) {
    const lx = x + side * halfW * g.inset
    // The lens is opaque, not additive. Added on top of a light-coloured body a
    // red lamp goes white, which is exactly what a silver car's taillights did.
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = `rgba(216, 38, 30, ${Math.min(1, 0.82 + fade * 0.18)})`
    ctx.fillRect(lx - lampW / 2, lampY - lampH / 2, lampW, lampH)

    // The glow around it is additive, because that part really is light in air.
    ctx.globalCompositeOperation = "lighter"
    const bloom = ctx.createRadialGradient(lx, lampY, 0, lx, lampY, bloomR)
    bloom.addColorStop(0, `rgba(255, 66, 52, ${0.4 * fade})`)
    bloom.addColorStop(1, "rgba(255, 66, 52, 0)")
    ctx.fillStyle = bloom
    ctx.beginPath()
    ctx.arc(lx, lampY, bloomR, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(255, 120, 96, ${0.5 * fade})`
    ctx.fillRect(lx - lampW * 0.34, lampY - lampH * 0.3, lampW * 0.68, lampH * 0.6)
  }

  // A lorry also carries amber marker lights along its top edge and reflective
  // tape down the door split. Both are regulation, and both are what makes the
  // shape ahead of you read as a lorry from half a mile back.
  if (body === "lorry" && height > 18) {
    const roofY = ground - height
    const dotR = Math.max(0.8, halfW * 0.055)
    for (let i = -2; i <= 2; i += 1) {
      const mx = x + (i / 2) * halfW * 0.88
      ctx.fillStyle = `rgba(255, 168, 44, ${0.8 * fade})`
      ctx.beginPath()
      ctx.arc(mx, roofY + dotR, dotR, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/**
 * A vehicle on the far carriageway, coming the other way.
 *
 * Nothing but the lamps and their glare, because that is genuinely all you see:
 * our headlights do not reach across the median, so the body is a silhouette
 * against the sky and everything readable about it is the pair of lights and
 * the mess they make of the air. Drawing this like a rear view with the colours
 * swapped would be a rendering of a car; this is a rendering of what a driver
 * actually sees.
 */
export function drawOncoming(
  ctx: Ctx,
  opts: { x: number; ground: number; scale: number; fade: number },
): void {
  const { x, ground, scale, fade } = opts
  const halfW = 0.9 * scale
  const height = 1.5 * scale
  const lampY = ground - height * 0.42
  const lampR = Math.min(Math.max(2.5, halfW * 1.5), 34)

  // The silhouette, barely separated from the night behind it.
  ctx.globalCompositeOperation = "source-over"
  ctx.fillStyle = `rgba(8, 10, 14, ${0.75 * fade})`
  ctx.beginPath()
  ctx.moveTo(x - halfW, ground)
  ctx.lineTo(x - halfW * 0.94, ground - height * 0.52)
  ctx.quadraticCurveTo(x, ground - height * 1.02, x + halfW * 0.94, ground - height * 0.52)
  ctx.lineTo(x + halfW, ground)
  ctx.closePath()
  ctx.fill()

  ctx.globalCompositeOperation = "lighter"

  // The wash the beams throw onto the surface in front of them, which is what
  // stops the lamps reading as two stickers floating in the dark.
  const spill = ctx.createRadialGradient(x, ground, 0, x, ground, lampR * 2.4)
  spill.addColorStop(0, `rgba(150, 178, 214, ${0.2 * fade})`)
  spill.addColorStop(1, "rgba(150, 178, 214, 0)")
  ctx.fillStyle = spill
  ctx.beginPath()
  ctx.ellipse(x, ground, lampR * 2.4, lampR * 0.8, 0, 0, Math.PI * 2)
  ctx.fill()

  for (const side of [-1, 1]) {
    const lx = x + side * halfW * 0.66
    const glare = ctx.createRadialGradient(lx, lampY, 0, lx, lampY, lampR * 2.6)
    glare.addColorStop(0, `rgba(214, 230, 255, ${0.62 * fade})`)
    glare.addColorStop(0.35, `rgba(170, 200, 250, ${0.2 * fade})`)
    glare.addColorStop(1, "rgba(150, 185, 245, 0)")
    ctx.fillStyle = glare
    ctx.beginPath()
    ctx.arc(lx, lampY, lampR * 2.6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(246, 250, 255, ${Math.min(1, 0.7 + fade * 0.3)})`
    ctx.beginPath()
    ctx.arc(lx, lampY, Math.max(0.7, halfW * 0.22), 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * A roadside camera on its mast.
 *
 * The one piece of furniture on this road that is actually the product. Coasta
 * reads cameras that are already pointed at the carriageway, and until now the
 * world contained gantries, lamps, barriers and traffic but not a single one of
 * the things the whole page is about. Passing them is the quietest possible way
 * to make the claim, and it is the same claim the contrast table makes in
 * words: the camera is watching that road whether anyone is on it or not.
 *
 * Its status lamp blinks on a slow cycle rather than flashing at you. It is
 * infrastructure, not an alert.
 */
export function drawCameraMast(
  ctx: Ctx,
  opts: {
    proj: Projector
    lateral: number
    z: number
    /** Which way the arm reaches. -1 leans left, 1 leans right. */
    reach: number
    fade: number
    phase: number
  },
): void {
  const { proj, lateral, z, reach, fade, phase } = opts
  const base = proj(lateral, z)
  const perMetre = (proj(0, 1).y - proj(0, 2).y) / z
  const headY = base.y - perMetre * 7
  const armX = base.x - reach * perMetre * 2.2
  const line = Math.max(1.1, perMetre * 0.17)

  ctx.globalCompositeOperation = "source-over"
  // Brighter and heavier than a lighting column. It sits among them, and at a
  // column's weight it read as one more lamp post with the bulb missing.
  ctx.strokeStyle = `rgba(150, 176, 200, ${0.8 * fade})`
  ctx.lineWidth = line
  ctx.lineCap = "butt"
  ctx.beginPath()
  ctx.moveTo(base.x, base.y)
  ctx.lineTo(base.x, headY)
  ctx.lineTo(armX, headY)
  ctx.stroke()

  // The housing: a small box under the arm with a hood over the lens.
  const boxW = Math.max(3, perMetre * 1.05)
  const boxH = Math.max(1.8, boxW * 0.46)
  // Housing, then the hood over the lens that overhangs it. The overhang is
  // the whole silhouette: it is what says camera rather than lamp.
  ctx.fillStyle = `rgba(24, 30, 39, ${0.95 * fade})`
  ctx.fillRect(armX - boxW / 2, headY, boxW, boxH)
  ctx.fillStyle = `rgba(74, 88, 104, ${0.95 * fade})`
  ctx.fillRect(armX - boxW * 0.66, headY - boxH * 0.34, boxW * 1.32, boxH * 0.36)
  // The lens, looking back up the carriageway.
  ctx.fillStyle = `rgba(12, 16, 22, ${0.95 * fade})`
  ctx.fillRect(armX - boxW * 0.5, headY + boxH * 0.2, boxW * 0.34, boxH * 0.5)

  // Status lamp. Slow, small, and never the brightest thing in frame.
  if (boxW > 2.4) {
    const on = phase % 1 < 0.3
    const r = Math.max(0.9, boxW * 0.13)
    ctx.globalCompositeOperation = "lighter"
    const g = ctx.createRadialGradient(armX + boxW * 0.3, headY + boxH * 0.5, 0, armX + boxW * 0.3, headY + boxH * 0.5, r * 5)
    const rgb = on ? "120, 235, 170" : "40, 90, 70"
    g.addColorStop(0, `rgba(${rgb}, ${0.85 * fade})`)
    g.addColorStop(1, `rgba(${rgb}, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(armX + boxW * 0.3, headY + boxH * 0.5, r * 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = "source-over"
  }
}

/**
 * The median barrier, drawn as one continuous run with posts.
 *
 * It is the fastest-moving thing in the frame, so it carries the speed cue the
 * lane dashes alone were carrying, and it gives the oncoming traffic something
 * to be on the other side of.
 */
export function drawBarrier(
  ctx: Ctx,
  opts: { proj: Projector; lateral: number; from: number; to: number; fade: number },
): void {
  const { proj, lateral, from, to } = opts
  ctx.globalCompositeOperation = "source-over"

  // The rail: two lines, top and bottom, filled between.
  const railTop: Array<{ x: number; y: number }> = []
  const railBottom: Array<{ x: number; y: number }> = []
  for (let z = from; z <= to; z += 4) {
    const base = proj(lateral, z)
    const lift = (0.78 * (proj(0, 1).y - proj(0, 2).y)) / z
    railTop.push({ x: base.x, y: base.y - lift })
    railBottom.push(base)
  }
  if (railTop.length < 2) return

  ctx.beginPath()
  railTop.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  for (let i = railBottom.length - 1; i >= 0; i -= 1) {
    const p = railBottom[i]!
    ctx.lineTo(p.x, p.y)
  }
  ctx.closePath()
  ctx.fillStyle = "rgba(38, 46, 58, 0.9)"
  ctx.fill()

  // The reflective strip along the top, catching the gantry light.
  ctx.beginPath()
  railTop.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.strokeStyle = "rgba(168, 198, 226, 0.38)"
  ctx.lineWidth = 1.6
  ctx.stroke()
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
