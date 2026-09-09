import type { Metadata } from "next";
import { Orbitron, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-space",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "TARCOIN Explorer", template: "%s | TARCOIN Explorer" },
  description: "Real-time blockchain explorer for TARCOIN (TAR) — browse blocks, transactions, addresses and network statistics.",
  keywords: ["TARCOIN", "TAR", "blockchain explorer", "bitcoin", "SHA256d"],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  },
  openGraph: {
    title: "TARCOIN Blockchain Explorer",
    description: "Explore the TARCOIN mainnet — live blocks, transactions, addresses and stats.",
    url: "https://explorer.tarcoin.org",
    siteName: "TARCOIN Explorer",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${orbitron.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}