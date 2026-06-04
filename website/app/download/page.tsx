"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const VERSION = "v1.0.0";
const GITHUB_RELEASE     = `https://github.com/tarcoin/tarcoin/releases/tag/${VERSION}`;
const GITHUB_RELEASE_DL  = `https://github.com/tarcoin/tarcoin/releases/download/${VERSION}`;

interface Download {
  id: string;
  title: string;
  icon: string;
  desc: string;
  file: string;
  size: string;
  // "local" = served from /api/download (file exists in public/downloads)
  // "github" = redirect to GitHub release asset
  source: "local" | "github";
}

const downloads: Download[] = [
  {
    id: "windows",
    title: "Windows Wallet",
    icon: "🪟",
    desc: "Windows 10/11 64-bit",
    file: "tarcoin-wallet-win64.zip",
    size: "~28 MB",
    source: "github",
  },
  {
    id: "macos",
    title: "macOS Wallet",
    icon: "🍎",
    desc: "macOS 12+ (Intel & Apple Silicon)",
    file: "tarcoin-wallet-macos.dmg",
    size: "~32 MB",
    source: "github",
  },
  {
    id: "linux",
    title: "Linux Full Package",
    icon: "🐧",
    desc: "Ubuntu / Debian 22.04+",
    file: "tarcoin-linux-full.tar.gz",
    size: "~114 MB",
    source: "local",
  },
  {
    id: "cli",
    title: "Linux Server Node",
    icon: "⌨️",
    desc: "Ubuntu / Debian 22.04+ · tarcoind + tarcoin-cli (server only, no GUI)",
    file: "tarcoin-linux-daemon.tar.gz",
    size: "~114 MB",
    source: "local",
  },
];

function DownloadButton({ d }: { d: Download }) {
  const [state, setState] = useState<"idle" | "downloading" | "done">("idle");

  const handleClick = () => {
    setState("downloading");

    const href =
      d.source === "local"
        ? `/api/download/${encodeURIComponent(d.file)}`
        : `${GITHUB_RELEASE_DL}/${d.file}`;

    const a = document.createElement("a");
    a.href = href;
    a.download = d.file;
    if (d.source === "github") a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => setState("done"), 1500);
    setTimeout(() => setState("idle"), 4000);
  };

  const icons = {
    idle: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    downloading: (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    done: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  };

  const labels = { idle: "Download", downloading: "Starting…", done: "Done ✓" };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        id={`download-${d.id}`}
        onClick={handleClick}
        disabled={state === "downloading"}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-orbitron transition-all duration-200 active:scale-95
          ${state === "done"
            ? "bg-green-500/10 border border-green-500/40 text-green-400"
            : "bg-tarcoin-gold/10 hover:bg-tarcoin-gold/25 border border-tarcoin-gold/30 hover:border-tarcoin-gold/70 text-tarcoin-gold"
          }
          disabled:opacity-60 disabled:cursor-wait`}
      >
        {icons[state]}
        {labels[state]}
      </button>

      {/* Always-visible direct GitHub link as fallback */}
      <a
        href={`${GITHUB_RELEASE_DL}/${d.file}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors font-mono"
      >
        via GitHub ↗
      </a>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-tarcoin-black">
      <div className="scanlines" />
      <div className="cyber-bg min-h-screen pt-20">
        <section className="relative min-h-screen flex items-center justify-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-tarcoin-gold/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tarcoin-cyan/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

            {/* Version badge */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-tarcoin-gold/20 bg-tarcoin-gold/5 mb-8">
              <span className="w-2 h-2 rounded-full bg-tarcoin-gold animate-pulse" />
              <span className="text-xs font-orbitron text-tarcoin-gold tracking-[0.2em] uppercase">
                Official Downloads — {VERSION}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl font-orbitron font-black mb-6">
              <span className="text-white">Download</span>
              <br />
              <span className="text-tarcoin-gold text-glow">TARCOIN Wallet</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }}
              className="text-lg text-gray-400 max-w-3xl mx-auto mb-4 font-space">
              Download the official TARCOIN wallet for your platform. TARCOIN full node with wallet support
              with wallet, mining, and networking capabilities.
            </motion.p>

            {/* GitHub releases */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mb-10">
              <a href={GITHUB_RELEASE} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-tarcoin-gold transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                All releases on GitHub →
              </a>
            </motion.div>

            {/* Download cards grid */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.55 }}
              className="grid sm:grid-cols-2 gap-6 mb-12 text-left">
              {downloads.map((d) => (
                <div key={d.id} id={d.id}
                  className="glass rounded-xl p-6 border border-tarcoin-gold/10 hover:border-tarcoin-gold/30 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{d.icon}</span>
                      <div>
                        <h3 className="text-base font-orbitron font-semibold text-white">{d.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-tarcoin-gold shrink-0 ml-2">{VERSION}</span>
                  </div>

                  <div className="flex items-end justify-between mt-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-600 font-mono truncate max-w-[180px]">{d.file}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{d.size}</div>
                    </div>
                    <DownloadButton d={d} />
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Build from source */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7 }}
              className="glass rounded-xl p-6 border border-tarcoin-gold/10 mb-6 text-left max-w-3xl mx-auto">
              <h3 className="text-sm font-orbitron text-tarcoin-gold mb-3 tracking-wider">⚙ BUILD FROM SOURCE</h3>
              <p className="text-xs text-gray-400 mb-3 font-space">TARCOIN is fully open source. Build for any platform:</p>
              <pre className="text-xs font-mono bg-black/40 rounded-lg p-3 overflow-x-auto text-gray-300 border border-white/5">{`git clone https://github.com/tarcoin/tarcoin.git
cd tarcoin/blockchain_core/tarcoin-core
cmake -B build && cmake --build build -j$(nproc)
./build/bin/tarcoind -printtoconsole`}</pre>
            </motion.div>

            {/* Checksums */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}
              className="glass rounded-xl p-6 border border-tarcoin-gold/10 max-w-2xl mx-auto mb-10">
              <h3 className="text-sm font-orbitron text-tarcoin-gold mb-2 tracking-wider">🔐 VERIFY YOUR DOWNLOAD</h3>
              <p className="text-sm text-gray-400 font-space mb-3">
                All releases are signed with GPG and include SHA256 checksums.
              </p>
              <pre className="text-xs font-mono bg-black/40 rounded-lg p-3 overflow-x-auto text-gray-300 border border-white/5">{`sha256sum tarcoin-linux-full.tar.gz
# compare against SHA256SUMS in the GitHub release`}</pre>
              <a href={`${GITHUB_RELEASE_DL}/SHA256SUMS`} target="_blank" rel="noopener noreferrer"
                className="inline-block mt-3 text-xs text-tarcoin-gold hover:text-white transition-colors">
                Download SHA256SUMS →
              </a>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
              <Link href="/" className="btn-ghost text-base px-8 py-3.5">Back to Home</Link>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}