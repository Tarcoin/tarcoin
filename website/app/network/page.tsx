"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const EXPLORER_API = process.env.NEXT_PUBLIC_EXPLORER_API || "https://explorer.tarcoin.org";

function formatHashrate(hr: number): string {
  if (!hr) return "0 H/s";
  if (hr < 1e3) return `${hr.toFixed(2)} H/s`;
  if (hr < 1e6) return `${(hr / 1e3).toFixed(2)} KH/s`;
  if (hr < 1e9) return `${(hr / 1e6).toFixed(2)} MH/s`;
  if (hr < 1e12) return `${(hr / 1e9).toFixed(2)} GH/s`;
  return `${(hr / 1e12).toFixed(2)} TH/s`;
}

function formatNumber(n: number): string {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString();
}

interface NetStats {
  blocks?: number;
  blockHeight?: number;
  hashrate?: number;
  difficulty?: number;
  connections?: number;
}

export default function NetworkPage() {
  const [stats, setStats] = useState<NetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  async function fetchStats() {
    try {
      const res = await fetch(`${EXPLORER_API}/api/network/stats`);
      if (res.ok) {
        const data: NetStats = await res.json();
        setStats(data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch {
      // keep previous data if available
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const blockHeight = stats?.blockHeight ?? stats?.blocks ?? 0;
  const hashrate = stats?.hashrate ?? 0;
  const difficulty = stats?.difficulty ?? 0;
  const connections = stats?.connections ?? 0;

  const statsGrid = [
    { label: "Consensus", value: "SHA256d PoW" },
    { label: "Block Time", value: "~10 minutes" },
    { label: "Difficulty", value: loading ? "Loading..." : difficulty ? difficulty.toFixed(4) : "—" },
    { label: "Block Height", value: loading ? "Loading..." : formatNumber(blockHeight) },
    { label: "Network Hashrate", value: loading ? "Loading..." : formatHashrate(hashrate) },
    { label: "Active Nodes", value: loading ? "Loading..." : connections ? formatNumber(connections) : "—" },
  ];

  return (
    <div className="min-h-screen pt-24">
        <section className="relative min-h-screen flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-tarcoin-gold/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tarcoin-cyan/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
          </div>
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-tarcoin-gold/20 bg-tarcoin-gold/5 mb-8">
              <span className="w-2 h-2 rounded-full bg-tarcoin-gold animate-pulse" />
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase">Network Status</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl font-orbitron font-black mb-6">
              <span className="text-white">Network</span><br />
              <span className="text-tarcoin-gold text-glow">Status</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-gray-400 max-w-3xl mx-auto mb-2 font-space">
              Real-time TARCOIN mainnet status. View block height, difficulty, hashrate, and node health.
            </motion.p>
            {lastUpdated && (
              <p className="text-xs text-gray-600 font-mono mb-10">
                Last updated: {lastUpdated} · Auto-refreshes every 15s
              </p>
            )}
            {!lastUpdated && !loading && (
              <p className="text-xs text-red-400/70 font-mono mb-10">
                Could not reach API — showing static parameters only.
              </p>
            )}
            {!lastUpdated && loading && (
              <p className="text-xs text-gray-600 font-mono mb-10 animate-pulse">
                Fetching live data…
              </p>
            )}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left mb-12">
              {statsGrid.map((s) => (
                <div key={s.label} className="glass rounded-xl p-6 border border-tarcoin-gold/10">
                  <div className="text-xs font-orbitron text-tarcoin-gold tracking-widest mb-1">{s.label}</div>
                  <div className={`text-xl font-mono ${s.value === "Loading..." ? "text-gray-500 animate-pulse" : "text-white"}`}>{s.value}</div>
                </div>
              ))}
            </motion.div>
            <div className="mb-8">
              <a href="https://explorer.tarcoin.org" target="_blank" rel="noopener noreferrer"
                className="btn-primary text-base px-8 py-3.5 inline-block mr-4">
                Open Explorer ↗
              </a>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5">Back to Home</Link>
            </div>
          </div>
        </section>
    </div>
  );
}