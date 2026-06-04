"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function NetworkPage() {
  return (
    <main className="min-h-screen bg-tarcoin-black">
      <div className="scanlines" />
      <div className="cyber-bg min-h-screen pt-20">
        <section className="relative min-h-screen flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-tarcoin-gold/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tarcoin-cyan/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
          </div>
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-tarcoin-gold/20 bg-tarcoin-gold/5 mb-8">
              <span className="w-2 h-2 rounded-full bg-tarcoin-gold animate-pulse" />
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase">Network Status</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl font-orbitron font-black mb-6">
              <span className="text-white">Network</span><br />
              <span className="text-tarcoin-gold text-glow">Status</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-gray-400 max-w-3xl mx-auto mb-10 font-space">
              Real-time TARCOIN mainnet status. View block height, difficulty, hashrate, and node health.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left mb-12">
              {[
                { label: "Consensus", value: "SHA256d PoW" },
                { label: "Block Time", value: "~10 minutes" },
                { label: "Difficulty", value: "Loading..." },
                { label: "Block Height", value: "Loading..." },
                { label: "Network Hashrate", value: "Loading..." },
                { label: "Active Nodes", value: "Loading..." },
              ].map((s) => (
                <div key={s.label} className="glass rounded-xl p-6 border border-tarcoin-gold/10">
                  <div className="text-xs font-orbitron text-tarcoin-gold tracking-widest mb-1">{s.label}</div>
                  <div className="text-xl font-mono text-white">{s.value}</div>
                </div>
              ))}
            </motion.div>
            <Link href="/" className="btn-ghost text-base px-8 py-3.5">Back to Home</Link>
          </div>
        </section>
      </div>
    </main>
  );
}