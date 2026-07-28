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
       hydrates, which React reports as a server/client attribute mismatch.
       suppressHydrationWarning is the intended escape hatch and covers only
       this element own attributes, not anything inside it. */
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before first paint, so assembled content is never shown and
            then snatched away. It is also the single place that decides
            whether assembly happens at all: no attribute means the CSS that
            hides things never matches, which is what makes the page safe with
            JavaScript disabled and correct under reduced motion. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)" +
              "document.documentElement.dataset.assembly='on'",
          }}
        />
      </head>
      <body>
        {children}
        <Assembly />
        {/* Renders null in production; the guard lives in the component so the
            import stays static and there is one place to reason about it. */}
        <TweakBar />
      </body>
    </html>
  )
}
