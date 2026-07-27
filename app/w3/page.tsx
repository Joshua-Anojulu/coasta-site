import "@/styles/worlds.css"

const INDEX = ["Network", "Corridors", "The read", "Alerts", "Coverage", "Questions"]

const ENTRIES = [
  ["001", "I-35E at Northwest Highway", "4 lanes"],
  ["002", "I-635 at US-75, High Five", "5 levels"],
  ["003", "I-30 at TX-161", "6 ramps"],
  ["004", "Dallas North Tollway at PGBT", "4 lanes"],
  ["005", "I-20 at I-35E", "5 ramps"],
  ["006", "I-820 at SH-183", "4 lanes"],
]

/** w3: editorial ledger. World: a highway department's ruled logbook.
 *  Fits Coasta's own positioning: it indexes roadway activity. */
export default function W3() {
  return (
    <main className="w w3">
      <span className="w-tag">W3 / EDITORIAL LEDGER</span>

      <div className="w3-grid">
        <aside>
          <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, letterSpacing: "0.18em", color: "#a3271b", margin: 0 }}>
            COASTA
          </p>
          <ul className="w3-index" style={{ listStyle: "none", margin: "18px 0 0", padding: 0 }}>
            {INDEX.map((item, i) => (
              <li key={item} data-here={i === 0}>
                <span>{item}</span>
                <span>{String(i + 1).padStart(2, "0")}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div>
          <h1>
            Every camera.
            <br />
            Now a sensor.
          </h1>
          <p style={{ maxWidth: "52ch", marginTop: 22, fontSize: 17, lineHeight: 1.55, color: "#4a463c" }}>
            Coasta reads the roadway through cameras already looking at DFW, and
            keeps the record.
          </p>

          <div style={{ marginTop: 54 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "2px solid #16150f" }}>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, letterSpacing: "0.18em" }}>
                CORRIDOR REGISTER
              </span>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: "#6c6758" }}>
                LAUNCH AREA
              </span>
            </div>
            {ENTRIES.map(([n, name, detail]) => (
              <div className="w3-entry" key={n}>
                <span>{n}</span>
                <span>{name}</span>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
