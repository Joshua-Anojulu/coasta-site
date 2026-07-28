import "@fontsource-variable/archivo"
import "@fontsource/ibm-plex-mono/400.css"
import "@fontsource/ibm-plex-mono/500.css"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Assembly } from "@/components/Assembly"
import { TweakBar } from "@/components/dev/TweakBar"
import "./globals.css"

export const metadata: Metadata = {
  description:
    "Coasta reads roadside cameras across DFW and alerts drivers to changing road conditions. Join the waitlist.",
  icons: {
    icon: "/brand/coasta-mark.png",
  },
  metadataBase: new URL(process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000"),
  openGraph: {
    description:
      "Road intelligence for DFW drivers, read through the camera's own eye.",
    images: [
      {
        alt: "Coasta",
        height: 1135,
        url: "/brand/coasta-logo.jpg",
        width: 1170,
      },
    ],
    title: "Coasta",
    type: "website",
  },
  title: "Coasta | Road intelligence for DFW",
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    /* data-assembly is set on <html> by the inline script below, before React
       hydrates, which React would otherwise report as a server/client
       attribute mismatch. suppressHydrationWarning is the intended escape
       hatch and covers only this element own attributes, not its children. */
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* First thing in the body, so it runs before any of the content below
            it is painted and nothing is ever shown and then snatched away.
            It is also the single place that decides whether assembly happens
            at all: no attribute means the CSS that hides things never matches,
            which is what keeps the page whole with JavaScript disabled and
            correct under reduced motion.

            It lives here rather than in a hand-written <head> for two reasons.
            App Router owns the document head and manual <head> elements in a
            layout are discouraged. More practically, <head> is where browser
            extensions inject: one that prepends a script there shifts every
            sibling by one, so React finds the extension's script where it left
            this one and reports a hydration mismatch on every page load. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)" +
              "document.documentElement.dataset.assembly='on'",
          }}
        />
        {children}
        <Assembly />
        {/* Renders null in production; the guard lives in the component so the
            import stays static and there is one place to reason about it. */}
        <TweakBar />
      </body>
    </html>
  )
}
