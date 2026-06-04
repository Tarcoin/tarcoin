"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BsSearch, BsBox, BsCurrencyDollar, BsActivity } from "react-icons/bs";

const explorerFeatures = [
  {
    icon: BsBox,
    title: "Block Explorer",
    description: "Search blocks, view transactions, and track the blockchain in real-time.",
  },
  {
    icon: BsCurrencyDollar,
    title: "Address Lookup",
    description: "Check balances, transaction history, and UTXO set for any address.",
  },
  {
    icon: BsActivity,
    title: "Mempool Monitor",
    description: "Watch pending transactions, fees, and network congestion in real-time.",
  },
  {
    icon: BsSearch,
    title: "Rich List",
    description: "View the top TAR holders with transparent supply distribution.",
  },
];

export default function ExplorerPreview() {
  return (
    <section id="explorer" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-widest uppercase mb-4 block">
            Explorer
          </span>
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6">
            Blockchain{" "}
            <span className="text-tarcoin-gold text-glow">Explorer</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Fully transparent, real-time blockchain explorer. Search blocks, transactions, and addresses.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mb-16"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search block height, transaction hash, or address..."
              className="input-cyber pl-12 pr-4 py-4 text-sm"
            />
            <BsSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-tarcoin-gold/50" />
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {explorerFeatures.map((feature, index) => (
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
          <Link href="/explorer" className="btn-primary text-lg px-10 py-4 inline-block">
            Open Explorer
          </Link>
        </motion.div>
      </div>
    </section>
  );
}