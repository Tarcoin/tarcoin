"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

const TNS_TREASURY_TAR = "tar1q3e8a9xg89jd4wg8q97x3ar3l4ew2a7gtamqskq";
const TNS_TREASURY_USDT_POLYGON = "0x1D48feF097989b698009716965ACb8eC4d7c3CbF";

const PREMIUM_KEYWORDS = new Set([
  // 3-Letter
  "vip", "btc", "usd", "eth", "dex", "ceo", "god", "top", "pay", "pro",
  "win", "app", "bot", "dao", "sol", "xmr", "ltc", "one", "ace", "hot", "sun",
  "max", "gem", "hub", "box", "run", "fit", "law", "art", "gas", "web", "dev",
  // 4-Letter
  "love", "usdt", "pool", "gold", "node", "coin", "mine", "bank", "cash", "king",
  "moon", "safe", "swap", "earn", "rich", "star", "fire", "fast", "best", "real",
  "game", "play", "meta", "defi", "card", "free", "gift", "luck", "boss", "lord",
  "apex", "core", "drop", "link", "pass", "team", "hero", "rock", "blue", "cool",
  // 5-Letter
  "money", "chain", "token", "crypt", "block", "whale", "yield", "stake", "trust",
  "super", "smart", "elite", "alpha", "prime", "cloud", "cyber", "world"
]);

interface TierInfo {
  tier: number;
  name: string;
  minLen: number;
  maxLen: number;
  priceUsdt: number;
  priceTarUsd: number; // 25% OFF
  isReserved: boolean;
}

const TIERS: Record<string, TierInfo> = {
  RESERVED: {
    tier: 0,
    name: "VVIP & Core Reserved",
    minLen: 1,
    maxLen: 2,
    priceUsdt: 0,
    priceTarUsd: 0,
    isReserved: true,
  },
  TIER_3: {
    tier: 1,
    name: "3-Character Standard",
    minLen: 3,
    maxLen: 3,
    priceUsdt: 500,
    priceTarUsd: 375,
    isReserved: false,
  },
  TIER_4: {
    tier: 2,
    name: "4-Character Standard",
    minLen: 4,
    maxLen: 4,
    priceUsdt: 200,
    priceTarUsd: 150,
    isReserved: false,
  },
  TIER_5: {
    tier: 3,
    name: "5-Character Brand",
    minLen: 5,
    maxLen: 5,
    priceUsdt: 50,
    priceTarUsd: 37.5,
    isReserved: false,
  },
  TIER_STANDARD: {
    tier: 4,
    name: "Standard (6-8 Characters)",
    minLen: 6,
    maxLen: 8,
    priceUsdt: 20,
    priceTarUsd: 15,
    isReserved: false,
  },
  TIER_EXTENDED: {
    tier: 5,
    name: "Extended (9+ Characters)",
    minLen: 9,
    maxLen: 64,
    priceUsdt: 10,
    priceTarUsd: 7.5,
    isReserved: false,
  },
};

export default function DomainsPage() {
  const [search, setSearch] = useState("");
  const [years, setYears] = useState<1 | 4>(4);
  const [paymentMethod, setPaymentMethod] = useState<"TAR" | "USDT">("TAR");
  const [copied, setCopied] = useState<string | null>(null);

  // Live availability check state
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isTaken, setIsTaken] = useState(false);
  const [registeredData, setRegisteredData] = useState<any | null>(null);

  // Live NestEx price feed for TAR amount calculation
  const [tarPriceUsd, setTarPriceUsd] = useState<number>(0.0000105);

  useEffect(() => {
    fetch("https://api.nestex.one/cg/tickers")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((tickers) => {
        if (Array.isArray(tickers)) {
          const t = tickers.find((x: any) => x.ticker_id === "TAR_USDT" || x.base_currency === "TAR");
          if (t && parseFloat(t.last_price) > 0) {
            setTarPriceUsd(parseFloat(t.last_price));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Direct USDT Form state
  const [txHash, setTxHash] = useState("");
  const [enableTarAddress, setEnableTarAddress] = useState(true);
  const [tarAddressInput, setTarAddressInput] = useState("");
  const [enableIpfs, setEnableIpfs] = useState(false);
  const [ipfsCidInput, setIpfsCidInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const cleanName = useMemo(() => {
    let clean = search.trim().toLowerCase();
    if (clean.endsWith(".tar")) clean = clean.slice(0, -4);
    return clean.replace(/[^a-z0-9-]/g, "");
  }, [search]);

  // Brand protection & reservation checks
  const reservation = useMemo(() => {
    if (!cleanName) return { isReserved: false };
    if (cleanName.startsWith("tarcoin")) {
      return {
        isReserved: true,
        reason: "Official Tarcoin Brand Reserved — Exclusive to Core Team & Foundation.",
      };
    }
    if (cleanName === "tar") {
      return {
        isReserved: true,
        reason: "Protocol Ticker Reserved — Exclusive to Core Foundation.",
      };
    }
    if (cleanName.length <= 2) {
      return {
        isReserved: true,
        reason: "1 & 2 Character Names (0–9, 00–99, a–z) are Locked for VVIPs & Protocol Security.",
      };
    }
    return { isReserved: false };
  }, [cleanName]);

  // Check live availability on TNS indexer
  useEffect(() => {
    if (!cleanName || reservation.isReserved) {
      setIsTaken(false);
      setRegisteredData(null);
      setIsCheckingAvailability(false);
      return;
    }

    let cancelled = false;
    setIsCheckingAvailability(true);

    const timer = setTimeout(() => {
      fetch(`/api/tns/resolve/${cleanName}.tar`)
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data) => {
          if (cancelled) return;
          if (data && data.success && data.targetAddress) {
            setIsTaken(true);
            setRegisteredData(data);
          } else {
            setIsTaken(false);
            setRegisteredData(null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setIsTaken(false);
            setRegisteredData(null);
          }
        })
        .finally(() => {
          if (!cancelled) setIsCheckingAvailability(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cleanName, reservation.isReserved]);

  // Ultra-Premium 2x Multiplier detection
  const premiumInfo = useMemo(() => {
    const len = cleanName.length;
    if (len <= 2 || reservation.isReserved) return { isPremium: false };

    // 1. Pure numeric digits (911, 100, 111, 786, 222, 1111, 2222, etc.)
    if (/^[0-9]+$/.test(cleanName)) {
      if (len === 3) return { isPremium: true, reason: "Pure 3-Digit Numeric (999 Club)" };
      if (len === 4) return { isPremium: true, reason: "Pure 4-Digit Numeric (10k Club)" };
    }

    // 2. High-value iconic keywords (vip, btc, usd, usdt, love, pool, gold, etc.)
    if (PREMIUM_KEYWORDS.has(cleanName)) {
      return { isPremium: true, reason: "High-Value Web3 Keyword / Ticker" };
    }

    // 3. Repeating patterns (aaa, 111, abab)
    if (/^(.)\1+$/.test(cleanName)) {
      return { isPremium: true, reason: "Repeating Pattern" };
    }
    if (len === 4 && cleanName[0] === cleanName[2] && cleanName[1] === cleanName[3]) {
      return { isPremium: true, reason: "Repeating Pattern (ABAB)" };
    }

    return { isPremium: false };
  }, [cleanName, reservation.isReserved]);

  const baseTier = useMemo(() => {
    const len = cleanName.length;
    if (len === 0) return null;
    if (reservation.isReserved) return TIERS.RESERVED;
    if (len === 3) return TIERS.TIER_3;
    if (len === 4) return TIERS.TIER_4;
    if (len === 5) return TIERS.TIER_5;
    if (len <= 8) return TIERS.TIER_STANDARD;
    return TIERS.TIER_EXTENDED;
  }, [cleanName, reservation.isReserved]);

  // Apply 2x Ultra-Premium Multiplier if applicable
  const effectiveBaseUsdt = useMemo(() => {
    if (!baseTier) return 0;
    return baseTier.priceUsdt * (premiumInfo.isPremium ? 2 : 1);
  }, [baseTier, premiumInfo.isPremium]);

  const effectiveBaseTarUsd = useMemo(() => {
    if (!baseTier) return 0;
    return baseTier.priceTarUsd * (premiumInfo.isPremium ? 2 : 1);
  }, [baseTier, premiumInfo.isPremium]);

  // Duration Promo: 4-Year promo pays for 3 years (1 year FREE)
  const durationMultiplier = years === 4 ? 3 : 1;
  const usdtTotal = effectiveBaseUsdt * durationMultiplier;
  const tarTotalUsd = effectiveBaseTarUsd * durationMultiplier;

  // Real-time TAR calculation from live NestEx market price
  const tarAmount = useMemo(() => {
    if (!tarTotalUsd || tarPriceUsd <= 0) return 0;
    return Math.ceil(tarTotalUsd / tarPriceUsd);
  }, [tarTotalUsd, tarPriceUsd]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleUsdtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const cleanTx = txHash.trim();
    if (!cleanTx || cleanTx.length < 10) {
      setSubmitError("Please enter a valid Polygon Transaction Hash (TXID).");
      return;
    }

    if (!enableTarAddress && !enableIpfs) {
      setSubmitError("Please select at least one record option (Tarcoin Address or IPFS Website).");
      return;
    }

    if (enableTarAddress && !tarAddressInput.trim()) {
      setSubmitError("Please enter your Tarcoin receiving address (tar1...).");
      return;
    }

    if (enableIpfs && !ipfsCidInput.trim()) {
      setSubmitError("Please enter your IPFS Website CID (bafy... or Qm...).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/domains/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: `${cleanName}.tar`,
          years,
          paymentMethod: "USDT_POLYGON",
          txHash: cleanTx,
          tarAddress: enableTarAddress ? tarAddressInput.trim() : null,
          ipfsCid: enableIpfs ? ipfsCidInput.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit domain registration");
      }

      setSubmittedOrder({
        domain: `${cleanName}.tar`,
        years,
        txHash: cleanTx,
        tarAddress: enableTarAddress ? tarAddressInput.trim() : null,
        ipfsCid: enableIpfs ? ipfsCidInput.trim() : null,
        amountUsdt: usdtTotal,
      });
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-tarcoin-black text-white">
      <div className="scanlines" />
      <div className="cyber-bg min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header Hero */}
        <section className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-tarcoin-gold/30 bg-tarcoin-gold/10 text-tarcoin-gold text-xs font-orbitron tracking-widest uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-tarcoin-gold animate-pulse" />
            Tarcoin Name Service (TNS-1)
          </div>

          <h1 className="text-4xl sm:text-6xl font-orbitron font-black tracking-tight mb-4">
            Own Your <span className="text-tarcoin-gold">.tar</span> Web3 Identity
          </h1>

          <p className="text-gray-400 font-space text-base sm:text-lg mb-8">
            Replace complex 42-character wallet addresses with a simple, human-readable name. 
            Host decentralized websites on IPFS and build your censorship-resistant brand.
          </p>

          {/* Search Box */}
          <div className="relative max-w-xl mx-auto glass p-2 rounded-2xl border border-tarcoin-gold/30 shadow-2xl shadow-tarcoin-gold/10">
            <div className="flex items-center bg-black/60 rounded-xl px-4 py-3 border border-white/5">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSubmittedOrder(null);
                  setSubmitError(null);
                }}
                placeholder="search your favorite name (e.g. 786, 911, miner, love)"
                className="w-full bg-transparent text-white font-mono placeholder-gray-600 focus:outline-none text-lg pr-4"
              />
              <span className="text-tarcoin-gold font-orbitron font-bold text-lg select-none">
                .tar
              </span>
            </div>
          </div>
        </section>

        {/* Pricing & Checkout Card */}
        {cleanName && baseTier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto glass rounded-2xl p-6 sm:p-8 border border-tarcoin-gold/30 mb-14 shadow-xl"
          >
            {reservation.isReserved ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-tarcoin-gold flex items-center justify-center mx-auto text-xl font-bold">
                  🔒
                </div>
                <h3 className="text-xl font-orbitron font-bold text-white">
                  {cleanName}.tar is Permanently Reserved
                </h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  {reservation.reason}
                </p>
                <div className="pt-2">
                  <span className="text-xs px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full font-mono">
                    Protected Invariant: Core Team & Protocol Exclusive
                  </span>
                </div>
              </div>
            ) : isTaken && registeredData ? (
              /* Already Registered Card */
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold">
                        {cleanName}.tar
                      </h2>
                      {premiumInfo.isPremium && (
                        <span className="text-[10px] font-orbitron font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          👑 2X ULTRA-PREMIUM
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 font-mono">{baseTier.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full font-mono flex items-center gap-1">
                      <span>Already Registered</span>
                      <span>🔒</span>
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-3 font-mono text-xs">
                  <div className="text-amber-400 font-bold font-orbitron text-sm">
                    This .tar domain is already owned and active on-chain.
                  </div>
                  <div className="space-y-2 pt-1 text-gray-300">
                    <div className="break-all">
                      <span className="text-gray-500 block text-[10px] uppercase tracking-wider">Points to Tarcoin Wallet:</span>
                      <span className="text-white text-xs">{registeredData.targetAddress}</span>
                    </div>
                    {registeredData.ipfsCid && (
                      <div className="break-all pt-1">
                        <span className="text-gray-500 block text-[10px] uppercase tracking-wider">Decentralized IPFS Website:</span>
                        <a
                          href={`https://dweb.link/ipfs/${registeredData.ipfsCid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline text-xs"
                        >
                          {registeredData.ipfsCid} ↗
                        </a>
                      </div>
                    )}
                    {registeredData.txid && (
                      <div className="break-all pt-1">
                        <span className="text-gray-500 block text-[10px] uppercase tracking-wider">Registration TXID:</span>
                        <span className="text-gray-400 text-[11px]">{registeredData.txid}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : submittedOrder ? (
              /* Success / Confirmation Card */
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-2xl font-orbitron font-bold text-white">
                  Registration Order Submitted!
                </h3>
                <p className="text-sm text-gray-300 max-w-md mx-auto font-space">
                  Your order for <span className="text-tarcoin-gold font-bold font-mono">{submittedOrder.domain}</span> has been logged with the TNS Registry.
                </p>

                <div className="bg-black/60 rounded-xl p-4 border border-white/10 text-left font-mono text-xs space-y-2 max-w-md mx-auto">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Domain:</span>
                    <span className="text-tarcoin-gold font-bold">{submittedOrder.domain}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">{submittedOrder.years} Year(s)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">USDT Paid:</span>
                    <span className="text-emerald-400 font-bold">${submittedOrder.amountUsdt.toFixed(2)} USDT</span>
                  </div>
                  <div className="py-1 border-b border-white/5 break-all">
                    <span className="text-gray-400 block mb-0.5">Polygon TXID:</span>
                    <span className="text-gray-200 text-[11px]">{submittedOrder.txHash}</span>
                  </div>
                  {submittedOrder.tarAddress && (
                    <div className="py-1 border-b border-white/5 break-all">
                      <span className="text-gray-400 block mb-0.5">Linked Tarcoin Address:</span>
                      <span className="text-amber-300 text-[11px]">{submittedOrder.tarAddress}</span>
                    </div>
                  )}
                  {submittedOrder.ipfsCid && (
                    <div className="py-1 break-all">
                      <span className="text-gray-400 block mb-0.5">Linked IPFS Website CID:</span>
                      <span className="text-cyan-300 text-[11px]">{submittedOrder.ipfsCid}</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-gray-400 font-space max-w-md mx-auto">
                  The TNS Registry indexer verifies your Polygon transaction block confirmations and activates the on-chain mapping automatically.
                </p>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedOrder(null);
                      setTxHash("");
                      setSearch("");
                    }}
                    className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron text-xs transition-all"
                  >
                    Register Another Domain
                  </button>
                  <a
                    href={`https://polygonscan.com/tx/${submittedOrder.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-orbitron text-xs transition-all flex items-center gap-1.5"
                  >
                    View TX on PolygonScan ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold">
                        {cleanName}.tar
                      </h2>
                      {premiumInfo.isPremium && (
                        <span className="text-[10px] font-orbitron font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          👑 2X ULTRA-PREMIUM
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 font-mono">{baseTier.name}</span>
                      {premiumInfo.reason && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          • {premiumInfo.reason}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {isCheckingAvailability ? (
                      <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full font-mono animate-pulse">
                        Checking...
                      </span>
                    ) : (
                      <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full font-mono">
                        Available to Register
                      </span>
                    )}
                  </div>
                </div>

                {/* Duration Pills */}
                <div className="space-y-2">
                  <label className="text-xs font-orbitron text-gray-300 tracking-wider">
                    REGISTRATION DURATION
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setYears(1)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        years === 1
                          ? paymentMethod === "USDT"
                            ? "bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                            : "bg-tarcoin-gold/15 border-tarcoin-gold text-white"
                          : "bg-black/40 border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs font-semibold">1 Year</div>
                      {paymentMethod === "USDT" ? (
                        <>
                          <div className="text-base font-orbitron font-bold text-emerald-400 mt-1">
                            ${effectiveBaseUsdt.toFixed(2)}{" "}
                            <span className="text-xs text-gray-400 font-normal">USDT</span>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Standard Retail
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-base font-orbitron font-bold text-tarcoin-gold mt-1">
                            ${effectiveBaseTarUsd.toFixed(2)}{" "}
                            <span className="text-xs text-gray-400 font-normal">in TAR</span>
                          </div>
                          <div className="text-[10px] text-gray-500 line-through">
                            ${effectiveBaseUsdt.toFixed(2)} USDT
                          </div>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setYears(4)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                        years === 4
                          ? paymentMethod === "USDT"
                            ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                            : "bg-tarcoin-gold/20 border-tarcoin-gold text-white shadow-lg shadow-tarcoin-gold/10"
                          : "bg-black/40 border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <span
                        className={`absolute top-0 right-0 text-black text-[9px] font-orbitron font-black px-2 py-0.5 rounded-bl-lg ${
                          paymentMethod === "USDT" ? "bg-emerald-400" : "bg-tarcoin-gold"
                        }`}
                      >
                        1 YR FREE 🔥
                      </span>
                      <div className="text-xs font-semibold">4 Years (Best Deal)</div>
                      {paymentMethod === "USDT" ? (
                        <>
                          <div className="text-base font-orbitron font-bold text-emerald-400 mt-1">
                            ${(effectiveBaseUsdt * 3).toFixed(2)}{" "}
                            <span className="text-xs text-gray-400 font-normal">USDT</span>
                          </div>
                          <div className="text-[10px] text-gray-500 line-through">
                            ${(effectiveBaseUsdt * 4).toFixed(2)} USDT
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-base font-orbitron font-bold text-tarcoin-gold mt-1">
                            ${(effectiveBaseTarUsd * 3).toFixed(2)}{" "}
                            <span className="text-xs text-gray-400 font-normal">in TAR</span>
                          </div>
                          <div className="text-[10px] text-gray-500 line-through">
                            ${(effectiveBaseUsdt * 3).toFixed(2)} USDT
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Currency Switcher */}
                <div className="space-y-2">
                  <label className="text-xs font-orbitron text-gray-300 tracking-wider">
                    PAYMENT CURRENCY
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("TAR")}
                      className={`p-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === "TAR"
                          ? "bg-tarcoin-gold/20 border-tarcoin-gold text-tarcoin-gold"
                          : "bg-black/40 border-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      ⚡ Pay with TAR (25% OFF)
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("USDT")}
                      className={`p-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === "USDT"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-black/40 border-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      💵 Pay with USDT (Polygon)
                    </button>
                  </div>
                </div>

                {/* Checkout Instructions */}
                <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-gray-400">Total Price:</span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-tarcoin-gold block">
                        {paymentMethod === "TAR"
                          ? `${tarAmount.toLocaleString()} TAR`
                          : `$${usdtTotal.toFixed(2)} USDT`}
                      </span>
                      {paymentMethod === "TAR" && (
                        <span className="text-xs text-gray-400 font-mono block">
                          ≈ ${tarTotalUsd.toFixed(2)} USD (Live Rate: ${tarPriceUsd.toFixed(8)})
                        </span>
                      )}
                    </div>
                  </div>

                  {paymentMethod === "TAR" ? (
                    /* TAR Payment Flow */
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      {/* Exact TAR Amount Box */}
                      <div className="space-y-1 text-xs font-mono break-all text-gray-400">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-orbitron">
                            Exact TAR Amount To Send:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(String(tarAmount))}
                            className="text-tarcoin-gold hover:text-white font-sans text-xs underline"
                          >
                            {copied === String(tarAmount) ? "Copied ✓" : "Copy Amount"}
                          </button>
                        </div>
                        <div className="text-white bg-black/80 p-2.5 rounded-lg border border-tarcoin-gold/30 flex items-center justify-between">
                          <span className="text-base font-bold text-tarcoin-gold font-mono">
                            {tarAmount.toLocaleString()} TAR
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            ≈ ${tarTotalUsd.toFixed(2)} USD
                          </span>
                        </div>
                      </div>

                      {/* Registry Address Box */}
                      <div className="space-y-1 text-xs font-mono break-all text-gray-400">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-orbitron">
                          Send Payment To TNS Domain Registry Wallet (TAR):
                        </span>
                        <div className="text-white bg-black/80 p-2.5 rounded-lg border border-white/10 flex items-center justify-between">
                          <span className="truncate pr-2 font-mono text-[11px]">
                            {TNS_TREASURY_TAR}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(TNS_TREASURY_TAR)}
                            className="text-tarcoin-gold hover:text-white shrink-0 font-sans text-xs underline"
                          >
                            {copied === TNS_TREASURY_TAR ? "Copied ✓" : "Copy Address"}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <a
                          href={`https://my-wallet.tarcoin.org?domain=${cleanName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full py-3 text-center bg-gradient-to-r from-tarcoin-gold to-yellow-600 hover:from-yellow-400 hover:to-tarcoin-gold text-black font-orbitron font-bold rounded-xl text-sm transition-all shadow-lg shadow-tarcoin-gold/10"
                        >
                          Instant 1-Click Register in My-Wallet →
                        </a>
                      </div>
                    </div>
                  ) : (
                    /* USDT (Polygon) Direct Flow */
                    <form onSubmit={handleUsdtSubmit} className="space-y-4 pt-2 border-t border-white/5">
                      {/* Registry Address & QR */}
                      <div className="space-y-1.5 text-xs font-mono break-all text-gray-400">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-orbitron block">
                          Send Payment To TNS Domain Registry Wallet (Polygon USDT):
                        </span>

                        <div className="flex flex-col sm:flex-row items-center gap-3 bg-black/90 p-3 rounded-xl border border-white/10">
                          <div className="bg-white p-1.5 rounded-lg shrink-0">
                            <QRCodeSVG value={TNS_TREASURY_USDT_POLYGON} size={76} />
                          </div>
                          <div className="w-full space-y-1 text-left">
                            <div className="text-[10px] text-emerald-400 font-mono">
                              Network: Polygon (POS) • USDT Contract
                            </div>
                            <div className="text-white text-[11px] font-mono select-all">
                              {TNS_TREASURY_USDT_POLYGON}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(TNS_TREASURY_USDT_POLYGON)}
                              className="text-tarcoin-gold hover:text-white text-xs underline inline-block pt-0.5"
                            >
                              {copied === TNS_TREASURY_USDT_POLYGON ? "Copied ✓" : "Copy USDT Address"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Step 1: TXID Input */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-orbitron text-gray-200 tracking-wider flex items-center justify-between">
                          <span>1. Polygon Transaction Hash (TXID)</span>
                          <span className="text-[10px] text-emerald-400 font-mono">Required</span>
                        </label>
                        <input
                          type="text"
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          placeholder="0x... paste your Polygon USDT transfer TX hash"
                          className="w-full bg-black/80 border border-white/15 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none transition-all"
                        />
                      </div>

                      {/* Step 2: Choose Destination Options */}
                      <div className="space-y-2.5 pt-1">
                        <label className="text-xs font-orbitron text-gray-200 tracking-wider block">
                          2. Configure Domain Destination (Select 1 or Both)
                        </label>

                        {/* Option A: Link Tarcoin Address */}
                        <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={enableTarAddress}
                              onChange={(e) => setEnableTarAddress(e.target.checked)}
                              className="rounded border-gray-700 text-tarcoin-gold focus:ring-tarcoin-gold bg-black/80 w-4 h-4"
                            />
                            <span className="text-xs font-semibold text-white">
                              Link Tarcoin Wallet Address (for receiving payments)
                            </span>
                          </label>

                          {enableTarAddress && (
                            <input
                              type="text"
                              value={tarAddressInput}
                              onChange={(e) => setTarAddressInput(e.target.value)}
                              placeholder="tar1q... recipient Tarcoin address"
                              className="w-full bg-black/90 border border-white/15 focus:border-tarcoin-gold rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-gray-600 focus:outline-none"
                            />
                          )}
                        </div>

                        {/* Option B: Link IPFS Website */}
                        <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={enableIpfs}
                              onChange={(e) => setEnableIpfs(e.target.checked)}
                              className="rounded border-gray-700 text-cyan-400 focus:ring-cyan-400 bg-black/80 w-4 h-4"
                            />
                            <span className="text-xs font-semibold text-white">
                              Link Decentralized Website (IPFS CID)
                            </span>
                          </label>

                          {enableIpfs && (
                            <input
                              type="text"
                              value={ipfsCidInput}
                              onChange={(e) => setIpfsCidInput(e.target.value)}
                              placeholder="bafybeic... or Qm... IPFS CID hash"
                              className="w-full bg-black/90 border border-white/15 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-gray-600 focus:outline-none"
                            />
                          )}
                        </div>
                      </div>

                      {submitError && (
                        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 font-mono">
                          {submitError}
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting || !txHash.trim()}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-orbitron font-bold rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            <span>Verifying & Submitting Order...</span>
                          </>
                        ) : (
                          <span>Submit USDT Registration →</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Pricing Tiers Table */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-orbitron font-bold mb-2">
              Official TNS-1 Pricing Tiers
            </h2>
            <p className="text-gray-400 text-sm font-space">
              Enjoy 25% discount when paying with native $TAR + 1 Year Free on 4-year registrations!
            </p>
          </div>

          <div className="overflow-x-auto glass rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm font-space">
              <thead className="bg-white/5 border-b border-white/10 text-xs font-orbitron text-tarcoin-gold">
                <tr>
                  <th className="py-4 px-6">Length / Category</th>
                  <th className="py-4 px-6">Examples</th>
                  <th className="py-4 px-6">Retail (USDT)</th>
                  <th className="py-4 px-6">With TAR (25% OFF)</th>
                  <th className="py-4 px-6">4-Year Promo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                <tr className="bg-white/[0.02]">
                  <td className="py-3.5 px-6 font-bold text-white">1 & 2 Characters</td>
                  <td className="py-3.5 px-6 text-gray-500">7.tar, 99.tar</td>
                  <td className="py-3.5 px-6 text-amber-400 font-bold" colSpan={3}>
                    🔒 PERMANENTLY LOCKED & RESERVED (Core Team & Protocol)
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-white">3 Characters</td>
                  <td className="py-3.5 px-6 text-gray-400">xyz.tar, 5k9.tar</td>
                  <td className="py-3.5 px-6 text-gray-400 line-through">$500.00</td>
                  <td className="py-3.5 px-6 text-tarcoin-gold font-bold">$375.00</td>
                  <td className="py-3.5 px-6 text-green-400 font-bold">$1,125.00 (Save $375)</td>
                </tr>
                <tr className="bg-white/[0.02]">
                  <td className="py-3.5 px-6 font-bold text-white">4 Characters</td>
                  <td className="py-3.5 px-6 text-gray-400">zone.tar, byte.tar</td>
                  <td className="py-3.5 px-6 text-gray-400 line-through">$200.00</td>
                  <td className="py-3.5 px-6 text-tarcoin-gold font-bold">$150.00</td>
                  <td className="py-3.5 px-6 text-green-400 font-bold">$450.00 (Save $150)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-white">5 Characters</td>
                  <td className="py-3.5 px-6 text-gray-400">token.tar, cloud.tar</td>
                  <td className="py-3.5 px-6 text-gray-400 line-through">$50.00</td>
                  <td className="py-3.5 px-6 text-tarcoin-gold font-bold">$37.50</td>
                  <td className="py-3.5 px-6 text-green-400 font-bold">$112.50 (Save $37.50)</td>
                </tr>
                <tr className="bg-white/[0.02]">
                  <td className="py-3.5 px-6 font-bold text-white">6 to 8 Characters</td>
                  <td className="py-3.5 px-6 text-gray-400">myname.tar, wallet.tar</td>
                  <td className="py-3.5 px-6 text-gray-400 line-through">$20.00</td>
                  <td className="py-3.5 px-6 text-tarcoin-gold font-bold">$15.00</td>
                  <td className="py-3.5 px-6 text-green-400 font-bold">$45.00 (Save $15.00)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-white">9+ Characters</td>
                  <td className="py-3.5 px-6 text-gray-400">satoshicoin.tar, cryptowallet.tar</td>
                  <td className="py-3.5 px-6 text-gray-400 line-through">$10.00</td>
                  <td className="py-3.5 px-6 text-tarcoin-gold font-bold">$7.50</td>
                  <td className="py-3.5 px-6 text-green-400 font-bold">$22.50 (Save $7.50)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="grid sm:grid-cols-3 gap-6 mb-16">
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-tarcoin-gold/10 border border-tarcoin-gold/30 text-tarcoin-gold flex items-center justify-center font-bold text-lg">
              🏷️
            </div>
            <h3 className="font-orbitron font-bold text-white">Human-Readable Wallets</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-space">
              Stop typing error-prone 42-character alphanumeric addresses. Anyone can send TAR 
              directly to your .tar name in my-wallet or supported apps.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-lg">
            🌐
          </div>
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-3">
            <h3 className="font-orbitron font-bold text-white">Decentralized Websites</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-space">
              Point your domain to an IPFS CID hash. Your website lives permanently on peer-to-peer 
              nodes, immune to DNS seizure and server takedowns.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl border border-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-lg">
            ⛓️
          </div>
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-3">
            <h3 className="font-orbitron font-bold text-white">100% Layer-1 On-Chain</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-space">
              Recorded natively in Tarcoin blocks via OP_RETURN scripts. No third-party smart contracts, 
              no gas price wars, and zero central authority.
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center glass p-8 rounded-2xl border border-tarcoin-gold/20">
          <h3 className="text-xl sm:text-2xl font-orbitron font-bold text-white mb-2">
            Ready to claim your official .tar name?
          </h3>
          <p className="text-gray-400 text-sm font-space mb-6 max-w-lg mx-auto">
            Open the official Tarcoin Web Wallet to search, register, and link your domain in 1-click.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://my-wallet.tarcoin.org"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold px-8 py-3 text-sm font-orbitron"
            >
              Launch Web Wallet
            </a>
            <Link href="/download" className="btn-ghost px-8 py-3 text-sm font-orbitron">
              Download Android APK
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
