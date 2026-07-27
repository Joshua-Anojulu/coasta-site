import { LivingNetwork } from "@/components/motion/LivingNetwork"
import "@/styles/worlds.css"

/** w6: the living network.
 *  World: the metroplex as light, seen from above, awake.
 *  Rendered entirely in code from the real OpenStreetMap geometry already in
 *  the repo, so it needs no image assets and it moves, which a generated still
 *  could not do. */
export default function W6() {
  return (
    <main className="w w6">
      <span className="w-tag">W6 / THE LIVING NETWORK</span>

      <section className="w6-hero">
        <LivingNetwork className="w6-canvas" />
        <div className="w6-veil" aria-hidden="true" />

        <div className="w6-copy">
          <p className="w6-eyebrow">Dallas / Fort Worth</p>
          <h1 className="w6-head">
            Every camera.
            <br />
            Now a sensor.
          </h1>
          <p className="w6-sub">
            Coasta reads the roadway through cameras already looking at DFW.
          </p>
          <a className="w6-cta" href="#read">
            Join the waitlist
          </a>
        </div>

        <p className="w6-credit">
          Live render / 236 corridors / OpenStreetMap contributors
        </p>
      </section>

      <section className="w6-read" id="read">
        <div className="w6-read-inner">
          <p className="w6-eyebrow">The read</p>
          <h2 className="w6-h2">The frame becomes a decision.</h2>
          <p className="w6-body">
            A frame arrives. The model names what is on the road. The road is
            named back to you, before you reach it.
          </p>
        </div>
      </section>
    </main>
  )
}
