"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiTerminal, FiCopy, FiCheck } from "react-icons/fi";
import { BsServer } from "react-icons/bs";

export default function RunNodeSection() {
  const [copied, setCopied] = useState(false);
  
  const installCommand = "curl -sL https://raw.githubusercontent.com/Tarcoin/tarcoin/master/devops/scripts/install-node.sh | sudo bash";

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-24 relative overflow-hidden bg-black/40 border-y border-gold/10" id="run-node">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-gold/20 bg-gold/5 mb-6 text-gold">
            <BsServer className="w-5 h-5" />
            <span className="font-mono text-sm tracking-widest font-semibold uppercase">Decentralize the Network</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-6">
            Want to support Tarcoin?
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-space">
            Help secure the blockchain by running your own node. You don't need to be a developer. Rent a cheap Linux VPS and deploy a full Tarcoin node in exactly <span className="text-gold font-bold">60 seconds</span>.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative group rounded-xl border border-gold/20 bg-black/60 p-1 overflow-hidden">
            {/* Animated Gradient Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/30 to-gold/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-x-full group-hover:translate-x-full ease-in-out" />
            
            <div className="relative bg-[#0d1117] rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 p-4 bg-gold/10 rounded-lg">
                <FiTerminal className="w-8 h-8 text-gold" />
              </div>
              
              <div className="flex-grow min-w-0 font-mono text-sm sm:text-base text-gray-300 overflow-x-auto whitespace-pre no-scrollbar">
                <span className="text-green-400">$</span> <span className="text-blue-400">curl</span> <span className="text-gray-400">-sL</span> <span className="text-cyan-400">https://raw.githubusercontent.com/Tarcoin/tarcoin/master/devops/scripts/install-node.sh</span> <span className="text-gray-400">|</span> <span className="text-gold">sudo bash</span>
              </div>
              
              <button 
                onClick={handleCopy}
                className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold transition-colors border border-gold/20 hover:border-gold/50"
                title="Copy to clipboard"
              >
                {copied ? <FiCheck className="w-5 h-5 text-green-400" /> : <FiCopy className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 font-space font-medium">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Auto-installs Docker
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Auto-generates Secure Passwords
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Ultra-lightweight (1GB RAM Minimum)
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
