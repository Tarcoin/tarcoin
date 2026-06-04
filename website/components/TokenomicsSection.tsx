"use client";

import { motion } from "framer-motion";

const tokenomics = [
  {
    label: "Max Supply",
    value: "50,000,000,000",
    detail: "50 Billion TAR",
    color: "from-tarcoin-gold to-yellow-600",
    percentage: "100%",
  },
  {
    label: "Reserved Supply",
    value: "10,000,000,000",
    detail: "10 Billion TAR (20%) — Reserved for ecosystem growth, infrastructure, and future development",
    color: "from-tarcoin-cyan to-blue-600",
    percentage: "20%",
  },
  {
    label: "Mineable Supply",
    value: "40,000,000,000",
    detail: "40 Billion TAR (80%) — Distributed through mining over 15–20 years via SHA256 Proof-of-Work",
    color: "from-tarcoin-neon to-green-600",
    percentage: "80%",
  },
  {
    label: "Block Reward",
    value: "50,000 TAR",
    detail: "Halves every 400,000 blocks (~7.6 years)",
    color: "from-tarcoin-purple to-violet-600",
    percentage: "-",
  },
];

const emissionSchedule = [
  { era: "Era 1", blocks: "0 - 400,000", reward: "50,000 TAR", total: "20,000,000,000" },
  { era: "Era 2", blocks: "400,001 - 800,000", reward: "25,000 TAR", total: "10,000,000,000" },
  { era: "Era 3", blocks: "800,001 - 1,200,000", reward: "12,500 TAR", total: "5,000,000,000" },
  { era: "Era 4", blocks: "1,200,001 - 1,600,000", reward: "6,250 TAR", total: "2,500,000,000" },
  // ... continue as needed for full emission
];

export default function TokenomicsSection() {
  return (
    <section id="tokenomics" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-widest uppercase mb-4 block">
            Tokenomics
          </span>
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6">
            Transparent{" "}
            <span className="text-tarcoin-gold text-glow">Supply Model</span>
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            TARCOIN is a next-generation decentralized blockchain network designed for long-term global adoption, sustainable mining, and scalable digital infrastructure. The supply is fixed and immutable, with no hidden inflation or admin minting. 10 Billion TAR is reserved for ecosystem growth, infrastructure, and future development, while 40 Billion TAR will be distributed through mining over approximately 15–20 years. Halving occurs every 400,000 blocks, ensuring a sustainable emission schedule for decades.
          </p>
        </motion.div>

        {/* Supply Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {tokenomics.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card text-center"
            >
              <div className={`tokenomics-value bg-gradient-to-r ${item.color} mb-2`}>
                {item.value}
              </div>
              <div className="text-sm text-tarcoin-gold font-orbitron mb-2 leading-tight">{item.label}</div>
              <div className="text-xs text-gray-500 leading-relaxed px-2">{item.detail}</div>
            </motion.div>
          ))}
        </div>

        {/* Ecosystem Treasury Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-xl p-6 mb-16 border-tarcoin-gold/10 max-w-4xl mx-auto"
        >
          <div className="flex items-start gap-4">
            <div className="w-1.5 h-16 bg-tarcoin-gold rounded-full flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-orbitron text-tarcoin-gold mb-2">Long-Term Ecosystem Treasury — Transparent Cold Storage</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                20% of the total TAR supply (10 Billion TAR) is reserved in publicly verifiable cold storage wallets for ecosystem growth, infrastructure, and future development. These funds are allocated exclusively for network security, infrastructure sustainability, ecosystem development, mining infrastructure, public tooling, exchange integrations, and long-term ecosystem growth. No individual or entity has unilateral control. All treasury transactions are publicly recorded on the blockchain and subject to network-wide transparency.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Emission Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-tarcoin-gold/10">
            <h3 className="text-xl font-orbitron font-bold text-tarcoin-gold">
              Emission Schedule
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-tarcoin-gold/10">
                  <th className="text-left p-4 text-xs font-orbitron text-gray-400 uppercase tracking-wider">Era</th>
                  <th className="text-left p-4 text-xs font-orbitron text-gray-400 uppercase tracking-wider">Block Range</th>
                  <th className="text-left p-4 text-xs font-orbitron text-gray-400 uppercase tracking-wider">Block Reward</th>
                  <th className="text-left p-4 text-xs font-orbitron text-gray-400 uppercase tracking-wider">Total Mined</th>
                </tr>
              </thead>
              <tbody>
                {emissionSchedule.map((era, index) => (
                  <tr key={era.era} className="border-b border-tarcoin-gold/5 hover:bg-tarcoin-gold/5 transition-colors">
                    <td className="p-4 font-orbitron text-tarcoin-gold">{era.era}</td>
                    <td className="p-4 font-mono text-sm text-gray-300">{era.blocks}</td>
                    <td className="p-4 font-mono text-sm text-gray-300">{era.reward}</td>
                    <td className="p-4 font-mono text-sm text-gray-300">{era.total} TAR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}