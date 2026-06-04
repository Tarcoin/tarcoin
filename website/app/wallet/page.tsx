"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function WalletPage() {
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
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase">Secure Wallet</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl font-orbitron font-black mb-6"
            >
              <span className="text-white">TARCOIN</span>
              <br />
              <span className="text-tarcoin-gold text-glow">Wallet</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-gray-400 max-w-3xl mx-auto mb-10 font-space"
            >
              Secure, decentralized wallet for storing, sending, and receiving TAR. 
              Full Bitcoin Core compatibility with SegWit, Bech32, and hierarchical deterministic key generation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4 mb-16"
            >
              <Link href="/download" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Wallet
              </Link>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5">
                Back to Home
              </Link>
            </motion.div>

            {/* Wallet Features */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left"
            >
              {[
                { title: "AES-256 Encryption", desc: "All wallet files encrypted with industry-standard AES-256 encryption." },
                { title: "BIP39/BIP32 Seeds", desc: "12/24 word mnemonic phrases for backup and recovery." },
                { title: "SegWit Support", desc: "Bech32 (tar1) addresses for lower fees and faster transactions." },
                { title: "Cold Storage", desc: "Offline transaction signing for maximum security." },
                { title: "RPC Interface", desc: "Full JSON-RPC API for programmatic wallet management." },
                { title: "Multi-Platform", desc: "Windows, macOS, and Linux desktop wallets available." },
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