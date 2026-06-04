"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function ApiRpcPage() {
  return (
    <main className="min-h-screen bg-tarcoin-black">
      <div className="scanlines" />
      <div className="cyber-bg min-h-screen pt-20">
        <section className="relative min-h-screen py-24 flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-tarcoin-gold/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tarcoin-cyan/5 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="text-center mb-16">
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.3em] uppercase inline-block mb-3">Reference</span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-orbitron font-bold mb-4">
                <span className="text-white">RPC</span><br />
                <span className="text-tarcoin-gold text-glow">Reference</span>
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto mt-4 text-base">
                TARCOIN Core JSON-RPC API reference. Fully compatible with Bitcoin Core RPC interface on port 19332.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="glass rounded-xl p-8 border border-tarcoin-gold/10 text-left mb-8">
              <h3 className="text-lg font-orbitron font-semibold mb-4 text-tarcoin-gold">Connection Details</h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">RPC Port</span>
                  <span className="text-white">19332</span>
                </div>
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">P2P Port</span>
                  <span className="text-white">19333</span>
                </div>
                <div className="flex justify-between py-2 border-b border-tarcoin-gold/10">
                  <span className="text-gray-400">Protocol</span>
                  <span className="text-white">JSON-RPC over HTTP</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Authentication</span>
                  <span className="text-white">Basic Auth (rpcuser / rpcpassword)</span>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="glass rounded-xl p-6 border border-tarcoin-gold/10 text-left">
              <h3 className="text-lg font-orbitron font-semibold mb-4 text-tarcoin-gold">Common RPC Methods</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm font-mono">
                {[
                  "getblockchaininfo", "getblockcount", "getblockhash", "getblock", "getrawtransaction", "decoderawtransaction", "gettxout", "getmempoolinfo", "getmininginfo", "getnetworkhashps", "getdifficulty", "getpeerinfo", "getbalance", "listunspent", "sendtoaddress", "getnewaddress", "validateaddress", "estimatefee",
                ].map((method) => (
                  <div key={method} className="text-tarcoin-gold bg-tarcoin-gold/5 rounded-lg px-3 py-2 text-xs">
                    {method}
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="text-center mt-12">
              <a href="http://localhost:5000/api/docs" target="_blank" rel="noopener noreferrer" className="btn-primary text-base px-8 py-3.5 mr-4">API Documentation</a>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5">Back to Home</Link>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}