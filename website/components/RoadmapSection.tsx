"use client";

import { motion } from "framer-motion";

const roadmapPhases = [
  {
    phase: "Phase 1",
    title: "Foundation & Core",
    status: "completed",
    date: "Q1 2026",
    items: [
      "Fork Bitcoin Core v31.x",
      "Modify chain parameters",
      "Generate genesis block",
      "Launch regtest network",
      "Build TARCOIN daemon",
    ],
  },
  {
    phase: "Phase 2",
    title: "Testnet & Wallets",
    status: "completed",
    date: "Q2 2026",
    items: [
      "Launch public testnet",
      "Build Qt wallet GUI",
      "Build CLI wallet tools",
      "Blockchain explorer v1",
      "Testnet mining activation",
    ],
  },
  {
    phase: "Phase 3",
    title: "Infrastructure",
    status: "completed",
    date: "Q3 2026",
    items: [
      "Seed node deployment",
      "Website & explorer launch",
      "Stratum mining pool",
      "REST API infrastructure",
      "Security auditing phase",
    ],
  },
  {
    phase: "Phase 4",
    title: "Mainnet Launch",
    status: "completed",
    date: "Q4 2026",
    items: [
      "Mainnet genesis activation",
      "Public mining launch",
      "Exchange integrations",
      "Ecosystem treasury activation",
      "Community governance framework",
    ],
  },
  {
    phase: "Phase 5",
    title: "Ecosystem & Expansion",
    status: "in-progress",
    date: "Q1 2027",
    items: [
      "Hardware wallet compatibility",
      "Layer-2 scaling research",
      "Global mining pool expansion",
      "Developer grant program",
      "Web3 explorer integration",
    ],
  },
];

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-widest uppercase mb-4 block">
            Roadmap
          </span>
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6">
            Development{" "}
            <span className="text-tarcoin-gold text-glow">Timeline</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Transparent development roadmap with community-driven milestones focused on long-term network sustainability.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {roadmapPhases.map((phase, index) => (
            <motion.div
              key={phase.phase}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="card relative overflow-hidden"
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-orbitron px-3 py-1 rounded-full ${
                  phase.status === "completed" 
                    ? "bg-tarcoin-neon/10 text-tarcoin-neon border border-tarcoin-neon/20"
                    : phase.status === "in-progress"
                    ? "bg-tarcoin-gold/10 text-tarcoin-gold border border-tarcoin-gold/20"
                    : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                }`}>
                  {phase.status === "completed" ? "✓ Completed" : phase.status === "in-progress" ? "● In Progress" : "○ Upcoming"}
                </span>
                <span className="text-xs font-mono text-gray-500">{phase.date}</span>
              </div>

              <h3 className="text-lg font-orbitron font-bold text-tarcoin-gold mb-1">{phase.phase}</h3>
              <p className="text-sm text-white mb-4">{phase.title}</p>

              <ul className="space-y-2">
                {phase.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                    <span className="text-tarcoin-gold mt-0.5">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}