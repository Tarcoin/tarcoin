"use client";

import { motion } from "framer-motion";

const specs = [
  { label: "Algorithm", value: "SHA256d" },
  { label: "Consensus", value: "Proof-of-Work" },
  { label: "Block Time", value: "10 Minutes" },
  { label: "Halving Interval", value: "400,000 Blocks" },
  { label: "Max Supply", value: "50B TAR" },
  { label: "Block Reward", value: "50,000 TAR" },
  { label: "P2P Port", value: "19333" },
  { label: "RPC Port", value: "19332" },
  { label: "Bech32 Prefix", value: "tar" },
  { label: "nBits", value: "0x1f00ffff" },
];

export default function NetworkSpecs() {
  return (
    <section className="py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 sm:p-8"
        >
          <div className="text-center mb-8">
            <span className="text-xs font-orbitron text-tarcoin-gold tracking-widest uppercase">
              Network Specifications
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {specs.map((spec, index) => (
              <motion.div
                key={spec.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="text-center p-3 rounded-lg border border-tarcoin-gold/5 hover:border-tarcoin-gold/20 transition-colors"
              >
                <div className="text-sm font-orbitron font-bold text-tarcoin-gold">
                  {spec.value}
                </div>
                <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                  {spec.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}