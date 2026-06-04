"use client";

import { motion } from "framer-motion";
import { BsGear, BsPeople, BsBarChart, BsWallet2 } from "react-icons/bs";
import { TbHexagon3D } from "react-icons/tb";

const miningStats = [
  { label: "Algorithm", value: "SHA256 Proof-of-Work" },
  { label: "Block Reward", value: "50,000 TAR" },
  { label: "Block Time", value: "10 minutes" },
  { label: "ASIC Compatible", value: "Yes" },
];

const poolFeatures = [
  {
    icon: BsGear,
    title: "Stratum Protocol",
    description: "Full Stratum mining protocol support with low-latency connections for efficient mining operations.",
  },
  {
    icon: BsPeople,
    title: "Worker Management",
    description: "Comprehensive monitoring for individual miners with detailed hashrate tracking and performance statistics.",
  },
  {
    icon: BsBarChart,
    title: "Real-time Analytics",
    description: "Live hashrate charts, pool statistics, network difficulty tracking, and transparent payout monitoring.",
  },
  {
    icon: BsWallet2,
    title: "Automated Payouts",
    description: "Reliable automatic TAR payouts with configurable thresholds and consistent payment schedules.",
  },
];

export default function MiningSection() {
  return (
    <section id="mining" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-widest uppercase mb-4 block">
            Mining
          </span>
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6">
            Proof-of-Work{" "}
            <span className="text-tarcoin-gold text-glow">Mining</span>
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            TARCOIN uses a SHA256 Proof-of-Work consensus model with a maximum supply of 50 Billion TAR. 40 Billion TAR will be distributed through mining over approximately 15–20 years, while 10 Billion TAR is reserved for ecosystem growth, infrastructure, and future development. Mining starts with a block reward of 50,000 TAR per block, with reward halvings occurring every 400,000 blocks. This ensures a long-term, sustainable emission schedule and fair, global distribution.
          </p>
        </motion.div>

        {/* Mining Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {miningStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl p-5 text-center"
            >
              <div className="text-lg font-orbitron font-bold text-tarcoin-gold">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Pool Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {poolFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <feature.icon className="text-3xl text-tarcoin-gold mb-4" />
              <h3 className="text-lg font-orbitron font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a
            href="/mining"
            className="btn-primary text-lg px-10 py-4 inline-block"
          >
            Start Mining
          </a>
        </motion.div>
      </div>
    </section>
  );
}