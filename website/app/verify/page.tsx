"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export default function VerifyPage() {
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [result, setResult] = useState<"valid" | "invalid" | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim() || !message.trim() || !signature.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      // Call the TARCOIN API for message verification
      const res = await fetch("https://api.tarcoin.org/api/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), message: message.trim(), signature: signature.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.valid ? "valid" : "invalid");
      } else {
        setResult("invalid");
      }
    } catch {
      setResult("invalid");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setAddress("");
    setMessage("");
    setSignature("");
    setResult(null);
  }

  return (
    <main className="min-h-screen bg-tarcoin-black">
      <div className="scanlines" />
      <div className="cyber-bg min-h-screen pt-20">
        <section className="relative min-h-screen py-24 flex items-center justify-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-tarcoin-gold/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tarcoin-cyan/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-tarcoin-gold/20 bg-tarcoin-gold/5 mb-8">
              <span className="w-2 h-2 rounded-full bg-tarcoin-gold animate-pulse" />
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase">Message Verification</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl font-orbitron font-black mb-4">
              <span className="text-white">Verify</span><br />
              <span className="text-tarcoin-gold text-glow">Signature</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }}
              className="text-base text-gray-400 max-w-xl mb-10 font-space leading-relaxed">
              Verify that a message was cryptographically signed by the owner of a TARCOIN address.
              Enter the receiver's address, the original message (copy line breaks exactly), and the signature.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
              className="glass rounded-2xl p-6 sm:p-8 border border-tarcoin-gold/10 mb-6">

              <form onSubmit={handleVerify} className="space-y-5">
                {/* Address */}
                <div>
                  <label className="block text-xs font-orbitron text-tarcoin-gold tracking-widest mb-2 uppercase">
                    TARCOIN Address (tar1… or T…)
                  </label>
                  <input
                    id="verify-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. tar1qxxx... or TxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY"
                    className="w-full bg-black/40 border border-tarcoin-gold/20 rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-tarcoin-gold/50 transition-colors"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-orbitron text-tarcoin-gold tracking-widest mb-2 uppercase">
                    Signed Message
                  </label>
                  <textarea
                    id="verify-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="The signed message to verify (copy line breaks, spaces, and tabs exactly)"
                    rows={4}
                    className="w-full bg-black/40 border border-tarcoin-gold/20 rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-tarcoin-gold/50 transition-colors resize-none"
                    spellCheck={false}
                  />
                </div>

                {/* Signature */}
                <div>
                  <label className="block text-xs font-orbitron text-tarcoin-gold tracking-widest mb-2 uppercase">
                    Signature
                  </label>
                  <input
                    id="verify-signature"
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="The signature given when the message was signed"
                    className="w-full bg-black/40 border border-tarcoin-gold/20 rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-tarcoin-gold/50 transition-colors"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                {/* Result banner */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl px-5 py-4 text-center font-orbitron tracking-wider text-sm border ${
                      result === "valid"
                        ? "bg-green-500/10 border-green-500/40 text-green-400"
                        : "bg-red-500/10 border-red-500/40 text-red-400"
                    }`}
                  >
                    {result === "valid" ? "✓ Signature is VALID" : "✕ Signature is INVALID or could not be verified"}
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    id="verify-btn"
                    type="submit"
                    disabled={loading || !address || !message || !signature}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Verifying…
                      </>
                    ) : "Verify Message"}
                  </button>
                  <button
                    id="verify-clear"
                    type="button"
                    onClick={handleClear}
                    className="btn-ghost px-6"
                  >
                    Clear All
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Info note */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="glass rounded-xl p-5 border border-tarcoin-gold/10 mb-8 text-sm text-gray-400 font-space">
              <p className="mb-2">
                <span className="text-tarcoin-gold font-orbitron text-xs tracking-wider">ℹ NOTE:</span> This only proves the signing party controls the address — it does not prove sendership of any transaction.
              </p>
              <p>Be careful not to read more into the signature than what is in the signed message itself, to avoid being tricked by a man-in-the-middle attack.</p>
            </motion.div>

            <div className="flex flex-wrap gap-4">
              <Link href="/wallet" className="btn-ghost text-base px-8 py-3.5">Wallet</Link>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5">Back to Home</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
