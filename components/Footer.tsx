import Reveal from "./Reveal";

export default function Footer() {
  return (
    <footer className="border-t border-border px-5 py-16 md:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal
          as="div"
          className="grid gap-10 sm:grid-cols-2 md:grid-cols-4"
        >
          <div>
            <span className="font-display text-sm uppercase text-ink">
              C<span className="text-signal">O</span>ASTA
            </span>
            <p className="mt-3 max-w-[22ch] text-sm leading-relaxed text-ink-2">
              AI that reads DFW traffic cameras so you are never surprised on the road.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">Product</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-2">
              <li>
                <a
                  href="#how-it-works"
                  className="transition-colors duration-300 [transition-timing-function:var(--ease-signal)] hover:text-ink"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#coverage"
                  className="transition-colors duration-300 [transition-timing-function:var(--ease-signal)] hover:text-ink"
                >
                  Coverage
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="transition-colors duration-300 [transition-timing-function:var(--ease-signal)] hover:text-ink"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#waitlist"
                  className="transition-colors duration-300 [transition-timing-function:var(--ease-signal)] hover:text-ink"
                >
                  Join the waitlist
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">Company</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-2">
              <li>About</li>
              <li>
                <a
                  href="mailto:hello@coasta.app"
                  className="transition-colors duration-300 [transition-timing-function:var(--ease-signal)] hover:text-ink"
                >
                  Contact
                </a>
              </li>
              <li>Press kit (soon)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">Legal</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-2">
              <li>Privacy policy (at launch)</li>
              <li>Terms (at launch)</li>
            </ul>
          </div>
        </Reveal>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-ink-2 sm:flex-row sm:items-center">
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
        </div>
      </div>
    </footer>
  );
}
