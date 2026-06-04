import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TARCOIN Explorer", template: "%s | TARCOIN Explorer" },
  description: "Real-time blockchain explorer for TARCOIN (TAR) — browse blocks, transactions, addresses and network statistics.",
  keywords: ["TARCOIN", "TAR", "blockchain explorer", "bitcoin", "SHA256d"],
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "TARCOIN Blockchain Explorer",
    description: "Explore the TARCOIN mainnet — live blocks, transactions, addresses and stats.",
    url: "https://explorer.tarcoin.org",
    siteName: "TARCOIN Explorer",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="scanlines" />
        {children}
      </body>
    </html>
  );
}
