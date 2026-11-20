"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  BsShieldCheck, 
  BsCopy, 
  BsCheck2, 
  BsBoxArrowUpRight, 
  BsLightningChargeFill, 
  BsArrowLeftRight,
  BsWallet2,
  BsCurrencyExchange,
  BsBarChartLineFill,
  BsFileEarmarkPdf
} from "react-icons/bs";

export default function WTARPage() {
  const [copied, setCopied] = useState(false);
  const contractAddress = "0x92204ea1106fb83025af2435f2a0be2effb83e80";
  const poolAddress = "0xbb959c6df595bac5c726e895c1019aaebe18ca04";

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const addToMetaMask = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: contractAddress,
              symbol: "wTAR",
              decimals: 8,
              image: "https://tarcoin.org/logo.png",
            },
          },
        });
      } catch (err) {
        console.error("MetaMask watchAsset error:", err);
      }
    } else {
      alert("Please open this page in MetaMask, Trust Wallet, or install the MetaMask browser extension to auto-import wTAR.");
    }
  };

  return (
    <main className="min-h-screen bg-tarcoin-black text-white relative overflow-hidden">
      <div className="scanlines" />

      {/* Cyber Background Glows */}
      <div className="cyber-bg min-h-screen pt-24 pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-tarcoin-gold/10 rounded-full blur-[140px] animate-float" />
          <div className="absolute top-2/3 right-1/4 w-[500px] h-[500px] bg-tarcoin-purple/10 rounded-full blur-[140px] animate-float" style={{ animationDelay: "3s" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <section className="text-center max-w-4xl mx-auto pt-6 pb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-tarcoin-gold/30 bg-tarcoin-gold/10 mb-6 backdrop-blur-md"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-tarcoin-gold animate-pulse" />
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase font-bold">
                Polygon PoS (ERC-20) • 1:1 Reserve Backed
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-6xl font-orbitron font-black tracking-tight mb-6 leading-tight"
            >
              Wrapped <span className="text-tarcoin-gold drop-shadow-[0_0_25px_rgba(212,168,67,0.4)]">TARCOIN</span> (wTAR)
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-10 font-space font-light leading-relaxed"
            >
              Bringing Tarcoin&apos;s decentralized Proof-of-Work store of value into global Web3 DeFi. 
              Trade on decentralized exchanges with sub-cent gas fees, instant finality, and 100% auditable 1:1 reserves.
            </motion.p>

            {/* Quick Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <a
                href="https://dapp.quickswap.exchange/swap?type=best&from=0xc2132D05D31c914a87C6611C10748AEb04B58e8F&to=0x92204EA1106fb83025aF2435f2A0bE2eFFB83e80&chainId=137"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-orbitron font-bold text-sm bg-tarcoin-gold text-black hover:bg-tarcoin-gold-light transition-all shadow-[0_0_25px_rgba(212,168,67,0.35)] hover:scale-105"
              >
                <BsCurrencyExchange className="text-lg" />
                Trade on QuickSwap
                <BsBoxArrowUpRight className="text-xs" />
              </a>

              <button
                onClick={addToMetaMask}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-orbitron font-bold text-sm border border-tarcoin-gold/40 bg-tarcoin-gold/10 text-white hover:bg-tarcoin-gold/20 hover:border-tarcoin-gold transition-all backdrop-blur-md"
              >
                <BsWallet2 className="text-tarcoin-gold text-base" />
                Add to MetaMask
              </button>

              <a
                href="https://www.geckoterminal.com/polygon_pos/pools/0xbb959c6df595bac5c726e895c1019aaebe18ca04"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-orbitron font-bold text-sm border border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:border-white/40 transition-all backdrop-blur-md"
              >
                <BsBarChartLineFill className="text-tarcoin-cyan text-base" />
                Live Chart
                <BsBoxArrowUpRight className="text-xs text-gray-400" />
              </a>

              <a
                href="/docs/wTAR_WHITEPAPER.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-orbitron font-bold text-sm border border-tarcoin-gold/50 bg-tarcoin-gold/15 text-tarcoin-gold hover:bg-tarcoin-gold hover:text-black transition-all shadow-[0_0_15px_rgba(212,168,67,0.2)]"
              >
                <BsFileEarmarkPdf className="text-base" />
                Read Whitepaper
                <BsBoxArrowUpRight className="text-xs" />
              </a>
            </motion.div>
          </section>

          {/* Verified Contract Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-4xl mx-auto mb-16 p-6 rounded-2xl border border-tarcoin-gold/30 bg-tarcoin-black-2/80 backdrop-blur-xl shadow-2xl relative"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-tarcoin-gold uppercase tracking-wider mb-1">
                  <BsShieldCheck className="text-base text-tarcoin-neon" />
                  Official Verified Contract Address (Polygon PoS)
                </div>
                <div className="font-mono text-sm sm:text-base text-gray-200 break-all select-all">
                  {contractAddress}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={copyToClipboard}
                  className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-orbitron text-xs font-semibold transition-all border ${
                    copied
                      ? "bg-tarcoin-neon/20 border-tarcoin-neon text-tarcoin-neon"
                      : "bg-tarcoin-gold/15 border-tarcoin-gold/40 text-tarcoin-gold hover:bg-tarcoin-gold hover:text-black"
                  }`}
                >
                  {copied ? (
                    <>
                      <BsCheck2 className="text-base" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <BsCopy className="text-sm" />
                      Copy Address
                    </>
                  )}
                </button>

                <a
                  href={`https://polygonscan.com/token/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/30 transition-all"
                  title="View on Polygonscan"
                >
                  <BsBoxArrowUpRight className="text-base" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Live Chart Section */}
          <section className="mb-20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white flex items-center gap-3">
                  <BsBarChartLineFill className="text-tarcoin-gold" />
                  Live Market & Trading Chart
                </h2>
                <p className="text-sm text-gray-400 font-space mt-1">
                  Real-time price feed and order flow powered by GeckoTerminal & QuickSwap AMM.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-4 md:mt-0">
                <a
                  href="https://dexscreener.com/polygon/0x92204ea1106fb83025af2435f2a0be2effb83e80"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-orbitron text-gray-400 hover:text-tarcoin-gold flex items-center gap-1.5 transition-colors"
                >
                  DexScreener <BsBoxArrowUpRight className="text-[10px]" />
                </a>
                <span className="text-gray-700">|</span>
                <a
                  href="https://polygonscan.com/token/0x92204ea1106fb83025af2435f2a0be2effb83e80"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-orbitron text-gray-400 hover:text-tarcoin-gold flex items-center gap-1.5 transition-colors"
                >
                  Polygonscan <BsBoxArrowUpRight className="text-[10px]" />
                </a>
              </div>
            </div>

            {/* GeckoTerminal Responsive Embed */}
            <div className="w-full h-[580px] rounded-2xl border border-tarcoin-gold/20 overflow-hidden bg-tarcoin-black-2/90 shadow-2xl relative">
              <iframe
                height="100%"
                width="100%"
                id="geckoterminal-embed"
                title="wTAR GeckoTerminal Chart"
                src="https://www.geckoterminal.com/polygon_pos/pools/0xbb959c6df595bac5c726e895c1019aaebe18ca04?embed=1&info=0&swaps=0"
                frameBorder="0"
                allow="clipboard-write"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </section>

          {/* Token Specs Grid */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white mb-3">
                Token Specifications & Ecosystem
              </h2>
              <p className="text-sm text-gray-400 font-space max-w-2xl mx-auto">
                Transparent, audited, and strictly engineered for maximum cross-chain interoperability.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Token Name", value: "Wrapped Tarcoin", sub: "Canonical DeFi Asset" },
                { title: "Symbol / Ticker", value: "wTAR", sub: "ERC-20 on Polygon" },
                { title: "Decimals", value: "8", sub: "1:1 Satoshis Precision (1e8)" },
                { title: "Network", value: "Polygon PoS", sub: "Chain ID: 137" },
                { title: "Backing Ratio", value: "1 : 1", sub: "Reserved with Native TAR" },
                { title: "Trading Fee", value: "< $0.005", sub: "Sub-cent Polygon Gas" },
                { title: "Primary DEX", value: "QuickSwap (V2)", sub: "Decentralized AMM" },
                { title: "Settlement Speed", value: "~2 Seconds", sub: "Instant Finality" },
              ].map((spec, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-white/10 bg-tarcoin-black-2/60 backdrop-blur-md hover:border-tarcoin-gold/40 transition-all group"
                >
                  <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                    {spec.title}
                  </div>
                  <div className="text-xl font-orbitron font-bold text-white group-hover:text-tarcoin-gold transition-colors mb-1">
                    {spec.value}
                  </div>
                  <div className="text-xs text-tarcoin-gold/70 font-space">
                    {spec.sub}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Dual Engine Architecture: Native TAR vs wTAR */}
          <section className="mb-20">
            <div className="p-8 sm:p-12 rounded-3xl border border-tarcoin-gold/20 bg-gradient-to-b from-tarcoin-black-3 to-tarcoin-black-2 relative overflow-hidden">
              <div className="max-w-3xl mb-10">
                <span className="text-xs font-mono text-tarcoin-gold uppercase tracking-[0.2em] font-bold block mb-2">
                  Two Chains, One Vision
                </span>
                <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white leading-tight">
                  How Native TAR & wTAR Power the Ecosystem
                </h2>
                <p className="text-gray-400 font-space mt-3">
                  Tarcoin uses a dual-engine model: Native Proof-of-Work provides absolute immutability, 
                  while wTAR unlocks global liquidity and DeFi composability.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Native TAR Card */}
                <div className="p-7 rounded-2xl border border-white/10 bg-tarcoin-black/70 backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-tarcoin-gold/15 flex items-center justify-center text-tarcoin-gold text-xl">
                      ⛏️
                    </div>
                    <div>
                      <h3 className="text-lg font-orbitron font-bold text-white">Native TAR (Layer 1)</h3>
                      <span className="text-xs text-tarcoin-gold font-mono">SHA-256d Proof-of-Work</span>
                    </div>
                  </div>
                  <ul className="space-y-3 text-sm text-gray-300 font-space">
                    <li className="flex items-center gap-2">
                      <span className="text-tarcoin-gold">✔</span> ASIC hardware mining security
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-tarcoin-gold">✔</span> 50,000,000,000 TAR fixed supply cap
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-tarcoin-gold">✔</span> Dark Gravity Wave v3 & EDA retarget
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-tarcoin-gold">✔</span> Sovereign, censorship-resistant ledger
                    </li>
                  </ul>
                </div>

                {/* wTAR Card */}
                <div className="p-7 rounded-2xl border border-tarcoin-gold/40 bg-tarcoin-gold/5 backdrop-blur-md shadow-[0_0_20px_rgba(212,168,67,0.1)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-tarcoin-cyan/15 flex items-center justify-center text-tarcoin-cyan text-xl">
                      ⚡
                    </div>
                    <div>
                      <h3 className="text-lg font-orbitron font-bold text-white">Wrapped TAR (Polygon DeFi)</h3>
                      <span className="text-xs text-tarcoin-cyan font-mono">ERC-20 Smart Contract</span>
                    </div>
                  </div>
                  <ul className="space-y-3 text-sm text-gray-300 font-space">
                    <li className="flex items-center gap-2">
                      <span className="text-tarcoin-gold">✔</span> 100% backed 1:1 by reserve TAR
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-tarcoin-gold">✔</span> Instant trades on QuickSwap, Uniswap & DEXs
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-tarcoin-gold">✔</span> Native compatibility with MetaMask & Trust Wallet
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-tarcoin-gold">✔</span> Micro gas fees under 1 cent per transfer
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* How to Get & Bridge wTAR */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white mb-3">
                How to Get & Trade wTAR
              </h2>
              <p className="text-sm text-gray-400 font-space max-w-xl mx-auto">
                Follow these three simple steps to start trading or holding wTAR today.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Connect Wallet",
                  desc: "Add the Polygon Network and wTAR contract address to MetaMask, Trust Wallet, or Coinbase Wallet using the 1-click button above.",
                },
                {
                  step: "02",
                  title: "Swap on QuickSwap",
                  desc: "Swap POL (MATIC), USDT, or USDC directly for wTAR on QuickSwap DEX with instant execution and deep liquidity.",
                },
                {
                  step: "03",
                  title: "Bridge via Official Wallet",
                  desc: "Deposit native TAR into the Tarcoin Web Wallet to wrap it into wTAR, or unwrap your wTAR back to native TAR anytime.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-8 rounded-2xl border border-white/10 bg-tarcoin-black-2/70 backdrop-blur-md relative group hover:border-tarcoin-gold/40 transition-all"
                >
                  <div className="text-4xl font-orbitron font-black text-tarcoin-gold/30 group-hover:text-tarcoin-gold transition-colors mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-orbitron font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 font-space leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Frequently Asked Questions */}
          <section className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-gray-400 font-space">
                Clear answers regarding the wTAR tokenomics and safety.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Is wTAR a different coin than native TAR?",
                  a: "No. wTAR is an ERC-20 token on Polygon that represents native TAR 1:1. For every wTAR minted on Polygon, one native TAR is held in the official reserve vault. You can hold, swap, or bridge back anytime.",
                },
                {
                  q: "Why did Tarcoin create a wrapped version on Polygon?",
                  a: "Native TAR is mined via SHA-256 hardware ASICs and operates on its own layer-1 Bitcoin-like blockchain. By creating wTAR on Polygon PoS, Tarcoin enters the multi-billion dollar EVM ecosystem—enabling decentralized swaps, liquidity farming, and instant Web3 wallet access.",
                },
                {
                  q: "Where can I track the live price and chart?",
                  a: "You can view the live candlestick chart right here on this page, or directly on GeckoTerminal and DexScreener by searching for wTAR or our pool address.",
                },
                {
                  q: "How do I verify the contract on Polygonscan?",
                  a: "The smart contract is open-source and verified on Polygonscan under address 0x92204ea1106fb83025af2435f2a0be2effb83e80. You can inspect the code, transfers, and holders directly on-chain.",
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl border border-white/10 bg-tarcoin-black-2/60 backdrop-blur-md"
                >
                  <h3 className="text-base font-orbitron font-bold text-white mb-2 text-tarcoin-gold">
                    {faq.q}
                  </h3>
                  <p className="text-sm text-gray-300 font-space leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Call to Action */}
          <section className="text-center max-w-3xl mx-auto p-10 rounded-3xl border border-tarcoin-gold/30 bg-gradient-to-b from-tarcoin-gold/10 to-transparent backdrop-blur-xl shadow-2xl">
            <h2 className="text-3xl font-orbitron font-black text-white mb-4">
              Hold the Gold. Trade on Web3.
            </h2>
            <p className="text-gray-300 font-space mb-8 text-sm sm:text-base">
              Join thousands of miners and traders participating in the decentralized future of Tarcoin.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://dapp.quickswap.exchange/swap?type=best&from=0xc2132D05D31c914a87C6611C10748AEb04B58e8F&to=0x92204EA1106fb83025aF2435f2A0bE2eFFB83e80&chainId=137"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 rounded-xl font-orbitron font-bold text-sm bg-tarcoin-gold text-black hover:bg-tarcoin-gold-light transition-all shadow-[0_0_20px_rgba(212,168,67,0.3)]"
              >
                Swap wTAR on QuickSwap
              </a>
              <Link
                href="/wallet"
                className="px-8 py-3.5 rounded-xl font-orbitron font-bold text-sm border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all"
              >
                Download Native Wallet
              </Link>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
