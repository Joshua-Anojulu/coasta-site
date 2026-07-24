import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-plus-jakarta",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Coasta | See the road before you reach it",
  description:
    "Coasta turns DFW traffic cameras into an AI detection network. Police, crashes, and hazards, spotted the moment a camera sees them. Join the waitlist.",
  metadataBase: new URL("https://coasta.app"),
  openGraph: {
    title: "Coasta | See the road before you reach it",
    description:
      "AI reads DFW traffic cameras and warns you about police, crashes, and hazards. Join the waitlist.",
    type: "website",
    images: [{ url: "/brand/coasta-logo.jpg", width: 1170, height: 1135 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
