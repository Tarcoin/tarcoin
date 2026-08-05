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
      // Connect to the mining pool backend which hosts the faucet API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://31.70.104.158:3001";
      
      const res = await fetch(`${apiUrl}/api/faucet`, {
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
            Claim <span className="text-tarcoin-gold">100 Free TAR</span>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-gray-400 font-space max-w-2xl mx-auto mb-8">
            To help bootstrap the network and allow new users to test the TARCOIN ecosystem, the developers have allocated funds from the Treasury to give away free TAR.
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
          <div className="cyber-border-container bg-tarcoin-gray-900/50 backdrop-blur-sm p-8">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-tarcoin-cyan/50 to-transparent" />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="address" className="block text-sm font-orbitron text-tarcoin-cyan mb-2">
                  Your Tarcoin Address
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="tar1q... or T..."
                  disabled={loading}
                  className="w-full bg-tarcoin-black border border-tarcoin-gray-800 rounded-lg px-4 py-3 text-white font-mono focus:border-tarcoin-cyan focus:ring-1 focus:ring-tarcoin-cyan transition-colors disabled:opacity-50 outline-none"
                />
                <p className="text-xs text-gray-500 mt-2 font-space">
                  Limit: 1 claim per IP Address & Wallet Address.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <FaExclamationCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200 font-space">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex flex-col items-center gap-3 text-center">
                  <FaCheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-green-400 font-orbitron font-bold mb-1">
                      {success.amount} TAR Sent Successfully!
                    </p>
                    <p className="text-xs text-green-200/70 font-mono break-all">
                      TXID: {success.txid}
                    </p>
                  </div>
                  <Link href={`https://explorer.tarcoin.org/tx/${success.txid}`} target="_blank" className="text-xs text-tarcoin-gold hover:underline mt-2">
                    View on Block Explorer
                  </Link>
                </div>
              )}

              <div className="flex justify-center mt-6">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                  onSuccess={(t) => setToken(t)}
                  onExpire={() => setToken("")}
                  onError={() => setError("Bot verification failed. Please refresh the page.")}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !address}
                className="w-full cyber-button py-4 font-orbitron font-bold tracking-wider relative group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-tarcoin-cyan opacity-10 group-hover:opacity-20 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2 text-tarcoin-cyan">
                  {loading ? (
                    <>
                      <FaSpinner className="w-5 h-5 animate-spin" />
                      PROCESSING...
                    </>
                  ) : (
                    <>
                      CLAIM 100 TAR
                      <FaArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
