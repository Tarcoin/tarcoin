"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function ApiPage() {
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
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase">RESTful API</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl font-orbitron font-black mb-6"
            >
              <span className="text-white">TARCOIN</span>
              <br />
              <span className="text-tarcoin-gold text-glow">API</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-gray-400 max-w-3xl mx-auto mb-10 font-space"
            >
              Build on TARCOIN with a comprehensive RESTful API. Access blockchain data, wallet utilities, mining information, and more.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4 mb-16"
            >
              <a href="https://api.tarcoin.org/api/docs" target="_blank" rel="noopener noreferrer" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                API Documentation
              </a>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5">
                Back to Home
              </Link>
            </motion.div>

            {/* Endpoints */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid sm:grid-cols-2 gap-6 text-left"
            >
              <div className="glass rounded-xl p-6 border border-tarcoin-gold/10">
                <h3 className="text-lg font-orbitron font-semibold mb-4 text-tarcoin-gold">Blockchain Data</h3>
                <ul className="space-y-3 text-sm font-mono">
                  <li><span className="text-tarcoin-cyan">GET</span> <span className="text-white">/api/block/:hash</span></li>
                  <li><span className="text-tarcoin-cyan">GET</span> <span className="text-white">/api/blocks</span></li>
                  <li><span className="text-tarcoin-cyan">GET</span> <span className="text-white">/api/tx/:txid</span></li>
                  <li><span className="text-tarcoin-cyan">GET</span> <span className="text-white">/api/address/:address</span></li>
                  <li><span className="text-tarcoin-cyan">GET</span> <span className="text-white">/api/mempool</span></li>
                  <li><span className="text-tarcoin-cyan">GET</span> <span className="text-white">/api/supply</span></li>
                </ul>
              </div>
              <div className="glass rounded-xl p-6 border border-tarcoin-gold/10">
                <h3 className="text-lg font-orbitron font-semibold mb-4 text-tarcoin-gold">Utilities</h3>
                <ul className="space-y-3 text-sm font-mono">
                  <li><span className="text-tarcoin-cyan">GET</span> <span className="text-white">/api/search?q=</span></li>
                  <li><span className="text-tarcoin-cyan">GET</span> <span className="text-white">/api/network/stats</span></li>
                  <li><span className="text-tarcoin-cyan">GET</span> <span className="text-white">/api/richlist</span></li>
                  <li><span className="text-tarcoin-gold">POST</span> <span className="text-white">/api/wallet/validate</span></li>
                  <li><span className="text-tarcoin-gold">POST</span> <span className="text-white">/api/wallet/estimate-fee</span></li>
                </ul>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}