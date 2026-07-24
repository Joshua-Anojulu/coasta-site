import Reveal from "./Reveal";

export default function Footer() {
  return (
    <footer className="border-t border-border px-5 py-10 md:px-10">
      <Reveal
        as="div"
        className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 text-xs text-ink-2 sm:flex-row sm:items-center"
      >
        <span className="font-display text-sm uppercase text-ink">
          C<span className="text-signal">O</span>ASTA
        </span>
        <span>All detections shown on this page are simulated demonstrations.</span>
        <span>
          Map data{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            className="underline decoration-border underline-offset-2 transition-colors duration-300 [transition-timing-function:var(--ease-signal)] hover:text-ink"
          >
            &copy; OpenStreetMap contributors
          </a>
        </span>
        <span>&copy; 2026 Coasta</span>
      </Reveal>
    </footer>
  );
}
