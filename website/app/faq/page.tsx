"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function FaqPage() {
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
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase inline-block mb-3">FAQ</span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-orbitron font-bold mb-4">
                <span className="text-white">Frequently Asked</span><br />
                <span className="text-tarcoin-gold text-glow">Questions</span>
              </h1>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6 text-left">
              {[
                { q: "What is TARCOIN?", a: "TARCOIN (TAR) is a decentralized, UTXO-based cryptocurrency built on a fork of Bitcoin Core v31.x. It uses SHA256d Proof-of-Work, has a fixed supply of 50 billion TAR, and is fully ASIC compatible." },
                { q: "How do I get TAR?", a: "You can mine TAR using SHA256d ASIC miners through the official mining pool. TAR can also be obtained through peer-to-peer transactions or exchange listings." },
                { q: "What wallets are available?", a: "The official TARCOIN Core wallet is available for Windows, macOS, and Linux. It features full node capabilities, AES-256 encryption, and BIP39/BIP32 mnemonic seeds." },
                { q: "Can I mine TAR with my Bitcoin ASIC?", a: "Yes! TARCOIN uses the same SHA256d algorithm as Bitcoin. Any Bitcoin ASIC miner can mine TAR by pointing it to the TARCOIN pool at stratum+tcp://pool.tarcoin.org:3333." },
                { q: "What is the total supply?", a: "The total supply is 50,000,000,000 TAR. 80% (40B) is allocated to public mining rewards, and 20% (10B) to a long-term ecosystem treasury allocated at genesis." },
                { q: "Is TARCOIN a Bitcoin fork?", a: "TARCOIN is derived from Bitcoin Core v31.x with modified supply parameters, network parameters, address prefixes, and branding. The consensus rules and security model remain identical to Bitcoin." },
                { q: "How does the halving schedule work?", a: "Block rewards start at 50,000 TAR and halve every 400,000 blocks (approximately every 7.6 years). The emission schedule is designed to distribute the mineable supply over 15-20 years." },
                { q: "Is there any pre-mine or ICO?", a: "No ICO, no pre-sale, no founder rewards. The ecosystem treasury of 10B TAR was allocated at genesis to a publicly verifiable cold storage address. All other coins are distributed through mining rewards." },
              ].map((item, i) => (
                <details key={i} className="glass rounded-xl border border-tarcoin-gold/10 group open:border-tarcoin-gold/30 transition-all">
                  <summary className="px-6 py-5 cursor-pointer flex items-center justify-between gap-4 list-none">
                    <span className="text-base font-orbitron font-semibold text-white group-open:text-tarcoin-gold transition-colors">{item.q}</span>
                    <svg className="w-5 h-5 text-tarcoin-gold flex-shrink-0 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
                  </div>
                </details>
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