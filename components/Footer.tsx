export default function Footer() {
  return (
    <footer className="border-t border-white/5 px-5 py-10 md:px-10">
      <div className="flex flex-col items-start justify-between gap-4 text-xs text-fog-dim sm:flex-row sm:items-center">
        <span className="font-display text-sm uppercase text-fog">
          C<span className="text-signal">O</span>ASTA
        </span>
        <span>All detections shown on this page are simulated demonstrations.</span>
        <span>&copy; 2026 Coasta</span>
      </div>
    </footer>
  );
}
