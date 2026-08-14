"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const EXPLORER_API = process.env.NEXT_PUBLIC_EXPLORER_API || "https://explorer.tarcoin.org";

const BLOCK_REWARD = 50_000;
const TOTAL_SUPPLY = "50,000,000,000";
const COLD_STORAGE = "10,000,000,000";

function formatHashrate(hr: number): string {
  if (!hr) return "—";
  if (hr < 1e3) return `${hr.toFixed(2)} H/s`;
  if (hr < 1e6) return `${(hr / 1e3).toFixed(2)} KH/s`;
  if (hr < 1e9) return `${(hr / 1e6).toFixed(2)} MH/s`;
  if (hr < 1e12) return `${(hr / 1e9).toFixed(2)} GH/s`;
  return `${(hr / 1e12).toFixed(2)} TH/s`;
}

function formatNumber(n: number): string {
  if (!n) return "—";
  return n.toLocaleString();
}

export default function StatsBar() {
  const [blockHeight, setBlockHeight] = useState<number>(0);
  const [hashrate, setHashrate] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    try {
      const res = await fetch(`${EXPLORER_API}/api/network/stats`);
      if (res.ok) {
        const data = await res.json();
        setBlockHeight(data.blockHeight ?? data.blocks ?? 0);
        setHashrate(data.hashrate ?? 0);
      }
    } catch {
      // keep previous values on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const minedSupply = blockHeight * BLOCK_REWARD;

  const stats = [
    { label: "Block Height", value: loading ? "..." : formatNumber(blockHeight), suffix: "" },
    { label: "Network Hashrate", value: loading ? "..." : formatHashrate(hashrate), suffix: "" },
    { label: "Mined Supply", value: loading ? "..." : formatNumber(minedSupply), suffix: " TAR" },
    { label: "Total Supply", value: TOTAL_SUPPLY, suffix: " TAR" },
    { label: "Cold Storage Reserve", value: COLD_STORAGE, suffix: " TAR" },
    { label: "Block Reward", value: formatNumber(BLOCK_REWARD), suffix: " TAR" },
  ];

  return (
    <section className="py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-4 sm:p-6 lg:p-8"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="stat-value">
                  {stat.value}
                  <span className="block sm:inline text-[10px] sm:text-xs text-gray-400">{stat.suffix}</span>
                </div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}