"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function RichListPage() {
  const [richList, setRichList] = useState<{rank: number, address: string, balance: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/richlist.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.top_addresses) {
          setRichList(data.top_addresses);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load rich list:", err);
        setLoading(false);
      });
  }, []);

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
              className="text-5xl sm:text-6xl md:text-7xl font-orbitron font-black mb-6">
              <span className="text-white">Rich</span><br />
              <span className="text-tarcoin-gold text-glow">List</span>
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
            {/* 
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}
              className="glass rounded-xl p-6 border border-tarcoin-gold/10 text-left">
              <h3 className="text-lg font-orbitron font-semibold mb-4 text-tarcoin-gold">Supply Breakdown</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">Maximum Supply</span>
                  <span className="text-white font-mono">50,000,000,000 TAR</span>
                </div>
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">Mineable Supply (80%)</span>
                  <span className="text-white font-mono">40,000,000,000 TAR</span>
                </div>
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">Ecosystem Treasury (20%)</span>
                  <span className="text-tarcoin-gold font-mono">10,000,000,000 TAR</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Circulating Supply</span>
                  <span className="text-white font-mono">Check explorer for live data</span>
                </div>
              </div>
            </motion.div>
            */}

            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.0 }}
              className="glass rounded-xl p-6 border border-tarcoin-gold/10 text-left mt-8 overflow-hidden">
              <h3 className="text-lg font-orbitron font-semibold mb-4 text-tarcoin-gold">Top Addresses (Rich List)</h3>
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
                    ) : richList.length > 0 ? (
                      (showAll ? richList : richList.slice(0, 20)).map((miner, index) => (
                        <tr key={miner.address} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-white">{index + 1}</td>
                          <td className="px-4 py-3 text-tarcoin-gold font-mono text-xs">{miner.address}</td>
                          <td className="px-4 py-3 text-white text-right font-mono">
                            {miner.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-right">
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
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && richList.length > 20 && (
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={() => setShowAll(!showAll)}
                    className="btn-primary text-sm px-6 py-2 border border-tarcoin-gold/30 hover:bg-tarcoin-gold/10 transition-colors rounded-lg"
                  >
                    {showAll ? "Show Top 20" : `View All ${richList.length} Addresses`}
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