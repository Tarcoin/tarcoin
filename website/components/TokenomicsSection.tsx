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

        {/* Transparency Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-8 mb-16 border border-tarcoin-gold/20 max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-10 bg-tarcoin-gold rounded-full flex-shrink-0" />
            <div>
              <h3 className="text-lg font-orbitron text-tarcoin-gold">🔐 Reserved Supply — Fully Transparent & Verifiable</h3>
              <p className="text-xs text-gray-400 mt-1">Our entire 10B TAR reserve is publicly verifiable on-chain. No trust needed — verify it yourself.</p>
            </div>
          </div>

          {/* Live Wallet Verification */}
          <div className="bg-black/40 rounded-xl p-5 mb-6 border border-tarcoin-gold/10">
            <div className="text-xs font-orbitron text-tarcoin-gold tracking-widest mb-3">🔍 COLD STORAGE WALLET — VERIFY LIVE</div>
            <a
              href="https://explorer.tarcoin.org/address/tar1qn56jedak2gzxmaukh94cz0sampnhydnk3n3tah"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-tarcoin-cyan break-all hover:text-tarcoin-gold transition-colors"
            >
              tar1qn56jedak2gzxmaukh94cz0sampnhydnk3n3tah
            </a>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-tarcoin-neon animate-pulse" />
                <span className="text-xs text-gray-300">Balance: <span className="text-tarcoin-neon font-mono">10,000,000,000 TAR</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-tarcoin-neon animate-pulse" />
                <span className="text-xs text-gray-300">Total Sent: <span className="text-tarcoin-neon font-mono">0 TAR</span> — Never moved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-tarcoin-neon animate-pulse" />
                <span className="text-xs text-gray-300">Mined: <span className="text-tarcoin-neon font-mono">23 June 2026</span></span>
              </div>
            </div>
            <a
              href="https://explorer.tarcoin.org/address/tar1qn56jedak2gzxmaukh94cz0sampnhydnk3n3tah"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-xs font-orbitron text-tarcoin-gold border border-tarcoin-gold/30 rounded-lg px-4 py-2 hover:bg-tarcoin-gold/10 transition-colors"
            >
              🔗 Verify on Explorer →
            </a>
          </div>

          {/* Reserve Management Statement */}
          <div className="bg-black/30 rounded-xl p-5 border border-tarcoin-gold/10">
            <div className="text-xs font-orbitron text-tarcoin-gold tracking-widest mb-3">📋 RESERVE MANAGEMENT</div>
            <p className="text-xs text-gray-400 leading-relaxed">
              The 10 Billion TAR reserve is managed by the TARCOIN founding team and will be deployed strategically for ecosystem growth, exchange listings, infrastructure, developer compensation, and community initiatives. Reserve deployments will be communicated through official channels. The founding team retains full discretion over the timing and allocation of reserved funds to best serve the long-term growth of the network.
            </p>
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