import "@/styles/worlds.css"

/** w5: print-tech paper. World: a TxDOT plan sheet on a drafting table. */
export default function W5() {
  return (
    <main className="w w5">
      <span className="w-tag">W5 / PRINT-TECH PAPER</span>

      <div className="w5-sheet">
        <span className="w5-reg" style={{ top: 14, left: 14 }} aria-hidden="true" />
        <span className="w5-reg" style={{ top: 14, right: 14 }} aria-hidden="true" />
        <span className="w5-reg" style={{ bottom: 14, left: 14 }} aria-hidden="true" />
        <span className="w5-reg" style={{ bottom: 14, right: 14 }} aria-hidden="true" />

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: "0.16em" }}>
          <span style={{ color: "#1b3a6b" }}>COASTA / ROADWAY INTELLIGENCE</span>
          <span style={{ color: "#c0392b" }}>PRELIMINARY / NOT FOR CONSTRUCTION</span>
        </div>

        <h1 style={{ marginTop: 52 }}>
          Every camera.
          <br />
          Now a sensor.
        </h1>

        <p
          style={{
            maxWidth: "56ch",
            marginTop: 26,
            fontSize: 13,
            lineHeight: 1.7,
            fontFamily: "Archivo Variable, Arial, sans-serif",
          }}
        >
          Coasta reads the roadway through cameras already looking at DFW.
          Existing infrastructure, read continuously, reported as it happens.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, marginTop: 44, border: "1px solid #1b3a6b" }}>
          {[
            ["DETECT", "Vehicle, class, position"],
            ["CONFIRM", "Signal held across frames"],
            ["REPORT", "Road reference, to the driver"],
          ].map(([step, desc], i) => (
            <div
              key={step}
              style={{
                padding: "20px 18px",
                borderRight: i < 2 ? "1px solid rgb(27 58 107 / 0.45)" : undefined,
              }}
            >
              <b style={{ display: "block", color: "#1b3a6b", fontSize: 10, letterSpacing: "0.16em" }}>
                {String(i + 1).padStart(2, "0")} {step}
              </b>
              <span style={{ display: "block", marginTop: 10, fontSize: 12, lineHeight: 1.6 }}>{desc}</span>
            </div>
          ))}
        </div>

        <div className="w5-titleblock">
          <div>
            <b>SHEET</b>
            01 OF 06
          </div>
          <div>
            <b>AREA</b>
            DFW METROPLEX
          </div>
          <div>
            <b>PHASE</b>
            WAITLIST
          </div>
          <div>
            <b>REV</b>
            A
          </div>
        </div>
      </div>
    </main>
  )
}
