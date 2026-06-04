"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function MiningProfitPage() {
  return (
    <main className="min-h-screen bg-tarcoin-black">
      <div className="scanlines" />
      <div className="cyber-bg min-h-screen pt-20">
        <section className="relative min-h-screen py-24 flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-tarcoin-gold/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tarcoin-cyan/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="text-center mb-16">
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase inline-block mb-3">Analysis</span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-orbitron font-bold mb-4">
                <span className="text-white">Mining</span><br />
                <span className="text-tarcoin-gold text-glow">Profitability</span>
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto mt-4 text-base">
                TARCOIN mining profitability overview and ROI estimates for SHA256d ASIC miners.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="grid sm:grid-cols-2 gap-6 text-left mb-8">
              {[
                { label: "Block Reward", value: "50,000 TAR" },
                { label: "Current Era", value: "Era 1 (~7.6 years)" },
                { label: "Pool Fee", value: "1%", accent: true },
                { label: "Payout Schedule", value: "Daily" },
              ].map((s) => (
                <div key={s.label} className="glass rounded-xl p-6 border border-tarcoin-gold/10">
                  <div className="text-xs font-orbitron text-tarcoin-gold tracking-widest mb-1">{s.label}</div>
                  <div className={`text-xl font-mono ${s.accent ? 'text-tarcoin-gold' : 'text-white'}`}>{s.value}</div>
                </div>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="glass rounded-xl p-6 border border-tarcoin-gold/10 text-left">
              <h3 className="text-lg font-orbitron font-semibold mb-4 text-tarcoin-gold">Important Notes</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Profitability depends on hashrate, power cost, and TAR market value</li>
                <li>• Block reward halves every 400,000 blocks (~7.6 years)</li>
                <li>• SHA256d ASIC miners are widely available from multiple manufacturers</li>
                <li>• Pool mining provides consistent payouts vs. solo mining variance</li>
                <li>• Use mining calculators to estimate daily earnings based on your hashrate</li>
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="text-center mt-12">
              <Link href="/mining" className="btn-ghost text-base px-8 py-3.5">Back to Mining</Link>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5 ml-4">Back to Home</Link>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}