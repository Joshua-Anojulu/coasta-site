import { ContrastChapter } from "@/components/chapters/ContrastChapter"
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
 *   contrast  the page goes still and says plainly what it just showed you
 *   ground    the questions and the form
 *
 * The old wall, read and alert chapters are absorbed into the drive. Keeping
 * them alongside it would have told the same story twice.
 *
 * Contrast sits after the scan wipe on purpose. It restates in a table what the
 * drive has just spent four hazards demonstrating, which is repetition, but the
 * repetition is the point: the drive convinces and the table is what a reader
 * can quote to somebody else.
 *
 * There is no coverage section and no replacement for it. "Where do you cover?"
 * is already answered twice, in the hero support line and in the FAQ, and a
 * corridor list would assert coverage specifics nobody has verified.
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
        <ContrastChapter />
        <GroundChapter />
      </main>
      <SiteFooter />
    </>
  )
}
