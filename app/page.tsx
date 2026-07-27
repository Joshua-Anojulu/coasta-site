import { CoverageChapter } from "@/components/chapters/CoverageChapter"
import { DriveChapter } from "@/components/chapters/DriveChapter"
import { GroundChapter } from "@/components/chapters/GroundChapter"
import { IntroChapter } from "@/components/chapters/IntroChapter"
import { ScanWipe } from "@/components/ScanWipe"
import { SiteFooter } from "@/components/SiteFooter"
import { SiteNav } from "@/components/SiteNav"

/**
 * The journey, not a stack of sections about a product:
 *
 *   intro     you are on the road at night
 *   drive     four things happen, each explained before you reach it
 *   coverage  you arrive, and see the network you drove through
 *   ground    the page goes still and plain for the questions and the form
 *
 * The old wall, read and alert chapters are absorbed into the drive. Keeping
 * them alongside it would have told the same story twice.
 */
export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteNav />
      <main id="main-content">
        <IntroChapter />
        <DriveChapter />
        <ScanWipe />
        <CoverageChapter />
        <ScanWipe />
        <GroundChapter />
      </main>
      <SiteFooter />
    </>
  )
}
