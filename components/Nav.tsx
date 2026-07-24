export default function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-ground/80 px-5 backdrop-blur-md md:px-10">
      <a href="#" className="font-display text-lg uppercase tracking-tight">
        C<span className="text-signal">O</span>ASTA
      </a>
      <div className="flex items-center gap-6">
        <span className="hidden font-mono text-xs text-ink-2 sm:block">
          network: DFW <span className="text-signal">/ demo</span>
        </span>
        <a
          href="#waitlist"
          className="border border-signal/40 px-4 py-1.5 text-xs text-signal transition-colors duration-300 [transition-timing-function:var(--ease-signal)] hover:bg-signal hover:text-ground"
        >
          Join waitlist
        </a>
      </div>
    </nav>
  );
}
