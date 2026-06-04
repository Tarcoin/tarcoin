"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-tarcoin-gold/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-tarcoin-cyan/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      {/* Hex Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hex-grid" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
              <path d="M28 0L56 16.67V50.01L28 66.68L0 50.01V16.67Z" fill="none" stroke="#D4A843" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center px-4 py-2 rounded-full border border-tarcoin-gold/20 bg-tarcoin-gold/5 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-tarcoin-neon animate-pulse mr-2" />
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-widest uppercase">
            Mainnet Live — SHA256d Proof of Work
          </span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-orbitron font-black mb-6"
        >
          <span className="text-white">TAR</span>
          <span className="text-tarcoin-gold text-glow">COIN</span>
        </motion.h1>

        {/* Subtitle - cinematic positioning */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-gray-400 max-w-4xl mx-auto mb-8 font-space leading-relaxed"
        >
          TARCOIN is a next-generation decentralized blockchain network designed for long-term global adoption, sustainable mining, and scalable digital infrastructure. 50 Billion TAR fixed supply · 40 Billion mineable · 10 Billion reserved · 50,000 TAR block reward · Halving every 400,000 blocks.
        </motion.p>

        {/* Live Network Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-6 mb-10"
        >
          {[
            { label: "Network", value: "Mainnet" },
            { label: "Consensus", value: "SHA256 Proof-of-Work" },
            { label: "Block Time", value: "10 min" },
            { label: "Supply Cap", value: "50B TAR" },
            { label: "Block Reward", value: "50,000 TAR" },
            { label: "Halving Interval", value: "400,000 blocks" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-lg px-5 py-3 text-center min-w-[120px]"
            >
              <div className="text-sm font-mono text-tarcoin-gold">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link href="/download" className="btn-primary text-lg px-10 py-4">
            Download Wallet
          </Link>
          <Link href="/explorer" className="btn-secondary text-lg px-10 py-4">
            Blockchain Explorer
          </Link>
          <Link href="/whitepaper" className="btn-ghost text-lg px-10 py-4">
            Whitepaper
          </Link>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute -bottom-16 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <span className="text-xs font-orbitron tracking-widest">SCROLL</span>
            <div className="w-6 h-10 border-2 border-gray-500 rounded-full flex justify-center">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-tarcoin-gold rounded-full mt-2"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}