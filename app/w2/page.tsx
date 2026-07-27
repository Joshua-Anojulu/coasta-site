import "@/styles/worlds.css"

/** w2: machined hardware. World: a roadside signal cabinet, opened. */
export default function W2() {
  return (
    <main className="w w2" style={{ display: "grid", placeItems: "center", padding: "8vh 0" }}>
      <span className="w-tag">W2 / MACHINED HARDWARE</span>

      <div className="w2-cabinet" style={{ position: "relative" }}>
        <span className="w2-screw" style={{ top: 10, left: 10 }} aria-hidden="true" />
        <span className="w2-screw" style={{ top: 10, right: 10 }} aria-hidden="true" />
        <span className="w2-screw" style={{ bottom: 10, left: 10 }} aria-hidden="true" />
        <span className="w2-screw" style={{ bottom: 10, right: 10 }} aria-hidden="true" />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <span className="w2-label">Coasta / cabinet 12</span>
          <span className="w2-label">DFW metroplex</span>
        </div>

        <div className="w2-plate">
          <h1>
            Every camera.
            <br />
            Now a sensor.
          </h1>
          <p style={{ maxWidth: "46ch", marginTop: 20, color: "#aeb6bd", fontSize: 15 }}>
            Coasta reads the roadway through cameras already looking at DFW.
          </p>

          <div className="w2-lamps" aria-hidden="true">
            {[true, true, true, false, false].map((on, i) => (
              <span className="w2-lamp" data-on={on} key={i} />
            ))}
          </div>
          <p className="w2-label" style={{ marginTop: 12 }}>
            Detection channels
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
          {["Police", "Crash", "Hazard"].map((label) => (
            <div
              key={label}
              style={{
                padding: "14px 16px",
                borderRadius: 5,
                background: "linear-gradient(180deg, #343a40, #23272b)",
                boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.12)",
              }}
            >
              <span className="w2-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
