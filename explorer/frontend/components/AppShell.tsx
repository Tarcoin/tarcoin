'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Search, Pickaxe, Users, Globe } from 'lucide-react';

// ── Inline live price ticker (no external file dependency needed) ─────────────
const FALLBACK_PRICE = 0.00001659;

function TarPriceTicker() {
  const [price, setPrice] = useState(FALLBACK_PRICE);
  const [change, setChange] = useState(0);
  const [live, setLive] = useState(false);
  const [show24h, setShow24h] = useState(false);
  const [high, setHigh] = useState(0);
  const [low, setLow] = useState(0);

  async function fetchPrice() {
    try {
      const res = await fetch('https://api.nestex.one/cg/tickers');
      if (!res.ok) throw new Error('error');
      const data = await res.json();
      const tar = data.find((t: any) => t.ticker_id === 'TAR_USDT' || t.base_currency === 'TAR');
      if (tar) {
        const p = parseFloat(tar.last_price) || FALLBACK_PRICE;
        const old = parseFloat(tar.oldltp24h) || p;
        const chg = old > 0 ? ((p - old) / old) * 100 : 0;
        setPrice(p);
        setChange(Math.round(chg * 100) / 100);
        setHigh(parseFloat(tar.high) || p);
        setLow(parseFloat(tar.low) || p);
        setLive(true);
        localStorage.setItem('tar_price_usd', p.toString());
      }
    } catch {
      const cached = localStorage.getItem('tar_price_usd');
      if (cached) { const p = parseFloat(cached); if (!isNaN(p) && p > 0) setPrice(p); }
    }
  }

  useEffect(() => {
    fetchPrice();
    const t = setInterval(fetchPrice, 45000);
    return () => clearInterval(t);
  }, []);

  const fmt = (p: number) => p < 0.0001 ? p.toFixed(8) : p < 0.01 ? p.toFixed(6) : p.toFixed(4);
  const isUp = change >= 0;

  return (
    <a
      href="https://trade.nestex.one/spot/tar"
      target="_blank"
      rel="noopener noreferrer"
      title="Live TAR/USDT on NestEx"
      className="inline-flex items-center rounded-full border border-tarcoin-gold/20 bg-[#0d1008]/80 overflow-hidden hover:border-tarcoin-gold/40 transition-all duration-300 shadow-lg no-underline"
    >
      <div className="flex flex-col items-center justify-center px-2.5 py-1.5 bg-tarcoin-gold/5 border-r border-tarcoin-gold/20">
        <span className="text-[9px] font-bold text-tarcoin-gold leading-none tracking-widest uppercase">TAR</span>
        <span className="text-[7px] text-tarcoin-gold/50 leading-none tracking-widest uppercase mt-0.5">USDT</span>
      </div>
      <div className="px-3 py-1.5 flex items-center gap-2">
        {live && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />}
        <span className="font-mono font-bold text-white text-sm">${fmt(price)}</span>
        {show24h && high > 0 && (
          <span className="text-[9px] font-mono text-tarcoin-muted hidden sm:inline">
            H: ${fmt(high)} L: ${fmt(low)}
          </span>
        )}
        <span className={`text-[10px] font-bold font-mono hidden sm:inline ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </span>
      </div>
      <button
        type="button"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setShow24h(v => !v); }}
        className={`px-2.5 py-1.5 text-[9px] font-bold tracking-widest border-l border-tarcoin-gold/20 transition-colors ${show24h ? 'text-tarcoin-gold bg-tarcoin-gold/10' : 'text-tarcoin-muted hover:text-tarcoin-gold'}`}
      >
        24H
      </button>
    </a>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: Box },
    { name: 'Latest Blocks', path: '/blocks', icon: Globe },
    { name: 'Rich List', path: '/richlist', icon: Users },
    { name: 'Pools', path: '/pool/official', icon: Pickaxe },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    const q = search.trim();
    if (/^\d+$/.test(q)) {
      router.push(`/block/${q}`);
    } else if (q.length === 64) {
      router.push(`/tx/${q}`);
    } else {
      router.push(`/address/${q}`);
    }
  };

  return (
    <div className="min-h-screen bg-tarcoin-black text-tarcoin-text font-sans flex flex-col">
      
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-tarcoin-border bg-[#0a0d12]/90 backdrop-blur-xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Brand & Node Status */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-tarcoin-black border border-tarcoin-gold/40 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(212,168,67,0.2)]">
              <img src="/favicon.png" alt="Tarcoin Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-heading font-bold text-lg leading-tight text-white flex items-center gap-2">
                Tarcoin <span className="text-[9px] px-1.5 py-0.5 rounded bg-tarcoin-gold/10 text-tarcoin-gold border border-tarcoin-gold/20 font-sans tracking-widest uppercase">SHA-256d</span>
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-green-400 uppercase">Node Online</span>
          </div>
        </div>

        {/* Center: Live TAR Price Ticker */}
        <div className="flex items-center justify-center">
          <TarPriceTicker />
        </div>

        {/* Right: Search Bar */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative w-full md:w-72">
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Block Height, Hash, TxID..." 
              className="w-full bg-[#111118] border border-tarcoin-border rounded-full py-2 pl-10 pr-4 text-xs font-mono text-white placeholder-tarcoin-muted focus:outline-none focus:border-tarcoin-gold/50 transition-colors shadow-inner"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-tarcoin-muted" />
          </form>
        </div>
      </nav>

      {/* Nav Links Row */}
      <div className="border-b border-tarcoin-border bg-[#0a0d12]/60 px-6 py-2 flex items-center gap-1 overflow-x-auto">
        {navLinks.map(link => {
          const Icon = link.icon;
          const isActive = pathname === link.path || (link.path !== '/' && pathname?.startsWith(link.path));
          return (
            <Link key={link.path} href={link.path} className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap ${isActive ? 'bg-tarcoin-gold/10 text-tarcoin-gold' : 'text-tarcoin-muted hover:text-white'}`}>
              <Icon className="w-3.5 h-3.5" />
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#080B0F]">
        <div className="flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>

    </div>
  );
}
