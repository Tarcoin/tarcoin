"use client";

import { motion } from "framer-motion";
import { 
  BsShieldCheck, BsLightning, BsCloudArrowUp, 
  BsGraphUpArrow, BsGlobe, BsLock 
} from "react-icons/bs";
import { TbHexagon3D, TbServer } from "react-icons/tb";

const features = [
  {
    icon: BsShieldCheck,
    title: "Bitcoin-Grade Security",
    description: "Built on a battle-tested UTXO blockchain architecture using SHA256d proof-of-work. Fully auditable, immutable, and decentralized network with no central point of failure.",
  },
  {
    icon: BsLightning,
    title: "SHA256d Mining",
    description: "ASIC-compatible mining using SHA256d algorithm. Full support for Antminer, Whatsminer, and all major mining hardware. Fair and accessible mining for all participants.",
  },
  {
    icon: TbHexagon3D,
    title: "Fixed Digital Scarcity",
    description: "Immutable supply of 50,000,000,000 TAR with 80% mineable via proof-of-work over 15–20 years. Predictable, transparent, and verifiable emission schedule.",
  },
  {
    icon: BsGlobe,
    title: "Decentralized Network",
    description: "Peer-to-peer network architecture with seed nodes worldwide. No central authority, no single point of control. Full node validation ensures network integrity.",
  },
  {
    icon: BsLock,
    title: "UTXO Transaction Model",
    description: "UTXO-based transaction architecture with full SegWit support. secp256k1 ECDSA signatures provide maximum cryptographic security for all transactions.",
  },
  {
    icon: TbServer,
    title: "Public Blockchain Explorer",
    description: "Fully transparent blockchain explorer with real-time mempool monitoring, block exploration, address tracking, and on-chain verification capabilities.",
  },
  {
    icon: BsCloudArrowUp,
    title: "Cross-Platform Wallets",
    description: "Native wallets for Windows, macOS, and Linux. Qt GUI, CLI, and RPC interfaces provide flexible access for all user skill levels.",
  },
  {
    icon: BsGraphUpArrow,
    title: "Mining Infrastructure",
    description: "Stratum mining protocol support with worker monitoring, real-time hashrate tracking, and automated payouts. Industrial-grade infrastructure for solo and pool mining.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-widest uppercase mb-4 block">
            Why TARCOIN
          </span>
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6">
            Built for{" "}
            <span className="text-tarcoin-gold text-glow">Security</span>
            {" & "}
            <span className="text-tarcoin-gold text-glow">Decentralization</span>
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            Every aspect of TARCOIN is engineered for industrial-grade security, predictable economics, 
            and long-term network sustainability. A decentralized proof-of-work ecosystem built to last.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card group cursor-default"
            >
              <feature.icon className="text-3xl text-tarcoin-gold mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-orbitron font-semibold mb-3 text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}