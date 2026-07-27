import "@fontsource-variable/archivo"
import "@fontsource/ibm-plex-mono/400.css"
import "@fontsource/ibm-plex-mono/500.css"
import type { Metadata } from "next"
import type { ReactNode } from "react"
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
    <html lang="en">
      <body>
        {children}
        {/* Renders null in production; the guard lives in the component so the
            import stays static and there is one place to reason about it. */}
        <TweakBar />
      </body>
    </html>
  )
}
