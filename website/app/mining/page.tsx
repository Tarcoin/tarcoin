"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function MiningPage() {
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
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase">SHA256d Mining</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl font-orbitron font-black mb-6"
            >
              <span className="text-white">Mine</span>
              <br />
              <span className="text-tarcoin-gold text-glow">TARCOIN</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-gray-400 max-w-3xl mx-auto mb-10 font-space"
            >
              TARCOIN uses SHA256d Proof-of-Work — fully compatible with Bitcoin ASIC miners. 
              40 billion TAR (80% of total supply) mineable through fair distribution over ~15-20 years.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Open Mining Pool
              </a>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5">
                Back to Home
              </Link>
            </motion.div>

            {/* Mining Details */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid sm:grid-cols-2 gap-6 mt-20 text-left"
            >
              <div className="glass rounded-xl p-6 border border-tarcoin-gold/10">
                <h3 className="text-lg font-orbitron font-semibold mb-4 text-tarcoin-gold">Pool Parameters</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><span className="text-white">Algorithm:</span> SHA256d</li>
                  <li><span className="text-white">Stratum Port:</span> 3333</li>
                  <li><span className="text-white">Block Reward:</span> 50,000 TAR</li>
                  <li><span className="text-white">Block Time:</span> ~10 minutes</li>
                  <li><span className="text-white">Pool Fee:</span> 1%</li>
                  <li><span className="text-white">Payouts:</span> Daily automatic</li>
                </ul>
              </div>
              <div className="glass rounded-xl p-6 border border-tarcoin-gold/10">
                <h3 className="text-lg font-orbitron font-semibold mb-4 text-tarcoin-gold">Getting Started</h3>
                <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
                  <li>Configure your ASIC miner for SHA256d</li>
                  <li>Point to <code className="text-tarcoin-gold">stratum+tcp://pool.tarcoin.org:3333</code></li>
                  <li>Set your TAR address as the worker username</li>
                  <li>Start mining and track shares on the pool dashboard</li>
                </ol>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}