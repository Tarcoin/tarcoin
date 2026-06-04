"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import { BsFillMoonStarsFill, BsSun } from "react-icons/bs";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Explorer", href: "/explorer" },
  { name: "Mining", href: "/mining" },
  { name: "Wallet", href: "/wallet" },
  { name: "API", href: "/api" },
  { name: "Whitepaper", href: "/whitepaper" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-tarcoin-black/90 backdrop-blur-xl border-b border-tarcoin-gold/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <img src="/logo.png" alt="TARCOIN" className="w-14 h-14" />
            <div>
              <span className="font-orbitron font-bold text-xl text-white group-hover:text-tarcoin-gold transition-colors">
                TARCOIN
              </span>
              <span className="font-mono text-xs text-tarcoin-gold block -mt-1">$TAR</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm font-orbitron text-gray-300 hover:text-tarcoin-gold hover:bg-tarcoin-gold/5 transition-all duration-300"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/download"
              className="ml-4 btn-primary text-sm"
            >
              Download Wallet
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-tarcoin-gold hover:bg-tarcoin-gold/10 transition-all"
          >
            {isOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-tarcoin-black/95 backdrop-blur-xl border-t border-tarcoin-gold/10"
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-orbitron text-gray-300 hover:text-tarcoin-gold hover:bg-tarcoin-gold/5 transition-all"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/download"
                onClick={() => setIsOpen(false)}
                className="block text-center btn-primary mt-4"
              >
                Download Wallet
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}