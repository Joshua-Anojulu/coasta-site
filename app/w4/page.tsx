import "@/styles/worlds.css"

/** w4: vast quiet cinematic. World: the metroplex from altitude, before dawn.
 *  The field is drawn geometry, never a gradient standing in as the hero
 *  subject, which house-style ban 1 forbids outright. */
export default function W4() {
  return (
    <main className="w w4">
      <span className="w-tag">W4 / VAST QUIET CINEMATIC</span>

      <section className="w4-hero">
        <div className="w4-field" aria-hidden="true" />
        <div style={{ position: "relative", padding: "0 6vw" }}>
          <h1>Every camera. Now a sensor.</h1>
          <p className="w4-micro">Dallas / Fort Worth</p>
        </div>
        <p
          style={{
            position: "absolute",
            bottom: "7vh",
            left: 0,
            right: 0,
            margin: 0,
            textAlign: "center",
            fontSize: 13,
            color: "#8ea3c4",
          }}
        >
          Coasta reads the roadway through cameras already looking at DFW.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "70dvh",
          padding: "0 6vw",
          borderTop: "1px solid #17202f",
        }}
      >
        <div style={{ width: "min(560px, 92vw)", textAlign: "center" }}>
          <p className="w4-micro" style={{ marginTop: 0 }}>
            The read
          </p>
          <p style={{ fontSize: 20, lineHeight: 1.6, color: "#c3cfe2", marginTop: 22 }}>
            A frame arrives. The model names what is on the road. The road is
            named back to you.
          </p>
        </div>
      </section>
    </main>
  )
}
