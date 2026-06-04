"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function MiningStratumPage() {
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
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase inline-block mb-3">Setup</span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-orbitron font-bold mb-4">
                <span className="text-white">Stratum</span><br />
                <span className="text-tarcoin-gold text-glow">Configuration</span>
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto mt-4 text-base">
                Stratum protocol connection details and configuration for TARCOIN mining.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="glass rounded-xl p-8 border border-tarcoin-gold/10 mb-8 text-left">
              <h3 className="text-lg font-orbitron font-semibold mb-4 text-tarcoin-gold">Stratum Connection Details</h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">URL</span>
                  <span className="text-white">stratum+tcp://pool.tarcoin.org:3333</span>
                </div>
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">Port</span>
                  <span className="text-white">3333 (SSL: 3334)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">Protocol</span>
                  <span className="text-white">Stratum v1</span>
                </div>
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">Algorithm</span>
                  <span className="text-tarcoin-gold">SHA256d</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Worker Format</span>
                  <span className="text-white">[TAR_Address]</span>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="text-center">
              <Link href="/mining" className="btn-ghost text-base px-8 py-3.5">Back to Mining</Link>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5 ml-4">Back to Home</Link>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}