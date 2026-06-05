"use client";

import Link from "next/link";
import { BsGithub, BsTwitter, BsDiscord, BsTelegram, BsMedium } from "react-icons/bs";

const footerLinks = {
  blockchain: [
    { name: "Explorer", href: "/explorer" },
    { name: "Whitepaper", href: "/whitepaper" },
    { name: "Network Status", href: "/network" },
    { name: "Rich List", href: "/richlist" },
  ],
  wallets: [
    { name: "Windows Wallet", href: "/download#windows" },
    { name: "macOS Wallet", href: "/download#macos" },
    { name: "Linux Wallet", href: "/download#linux" },
    { name: "CLI Tools", href: "/download#cli" },
  ],
  mining: [
    { name: "Getting Started", href: "/mining/guide" },
    { name: "Mining Pool", href: "/pool" },
    { name: "Stratum Setup", href: "/mining/stratum" },
    { name: "Profitability", href: "/mining/profit" },
  ],
  developers: [
    { name: "API Docs", href: "/api" },
    { name: "GitHub", href: "https://github.com/tarcoin" },
    { name: "RPC Reference", href: "/api/rpc" },
    { name: "Source Code", href: "https://github.com/Tarcoin/tarcoin" },
  ],
  resources: [
    { name: "FAQ", href: "/faq" },
    { name: "Mining Guide", href: "/mining/guide" },
    { name: "Security", href: "/security" },
    { name: "Brand Assets", href: "/brand" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-tarcoin-gold/10 bg-tarcoin-black-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <img src="/logo.png" alt="TARCOIN" className="w-14 h-14" />
              <span className="font-orbitron font-bold text-xl text-white">TARCOIN</span>
            </Link>
            <p className="text-sm text-gray-500 mb-6">
              A decentralized SHA-256 proof-of-work blockchain built for secure peer-to-peer value transfer, fixed digital scarcity, and long-term network sustainability.
            </p>
            <div className="flex space-x-3">
              <a href="https://github.com/tarcoin" className="w-10 h-10 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-tarcoin-gold hover:border-tarcoin-gold/30 transition-all">
                <BsGithub size={18} />
              </a>
              <a href="https://twitter.com/tarcoin" className="w-10 h-10 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-tarcoin-gold hover:border-tarcoin-gold/30 transition-all">
                <BsTwitter size={18} />
              </a>
              <a href="https://discord.gg/tarcoin" className="w-10 h-10 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-tarcoin-gold hover:border-tarcoin-gold/30 transition-all">
                <BsDiscord size={18} />
              </a>
              <a href="https://t.me/tarcoin" className="w-10 h-10 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-tarcoin-gold hover:border-tarcoin-gold/30 transition-all">
                <BsTelegram size={18} />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-orbitron font-bold text-tarcoin-gold uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-tarcoin-gold transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-tarcoin-gold/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} TARCOIN. Open source. MIT licensed.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>P2P Port: 19333</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>RPC Port: 19332</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>bech32: tar</span>
          </div>
        </div>
      </div>
    </footer>
  );
}