import "@/styles/worlds.css"

const ROADS = [
  ["I-35E", "NORTHBOUND", "CLEAR"],
  ["I-635", "EASTBOUND", "SLOW"],
  ["US-75", "SOUTHBOUND", "CLEAR"],
  ["I-30", "WESTBOUND", "STOPPED"],
  ["DNT", "NORTHBOUND", "CLEAR"],
]

/** w1: dither mono. World: a 1-bit monitor in a DOT control room at 3am. */
export default function W1() {
  return (
    <main className="w w1">
      <span className="w-tag">W1 / DITHER MONO</span>
      <div className="w1-hero">
        <p style={{ fontSize: 11, letterSpacing: "0.2em", opacity: 0.7, margin: 0 }}>
          COASTA // DFW NETWORK // 03:14
        </p>
        <h1 style={{ marginTop: 24 }}>
          Every camera.
          <br />
          Now a sensor
          <span className="w1-cursor" aria-hidden="true" />
        </h1>
        <div className="w1-dither" aria-hidden="true" />
        <div className="w1-rows">
          {ROADS.map(([road, dir, state]) => (
            <div key={road}>
              <span>{road}</span>
              <span style={{ opacity: 0.6 }}>{dir}</span>
              <span>{state}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 34, fontSize: 12, opacity: 0.65, maxWidth: "52ch" }}>
          Coasta reads the roadway through cameras already looking at DFW.
        </p>
      </div>
    </main>
  )
}
