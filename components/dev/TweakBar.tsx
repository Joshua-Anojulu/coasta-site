"use client"

import { useEffect, useState } from "react"

/**
 * Dev-only tuning panel (Ch0.5 stage 4).
 *
 * Exists so aesthetic decisions stop being a conversation. Every knob writes a
 * CSS custom property on :root; the stylesheet and the drive canvas both read
 * from those, so nothing here needs a rebuild or a model call. Drag until it
 * looks right, hit Copy tokens, paste the result into styles/foundation.css.
 *
 * A tuning session whose result never lands in the repo was a toy, so the copy
 * button is the point of the component, not a nicety.
 */

type Knob = {
  readonly key: string
  readonly label: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly unit?: string
  readonly group: string
}

const KNOBS: readonly Knob[] = [
  // Drive: read by DriveRoad each frame.
  { key: "--drive-run", label: "Road length", min: 600, max: 2600, step: 50, group: "Drive" },
  { key: "--drive-traffic", label: "Traffic density", min: 0, max: 2, step: 0.05, group: "Drive" },
  { key: "--drive-fog", label: "Fog depth", min: 120, max: 420, step: 10, group: "Drive" },
  { key: "--drive-lamp", label: "Lamp brightness", min: 0, max: 1.6, step: 0.05, group: "Drive" },
  { key: "--drive-lamp-gap", label: "Lamp spacing", min: 20, max: 110, step: 5, group: "Drive" },
  { key: "--drive-glow", label: "Hazard glow", min: 0, max: 2, step: 0.05, group: "Drive" },
  { key: "--drive-vignette", label: "Vignette", min: 0, max: 1.2, step: 0.05, group: "Drive" },
  { key: "--drive-steer", label: "Steering amount", min: 0, max: 2.5, step: 0.05, group: "Drive" },
  { key: "--drive-horizon", label: "Horizon height", min: 0.3, max: 0.62, step: 0.01, group: "Drive" },

  // Type and layout: read by the stylesheet.
  { key: "--type-display", label: "Display size", min: 2.5, max: 7, step: 0.1, unit: "rem", group: "Type" },
  { key: "--type-track", label: "Display tracking", min: -0.07, max: 0, step: 0.002, unit: "em", group: "Type" },
  { key: "--section-y", label: "Section padding", min: 3, max: 16, step: 0.5, unit: "rem", group: "Layout" },
  { key: "--card-w", label: "Alert card width", min: 360, max: 720, step: 10, unit: "px", group: "Layout" },
  { key: "--accent-h", label: "Accent hue", min: 0, max: 360, step: 1, group: "Colour" },
  { key: "--accent-s", label: "Accent saturation", min: 0, max: 100, step: 1, unit: "%", group: "Colour" },
]

const DEV = process.env.NODE_ENV !== "production"
const STORE = "coasta-tweaks"

export function TweakBar() {
  const [open, setOpen] = useState(false)
  const [vals, setVals] = useState<Record<string, string>>({})

  // The DEV guard sits INSIDE the effect on purpose. The early return below has
  // to come after the hooks or the hook order changes between environments, so
  // without this guard the effect would still run in production and paint a
  // stale tuning session onto :root with no panel to clear it.
  useEffect(() => {
    if (!DEV) return
    let saved: Record<string, string> = {}
    try {
      saved = JSON.parse(localStorage.getItem(STORE) ?? "{}") as Record<string, string>
    } catch {
      /* corrupt, ignore */
    }
    setVals(saved)
    for (const [k, v] of Object.entries(saved)) {
      document.documentElement.style.setProperty(k, v)
    }
  }, [])

  if (!DEV) return null

  const set = (knob: Knob, raw: string) => {
    const value = raw + (knob.unit ?? "")
    document.documentElement.style.setProperty(knob.key, value)
    const next = { ...vals, [knob.key]: value }
    setVals(next)
    localStorage.setItem(STORE, JSON.stringify(next))
  }

  const reset = () => {
    for (const knob of KNOBS) document.documentElement.style.removeProperty(knob.key)
    setVals({})
    localStorage.removeItem(STORE)
  }

  const groups = [...new Set(KNOBS.map((k) => k.group))]

  return (
    <div className="tweakbar">
      <button className="tweakbar__toggle" onClick={() => setOpen(!open)} type="button">
        {open ? "Close" : "Tweaks"}
      </button>

      {open && (
        <div className="tweakbar__panel">
          {groups.map((group) => (
            <fieldset className="tweakbar__group" key={group}>
              <legend>{group}</legend>
              {KNOBS.filter((k) => k.group === group).map((knob) => {
                const current = vals[knob.key]
                const numeric =
                  current === undefined
                    ? (knob.min + knob.max) / 2
                    : Number.parseFloat(current)
                return (
                  <label className="tweakbar__knob" key={knob.key}>
                    <span>
                      {knob.label}
                      <b>{current ?? "default"}</b>
                    </span>
                    <input
                      max={knob.max}
                      min={knob.min}
                      onChange={(event) => set(knob, event.target.value)}
                      step={knob.step}
                      type="range"
                      // Controlled, so after a reload the thumb sits where the
                      // value is instead of at the midpoint and jumping on the
                      // first drag.
                      value={Number.isFinite(numeric) ? numeric : knob.min}
                    />
                  </label>
                )
              })}
            </fieldset>
          ))}

          <div className="tweakbar__actions">
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  ":root {\n" +
                    Object.entries(vals)
                      .map(([k, v]) => `  ${k}: ${v};`)
                      .join("\n") +
                    "\n}",
                )
              }
              type="button"
            >
              Copy tokens
            </button>
            <button onClick={reset} type="button">
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
