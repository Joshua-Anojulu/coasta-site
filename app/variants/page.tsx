import "@/styles/variants.css"

/**
 * Ch0.5 comparison harness. Dev only.
 * Not app/_variants: an underscore prefix is a Next private folder and 404s.
 *
 * Two axes, deliberately separated:
 *   Stage 1 (worlds)    which reality the site lives in. Each has its own palette.
 *   Stage 2 (movements) how you travel through it. Palette held constant.
 */
const WORLDS = [
  { id: "w6", name: "The living network", world: "The metroplex as light, seen from above, awake", note: "A live canvas render of the real 236-corridor geometry: glowing arteries, amber signal pulses travelling them, brightening where corridors converge. No image assets, and it moves." },
  { id: "w1", name: "Dither mono", world: "A 1-bit monitor in a DOT control room at 3am", note: "Two colours, hard edges, a blinking block cursor. The most machine-native reading of the product." },
  { id: "w2", name: "Machined hardware", world: "A roadside signal cabinet, opened", note: "Brushed steel, engraved plates, indicator lamps, visible fasteners. The product as physical infrastructure." },
  { id: "w3", name: "Editorial ledger", world: "A highway department's ruled logbook", note: "Hairline rules, a left index, tabular figures. Matches Coasta's own line about indexing roadway activity." },
  { id: "w4", name: "Vast quiet cinematic", world: "The metroplex from altitude, before dawn", note: "One enormous drawn field, tiny type, monumental space. The most restrained and the most confident." },
  { id: "w5", name: "Print-tech paper", world: "A TxDOT plan sheet on a drafting table", note: "Title block, sheet number, registration marks, revision stamp. Speaks the customer's own document language." },
]

const MOVEMENTS = [
  { id: "v1", name: "The wall assembles", mechanic: "Pinned scene assembly", note: "The hero holds still and twelve feeds switch on around you. ~3.3 viewports pinned." },
  { id: "v2", name: "The sweep", mechanic: "Horizontal pan + depth", note: "The page travels west to east across the corridors. Falls back to a native carousel on mobile." },
  { id: "v3", name: "The rack", mechanic: "Sticky stack + word scrub", note: "Chapters hold at the top and the next arrives over it. Zero pinned scroll." },
]

function Card({ id, name, sub, note, tint }: { id: string; name: string; sub: string; note: string; tint: string }) {
  return (
    <figure
      style={{
        margin: 0,
        overflow: "hidden",
        border: "1px solid var(--color-line-dark)",
        borderRadius: 14,
        background: "#0b0d10",
      }}
    >
      <figcaption
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          padding: "11px 14px",
          borderBottom: "1px solid var(--color-line-dark)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
        }}
      >
        <span style={{ color: "var(--color-phosphor)" }}>
          {id.toUpperCase()} {name}
        </span>
        <a href={`/${id}`} style={{ textDecoration: "underline" }}>
          open
        </a>
      </figcaption>

      <div style={{ height: 420, overflow: "hidden", background: "#000" }}>
        <iframe
          src={`/${id}`}
          title={name}
          loading="lazy"
          style={{
            width: 1440,
            height: 1050,
            border: 0,
            transformOrigin: "top left",
            transform: "scale(0.40)",
          }}
        />
      </div>

      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--color-line-dark)" }}>
        <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: tint }}>
          {sub}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: "var(--color-phosphor-dim)" }}>{note}</p>
      </div>
    </figure>
  )
}

export default function VariantGrid() {
  if (process.env.NODE_ENV === "production") return null

  const grid = { display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))" } as const

  return (
    <main className="vroot" style={{ padding: 26 }}>
      <header style={{ marginBottom: 30 }}>
        <p className="vkicker">COASTA / DESIGN FUNNEL</p>
        <h1 className="vhead" style={{ fontSize: "clamp(1.75rem, 3vw, 2.75rem)", marginTop: 10 }}>
          Pick a world. Then pick how you move through it.
        </h1>
        <p style={{ maxWidth: "76ch", marginTop: 14, color: "var(--color-phosphor-dim)", lineHeight: 1.6 }}>
          Not one photograph in any of these. Every surface is drawn in CSS, so
          the design carries the work. Thumbnails are live pages at 40 percent
          and scroll behaviour only reads at full size, so open the ones you like.
        </p>
      </header>

      <section style={{ marginBottom: 44 }}>
        <h2 style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--color-confirm)", margin: "0 0 6px" }}>
          STAGE 1 / FIVE WORLDS
        </h2>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--color-phosphor-dim)" }}>
          Five different aesthetic families. Each derives its own palette from its
          own world, so these share nothing but the copy.
        </p>
        <div style={grid}>
          {WORLDS.map((w) => (
            <Card key={w.id} id={w.id} name={w.name} sub={w.world} note={w.note} tint="var(--color-confirm)" />
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--color-detection)", margin: "0 0 6px" }}>
          STAGE 2 / THREE MOVEMENTS
        </h2>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--color-phosphor-dim)" }}>
          Same world (the camera wall), three ways through it. Palette held
          constant on purpose so you judge the movement, not the colour.
        </p>
        <div style={grid}>
          {MOVEMENTS.map((m) => (
            <Card key={m.id} id={m.id} name={m.name} sub={m.mechanic} note={m.note} tint="var(--color-detection)" />
          ))}
        </div>
      </section>
    </main>
  )
}
