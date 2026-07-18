"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const stats = [
  { label: "Block Height", value: "375+", suffix: "" },
  { label: "Network Hashrate", value: "71.72", suffix: " TH/s" },
  { label: "Mined Supply", value: "18,750,000", suffix: " TAR" },
  { label: "Total Supply", value: "50,000,000,000", suffix: " TAR" },
  { label: "Cold Storage Reserve", value: "10,000,000,000", suffix: " TAR" },
  { label: "Block Reward", value: "50,000", suffix: " TAR" },
];

export default function StatsBar() {
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