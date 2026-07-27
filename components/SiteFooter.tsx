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
      <p>Map data © OpenStreetMap contributors.</p>
    </footer>
  )
}
