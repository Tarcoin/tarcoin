"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function ExplorerPage() {
  return (
    <main className="min-h-screen bg-tarcoin-black">
      <div className="scanlines" />
      <div className="cyber-bg min-h-screen pt-20">
        <section className="relative min-h-[90vh] flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-tarcoin-gold/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tarcoin-cyan/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-tarcoin-gold/20 bg-tarcoin-gold/5 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-tarcoin-gold animate-pulse" />
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase">Blockchain Explorer</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl font-orbitron font-black mb-6"
            >
              <span className="text-white">Blockchain</span>
              <br />
              <span className="text-tarcoin-gold text-glow">Explorer</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-gray-400 max-w-3xl mx-auto mb-10 font-space"
            >
              Explore the TARCOIN blockchain in real-time. View blocks, transactions, addresses, mempool activity, and track supply distribution.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <a href="https://explorer.tarcoin.org" target="_blank" rel="noopener noreferrer" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Explorer (port 4000)
              </a>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5">
                Back to Home
              </Link>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 text-left"
            >
              {[
                { title: "Block Explorer", desc: "Search blocks, view transactions, and track the blockchain in real-time." },
                { title: "Address Lookup", desc: "Check balances, transaction history, and UTXO set for any address." },
                { title: "Mempool Monitor", desc: "Watch pending transactions, fees, and network congestion in real-time." },
                { title: "Rich List", desc: "View the top TAR holders with transparent supply distribution." },
              ].map((f, i) => (
                <div key={f.title} className="glass rounded-xl p-6 border border-tarcoin-gold/10">
                  <div className="text-xs font-orbitron text-tarcoin-gold tracking-widest mb-2">0x{i + 1}</div>
                  <h3 className="text-lg font-orbitron font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-400">{f.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}