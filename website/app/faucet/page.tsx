"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { FaTint, FaArrowRight, FaSpinner, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { Turnstile } from '@marsidev/react-turnstile';

export default function FaucetPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ amount: number; txid: string } | null>(null);
  const [token, setToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (!address) {
      setError("Please enter a Tarcoin address.");
      return;
    }

    if (!address.startsWith("tar1") && !address.startsWith("T")) {
      setError("Invalid format. Addresses must start with 'tar1' or 'T'.");
      return;
    }

    if (!token) {
      setError("Please complete the bot verification check.");
      return;
    }

    setLoading(true);

    try {
      // Call our secure Next.js Proxy Route to bypass CORS
      const res = await fetch(`/api/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, token })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim TAR. Please try again later.");
      }

      setSuccess({ amount: data.amount, txid: data.txid });
      setAddress("");
    } catch (err: any) {
      setError(err.message || "Network error. Make sure the API is accessible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-tarcoin-black pt-24 pb-12">
      <div className="scanlines" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-tarcoin-cyan/20 bg-tarcoin-cyan/5 mb-6">
            <FaTint className="w-4 h-4 text-tarcoin-cyan animate-pulse" />
            <span className="text-xs font-orbitron text-tarcoin-cyan tracking-[0.2em] uppercase">Community Faucet</span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-orbitron font-black text-white mb-4">
            Bootstrap Faucet <span className="text-tarcoin-gold">Concluded</span>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-gray-400 font-space max-w-2xl mx-auto mb-8">
            The initial bootstrapping giveaway has successfully completed. TAR is now officially tradable on exchange markets and rewarded via Proof-of-Work mining!
          </motion.p>

          {/* Miner Bounty Banner */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-tarcoin-gold/10 border border-tarcoin-gold/30 rounded-xl p-6 max-w-2xl mx-auto text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tarcoin-gold/10 rounded-full blur-3xl group-hover:bg-tarcoin-gold/20 transition-all duration-500" />
            <h3 className="text-xl font-orbitron font-bold text-tarcoin-gold mb-2 flex items-center gap-2">
              <FaTint className="w-5 h-5" />
              Bonus: 1,000 TAR Miner Bounty
            </h3>
            <p className="text-sm text-gray-300 font-space">
              We are actively rewarding hashrate! The first 4,000 miners to accumulate 20,000 TAR in mining rewards on our official pool will instantly receive an automatic <strong>1,000 TAR Bonus</strong> deposited directly to their wallet!
            </p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="max-w-xl mx-auto">
          <div className="cyber-border-container bg-tarcoin-gray-900/50 backdrop-blur-sm p-8 text-center">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-tarcoin-cyan/50 to-transparent" />
            
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tarcoin-gold/10 border border-tarcoin-gold/30 mb-6">
              <FaCheckCircle className="w-8 h-8 text-tarcoin-gold" />
            </div>

            <h2 className="text-2xl font-orbitron font-bold text-white mb-3">
              Bootstrap Faucet Concluded
            </h2>

            <p className="text-gray-300 font-space text-sm mb-6 leading-relaxed">
              With TARCOIN officially listed and trading live on <strong>NestEx</strong>, the initial bootstrap faucet has successfully concluded to protect network value and liquidity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="https://trade.nestex.one/spot/tar" 
                target="_blank"
                className="cyber-button py-3 px-6 font-orbitron font-bold text-sm tracking-wider text-tarcoin-cyan border border-tarcoin-cyan/40 hover:bg-tarcoin-cyan/10 transition-all"
              >
                Trade on NestEx 🚀
              </Link>
              <Link 
                href="/mining" 
                className="cyber-button py-3 px-6 font-orbitron font-bold text-sm tracking-wider text-tarcoin-gold border border-tarcoin-gold/40 hover:bg-tarcoin-gold/10 transition-all"
              >
                Start Mining TAR ⛏️
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
