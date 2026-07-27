export function SiteFooter() {
  return (
    <footer className="site-footer">
      <picture>
        <source srcSet="/brand/coasta-logo.avif" type="image/avif" />
        <source srcSet="/brand/coasta-logo.webp" type="image/webp" />
        <img
          alt="Coasta"
          decoding="async"
          height={1135}
          loading="lazy"
          sizes="72px"
          src="/brand/coasta-logo.jpg"
          width={1170}
        />
      </picture>
      <p>Road intelligence for DFW drivers.</p>
      {/* ODbL compliance, both halves. Attribution alone is not enough: the
          coverage map is a Produced Work built from a Derivative Database that
          ships to every visitor, so the share alike term obliges us to offer
          that database itself. The download link is what discharges it. */}
      <p className="site-footer__attribution">
        Map data{" "}
        <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">
          © OpenStreetMap contributors
        </a>
        , used under the{" "}
        <a href="https://opendatacommons.org/licenses/odbl/1-0/" rel="noreferrer" target="_blank">
          Open Database License
        </a>
        . The derived DFW geometry database is offered under the same licence:{" "}
        <a href="/data/dfw-geometry.odbl.json" download>
          download it here
        </a>
        .
      </p>
    </footer>
  )
}
