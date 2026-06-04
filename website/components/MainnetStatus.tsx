"use client";

import { motion } from "framer-motion";
import { BsCheckCircle, BsClock, BsGear, BsGraphUpArrow } from "react-icons/bs";

const statusItems = [
  {
    icon: BsCheckCircle,
    label: "Genesis Block",
    status: "Verified & Running",
    description: "Hash: 000074c6...f44bd7e0 · Nonce: 15878 · nBits: 0x1f00ffff · Height: 0.",
    state: "completed",
  },
  {
    icon: BsGear,
    label: "TARCOIN Core",
    status: "Live on Mainnet",
    description: "Bitcoin Core v31.x fork running. PoW validated. CLIENT_VERSION_IS_RELEASE = true.",
    state: "completed",
  },
  {
    icon: BsGraphUpArrow,
    label: "Node Infrastructure",
    status: "Active & Synced",
    description: "Seed nodes fully deployed across multiple cloud providers for network resilience.",
    state: "completed",
  },
  {
    icon: BsClock,
    label: "Public Mainnet",
    status: "Fully Operational",
    description: "Explorer, mining pool, and wallet infrastructure online and fully operational.",
    state: "completed",
  },
];

export default function MainnetStatus() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-widest uppercase mb-4 block">
            Launch Status
          </span>
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6">
            Mainnet{" "}
            <span className="text-tarcoin-gold text-glow">Status</span>
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            TARCOIN mainnet node is live. Genesis block verified and loaded. Infrastructure
            deployment is progressing in phases toward full public network activation.
          </p>
          {/* Genesis verified badge */}
          <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-tarcoin-neon/30 bg-tarcoin-neon/5">
            <span className="w-2 h-2 rounded-full bg-tarcoin-neon animate-pulse" />
            <span className="text-xs font-mono text-tarcoin-neon tracking-wider">
              Genesis: 000074c6359f78730790275ea21bbd53f0bc3249604470bad49b9753f44bd7e0
            </span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statusItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card relative overflow-hidden"
            >
              {/* Status Indicator */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-orbitron px-3 py-1 rounded-full ${
                    item.state === "completed"
                      ? "bg-tarcoin-neon/10 text-tarcoin-neon border border-tarcoin-neon/20"
                      : item.state === "in-progress"
                      ? "bg-tarcoin-gold/10 text-tarcoin-gold border border-tarcoin-gold/20"
                      : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                  }`}
                >
                  {item.state === "completed"
                    ? "✓ Complete"
                    : item.state === "in-progress"
                    ? "● Active"
                    : "○ Pending"}
                </span>
              </div>

              <item.icon className="text-3xl text-tarcoin-gold mb-4" />
              <h3 className="text-lg font-orbitron font-bold text-tarcoin-gold mb-1">
                {item.label}
              </h3>
              <p className="text-sm text-white font-semibold mb-3">{item.status}</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}