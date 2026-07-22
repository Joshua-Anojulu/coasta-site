import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
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
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body className="font-mono antialiased">
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
