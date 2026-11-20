"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BsDownload, BsImage, BsFileEarmarkZip, BsBoxArrowUpRight } from "react-icons/bs";

const brandAssets = [
  {
    name: "TARCOIN Logo",
    format: "PNG / SVG",
    desc: "Primary official TARCOIN full logo with gold and black metallic scheme.",
    preview: "/logo.png",
    directFile: "/logo.png",
    directName: "tarcoin-logo.png",
    packFile: "/downloads/tarcoin-logo-pack.zip",
    packName: "tarcoin-logo-pack.zip",
    resolution: "High-Res PNG",
  },
  {
    name: "TAR Symbol",
    format: "PNG (Transparent)",
    desc: "The official $TAR ticker symbol badge for exchanges, widgets, and wallet icons.",
    preview: "/tar-symbol.png",
    directFile: "/tar-symbol.png",
    directName: "tar-symbol.png",
    packFile: "/downloads/tarcoin-symbol-pack.zip",
    packName: "tarcoin-symbol-pack.zip",
    resolution: "256x256 & 3D Pack",
  },
  {
    name: "Icon Pack",
    format: "ICO / PNG",
    desc: "Favicons, multi-resolution application icons (16x16, 32x32, 48x48, 200x200).",
    preview: "/favicon.png",
    directFile: "/favicon.png",
    directName: "tarcoin-favicon.png",
    packFile: "/downloads/tarcoin-icon-pack.zip",
    packName: "tarcoin-icon-pack.zip",
    resolution: "Complete Multi-Size Set",
  },
  {
    name: "Banner Pack",
    format: "PNG / JPG",
    desc: "High-definition social media banners, Twitter/X headers (1250x560), and promo graphics.",
    preview: "/tar-symbol.png",
    directFile: "/downloads/tarcoin-banner-pack.zip",
    directName: "tarcoin-banner-pack.zip",
    packFile: "/downloads/tarcoin-banner-pack.zip",
    packName: "tarcoin-banner-pack.zip",
    resolution: "Social & DEX Banners",
  },
];

export default function BrandPage() {
  return (
    <main className="min-h-screen bg-tarcoin-black text-white relative overflow-hidden">
      <div className="scanlines" />
      <div className="cyber-bg min-h-screen pt-20 pb-20">
        
        {/* Glow Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-tarcoin-gold/10 rounded-full blur-[140px] animate-float" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tarcoin-cyan/10 rounded-full blur-[140px] animate-float" style={{ animationDelay: "3s" }} />
        </div>

        <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          
          {/* Header Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-tarcoin-gold/25 bg-tarcoin-gold/10 mb-8 backdrop-blur-md"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-tarcoin-gold animate-pulse" />
            <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase font-bold">
              Official Brand Assets
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-5xl font-orbitron font-black mb-4 tracking-tight"
          >
            Brand <span className="text-tarcoin-gold drop-shadow-[0_0_20px_rgba(212,168,67,0.35)]">Assets & Media Kit</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto mb-6 font-space font-light"
          >
            Official TARCOIN logos, icons, badges, and brand guidelines for community members, exchange listings, and media publications.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-14"
          >
            <a
              href="https://github.com/Tarcoin/tarcoin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-tarcoin-gold transition-colors"
            >
              <span>Verified Open Source Assets on GitHub</span>
              <BsBoxArrowUpRight className="text-[10px]" />
            </a>
          </motion.p>

          {/* Asset Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid sm:grid-cols-2 gap-6 text-left mb-16"
          >
            {brandAssets.map((asset, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 border border-tarcoin-gold/20 bg-tarcoin-black-2/80 backdrop-blur-xl shadow-xl flex flex-col justify-between hover:border-tarcoin-gold/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-orbitron text-tarcoin-gold tracking-widest uppercase font-semibold">
                      {asset.format}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                      {asset.resolution}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-tarcoin-black/90 border border-white/10 flex items-center justify-center p-2 overflow-hidden flex-shrink-0 group-hover:border-tarcoin-gold/40 transition-colors">
                      <img
                        src={asset.preview}
                        alt={asset.name}
                        className="max-w-full max-h-full object-contain filter drop-shadow-[0_2px_8px_rgba(212,168,67,0.3)]"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-orbitron font-bold text-white group-hover:text-tarcoin-gold transition-colors">
                        {asset.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-space mt-1 leading-relaxed">
                        {asset.desc}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-wrap items-center gap-2.5 mt-2">
                  <a
                    href={asset.directFile}
                    download={asset.directName}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-orbitron font-bold text-xs bg-tarcoin-gold text-black hover:bg-tarcoin-gold-light transition-all shadow-md flex-1 justify-center"
                  >
                    <BsDownload className="text-xs" />
                    Download {asset.directName.endsWith(".zip") ? "Pack" : "File"}
                  </a>

                  {asset.packFile !== asset.directFile && (
                    <a
                      href={asset.packFile}
                      download={asset.packName}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-orbitron font-semibold text-xs border border-tarcoin-gold/30 bg-tarcoin-gold/10 text-tarcoin-gold hover:bg-tarcoin-gold hover:text-black transition-all"
                      title="Download full zip archive"
                    >
                      <BsFileEarmarkZip className="text-xs" />
                      .ZIP Pack
                    </a>
                  )}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Official Tagline Banner */}
          <div className="p-8 rounded-2xl border border-tarcoin-gold/30 bg-gradient-to-r from-tarcoin-gold/10 via-amber-500/5 to-transparent backdrop-blur-md text-left mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.25em] uppercase font-bold block mb-1">
                Official Brand Tagline &amp; Motto
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-tarcoin-gold to-amber-500 tracking-wider">
                HOLD THE GOLD
              </h2>
              <p className="text-xs text-gray-400 font-space mt-2 max-w-xl">
                The official slogan representing Tarcoin&apos;s digital scarcity, sovereign SHA-256d Proof-of-Work backing, and long-term value preservation.
              </p>
            </div>
            <div className="flex-shrink-0 px-4 py-2 rounded-xl border border-tarcoin-gold/20 bg-tarcoin-gold/10 text-xs font-mono text-tarcoin-gold">
              Motto: &quot;Hold The Gold&quot;
            </div>
          </div>

          {/* Brand Usage Guidelines */}
          <div className="p-8 rounded-2xl border border-white/10 bg-tarcoin-black-2/60 backdrop-blur-md text-left mb-12">
            <h3 className="text-lg font-orbitron font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-tarcoin-gold">◈</span> Brand Color Palette & Usage
            </h3>
            <p className="text-xs text-gray-400 font-space mb-6">
              Please maintain clear space around the logo and avoid altering proportions, colors, or adding unauthorized drop shadows.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "Tarcoin Gold", hex: "#D4A843", rgb: "212, 168, 67", use: "Primary Brand Color" },
                { name: "Gold Light", hex: "#F0D080", rgb: "240, 208, 128", use: "Highlights & Accents" },
                { name: "Tarcoin Black", hex: "#0A0A0A", rgb: "10, 10, 10", use: "Primary Background" },
                { name: "Cyber Cyan", hex: "#00D4FF", rgb: "0, 212, 255", use: "DeFi & Network Signals" },
              ].map((c, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-white/5 bg-black/40">
                  <div
                    className="w-full h-8 rounded-lg mb-2.5 border border-white/10 shadow-inner"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="text-xs font-orbitron font-bold text-white">{c.name}</div>
                  <div className="text-[11px] font-mono text-tarcoin-gold mt-0.5">{c.hex}</div>
                  <div className="text-[10px] text-gray-500 font-space mt-1">{c.use}</div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-orbitron text-xs font-semibold border border-white/20 bg-white/5 text-gray-300 hover:text-white hover:border-white/40 transition-all"
          >
            ← Back to Home
          </Link>
        </section>
      </div>
    </main>
  );
}
