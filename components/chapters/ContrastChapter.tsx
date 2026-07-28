/**
 * Where Coasta differs from the alerts a driver already gets.
 *
 * Deliberately not a competitor comparison. Naming a mapping app would put a
 * characterisation of someone else's product on the page, and the obvious one
 * ("they wait for drivers to report it") is not accurate enough to publish:
 * the large crowdsourced apps also ingest official incident feeds. The honest
 * axis is reported against detected, which is a real distinction, is true of
 * every report-driven alert, and describes what Coasta does rather than what
 * anybody else fails to do.
 *
 * It is a table because it is a table: two approaches, three dimensions. A grid
 * of divs would read to a screen reader as six unrelated sentences.
 */
const ROWS = [
  {
    detected: "A camera two miles up sees it before you are near it.",
    dimension: "Who finds it",
    reported: "Somebody has to reach it first.",
  },
  {
    detected: "Read again on a fixed cycle, whether or not anything changed.",
    dimension: "How current it is",
    reported: "As fresh as the last person who looked up and typed.",
  },
  {
    detected: "The camera is pointed at that road all night either way.",
    dimension: "Quiet roads",
    reported: "Only as good as how many drivers are on that road.",
  },
] as const

export function ContrastChapter() {
  return (
    <section className="chapter chapter-light contrast" id="how-it-differs">
      <div className="chapter-shell">
        <div className="chapter-heading" data-assemble>
          <span className="chapter-kicker">REPORTED / DETECTED</span>
          <h2>A reported hazard is one somebody already hit.</h2>
          <p>
            Coasta reads the cameras that are already pointed at the road, so an
            event is found without waiting for a driver to report it.
          </p>
        </div>

        <table className="contrast__table">
          <caption className="visually-hidden">
            How a reported alert compares with one detected from a camera
          </caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="contrast__label">Dimension</span>
              </th>
              <th scope="col">
                <span className="contrast__label">Reported</span>
              </th>
              <th scope="col">
                <span className="contrast__label contrast__label--live">Detected</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr
                data-assemble
                data-assemble-rule
                key={row.dimension}
                style={{ "--i": i } as React.CSSProperties}
              >
                <th scope="row">
                  <span className="contrast__index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="contrast__dimension">{row.dimension}</span>
                </th>
                <td className="contrast__reported">{row.reported}</td>
                <td className="contrast__detected">{row.detected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
