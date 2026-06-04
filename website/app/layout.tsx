import type { Metadata } from "next";
import { Inter, Orbitron, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TARCOIN | The Future of Decentralized Digital Currency",
  description:
    "TARCOIN (TAR) is a UTXO-based, SHA256d proof-of-work blockchain with a 50 billion supply cap. Mine, trade, and build on the most secure decentralized ecosystem.",
  keywords: [
    "TARCOIN",
    "TAR",
    "cryptocurrency",
    "blockchain",
    "bitcoin fork",
    "SHA-256",
    "mining",
    "decentralized",
    "digital currency",
  ],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "TARCOIN - Decentralized Digital Currency",
    description:
      "UTXO-based, SHA256d proof-of-work blockchain. 50 billion supply. Public ASIC mining.",
    url: "https://tarcoin.org",
    siteName: "TARCOIN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 800,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TARCOIN - Decentralized Digital Currency",
    description:
      "UTXO-based, SHA256d proof-of-work blockchain. 50 billion supply. Public ASIC mining.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${orbitron.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} font-space bg-tarcoin-black text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}