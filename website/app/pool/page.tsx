"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PoolPage() {
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
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase">Mining Pool</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl font-orbitron font-black mb-6">
              <span className="text-white">TARCOIN</span><br />
              <span className="text-tarcoin-gold text-glow">Mining Pool</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-gray-400 max-w-3xl mx-auto mb-10 font-space">
              Official TARCOIN mining pool. Stratum protocol, ASIC compatible, daily payouts.
              Point your SHA256d miners to <code className="text-tarcoin-gold">stratum+tcp://pool.tarcoin.org:3333</code>
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4 mb-16">
              <a href="https://pool.tarcoin.org" target="_blank" rel="noopener noreferrer" className="btn-primary text-base px-8 py-3.5">
                Pool Dashboard
              </a>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5">Back to Home</Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {[
                { title: "Stratum Server", desc: "Fully compatible Stratum protocol on port 3333 for all ASIC miners." },
                { title: "Worker Management", desc: "Create and monitor multiple workers with detailed share tracking." },
                { title: "Daily Payouts", desc: "Automatic daily payouts directly to your TAR wallet." },
                { title: "Pool Stats", desc: "Real-time hashrate, shares, miners, and block finder dashboard." },
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