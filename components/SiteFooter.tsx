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
      {/* No OpenStreetMap attribution here any more, and that is correct rather
          than an oversight: the coverage map was the only thing on the site
          using OSM data. With it gone the site ships no derivative database, so
          neither the attribution nor the ODbL share alike term applies. The
          reasoning and the removal are recorded in data/PROVENANCE.md. */}
      <p className="site-footer__attribution">Dallas / Fort Worth</p>
    </footer>
  )
}
