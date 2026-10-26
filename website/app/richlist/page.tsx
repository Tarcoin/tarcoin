"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function RichListPage() {
  const [richList, setRichList] = useState<{rank: number, address: string, balance: number}[]>([]);
  const [totalWallets, setTotalWallets] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/richlist.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.top_addresses) {
          setRichList(data.top_addresses);
        }
        if (data && data.total_wallets) {
          setTotalWallets(data.total_wallets);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load rich list:", err);
        setLoading(false);
      });
  }, []);

  const treasuryEntry = richList.find(item => item.balance > 1000000000);
  const treasuryBalance = treasuryEntry ? Math.round(treasuryEntry.balance) : null;
  const treasuryPercent = treasuryBalance ? ((treasuryBalance / 50000000000) * 100).toFixed(2) : null;
  const minerList = richList.filter(item => item.balance <= 1000000000);

  return (
    <main className="min-h-screen bg-tarcoin-black">
      <div className="scanlines" />
      <div className="cyber-bg min-h-screen pt-20">
        <section className="relative min-h-screen py-24 flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-tarcoin-gold/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tarcoin-cyan/5 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-tarcoin-gold/20 bg-tarcoin-gold/5 mb-8">
              <span className="w-2 h-2 rounded-full bg-tarcoin-gold animate-pulse" />
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase">Supply Distribution</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl font-orbitron font-black mb-4">
              <span className="text-white">Rich</span> <span className="text-tarcoin-gold ">List</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-gray-400 max-w-3xl mx-auto mb-10 font-space">
              Top TAR holder addresses and transparent supply distribution. Viewable via the blockchain explorer API.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4 mb-12">
              <a href="https://explorer.tarcoin.org" target="_blank" rel="noopener noreferrer" className="btn-primary text-base px-8 py-3.5">
                View in Explorer
              </a>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5">Back to Home</Link>
            </motion.div>

            {/* Dedicated Ecosystem Treasury Reserve Card */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}
              className="glass rounded-xl p-6 border border-tarcoin-gold/30 bg-tarcoin-gold/5 text-left mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-tarcoin-gold/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tarcoin-gold/10 border border-tarcoin-gold/30 text-tarcoin-gold text-xs font-orbitron mb-2">
                    🏛️ Protocol Ecosystem Reserve
                  </div>
                  <h3 className="text-lg font-orbitron font-bold text-white mb-1">
                    TARCOIN Foundation Cold Storage
                  </h3>
                  <p className="text-xs text-gray-400 font-space max-w-xl">
                    Dedicated 20% Genesis allocation secured in multi-layer Cold Storage. Reserved exclusively for Tier-1 exchange listings, infrastructure, and ecosystem grants.
                  </p>
                </div>
                <div className="md:text-right shrink-0">
                  <div className="text-xl font-mono font-bold text-white">
                    {treasuryBalance !== null ? treasuryBalance.toLocaleString() : "..."} <span className="text-tarcoin-gold text-sm">TAR</span>
                  </div>
                  <div className="text-xs font-space text-gray-400 mt-1">
                    {treasuryPercent !== null ? `${treasuryPercent}% of Max Supply (Locked)` : "Syncing..."}
                  </div>
                  <a 
                    href="https://tarcoin.org/transparency" 
                    className="inline-block mt-2 text-xs font-orbitron text-tarcoin-cyan hover:underline"
                  >
                    View Transparency Ledger →
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Miner & Community Rich List */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.0 }}
              className="glass rounded-xl p-6 border border-tarcoin-gold/10 text-left mt-8 overflow-hidden">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-orbitron font-semibold text-tarcoin-gold">Active Miners & Community Hodlers</h3>
                  <p className="text-xs text-gray-400 font-space mt-0.5">Ranked by Proof-of-Work mined supply</p>
                </div>
                {!loading && totalWallets !== null && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-tarcoin-gold/10 border border-tarcoin-gold/30 rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                    <span className="w-2 h-2 rounded-full bg-tarcoin-gold animate-pulse" />
                    <span className="text-sm font-space text-gray-300">Total Wallets on Network: <span className="text-white font-mono font-bold">{totalWallets.toLocaleString()}</span></span>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-black/20 border-b border-tarcoin-gold/20">
                    <tr>
                      <th className="px-4 py-3 font-orbitron tracking-wider">Rank</th>
                      <th className="px-4 py-3 font-orbitron tracking-wider">Address</th>
                      <th className="px-4 py-3 font-orbitron tracking-wider text-right">Balance (TAR)</th>
                      <th className="px-4 py-3 font-orbitron tracking-wider text-right">% of Supply</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tarcoin-gold/10">
                    {loading ? (
                      <tr className="hover:bg-white/5 transition-colors">
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                          Blockchain Indexer is syncing miner addresses... Check back shortly.
                        </td>
                      </tr>
                    ) : (() => {
                      const displayList = showAll ? minerList : minerList.slice(0, 20);

                      return displayList.length > 0 ? (
                        displayList.map((miner, index) => (
                          <tr key={miner.address} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-white font-mono font-bold">#{index + 1}</td>
                            <td className="px-4 py-3 text-tarcoin-gold font-mono text-xs">{miner.address}</td>
                            <td className="px-4 py-3 text-white text-right font-mono">
                              {miner.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-right font-mono">
                              {((miner.balance / 50000000000) * 100).toFixed(4)}%
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-white/5 transition-colors">
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                            No miner data found yet. The indexer will update shortly.
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {!loading && minerList.length > 20 && (
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={() => setShowAll(!showAll)}
                    className="btn-primary text-sm px-6 py-2 border border-tarcoin-gold/30 hover:bg-tarcoin-gold/10 transition-colors rounded-lg"
                  >
                    {showAll ? "Show Top 20" : `View All ${minerList.length} Addresses`}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}
