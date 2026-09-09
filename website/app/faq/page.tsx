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
              <h1 className="text-4xl md:text-5xl font-orbitron font-black mb-4">
                <span className="text-white">Frequently Asked</span> <span className="text-tarcoin-gold ">Questions</span>
              </h1>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6 text-left">
              {[
                { q: "What is TARCOIN?", a: "TARCOIN (TAR) is a decentralized, UTXO-based cryptocurrency built on a fork of Bitcoin Core v31.x. It uses SHA256d Proof-of-Work, has a fixed supply of 50 billion TAR, and is fully ASIC compatible." },
                { q: "How do I get TAR?", a: "You can mine TAR using any SHA256d ASIC miner or CPU miner. Point your miner to our official pool at stratum+tcp://stratum.tarcoin.org:3333 (or backup stratum2.tarcoin.org:3333) for the easiest setup, or mine solo directly to your own wallet address. TAR can also be obtained through peer-to-peer transactions or future exchange listings." },
                { q: "What wallets are available?", a: "The official TARCOIN Core wallet is available for Windows, macOS, and Linux. It features full node capabilities, AES-256 encryption, and BIP39/BIP32 mnemonic seeds." },
                { q: "How do I import my Web Wallet or Android Wallet into the Windows Wallet?", a: (
                  <div className="space-y-3">
                    <p><strong>Step 1:</strong> In the Web Wallet, go to <strong>Settings &rarr; Export Private Key</strong>, and copy your WIF Format key <em>(it will start with an &apos;L&apos; or &apos;K&apos;)</em>.</p>
                    <p><strong>Step 2 (Optional):</strong> If you want to keep your Web Wallet balance completely separated from your main Windows Wallet, you can create a new blank wallet first! In Tarcoin-Qt, go to <strong>File &rarr; Create Wallet</strong>, name it &apos;Web Wallet&apos;, check the &quot;Make Blank Wallet&quot; box, and click Create. <em>(Make sure it is selected in the top right corner before continuing!)</em></p>
                    <p><strong>Step 3:</strong> Open Tarcoin-Qt and go to <strong>Help &rarr; Debug Window &rarr; Console</strong>.</p>
                    <p><strong>Step 4:</strong> First, we need to generate a cryptographic checksum for your key. Type this command and hit Enter <em>(replace YOUR_WIF_KEY with your actual key)</em>:<br />
                    <code className="bg-black/40 px-2 py-1.5 rounded text-tarcoin-gold font-mono break-all block mt-2 border border-tarcoin-gold/20">getdescriptorinfo &quot;wpkh(YOUR_WIF_KEY)&quot;</code></p>
                    <p><strong>Step 5:</strong> The console will output a &quot;checksum&quot;. Copy that 8-character checksum string <em>(for example: m0p2yd0c)</em>.</p>
                    <p><strong>Step 6:</strong> Finally, run this exact command to officially import your wallet and scan for your balance. <em>(Replace the key with your key, and replace YOUR_CHECKSUM with the checksum you just copied)</em>:<br />
                    <code className="bg-black/40 px-2 py-1.5 rounded text-tarcoin-gold font-mono break-all block mt-2 border border-tarcoin-gold/20">importdescriptors &quot;[&#123;&quot;desc&quot;:&quot;wpkh(YOUR_WIF_KEY)#YOUR_CHECKSUM&quot;,&quot;timestamp&quot;:0,&quot;internal&quot;:false&#125;]&quot;</code></p>
                    <p className="text-tarcoin-gold pt-2"><em>Your wallet will freeze for a minute to scan the blockchain, and then your Web Wallet balance will magically appear on your desktop!</em></p>
                  </div>
                ) },
                { q: "Can I mine TAR with my Bitcoin ASIC?", a: "Yes! TARCOIN uses the same SHA256d algorithm as Bitcoin. Any Bitcoin ASIC miner or CPU miner can mine TAR by pointing it to stratum+tcp://stratum.tarcoin.org:3333 (Backup: stratum2.tarcoin.org:3333) with your TAR wallet address as the username and any password (e.g. x)." },
                { q: "What is the total supply?", a: "The total supply is 50,000,000,000 TAR. 80% (40B) is distributed through SHA256 Proof-of-Work mining rewards over 15-20 years. 20% (10B) is reserved and managed by the founding team for ecosystem growth, exchange listings, infrastructure, developer compensation, and community initiatives." },
                { q: "Is TARCOIN a Bitcoin fork?", a: "TARCOIN is derived from Bitcoin Core v31.x with modified supply parameters, network parameters, address prefixes, and branding. The consensus rules and security model remain identical to Bitcoin." },
                { q: "How does the halving schedule work?", a: "Block rewards start at 50,000 TAR and halve every 400,000 blocks (approximately every 7.6 years). The emission schedule is designed to distribute the mineable supply over 15-20 years." },
                { q: "Is there any pre-mine or ICO?", a: "No ICO and no pre-sale. The 10B TAR reserve was allocated at genesis to a publicly verifiable cold storage address and is managed by the founding team for long-term ecosystem development. All remaining coins are distributed fairly through Proof-of-Work mining rewards." },
              ].map((item, i) => (
                <details key={i} className="glass rounded-xl border border-tarcoin-gold/10 group open:border-tarcoin-gold/30 transition-all">
                  <summary className="px-6 py-5 cursor-pointer flex items-center justify-between gap-4 list-none">
                    <span className="text-base font-orbitron font-semibold text-white group-open:text-tarcoin-gold transition-colors">{item.q}</span>
                    <svg className="w-5 h-5 text-tarcoin-gold flex-shrink-0 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-5 pt-0">
                    <div className="text-sm text-gray-400 leading-relaxed">{item.a}</div>
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