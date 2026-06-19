"use client";

import { useState, useEffect, useRef } from "react";

const BTC_ADDRESS = "bc1q9lw4eeed48t3yr9gusxfvmtlsmvpzh84krdlqn";
const BTC_AMOUNT = "0.111";
const BTC_URI = `bitcoin:${BTC_ADDRESS}?amount=${BTC_AMOUNT}`;
const TAR_REWARD = "1,000,000";

// Fixed end date — June 25 2026 00:00:00 UTC
const END_DATE = new Date("2026-06-25T00:00:00Z").getTime();

// QR code via free API — encodes the full Bitcoin URI
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(BTC_URI)}&bgcolor=0A0A0A&color=D4A843&margin=12`;

function getTimeLeft() {
  const now = Date.now();
  const diff = Math.max(0, END_DATE - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

export default function EarlyAccessPage() {
  const [copied, setCopied] = useState(false);
  const [spotsLeft] = useState(37);
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [glitchActive, setGlitchActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form state
  const [form, setForm] = useState({ txid: "", tarAddress: "", btcSender: "", name: "", email: "" });
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");

  // Persistent countdown tied to fixed end date
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Glitch effect
  useEffect(() => {
    const glitch = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 4000);
    return () => clearInterval(glitch);
  }, []);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vy: number; opacity: number; size: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vy: -0.2 - Math.random() * 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        size: Math.random() * 2 + 0.5,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.vy;
        if (p.y < 0) p.y = canvas.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 168, 67, ${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };




  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="cyber-bg min-h-screen relative overflow-hidden">
      <div className="scanlines" />
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Ambient glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#D4A843]/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-1/4 w-[400px] h-[300px] bg-[#D4A843]/4 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-16 md:py-24">

        {/* Badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#D4A843]/40 bg-[#D4A843]/10 text-[#D4A843] text-xs font-orbitron font-bold tracking-[3px] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#D4A843] animate-pulse" />
            Limited Early Access
          </span>
        </div>

        {/* Headline */}
        <div className="text-center mb-6">
          <h1
            className={`font-orbitron font-black text-4xl md:text-6xl leading-tight mb-4 transition-all ${
              glitchActive ? "skew-x-1 text-[#00D4FF]" : "text-white"
            }`}
            style={{
              textShadow: glitchActive
                ? "2px 0 #D4A843, -2px 0 #00FF88"
                : "0 0 40px rgba(212,168,67,0.3)",
            }}
          >
            MINE UP TO<br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(90deg, #D4A843, #F0D080, #D4A843)" }}
            >
              1,000,000 TAR
            </span>
          </h1>
          <p className="text-gray-400 font-space text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Become an <span className="text-[#D4A843] font-semibold">Early Supporter</span> and secure your reserved mining allocation before the public launch.
          </p>
        </div>

        {/* Countdown — tied to fixed date, persists across reloads */}
        <div className="flex justify-center gap-3 mb-2">
          {[
            ["Days", pad(timeLeft.days)],
            ["Hours", pad(timeLeft.hours)],
            ["Minutes", pad(timeLeft.minutes)],
            ["Seconds", pad(timeLeft.seconds)],
          ].map(([label, value]) => (
            <div key={label} className="glass rounded-xl px-4 py-4 text-center min-w-[70px]" style={{ border: "1px solid rgba(212,168,67,0.2)" }}>
              <div className="font-orbitron font-black text-2xl md:text-3xl text-[#D4A843]" style={{ textShadow: "0 0 20px rgba(212,168,67,0.5)" }}>
                {value}
              </div>
              <div className="text-gray-500 text-[10px] font-space uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600 font-space text-xs mb-8">Offer closes June 25, 2026</p>

        {/* Spots left */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-red-500/10 border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-400 font-orbitron font-bold text-sm">
              Only {spotsLeft} spots remaining
            </span>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: "⛏️", title: "1M TAR Reserved", desc: "Your mining allocation is locked in before public launch" },
            { icon: "🚀", title: "Priority Access", desc: "Mainnet is live — start mining immediately with priority allocation" },
            { icon: "🛡️", title: "Founding Supporter", desc: "Recognized as a founding member of the Tarcoin network" },
          ].map((item) => (
            <div
              key={item.title}
              className="glass rounded-xl p-5 text-center transition-all duration-300 hover:-translate-y-1"
              style={{ border: "1px solid rgba(212,168,67,0.15)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(212,168,67,0.15)";
                (e.currentTarget as HTMLElement).style.border = "1px solid rgba(212,168,67,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 rgba(212,168,67,0)";
                (e.currentTarget as HTMLElement).style.border = "1px solid rgba(212,168,67,0.15)";
              }}
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="font-orbitron font-bold text-[#D4A843] text-sm mb-2">{item.title}</div>
              <div className="text-gray-400 font-space text-xs leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* ── Why We Need Support ── */}
        <div className="mb-10">
          <div className="text-center mb-6">
            <h2 className="font-orbitron font-bold text-white text-lg mb-2">
              Why We Need Your Support
            </h2>
            <p className="text-gray-500 font-space text-sm max-w-lg mx-auto">
              Tarcoin is built by a small, independent team with no venture capital or corporate backing. Here&apos;s where your support goes:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: "🖥️",
                title: "Server Infrastructure",
                desc: "Running the blockchain node, mining pool, explorer, and API 24/7 on dedicated servers costs real money every month. Your support keeps the network live.",
              },
              {
                icon: "🔒",
                title: "Security Audits",
                desc: "Before expanding the network, we need independent security audits of the core codebase to ensure your funds and the network are fully protected.",
              },
              {
                icon: "⚡",
                title: "Mining Pool Expansion",
                desc: "Growing the pool to handle thousands of miners requires upgraded bandwidth, load balancing, and redundant failover servers across multiple regions.",
              },
              {
                icon: "🌍",
                title: "Exchange Listings",
                desc: "Getting TAR listed on exchanges requires listing fees and liquidity. Early supporter funds directly accelerate TAR reaching the open market.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-5 rounded-xl transition-all duration-300"
                style={{
                  background: "rgba(212,168,67,0.03)",
                  border: "1px solid rgba(212,168,67,0.1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(212,168,67,0.3)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(212,168,67,0.1)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.03)";
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                  style={{
                    background: "rgba(212,168,67,0.1)",
                    border: "1px solid rgba(212,168,67,0.2)",
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div className="font-orbitron font-bold text-[#D4A843] text-xs mb-1">{item.title}</div>
                  <div className="text-gray-400 font-space text-xs leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust line */}
          <div
            className="mt-5 p-4 rounded-xl text-center"
            style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.1)" }}
          >
            <p className="text-[#00FF88]/70 font-space text-xs leading-relaxed">
              🛡️ &nbsp;Tarcoin is open-source, MIT licensed, and built on Bitcoin Core — the most battle-tested blockchain codebase in existence.
              Every line of code is publicly verifiable. No hidden admin keys. No inflation. No middlemen.
            </p>
          </div>
        </div>

        {/* ── Payment Box ── */}
        <div
          className="rounded-2xl p-8 mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(26,26,46,0.9), rgba(18,18,18,0.95))",
            border: "1px solid rgba(212,168,67,0.3)",
            boxShadow: "0 0 60px rgba(212,168,67,0.08), inset 0 1px 0 rgba(212,168,67,0.1)",
          }}
        >
          <div className="text-center mb-6">
            <h2 className="font-orbitron font-bold text-xl text-white mb-2">Become a Supporter</h2>
            <p className="text-gray-400 font-space text-sm">
              Send exactly{" "}
              <span className="text-[#D4A843] font-bold font-mono">{BTC_AMOUNT} BTC</span>{" "}
              to the address below to secure your{" "}
              <span className="text-[#D4A843] font-bold">{TAR_REWARD} TAR</span> early mining allocation.
            </p>
          </div>

          {/* Amount + QR side by side */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-6">

            {/* Left — amount + address */}
            <div className="flex-1 w-full">
              {/* Amount Badge */}
              <div className="flex justify-center md:justify-start mb-4">
                <div
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(212,168,67,0.05))",
                    border: "1px solid rgba(212,168,67,0.4)",
                  }}
                >
                  <span className="text-2xl">₿</span>
                  <div>
                    <div className="font-orbitron font-black text-2xl text-[#D4A843]">{BTC_AMOUNT} BTC</div>
                    <div className="text-gray-500 text-xs font-space">One-time support</div>
                  </div>
                </div>
              </div>

              {/* BTC Address */}
              <div className="mb-4">
                <div className="text-gray-500 text-xs font-space uppercase tracking-widest mb-2">Bitcoin Address</div>
                <div
                  className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300"
                  style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(212,168,67,0.2)" }}
                  onClick={copyAddress}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.border = "1px solid rgba(212,168,67,0.5)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.border = "1px solid rgba(212,168,67,0.2)"; }}
                >
                  <span className="font-mono text-[#D4A843] text-xs flex-1 break-all leading-relaxed">
                    {BTC_ADDRESS}
                  </span>
                  <div
                    className="flex-shrink-0 px-3 py-2 rounded-lg transition-all duration-200"
                    style={{
                      background: copied ? "rgba(0,255,136,0.15)" : "rgba(212,168,67,0.1)",
                      border: copied ? "1px solid rgba(0,255,136,0.4)" : "1px solid rgba(212,168,67,0.3)",
                    }}
                  >
                    {copied
                      ? <span className="text-[#00FF88] text-xs font-orbitron font-bold">✓ COPIED</span>
                      : <span className="text-[#D4A843] text-xs font-orbitron font-bold">COPY</span>
                    }
                  </div>
                </div>
              </div>

              {/* Open Wallet Button */}
              <a
                href={BTC_URI}
                className="inline-flex items-center gap-3 w-full justify-center px-6 py-4 rounded-xl font-orbitron font-bold text-sm transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #D4A843, #F0D080)",
                  color: "#0A0A0A",
                  boxShadow: "0 0 20px rgba(212,168,67,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(212,168,67,0.5)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(212,168,67,0.3)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <span className="text-lg">₿</span>
                Open Bitcoin Wallet
              </a>
            </div>

            {/* Right — QR Code */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <div
                className="p-3 rounded-xl"
                style={{ background: "#0A0A0A", border: "1px solid rgba(212,168,67,0.3)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={QR_URL}
                  alt="Bitcoin payment QR code"
                  width={160}
                  height={160}
                  className="rounded-lg"
                />
              </div>
              <span className="text-gray-600 text-[10px] font-space uppercase tracking-widest">Scan to Pay</span>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.1)" }}>
            <div className="text-gray-500 text-xs font-space text-center leading-relaxed">
              Send exactly <span className="text-[#D4A843]">{BTC_AMOUNT} BTC</span> — no more, no less. After sending, follow the steps below to confirm your allocation.
            </div>
          </div>
        </div>

        {/* ── After Payment — Submission Form ── */}
        <div
          className="rounded-2xl p-8 mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,255,0.04), rgba(18,18,18,0.95))",
            border: "1px solid rgba(0,212,255,0.2)",
            boxShadow: "0 0 40px rgba(0,212,255,0.04)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
              style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)" }}
            >
              📋
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-white text-base">After Sending — Confirm Your Allocation</h2>
              <p className="text-gray-500 font-space text-xs mt-1">Submit your payment details below to lock in your 1,000,000 TAR spot</p>
            </div>
          </div>

          {formStatus === "success" ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">✅</div>
              <div className="font-orbitron font-bold text-[#00FF88] text-lg mb-2">Submission Received!</div>
              <p className="text-gray-400 font-space text-sm">Your allocation is being confirmed. Welcome to the Tarcoin founding supporters.</p>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!form.txid || !form.tarAddress) {
                  setFormError("TXID and TAR address are required.");
                  return;
                }
                setFormStatus("loading");
                setFormError("");
                try {
                  const res = await fetch("/api/early-access", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Submission failed");
                  setFormStatus("success");
                } catch (err: any) {
                  setFormError(err.message || "Something went wrong. Please try again.");
                  setFormStatus("idle");
                }
              }}
              className="space-y-4"
            >
              {/* TXID */}
              <div>
                <label className="text-gray-500 text-xs font-space uppercase tracking-widest mb-2 block">
                  Bitcoin Transaction ID (TXID) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="a1b2c3d4e5f6..."
                  value={form.txid}
                  onChange={(e) => setForm({ ...form, txid: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl font-mono text-sm text-[#D4A843] placeholder-gray-700 outline-none transition-all duration-300"
                  style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,212,255,0.2)" }}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(0,212,255,0.5)"; }}
                  onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(0,212,255,0.2)"; }}
                />
                <p className="text-gray-600 text-[11px] font-space mt-1">The transaction ID from your Bitcoin wallet after sending.</p>
              </div>

              {/* TAR Address */}
              <div>
                <label className="text-gray-500 text-xs font-space uppercase tracking-widest mb-2 block">
                  Your TAR Wallet Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="tar1q..."
                  value={form.tarAddress}
                  onChange={(e) => setForm({ ...form, tarAddress: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl font-mono text-sm text-[#00D4FF] placeholder-gray-700 outline-none transition-all duration-300"
                  style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,212,255,0.2)" }}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(0,212,255,0.5)"; }}
                  onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(0,212,255,0.2)"; }}
                />
                <p className="text-gray-600 text-[11px] font-space mt-1">Your Tarcoin address where your 1,000,000 TAR allocation will be sent.</p>
              </div>

              {/* BTC Sender (optional) */}
              <div>
                <label className="text-gray-500 text-xs font-space uppercase tracking-widest mb-2 block">
                  Your Bitcoin Sender Address <span className="text-gray-700">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="bc1q..."
                  value={form.btcSender}
                  onChange={(e) => setForm({ ...form, btcSender: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl font-mono text-sm text-white placeholder-gray-700 outline-none transition-all duration-300"
                  style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(212,168,67,0.1)" }}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(212,168,67,0.3)"; }}
                  onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(212,168,67,0.1)"; }}
                />
                <p className="text-gray-600 text-[11px] font-space mt-1">Helps us verify the transaction faster.</p>
              </div>

              {/* Name */}
              <div>
                <label className="text-gray-500 text-xs font-space uppercase tracking-widest mb-2 block">
                  Your Name / Handle <span className="text-gray-700">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Satoshi, CryptoMiner99, ..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl font-space text-sm text-white placeholder-gray-700 outline-none transition-all duration-300"
                  style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(212,168,67,0.1)" }}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(212,168,67,0.3)"; }}
                  onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(212,168,67,0.1)"; }}
                />
                <p className="text-gray-600 text-[11px] font-space mt-1">How you&apos;d like to appear in the founding supporter records.</p>
              </div>

              {/* Email */}
              <div>
                <label className="text-gray-500 text-xs font-space uppercase tracking-widest mb-2 block">
                  Your Email Address <span className="text-gray-700">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl font-space text-sm text-white placeholder-gray-700 outline-none transition-all duration-300"
                  style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(212,168,67,0.1)" }}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(212,168,67,0.3)"; }}
                  onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(212,168,67,0.1)"; }}
                />
                <p className="text-gray-600 text-[11px] font-space mt-1">So we can contact you when your allocation is confirmed. Kept private.</p>
              </div>

              {/* Error */}
              {formError && (
                <div className="p-3 rounded-xl text-red-400 font-space text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  {formError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={formStatus === "loading"}
                className="w-full py-4 rounded-xl font-orbitron font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: formStatus === "loading"
                    ? "rgba(0,212,255,0.1)"
                    : "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.05))",
                  border: "1px solid rgba(0,212,255,0.4)",
                  color: "#00D4FF",
                  boxShadow: formStatus === "loading" ? "none" : "0 0 20px rgba(0,212,255,0.1)",
                }}
              >
                {formStatus === "loading" ? "Submitting..." : "✓ Submit My Allocation"}
              </button>

              <p className="text-gray-700 text-[11px] font-space text-center">
                Your information is kept private and used only to confirm your TAR allocation.
              </p>
            </form>
          )}
        </div>

        {/* How it works */}
        <div className="mb-10">
          <h3 className="font-orbitron font-bold text-center text-white text-sm uppercase tracking-widest mb-6">
            How It Works
          </h3>
          <div className="space-y-3">
            {[
              { step: "01", text: "Send exactly 0.111 BTC to the Bitcoin address above" },
              { step: "02", text: "Fill in the confirmation form below with your TXID and TAR wallet address" },
              { step: "03", text: "Your 1,000,000 TAR mining allocation is confirmed and locked" },
              { step: "04", text: "Tarcoin mainnet is already live — start mining immediately and earn TAR block rewards" },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-center gap-4 p-4 rounded-xl transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,168,67,0.08)" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-orbitron font-black text-sm"
                  style={{
                    background: "linear-gradient(135deg, rgba(212,168,67,0.2), rgba(212,168,67,0.05))",
                    border: "1px solid rgba(212,168,67,0.3)",
                    color: "#D4A843",
                  }}
                >
                  {item.step}
                </div>
                <p className="text-gray-300 font-space text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Network stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Block Reward", value: "50,000 TAR" },
            { label: "Algorithm", value: "SHA-256" },
            { label: "Max Supply", value: "50B TAR" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-4 text-center" style={{ border: "1px solid rgba(212,168,67,0.1)" }}>
              <div className="font-orbitron font-bold text-[#D4A843] text-sm mb-1">{s.value}</div>
              <div className="text-gray-500 text-[10px] font-space uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="text-center">
          <p className="text-gray-600 font-space text-xs leading-relaxed max-w-md mx-auto">
            TARCOIN is a decentralized, immutable SHA-256 proof-of-work blockchain forked from Bitcoin Core.
            All transactions are final and irreversible — exactly like Bitcoin.
          </p>
          <div className="mt-4 flex justify-center gap-2 text-gray-700 text-xs font-space">
            <span>tarcoin.org</span>
            <span>·</span>
            <span>SHA-256 PoW</span>
            <span>·</span>
            <span>MIT Licensed</span>
          </div>
        </div>

      </div>
    </div>
  );
}
