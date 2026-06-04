"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function MiningGuidePage() {
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
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase inline-block mb-3">Guide</span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-orbitron font-bold mb-4">
                <span className="text-white">Mining</span><br />
                <span className="text-tarcoin-gold text-glow">Getting Started</span>
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto mt-4 text-base">
                Start mining TARCOIN with your SHA256d ASIC miners. Complete setup guide for pool mining.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-8 text-left">
              {[
                { step: "1", title: "Get a TAR Wallet", desc: "Download and install the TARCOIN Core wallet for your platform. Create a new wallet and generate a receiving address (starts with tar1...)." },
                { step: "2", title: "Configure Your ASIC Miner", desc: "Access your ASIC miner's web interface and enter the pool configuration: URL: stratum+tcp://pool.tarcoin.org:3333, Worker: [Your TAR Address], Password: anything (or x)." },
                { step: "3", title: "Set Pool Parameters", desc: "For most ASIC miners, you'll need to set the pool URL, worker name (your TAR address), and password. The TARCOIN pool uses the standard Stratum protocol on port 3333." },
                { step: "4", title: "Monitor Your Mining", desc: "Check the pool dashboard to see your hashrate, shares, and earnings. The pool updates in real-time. Daily automatic payouts to your TAR wallet." },
              ].map((g) => (
                <div key={g.step} className="glass rounded-xl p-6 border border-tarcoin-gold/10 flex gap-5">
                  <div className="w-12 h-12 rounded-full bg-tarcoin-gold/10 border border-tarcoin-gold/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-orbitron font-bold text-tarcoin-gold">{g.step}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-orbitron font-semibold mb-2">{g.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{g.desc}</p>
                  </div>
                </div>
              ))}
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