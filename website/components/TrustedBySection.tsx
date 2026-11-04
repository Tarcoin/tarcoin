"use client";

import { motion } from "framer-motion";

export default function TrustedBySection() {
  return (
    <section className="py-12 border-t border-white/5 bg-black/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Section Heading */}
          <p className="text-tarcoin-gold font-orbitron font-semibold text-sm sm:text-base tracking-wider mb-6">
            Trusted by leading platforms
          </p>

          {/* Platform Cards Container */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* 1. Blockspot.io Card (First) */}
            <a
              href="https://blockspot.io/coin/tarcoin-tar/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Tarcoin on Blockspot.io"
              className="group inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-[#0e2430]/90 hover:bg-[#133242] border border-cyan-500/30 hover:border-tarcoin-gold/70 shadow-lg shadow-cyan-950/40 transition-all duration-300 hover:scale-105"
            >
              <img
                src="/blockspot-icon.png"
                alt="Blockspot.io"
                className="w-6 h-7 object-contain drop-shadow"
              />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-white group-hover:text-tarcoin-gold font-orbitron font-bold text-sm tracking-wide transition-colors">
                    blockspot.io
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    Verified ✅
                  </span>
                </div>
              </div>
            </a>

            {/* 2. LiveCoinWatch Card */}
            <a
              href="https://www.livecoinwatch.com/price/Tarcoin-_TAR"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Tarcoin on LiveCoinWatch"
              className="group inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-[#0e2430]/90 hover:bg-[#133242] border border-cyan-500/30 hover:border-tarcoin-gold/70 shadow-lg shadow-cyan-950/40 transition-all duration-300 hover:scale-105"
            >
              <img
                src="/livecoinwatch-icon.svg"
                alt="LiveCoinWatch"
                className="w-7 h-7 object-contain drop-shadow"
              />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-white group-hover:text-tarcoin-gold font-orbitron font-bold text-sm tracking-wide transition-colors">
                    LiveCoinWatch
                  </span>
                  <span className="text-[10px] font-mono bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    Live 🟢
                  </span>
                </div>
              </div>
            </a>

            {/* 3. CryptoPoolWatch Card */}
            <a
              href="https://cryptopoolwatch.live/coins/tarcoin"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Tarcoin on CryptoPoolWatch"
              className="group inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-[#0e2430]/90 hover:bg-[#133242] border border-cyan-500/30 hover:border-tarcoin-gold/70 shadow-lg shadow-cyan-950/40 transition-all duration-300 hover:scale-105"
            >
              <img
                src="/cpw-mark-dark.svg"
                alt="CryptoPoolWatch"
                className="w-7 h-7 object-contain drop-shadow"
              />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-white group-hover:text-tarcoin-gold font-orbitron font-bold text-sm tracking-wide transition-colors">
                    CryptoPoolWatch
                  </span>
                  <span className="text-[10px] font-mono bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    Tracked 📊
                  </span>
                </div>
              </div>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
