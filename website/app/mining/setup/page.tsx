"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function MinerSetupGuide() {
  return (
    <main className="min-h-screen bg-tarcoin-black">
      <div className="scanlines" />
      <div className="cyber-bg min-h-screen pt-20">
        <section className="relative min-h-[90vh] py-12">
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/mining" className="inline-flex items-center gap-2 text-tarcoin-cyan hover:text-white transition-colors mb-8 text-sm font-space">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Mining
            </Link>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-5xl font-orbitron font-black mb-6 text-white"
            >
              How to Mine <span className="text-tarcoin-gold text-glow">Tarcoin</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg text-gray-400 mb-12 font-space"
            >
              Whether you are using a small home miner like a Bitaxe or a massive Antminer S19, setting up to mine TAR is incredibly easy. 
              Follow the instructions below for your specific hardware.
            </motion.p>

            <div className="space-y-12">
              {/* Bitaxe Guide */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="glass rounded-2xl p-8 border border-tarcoin-cyan/20"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-tarcoin-cyan/10 flex items-center justify-center border border-tarcoin-cyan/20">
                    <svg className="w-6 h-6 text-tarcoin-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-orbitron font-bold text-white">Setup: Bitaxe / Home Miners</h2>
                </div>
                
                <p className="text-gray-400 font-space mb-6 text-sm">
                  The Bitaxe (AxeOS) makes it incredibly simple to mine. We even have custom-compiled firmware available for maximum compatibility!
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  <a href="/downloads/tarcoin-bitaxe-firmware.zip" download className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Full Firmware (.zip)
                  </a>
                  <a href="/downloads/esp-miner.bin" download className="btn-ghost text-xs px-4 py-2 border-tarcoin-cyan/30 text-tarcoin-cyan">
                    esp-miner.bin
                  </a>
                  <a href="/downloads/www.bin" download className="btn-ghost text-xs px-4 py-2 border-tarcoin-cyan/30 text-tarcoin-cyan">
                    www.bin
                  </a>
                </div>

                <p className="text-gray-400 font-space mb-4 text-sm">
                  After flashing, log into your Bitaxe dashboard and enter the following settings:
                </p>

                <div className="space-y-4 font-space text-sm">
                  <div className="bg-black/50 rounded-lg p-4 border border-white/5">
                    <p className="text-gray-500 mb-1">Stratum URL / Pool Host</p>
                    <code className="text-tarcoin-cyan text-base">stratum.tarcoin.org</code>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 border border-white/5 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 border-l-2 border-tarcoin-cyan pl-3">
                      <p className="text-gray-500 mb-1">Port <span className="text-tarcoin-cyan font-bold">(Shared Pool)</span></p>
                      <code className="text-tarcoin-cyan text-base">3333</code>
                      <p className="text-xs text-gray-400 mt-1">Steady payouts. Best for small miners.</p>
                    </div>
                    <div className="flex-1 border-l-2 border-tarcoin-gold pl-3">
                      <p className="text-gray-500 mb-1">Port <span className="text-tarcoin-gold font-bold">(Solo Pool)</span></p>
                      <code className="text-tarcoin-gold text-base">3334</code>
                      <p className="text-xs text-gray-400 mt-1">Keep 100% of the block. High risk/reward.</p>
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 border border-white/5">
                    <p className="text-gray-500 mb-1">User / Wallet Address</p>
                    <code className="text-tarcoin-gold text-base">Your TAR Wallet Address (e.g. tar1q...)</code>
                    <p className="text-xs text-gray-400 mt-2">
                      Worker names (e.g. tar1q...<strong>.bitaxe1</strong>) are optional but fully supported on both pools!
                    </p>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 border border-white/5">
                    <p className="text-gray-500 mb-1">Password</p>
                    <code className="text-tarcoin-cyan text-base">x</code>
                    <p className="text-xs text-gray-400 mt-2">Our Vardiff will auto-adjust your difficulty. To hardcode it, use <code className="text-white">d=2800</code> (replace 2800 with your desired diff).</p>
                  </div>
                </div>
              </motion.div>

              {/* standard ASIC Guide */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="glass rounded-2xl p-8 border border-tarcoin-gold/20"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-tarcoin-gold/10 flex items-center justify-center border border-tarcoin-gold/20">
                    <svg className="w-6 h-6 text-tarcoin-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-orbitron font-bold text-white">Setup: Standard ASICs (Antminer, Whatsminer)</h2>
                </div>
                
                <p className="text-gray-400 font-space mb-6 text-sm">
                  Log into your ASIC&apos;s dashboard and configure your primary pool with the following settings. You can choose between Shared or Solo mining.
                </p>

                <div className="space-y-4 font-space text-sm">
                  <div className="bg-black/50 rounded-lg p-4 border border-white/5 border-l-2 border-l-tarcoin-cyan">
                    <p className="text-gray-500 mb-1">URL <span className="text-tarcoin-cyan font-bold">(Shared Pool - Steady Payouts)</span></p>
                    <code className="text-tarcoin-cyan text-base">stratum+tcp://stratum.tarcoin.org:3333</code>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 border border-white/5 border-l-2 border-l-tarcoin-gold">
                    <p className="text-gray-500 mb-1">URL <span className="text-tarcoin-gold font-bold">(Solo Pool - 100% Block Reward)</span></p>
                    <code className="text-tarcoin-gold text-base">stratum+tcp://stratum.tarcoin.org:3334</code>
                    <p className="text-xs text-gray-500 mt-2">Note: If your custom firmware fails to connect, try removing &apos;stratum+tcp://&apos;</p>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 border border-white/5">
                    <p className="text-gray-500 mb-1">Worker / Username</p>
                    <code className="text-tarcoin-gold text-base">Your TAR Wallet Address</code>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 border border-white/5">
                    <p className="text-gray-500 mb-1">Password</p>
                    <code className="text-tarcoin-cyan text-base">x</code>
                    <p className="text-xs text-gray-500 mt-2">If your ASIC hashes incredibly fast (over 100 TH/s) and you want to prevent initial disconnects, set a static difficulty: <code className="text-white">d=65536</code>.</p>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <h4 className="text-red-400 font-orbitron font-bold mb-2">Troubleshooting Disconnects (Dead Status)</h4>
                  <ul className="text-sm text-red-300/80 font-space list-disc list-inside space-y-1">
                    <li>Make sure you are using a <strong>SHA256d</strong> ASIC (e.g. not a Kaspa or Dogecoin ASIC).</li>
                    <li>If you are using a VPN, it may block ports 3333/3334. Try turning it off.</li>
                    <li>If your custom firmware tries to force AsicBoost, turn AsicBoost <strong>OFF</strong> for this pool.</li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
