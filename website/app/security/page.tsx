"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function SecurityPage() {
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
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase inline-block mb-3">Security</span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-orbitron font-bold mb-4">
                <span className="text-white">Security</span><br />
                <span className="text-tarcoin-gold text-glow">Overview</span>
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto mt-4 text-base">
                TARCOIN inherits Bitcoin Core's battle-tested security model and adds additional protections specific to the network.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="grid sm:grid-cols-2 gap-6 text-left">
              {[
                { title: "SHA256d Proof-of-Work", desc: "Dual SHA-256 hashing secures the network against all known cryptographic attacks. ASIC mining ensures the hashrate stays competitive." },
                { title: "UTXO Model", desc: "Each transaction consumes existing outputs and creates new ones. No double-spends, no balance manipulation. Full node validation of all UTXOs." },
                { title: "SegWit Support", desc: "Segregated Witness eliminates transaction malleability, increases block capacity, and enables second-layer solutions." },
                { title: "AES-256 Wallet Encryption", desc: "All wallet files encrypted with military-grade AES-256 encryption. BIP39/BIP32 hierarchical deterministic key generation for secure backups." },
                { title: "51% Attack Resistance", desc: "SHA256d ASIC compatibility ensures broad miner distribution. Multiple mining pools and public mining campaigns maintain decentralization." },
                { title: "Deterministic Builds", desc: "All releases are deterministically built and reproducible. Anyone can verify that the binary matches the published source code." },
              ].map((s, i) => (
                <div key={s.title} className="glass rounded-xl p-6 border border-tarcoin-gold/10">
                  <div className="text-xs font-orbitron text-tarcoin-gold tracking-widest mb-2">0x{i + 1}</div>
                  <h3 className="text-lg font-orbitron font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-400">{s.desc}</p>
                </div>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="text-center mt-12">
              <Link href="/" className="btn-ghost text-base px-8 py-3.5">Back to Home</Link>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}