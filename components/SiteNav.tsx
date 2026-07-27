import Image from "next/image"
import { PrimaryAction } from "./PrimaryAction"

export function SiteNav() {
  return (
    <header className="site-nav">
      <a className="brand-lockup" href="#approach">
        <Image
          alt="Coasta mark"
          height={36}
          priority
          sizes="36px"
          src="/brand/coasta-mark.png"
          width={36}
        />
        <span>COASTA</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="#coverage">DFW coverage</a>
        <a href="#questions">FAQ</a>
        <PrimaryAction href="#waitlist">Join the waitlist</PrimaryAction>
      </nav>
    </header>
  )
}
