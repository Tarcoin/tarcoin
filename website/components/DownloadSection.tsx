"use client";

import { motion } from "framer-motion";
import { BsDownload, BsWindows, BsApple, BsUbuntu } from "react-icons/bs";
import { FaLinux } from "react-icons/fa";

const downloads = [
  {
    icon: BsWindows,
    title: "Windows",
    description: "Windows 10/11 64-bit",
    files: [
      { name: "tarcoin-qt.exe", size: "45 MB" },
      { name: "tarcoind.exe", size: "38 MB" },
      { name: "tarcoin-cli.exe", size: "12 MB" },
    ],
  },
  {
    icon: BsApple,
    title: "macOS",
    description: "macOS 12+ Intel & Apple Silicon",
    files: [
      { name: "Tarcoin-Qt.dmg", size: "52 MB" },
      { name: "tarcoind", size: "40 MB" },
      { name: "tarcoin-cli", size: "14 MB" },
    ],
  },
  {
    icon: FaLinux,
    title: "Linux",
    description: "Ubuntu 22.04+ / Debian 12+",
    files: [
      { name: "tarcoin-qt.AppImage", size: "48 MB" },
      { name: "tarcoind", size: "42 MB" },
      { name: "tarcoin-cli", size: "13 MB" },
    ],
  },
];

export default function DownloadSection() {
  return (
    <section id="download" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-orbitron text-tarcoin-gold tracking-widest uppercase mb-4 block">
            Downloads
          </span>
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6">
            Download{" "}
            <span className="text-tarcoin-gold text-glow">TARCOIN</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Native wallets for all major platforms. Deterministic builds for maximum security.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {downloads.map((platform, index) => (
            <motion.div
              key={platform.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="card"
            >
              <div className="flex items-center gap-4 mb-6">
                <platform.icon className="text-3xl text-tarcoin-gold" />
                <div>
                  <h3 className="text-lg font-orbitron font-bold">{platform.title}</h3>
                  <p className="text-xs text-gray-500">{platform.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                {platform.files.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-tarcoin-gold/5 border border-tarcoin-gold/10 hover:bg-tarcoin-gold/10 transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="text-sm font-mono text-gray-300 group-hover:text-tarcoin-gold transition-colors">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-600">{file.size}</div>
                    </div>
                    <BsDownload className="text-tarcoin-gold/50 group-hover:text-tarcoin-gold transition-colors" />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Verification Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-xl p-6 max-w-3xl mx-auto text-center"
        >
          <p className="text-sm text-gray-400">
            All binaries are deterministically built and cryptographically signed. 
            Verify checksums on our{" "}
            <a href="/verify" className="text-tarcoin-gold hover:underline">verification page</a>.
          </p>
        </motion.div>
      </div>
    </section>
  );
}