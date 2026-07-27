import { AlertChapter } from "@/components/chapters/AlertChapter"
import { ApproachChapter } from "@/components/chapters/ApproachChapter"
import { CoverageChapter } from "@/components/chapters/CoverageChapter"
import { GroundChapter } from "@/components/chapters/GroundChapter"
import { ReadChapter } from "@/components/chapters/ReadChapter"
import { WallChapter } from "@/components/chapters/WallChapter"
import { ScanWipe } from "@/components/ScanWipe"
import { SiteFooter } from "@/components/SiteFooter"
import { SiteNav } from "@/components/SiteNav"

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteNav />
      <main id="main-content">
        <ApproachChapter />
        <ScanWipe />
        <WallChapter />
        <ScanWipe />
        <ReadChapter />
        <ScanWipe />
        <AlertChapter />
        <ScanWipe />
        <CoverageChapter />
        <ScanWipe />
        <GroundChapter />
      </main>
      <SiteFooter />
    </>
  )
}
