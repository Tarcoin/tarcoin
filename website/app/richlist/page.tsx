"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function RichListPage() {
  return (
    <main className="min-h-screen bg-tarcoin-black">
      <div className="scanlines" />
      <div className="cyber-bg min-h-screen pt-20">
        <section className="relative min-h-screen py-24 flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-tarcoin-gold/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tarcoin-cyan/5 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-tarcoin-gold/20 bg-tarcoin-gold/5 mb-8">
              <span className="w-2 h-2 rounded-full bg-tarcoin-gold animate-pulse" />
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase">Supply Distribution</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl font-orbitron font-black mb-6">
              <span className="text-white">Rich</span><br />
              <span className="text-tarcoin-gold text-glow">List</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-gray-400 max-w-3xl mx-auto mb-10 font-space">
              Top TAR holder addresses and transparent supply distribution. Viewable via the blockchain explorer API.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4 mb-12">
              <a href="http://localhost:4000" target="_blank" rel="noopener noreferrer" className="btn-primary text-base px-8 py-3.5">
                View in Explorer
              </a>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5">Back to Home</Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}
              className="glass rounded-xl p-6 border border-tarcoin-gold/10 text-left">
              <h3 className="text-lg font-orbitron font-semibold mb-4 text-tarcoin-gold">Supply Breakdown</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">Maximum Supply</span>
                  <span className="text-white font-mono">50,000,000,000 TAR</span>
                </div>
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">Mineable Supply (80%)</span>
                  <span className="text-white font-mono">40,000,000,000 TAR</span>
                </div>
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">Ecosystem Treasury (20%)</span>
                  <span className="text-tarcoin-gold font-mono">10,000,000,000 TAR</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Circulating Supply</span>
                  <span className="text-white font-mono">Check explorer for live data</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}