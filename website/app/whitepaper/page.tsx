"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

// ─── Section 1: Hero ────────────────────────────────────────────────────────

function WhitepaperHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-tarcoin-gold/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tarcoin-cyan/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      {/* Hex grid overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wh-hex" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
              <path d="M28 0L56 16.67V50.01L28 66.68L0 50.01V16.67Z" fill="none" stroke="#D4A843" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wh-hex)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Version badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-tarcoin-gold/20 bg-tarcoin-gold/5 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-tarcoin-gold animate-pulse" />
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase">
            Technical Whitepaper v1.0.0 · Mainnet Live
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-orbitron font-black mb-6 leading-tight"
        >
          <span className="text-white">TARCOIN</span>
          <br />
          <span className="text-tarcoin-gold text-glow">Whitepaper</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-base sm:text-lg md:text-xl text-gray-400 max-w-4xl mx-auto mb-8 font-space leading-relaxed"
        >
          A UTXO-Based Decentralized Blockchain Network —
          <br />
          <span className="text-tarcoin-gold/90">
            SHA256d Proof-of-Work · UTXO · secp256k1 · SegWit · 50B Fixed Supply
          </span>
        </motion.p>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mb-10"
        >
          {[
            { label: "Version", value: "1.0.0" },
            { label: "Status", value: "Live ✓" },
            { label: "Date", value: "May 2026" },
            { label: "License", value: "MIT" },
            { label: "Genesis", value: "000074c6..." },
          ].map((s) => (
            <div key={s.label} className="glass rounded-lg px-5 py-3 text-center min-w-[110px]">
              <div className="text-sm font-mono text-tarcoin-gold">{s.value}</div>
              <div className="text-[10px] text-gray-500 mt-1 tracking-widest uppercase font-orbitron">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <a href="/docs/whitepaper.pdf" download className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </a>
          <a href="#overview" className="btn-secondary text-base px-8 py-3.5">
            Read Online
          </a>
          <Link href="/" className="btn-ghost text-base px-8 py-3.5">
            Back to Home
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute -bottom-16 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <span className="text-[10px] font-orbitron tracking-[0.3em]">EXPLORE</span>
            <div className="w-5 h-8 border-2 border-gray-500/50 rounded-full flex justify-center">
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-1 bg-tarcoin-gold rounded-full mt-1.5"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 2: Overview Cards ───────────────────────────────────────────────

const overviewCards = [
  {
    title: "Bitcoin-Origin",
    subtitle: "Battle-Tested Foundation",
    description:
      "Built on a fork of Bitcoin Core v31.x — preserving SHA256d PoW, UTXO model, secp256k1 ECDSA, SegWit, Bitcoin Script, Merkle trees, and longest-chain consensus. Maximum security, ASIC compatibility, and long-term stability.",
    accent: "from-tarcoin-gold to-tarcoin-gold-light",
    icon: "🔗",
  },
  {
    title: "Immutable Supply",
    subtitle: "50 Billion Fixed Cap",
    description:
      "Total supply of 50,000,000,000 TAR — 80% allocated to public mining (40B) and 20% to a Long-Term Ecosystem Treasury (10B). Halving every 400,000 blocks (~7.6 years) with a block reward of 50,000 TAR. No inflation, no admin override.",
    accent: "from-tarcoin-cyan to-tarcoin-cyan-dark",
    icon: "🔒",
  },
  {
    title: "ASIC Mineable",
    subtitle: "SHA256d Proof-of-Work",
    description:
      "Identical mining algorithm to Bitcoin — supports all existing SHA-256 ASIC miners. Difficulty retargets every 2016 blocks (~2 weeks). Stratum protocol pool support. Decentralized mining with no central authority or pre-mine.",
    accent: "from-tarcoin-neon to-green-500",
    icon: "⛏️",
  },
  {
    title: "Fully Decentralized",
    subtitle: "No Governance, No Admin",
    description:
      "No foundation, no corporation, no administrative keys, no governance tokens, no upgrade authority. The blockchain is governed solely by its consensus rules — identical to Bitcoin. Community-driven open-source development.",
    accent: "from-tarcoin-purple to-purple-500",
    icon: "🌐",
  },
];

function OverviewCards() {
  return (
    <section id="overview" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase inline-block mb-3">
            Overview
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
            What is <span className="text-tarcoin-gold">TARCOIN</span>?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto font-space text-base sm:text-lg">
            TARCOIN is a fully decentralized, UTXO-based blockchain network that preserves the complete Bitcoin security model
            while introducing a distinct identity, custom supply parameters, and a complete web/mobile ecosystem.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {overviewCards.map((card) => (
            <motion.div
              key={card.title}
              variants={itemVariants}
              className="group relative"
            >
              {/* Border glow on hover */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-tarcoin-gold/0 via-tarcoin-gold/0 to-tarcoin-gold/0 group-hover:from-tarcoin-gold/20 group-hover:via-tarcoin-gold/5 group-hover:to-tarcoin-gold/20 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm" />

              <div className="relative glass rounded-2xl p-6 sm:p-7 h-full flex flex-col border border-tarcoin-gold/10 group-hover:border-tarcoin-gold/25 transition-all duration-500">
                {/* Icon */}
                <div className="text-3xl mb-4">{card.icon}</div>

                {/* Accent bar */}
                <div className={`w-12 h-1 rounded-full bg-gradient-to-r ${card.accent} mb-4`} />

                <h3 className="text-lg font-orbitron font-bold text-white mb-1">{card.title}</h3>
                <p className="text-xs font-orbitron text-tarcoin-gold/60 tracking-wider mb-3 uppercase">{card.subtitle}</p>
                <p className="text-sm text-gray-400 font-space leading-relaxed flex-1">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 3: Key Network Parameters ───────────────────────────────────────

const networkParams = [
  { label: "Consensus Algorithm", value: "SHA256d Proof-of-Work" },
  { label: "Elliptic Curve", value: "secp256k1" },
  { label: "Signature Algorithm", value: "ECDSA" },
  { label: "Address Format (SegWit)", value: "Bech32 (tar1...)" },
  { label: "Address Format (Legacy)", value: "Base58 (T...)" },
  { label: "Transaction Model", value: "UTXO (Bitcoin Standard)" },
  { label: "Script Language", value: "Bitcoin Script" },
  { label: "Block Time", value: "10 minutes" },
  { label: "Block Size (Base)", value: "1 MB" },
  { label: "Block Size (SegWit)", value: "4 MB" },
  { label: "Difficulty Retarget", value: "Every 2016 blocks (~2 weeks)" },
  { label: "P2P Port (Mainnet)", value: "19333" },
  { label: "RPC Port (Mainnet)", value: "19332" },
  { label: "Magic Bytes (Mainnet)", value: "0xfabfb5da" },
  { label: "Genesis nBits", value: "0x1f00ffff" },
  { label: "Genesis Nonce", value: "15878" },
];

const supplyParams = [
  { label: "Total Supply", value: "50,000,000,000 TAR" },
  { label: "Public Mining Supply", value: "40,000,000,000 TAR (80%)" },
  { label: "Ecosystem Treasury", value: "10,000,000,000 TAR (20%)" },
  { label: "Block Reward (Era 1)", value: "50,000 TAR" },
  { label: "Halving Interval", value: "400,000 blocks (~7.6 years)" },
  { label: "Halving Schedule", value: "Progressive halvings every 400,000 blocks" },
  { label: "Genesis Hash", value: "000074c6359f78730790275ea21bbd53f0bc3249604470bad49b9753f44bd7e0" },
  { label: "Genesis Merkle Root", value: "1fa777a38f96e44bb26591573ed2b22d5b40d7a63067201a40ad3b214152b749" },
];

const emissionSchedule = [
  { era: 1, blocks: "0 – 400,000", reward: "50,000 TAR", duration: "~7.6 years" },
  { era: 2, blocks: "400,001 – 800,000", reward: "25,000 TAR", duration: "~7.6 years" },
  { era: 3, blocks: "800,001 – 1,200,000", reward: "12,500 TAR", duration: "~7.6 years" },
  { era: 4, blocks: "1,200,001 – 1,600,000", reward: "6,250 TAR", duration: "~7.6 years" },
];

function NetworkParameters() {
  return (
    <section id="parameters" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-tarcoin-black-2/50 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase inline-block mb-3">
            Specifications
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
            Network <span className="text-tarcoin-gold">Parameters</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto font-space text-base sm:text-lg">
            Every parameter is hardcoded at the consensus level — immutable after genesis.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Technical params */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="glass rounded-2xl p-6 sm:p-8 border border-tarcoin-gold/10"
          >
            <h3 className="text-lg font-orbitron font-bold text-tarcoin-gold mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-tarcoin-gold rounded-full" />
              Technical Specifications
            </h3>
            <div className="space-y-3">
              {networkParams.map((p) => (
                <div
                  key={p.label}
                  className="flex justify-between items-center py-2.5 border-b border-tarcoin-gold/5 last:border-0"
                >
                  <span className="text-sm text-gray-400 font-space">{p.label}</span>
                  <span className="text-sm font-mono text-tarcoin-gold/90 text-right ml-4">{p.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Supply params */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="glass rounded-2xl p-6 sm:p-8 border border-tarcoin-gold/10"
          >
            <h3 className="text-lg font-orbitron font-bold text-tarcoin-gold mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-tarcoin-gold rounded-full" />
              Supply Schedule
            </h3>
            <div className="space-y-3 mb-8">
              {supplyParams.map((p) => (
                <div
                  key={p.label}
                  className="flex justify-between items-center py-2.5 border-b border-tarcoin-gold/5 last:border-0"
                >
                  <span className="text-sm text-gray-400 font-space">{p.label}</span>
                  <span className="text-sm font-mono text-tarcoin-gold/90 text-right ml-4">{p.value}</span>
                </div>
              ))}
            </div>

            {/* Emission table */}
            <h4 className="text-sm font-orbitron font-semibold text-white/70 mb-3 uppercase tracking-wider">
              Emission Schedule
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-tarcoin-gold/10">
                    <th className="text-left py-2 text-gray-500 font-space font-medium text-xs uppercase tracking-wider">Era</th>
                    <th className="text-left py-2 text-gray-500 font-space font-medium text-xs uppercase tracking-wider">Blocks</th>
                    <th className="text-right py-2 text-gray-500 font-space font-medium text-xs uppercase tracking-wider">Reward</th>
                    <th className="text-right py-2 text-gray-500 font-space font-medium text-xs uppercase tracking-wider">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {emissionSchedule.map((era) => (
                    <tr key={era.era} className="border-b border-tarcoin-gold/5 hover:bg-tarcoin-gold/5 transition-colors">
                      <td className="py-2.5 font-mono text-tarcoin-gold/80">{era.era}</td>
                      <td className="py-2.5 text-gray-300 font-mono text-xs">{era.blocks}</td>
                      <td className="py-2.5 text-right font-mono text-tarcoin-gold">{era.reward}</td>
                      <td className="py-2.5 text-right text-gray-400 text-xs">{era.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-gray-500 mt-4 font-space">
              * Halving continues every 400,000 blocks until the 40B public mining supply is fully emitted.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: Security & Decentralization ──────────────────────────────────

const securityFeatures = [
  {
    title: "51% Attack Mitigation",
    items: [
      "Distributed mining participation incentives",
      "Multiple mining pool deployment",
      "ASIC compatibility for rapid hashrate growth",
      "Optional temporary checkpoints (initial security)",
    ],
    icon: "🛡️",
  },
  {
    title: "Reorg Protection",
    items: [
      "Bitcoin-standard reorganization handling",
      "100-block coinbase maturity",
      "Merkle tree verification",
      "Checkpoints at regular intervals",
    ],
    icon: "🔗",
  },
  {
    title: "Wallet Security",
    items: [
      "AES-256 encrypted wallet.dat",
      "BIP39/BIP32 mnemonic seed phrases",
      "Passphrase protection",
      "Offline transaction signing (cold storage)",
    ],
    icon: "🔐",
  },
  {
    title: "Network Security",
    items: [
      "Full node validation only (no SPV reliance)",
      "Tor/I2P privacy support",
      "Encrypted P2P (BIP324)",
      "DoS protection with penalty system",
    ],
    icon: "🌍",
  },
];

function SecuritySection() {
  return (
    <section id="security" className="py-24 relative">
      {/* Hex background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="sec-hex" width="40" height="69.28" patternUnits="userSpaceOnUse">
              <path d="M20 0L40 11.55V34.64L20 46.19L0 34.64V11.55Z" fill="none" stroke="#D4A843" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sec-hex)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase inline-block mb-3">
            Security
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
            Security & <span className="text-tarcoin-gold">Decentralization</span>
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto font-space text-base sm:text-lg">
            Every design decision prioritizes security over convenience, decentralization over speed,
            and immutability over flexibility.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid sm:grid-cols-2 gap-6"
        >
          {securityFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="glass rounded-2xl p-6 sm:p-7 border border-tarcoin-gold/10 hover:border-tarcoin-gold/20 transition-all duration-500"
            >
              <div className="flex items-start gap-4 mb-4">
                <span className="text-2xl">{feature.icon}</span>
                <h3 className="text-lg font-orbitron font-bold text-white">{feature.title}</h3>
              </div>
              <ul className="space-y-2.5">
                {feature.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-400 font-space">
                    <span className="w-1.5 h-1.5 rounded-full bg-tarcoin-gold/60 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Genesis / Treasury security note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 glass rounded-2xl p-6 sm:p-8 border border-tarcoin-gold/10 text-center"
        >
          <p className="text-sm font-orbitron text-tarcoin-gold mb-2 tracking-wider">
            🔒 ECOSYSTEM TREASURY — COLD STORAGE
          </p>
          <p className="text-sm text-gray-400 font-space max-w-3xl mx-auto">
            The 10B TAR Ecosystem Treasury was generated entirely offline on an air-gapped machine.
            The private key has never touched an internet-connected system. Multiple geographically
            separated backups exist. All treasury transactions are publicly verifiable on-chain.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 5: Infrastructure ───────────────────────────────────────────────

const infraServices = [
  {
    name: "Blockchain Node",
    description: "Bitcoin Core v31.x fork — live on mainnet. Genesis block verified. PoW validated. Full archive node.",
    requirements: "8 CPU · 16 GB RAM · 1+ TB SSD",
    color: "border-tarcoin-gold/30",
  },
  {
    name: "Explorer",
    description: "Real-time block, transaction, address lookup. Mempool monitoring. WebSocket live updates. Redis-cached API.",
    requirements: "4 CPU · 8 GB RAM · 100 GB SSD",
    color: "border-tarcoin-cyan/30",
  },
  {
    name: "REST API",
    description: "Comprehensive blockchain data endpoints, wallet utilities, mining info, Swagger docs, rate limiting.",
    requirements: "4 CPU · 8 GB RAM · 100 GB SSD",
    color: "border-tarcoin-neon/30",
  },
  {
    name: "Mining Pool",
    description: "Stratum protocol server (port 3333). Worker management, share tracking with Redis, payout engine, ASIC compatible.",
    requirements: "4 CPU · 8 GB RAM · 50 GB SSD",
    color: "border-tarcoin-purple/30",
  },
  {
    name: "Website",
    description: "Next.js frontend with cyberpunk/gold aesthetic, Framer Motion, responsive design, SEO optimized.",
    requirements: "2 CPU · 4 GB RAM · 20 GB SSD",
    color: "border-tarcoin-gold/20",
  },
  {
    name: "Monitoring",
    description: "Prometheus metrics, Grafana dashboards, Loki log aggregation, full observability stack.",
    requirements: "2 CPU · 4 GB RAM · 100 GB SSD",
    color: "border-tarcoin-cyan/20",
  },
];

const dockerServices = [
  "tarcoind", "explorer", "api", "mining-pool", "website",
  "nginx", "redis", "postgres", "prometheus", "grafana", "loki",
];

function InfrastructureSection() {
  return (
    <section id="infrastructure" className="py-24 relative bg-tarcoin-black-2/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase inline-block mb-3">
            Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
            Infrastructure <span className="text-tarcoin-gold">Ecosystem</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto font-space text-base sm:text-lg">
            All services containerized with Docker for deterministic, reproducible deployment across
            any cloud provider.
          </p>
        </motion.div>

        {/* Service cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {infraServices.map((svc) => (
            <motion.div
              key={svc.name}
              variants={itemVariants}
              className={`glass rounded-2xl p-6 border-l-4 ${svc.color} hover:glow-gold transition-all duration-500`}
            >
              <h3 className="text-base font-orbitron font-bold text-white mb-2">{svc.name}</h3>
              <p className="text-sm text-gray-400 font-space mb-3 leading-relaxed">{svc.description}</p>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-tarcoin-gold/60">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {svc.requirements}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Docker stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-6 sm:p-8 border border-tarcoin-gold/10 text-center"
        >
          <p className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase mb-4">
            Docker Service Stack
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {dockerServices.map((svc) => (
              <span
                key={svc}
                className="px-3 py-1.5 rounded-lg bg-tarcoin-black-2 border border-tarcoin-gold/10 text-xs font-mono text-tarcoin-gold/70"
              >
                {svc}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 6: PDF Preview / Download ──────────────────────────────────────

function PDFPreviewSection() {
  return (
    <section id="pdf" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase inline-block mb-3">
            Download
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
            Full <span className="text-tarcoin-gold">Whitepaper</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto font-space text-base sm:text-lg">
            Download the complete TARCOIN Technical Whitepaper (PDF) — 12 sections covering architecture,
            consensus, security, infrastructure, and launch roadmap.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          {/* PDF card mockup */}
          <div className="glass rounded-2xl p-8 sm:p-10 border border-tarcoin-gold/10 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-tarcoin-gold/20 to-tarcoin-gold/5 border border-tarcoin-gold/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-tarcoin-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>

            <h3 className="text-xl font-orbitron font-bold text-white mb-2">
              TARCOIN_WHITEPAPER_v1.0.0.pdf
            </h3>
            <p className="text-sm text-gray-400 font-space mb-2">
              Version 1.0.0 · May 2026 · 12 Sections
            </p>
            <p className="text-xs text-gray-500 font-mono mb-8">
              SHA256d · UTXO · secp256k1 · SegWit · 50B Supply · ASIC Mining
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/docs/whitepaper.pdf"
                download
                className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </a>
              <a
                href="/docs/whitepaper.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-base px-8 py-3.5 inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View in Browser
              </a>
            </div>
          </div>

          {/* Chapter listing */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {[
              "Abstract", "Introduction", "Technical Architecture",
              "Network Architecture", "Consensus Rules", "Ecosystem Treasury Security",
              "Security Model", "Infrastructure Architecture", "Deployment Architecture",
              "Testing & Audit", "Launch Checklist", "Governance",
            ].map((chapter, i) => (
              <div
                key={chapter}
                className="glass rounded-lg px-4 py-3 border border-tarcoin-gold/5 flex items-center gap-3"
              >
                <span className="text-[10px] font-mono text-tarcoin-gold/50 w-5">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-xs font-space text-gray-300">{chapter}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 7: Final CTA ────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-tarcoin-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase inline-block mb-4">
            Get Started
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold text-white mb-6">
            TARCOIN is Not an Experiment.
            <br />
            <span className="text-tarcoin-gold text-glow">
              Proven Architecture, Reborn for a New Era.
            </span>
          </h2>
          <p className="text-gray-400 font-space text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Download the wallet, explore the blockchain, or start mining. Everything you need to
            participate in the TARCOIN network is available now.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="btn-primary text-base px-8 py-3.5">
              ← Back to Home
            </Link>
            <a href="/docs/whitepaper.pdf" download className="btn-secondary text-base px-8 py-3.5 inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </a>
          </div>

          {/* Bottom links */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-500 font-space">
            <Link href="/" className="hover:text-tarcoin-gold transition-colors">Home</Link>
            <Link href="/#features" className="hover:text-tarcoin-gold transition-colors">Features</Link>
            <Link href="/#tokenomics" className="hover:text-tarcoin-gold transition-colors">Tokenomics</Link>
            <Link href="/#mining" className="hover:text-tarcoin-gold transition-colors">Mining</Link>
            <Link href="/#roadmap" className="hover:text-tarcoin-gold transition-colors">Roadmap</Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-tarcoin-gold via-tarcoin-gold-light to-tarcoin-gold origin-left z-[9999]"
    />
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WhitepaperPage() {
  return (
    <main className="relative min-h-screen bg-tarcoin-black">
      {/* Progress bar */}
      <ProgressBar />

      {/* Scanlines */}
      <div className="scanlines pointer-events-none" />

      {/* Sections */}
      <WhitepaperHero />
      <OverviewCards />
      <NetworkParameters />
      <SecuritySection />
      <InfrastructureSection />
      <PDFPreviewSection />
      <FinalCTA />

      {/* Footer */}
      <footer className="border-t border-tarcoin-gold/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-gray-500 font-space">
            TARCOIN — Technical Whitepaper v1.0.0 · May 2026 · Released under the MIT License
          </p>
          <p className="text-[10px] text-gray-600 font-space mt-1">
            This whitepaper is for informational purposes only and does not constitute financial advice.
          </p>
        </div>
      </footer>
    </main>
  );
}