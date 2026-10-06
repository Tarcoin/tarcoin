'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_EXPLORER_API || 'http://localhost:4000';
const GENESIS_HASH = '0000e37ee7aa8a88d1254ee3fe7c497c8fdaff36b29747eb64d8da68fbd9939e';
const POLL_INTERVAL = 15000;
const BLOCK_REWARD = 50000;

// ─── helpers ────────────────────────────────────────────────────────────────

function truncateHash(hash: string, head = 8, tail = 8): string {
  if (!hash || hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function formatHashrate(hr: number): string {
  if (!hr) return '0 H/s';
  if (hr < 1e3) return `${hr.toFixed(2)} H/s`;
  if (hr < 1e6) return `${(hr / 1e3).toFixed(2)} KH/s`;
  if (hr < 1e9) return `${(hr / 1e6).toFixed(2)} MH/s`;
  if (hr < 1e12) return `${(hr / 1e9).toFixed(2)} GH/s`;
  return `${(hr / 1e12).toFixed(2)} TH/s`;
}

function formatNumber(n: number): string {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString();
}

function formatSupply(n: number): string {
  if (!n) return '0 TAR';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(3)}B TAR`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M TAR`;
  return `${formatNumber(n)} TAR`;
}

// ─── types ───────────────────────────────────────────────────────────────────

interface Block {
  hash: string;
  height: number;
  time: number;
  tx?: string[];
  nTx?: number;
  size: number;
  weight?: number;
  difficulty?: number;
}

interface Tx {
  txid: string;
  vin?: Array<{ addr?: string; address?: string; value?: number }>;
  vout?: Array<{ scriptPubKey?: { address?: string }; value?: number }>;
  value?: number;
  time?: number;
  blocktime?: number;
  size?: number;
}

interface NetworkStats {
  blocks?: number;
  blockHeight?: number;
  hashrate?: number;
  difficulty?: number;
  mempoolSize?: number;
  mempoolCount?: number;
  totalSupply?: number;
  circulatingSupply?: number;
  circulating?: number;
  connections?: number;
}

// ─── 3D Block Card (mempool-style cube) ──────────────────────────────────────

const BW = 148; // front face width
const BH = 148; // front face height
const DX = 20;  // right face depth (x)
const DY = 13;  // top face depth (y)

function getBlockColors(fillPct: number, isNew: boolean, index: number) {
  if (isNew) return {
    front: 'linear-gradient(145deg, #d4a843 0%, #f5c842 60%, #fff0a0 100%)',
    top: '#a07820', side: '#7a5c10',
    accent: '#1a1000', border: 'rgba(255,255,255,0.5)',
  };
  // Vibrant full-fill gradients, gold is one of the colors in the mix
  const palette = [
    { front: 'linear-gradient(145deg, #7c3aed 0%, #d4a843 100%)',   top: '#5b21b6', side: '#3b0f8a', accent: '#fff', border: 'rgba(255,255,255,0.3)' }, // purple→gold
    { front: 'linear-gradient(145deg, #0891b2 0%, #00d97e 100%)',   top: '#066b87', side: '#044d60', accent: '#fff', border: 'rgba(255,255,255,0.3)' }, // teal→cyan
    { front: 'linear-gradient(145deg, #d4a843 0%, #ff8c00 100%)',   top: '#a07820', side: '#7a5810', accent: '#fff8e0', border: 'rgba(255,255,255,0.3)' }, // gold→orange
    { front: 'linear-gradient(145deg, #9333ea 0%, #ec4899 100%)',   top: '#6b21a8', side: '#4c1680', accent: '#fff', border: 'rgba(255,255,255,0.3)' }, // violet→pink
    { front: 'linear-gradient(145deg, #16a34a 0%, #86efac 100%)',   top: '#126e38', side: '#0d5228', accent: '#fff', border: 'rgba(255,255,255,0.3)' }, // green→lime
    { front: 'linear-gradient(145deg, #ea580c 0%, #d4a843 100%)',   top: '#b84508', side: '#8a3306', accent: '#fff8e0', border: 'rgba(255,255,255,0.3)' }, // orange→gold
  ];
  return palette[index % palette.length];
}


function BlockCard({ block, isNew, index = 0 }: { block: Block; isNew: boolean; index?: number }) {
  const txCount = block.nTx ?? block.tx?.length ?? 1;
  const fillPct = Math.min(100, (txCount / 20) * 100);
  const c = getBlockColors(fillPct, isNew, index);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -70, scale: 0.82 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 70, scale: 0.82 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26, delay: index * 0.08 }}
      style={{ flexShrink: 0, cursor: 'pointer' }}
    >
      <Link href={`/block/${block.hash}`} style={{ textDecoration: 'none' }}>
        {/* Outer container sized to hold all 3 faces */}
        <div
          className="block-3d-wrap"
          style={{
            width: BW + DX,
            height: BH + DY,
            position: 'relative',
          }}
        >

          {/* ── TOP FACE (parallelogram) ─────────────────────────── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0,
            width: BW + DX,
            height: DY + 2,
            background: c.top,
            border: `1px solid ${c.border}55`,
            clipPath: `polygon(${DX}px 0px, ${BW + DX}px 0px, ${BW}px ${DY}px, 0px ${DY}px)`,
          }} />

          {/* ── RIGHT FACE (parallelogram) ───────────────────────── */}
          <div style={{
            position: 'absolute',
            top: 0, left: BW,
            width: DX + 1,
            height: BH + DY,
            background: c.side,
            border: `1px solid ${c.border}33`,
            clipPath: `polygon(0px ${DY}px, ${DX}px 0px, ${DX}px ${BH}px, 0px ${BH + DY}px)`,
          }} />

          {/* ── FRONT FACE (main content) ────────────────────────── */}
          <div style={{
            position: 'absolute',
            top: DY, left: 0,
            width: BW, height: BH,
            background: c.front,
            border: `1.5px solid ${c.border}`,
            borderRadius: '3px 0 0 3px',
            padding: '13px',
            overflow: 'hidden',
            boxShadow: isNew ? `0 0 32px rgba(212,168,67,0.7)` : '0 4px 16px rgba(0,0,0,0.5)',
            transition: 'box-shadow 0.3s',
          }}>

            {/* Fill level overlay (white glow from bottom) */}
            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: `${fillPct}%`,
              background: 'rgba(255,255,255,0.08)',
              borderTop: '1px solid rgba(255,255,255,0.2)',
              transition: 'height 0.6s ease',
            }} />

            {/* NEW badge */}
            {isNew && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  position: 'absolute', top: 7, right: 7,
                  background: 'rgba(0,0,0,0.4)', color: '#fff',
                  fontSize: '7px', fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 900, padding: '2px 5px',
                  borderRadius: '3px', letterSpacing: '0.05em',
                }}
              >NEW</motion.div>
            )}

            {/* Block height */}
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '0.7rem', color: 'rgba(255,255,255,0.95)',
              fontWeight: 700, marginBottom: '5px',
              letterSpacing: '0.04em',
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}>
              #{block.height.toLocaleString()}
            </div>

            {/* Hash preview */}
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.56rem', color: 'rgba(255,255,255,0.55)',
              wordBreak: 'break-all', lineHeight: 1.3,
              marginBottom: '10px',
            }}>
              {block.hash.slice(0, 16)}…
            </div>

            {/* Tx count */}
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)',
              marginBottom: '2px',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}>
              {txCount} tx{txCount !== 1 ? 's' : ''}
            </div>

            {/* Reward */}
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.66rem', color: 'rgba(255,255,255,0.85)',
              marginBottom: '4px',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}>
              {BLOCK_REWARD.toLocaleString()} TAR
            </div>

            {/* Pool/miner */}
            {(block as any).miner && (
              <div style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '0.58rem', color: 'rgba(255,255,255,0.65)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                ⛏ {(block as any).miner}
              </div>
            )}

            {/* Time ago */}
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '0.58rem', color: 'rgba(255,255,255,0.6)',
              position: 'absolute', bottom: '10px', left: '13px',
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}>
              {block.time ? timeAgo(block.time) : '—'}
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}

// ─── Fee Estimator Card ───────────────────────────────────────────────────────


function FeeCard({ label, sat, usd, color }: { label: string; sat: string; usd: string; color: string }) {
  return (
    <div style={{
      flex: 1,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      padding: '12px 6px',
      textAlign: 'center',
      minWidth: '120px', /* force wrapping if container is too small */
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'inline-block',
        background: color,
        borderRadius: '4px',
        padding: '2px 6px',
        fontSize: '0.6rem',
        fontFamily: 'Orbitron, sans-serif',
        fontWeight: 700,
        color: '#000',
        marginBottom: '6px',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.95rem',
        fontWeight: 700,
        color: '#fff',
        marginBottom: '2px',
        wordBreak: 'break-all',
      }}>
        {sat}
      </div>
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '0.72rem',
        color: 'rgba(255,255,255,0.4)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {usd}
      </div>
    </div>
  );
}

// ─── Stat Ticker Item ─────────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', padding: '0 20px' }}>
      <span style={{ color: 'rgba(212,168,67,0.6)', fontSize: '0.7rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span style={{ color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

// ─── navbar ──────────────────────────────────────────────────────────────────

const navLinks = [
  { name: 'Blocks', href: '/blocks' },
  { name: 'Mempool', href: '/mempool' },
  { name: 'Rich List', href: 'https://tarcoin.org/richlist', external: true },
  { name: 'Mining Pool', href: 'https://pool.tarcoin.org/', external: true },
  { name: 'tarcoin.org', href: 'https://tarcoin.org/', external: true },
];

function Navbar({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(query.trim());
    setMobileOpen(false);
  }

  return (
    <nav style={{
      background: scrolled ? 'rgba(5,5,5,0.97)' : 'rgba(5,5,5,0.90)',
      borderBottom: '1px solid rgba(212,168,67,0.10)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      transition: 'background 0.3s',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1.5rem',
        height: isMobile ? '64px' : '80px',
        margin: '0 auto',
        padding: isMobile ? '0 1rem' : '0 2rem',
        width: '100%',
        maxWidth: '1400px',
      }}>

        {/* Logo */}
        <Link href="https://tarcoin.org" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <img
            src="https://tarcoin.org/logo.png"
            alt="TARCOIN"
            style={{ width: isMobile ? '40px' : '56px', height: isMobile ? '40px' : '56px', objectFit: 'contain' }}
          />
          <div>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: isMobile ? '0.9rem' : '1.25rem',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.05em',
              lineHeight: 1.1,
            }}>
              TARCOIN
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              color: '#d4a843',
              marginTop: '-1px',
            }}>
              $TAR
            </div>
          </div>
        </Link>

        {/* Search bar — desktop only */}
        {!isMobile && (
          <form onSubmit={handleSubmit} style={{ flex: 1, maxWidth: '520px', position: 'relative', display: 'flex' }}>
            <input
              className="search-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search block / tx / address…"
              style={{
                width: '100%',
                padding: '0.55rem 3.5rem 0.55rem 1rem',
                fontSize: '0.82rem',
                border: `1px solid ${focused ? 'rgba(212,168,67,0.5)' : 'rgba(255,255,255,0.08)'}`,
                transition: 'border-color 0.2s',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)',
                color: '#fff',
                outline: 'none',
              }}
            />
            <button type="submit" style={{
              position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
              padding: '0.28rem 0.75rem', background: '#d4a843', color: '#000',
              border: 'none', borderRadius: '6px', fontFamily: 'Orbitron, sans-serif',
              fontWeight: 700, fontSize: '0.62rem', cursor: 'pointer', letterSpacing: '0.05em',
            }}>GO</button>
          </form>
        )}

        <div style={{ flex: 1 }} />

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {navLinks.map(link => (
              <Link
                key={link.name}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                style={{
                  padding: '0.4rem 0.85rem', borderRadius: '8px',
                  fontFamily: 'Orbitron, sans-serif', fontSize: '0.72rem',
                  color: '#d1d5db', textDecoration: 'none',
                  letterSpacing: '0.04em', transition: 'color 0.2s, background 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLElement).style.color = '#d4a843';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.05)';
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLElement).style.color = '#d1d5db';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}

        {/* Mobile hamburger button */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'none', border: '1px solid rgba(212,168,67,0.3)',
              color: '#d4a843', cursor: 'pointer',
              padding: '0.4rem 0.7rem', fontSize: '1.2rem',
              borderRadius: '8px', lineHeight: 1,
            }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        )}
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'rgba(5,5,5,0.98)',
              borderTop: '1px solid rgba(212,168,67,0.1)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1rem' }}>
              {/* Mobile search */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search block / tx / address…"
                  style={{
                    flex: 1, padding: '0.65rem 1rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px', color: '#fff',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '0.85rem', outline: 'none',
                  }}
                />
                <button type="submit" style={{
                  padding: '0.65rem 1rem', background: '#d4a843', color: '#000',
                  border: 'none', borderRadius: '8px', fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                }}>GO</button>
              </form>
              {/* Mobile nav links */}
              {navLinks.map(link => (
                <Link
                  key={link.name}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '0.85rem 1rem', borderRadius: '8px',
                    fontFamily: 'Orbitron, sans-serif', fontSize: '0.82rem',
                    color: '#d4a843', textDecoration: 'none',
                    letterSpacing: '0.04em', marginBottom: '2px',
                    borderBottom: '1px solid rgba(212,168,67,0.06)',
                  }}
                >
                  {link.name} {link.external && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.5 }}>↗</span>}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embedded Mobile CSS */}
      <style>{`
        @media (max-width: 768px) {
          .main-content { padding: 1rem 0.75rem !important; }
          .updated-label { display: none !important; }
          .block-conveyor { gap: 4px !important; }
          .block-3d-wrap { transform: scale(0.76); transform-origin: top left; margin-right: -36px; }
          .block-pending { width: 108px !important; height: 108px !important; }
          .two-col-grid { grid-template-columns: 1fr !important; }
          .fee-cards-row { flex-direction: column !important; gap: 8px !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
          .nav-links-desktop { display: none !important; }
          .nav-search-desktop { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .ticker-label { font-size: 0.55rem !important; letter-spacing: 0.06em !important; }
          .ticker-value { font-size: 0.68rem !important; }
        }
        @media (max-width: 480px) {
          .block-3d-wrap { transform: scale(0.63); margin-right: -56px; }
          .block-conveyor { gap: 2px !important; }
          .main-content { padding: 0.75rem 0.5rem !important; }
        }
      `}</style>
    </nav>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [stats, setStats] = useState<NetworkStats>({});
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [newBlockHeight, setNewBlockHeight] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTopHeight = useRef<number | null>(null);

  const [minFeeRate, setMinFeeRate] = useState<number>(0);

  // ─ fetch blocks ─
  const fetchBlocks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blocks?limit=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Block[] = Array.isArray(data) ? data : data.blocks ?? [];
      list.sort((a, b) => b.height - a.height);

      // detect new block
      if (prevTopHeight.current !== null && list[0]?.height > prevTopHeight.current) {
        setNewBlockHeight(list[0].height);
        setTimeout(() => setNewBlockHeight(null), 5000);
      }
      prevTopHeight.current = list[0]?.height ?? null;

      setBlocks(list);
      setLoadingBlocks(false);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
      setLoadingBlocks(false);
    }
  }, []);

  // ─ fetch stats ─
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/network/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NetworkStats = await res.json();
      setStats(data);
      setLoadingStats(false);
    } catch {
      setLoadingStats(false);
    }
  }, []);

  // ─ fetch mempool stats (for real fee rate) ─
  const fetchMempoolStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/mempool/stats`);
      if (!res.ok) return;
      const data = await res.json();
      const rawMinFee = data.mempoolMinFee ?? data.minFeeRate ?? data.min_fee_rate ?? data.minfeerate ?? 0;
      if (rawMinFee > 0) setMinFeeRate(rawMinFee * 100000);
    } catch { /* ignore */ }
  }, []);

  // ─ fetch mempool txs ─
  const fetchTxs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/mempool?limit=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Tx[] = Array.isArray(data) ? data : data.transactions ?? data.txs ?? [];
      setTxs(list);
    } catch { /* ignore */ }
  }, []);

  // ─ poll ─
  useEffect(() => {
    fetchBlocks();
    fetchStats();
    fetchTxs();
    fetchMempoolStats();
    intervalRef.current = setInterval(() => {
      fetchBlocks();
      fetchStats();
      fetchTxs();
      fetchMempoolStats();
    }, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchBlocks, fetchStats, fetchTxs, fetchMempoolStats]);

  // ─ search ─
  function handleSearch(query: string) {
    if (!query) return;
    if (/^[0-9a-fA-F]{64}$/.test(query)) { router.push(`/block/${query}`); return; }
    if (/^\d+$/.test(query)) { router.push(`/block/${query}`); return; }
    if (/^(1|3|bc1|tar1|T)[a-zA-Z0-9]{10,}$/.test(query)) { router.push(`/address/${query}`); return; }
    router.push(`/block/${query}`);
  }

  // ─ derived ─
  const blockHeight = stats.blocks ?? stats.blockHeight ?? (blocks[0]?.height ?? 0);
  const hashrate = stats.hashrate ?? 0;
  const difficulty = stats.difficulty ?? (blocks[0]?.difficulty ?? 0);
  const mempoolCount = (stats as any).mempool?.count ?? stats.mempoolCount ?? txs.length ?? 0;
  const RESERVE = 10_000_000_000;
  const rawCirc = stats.circulating ?? stats.circulatingSupply ?? 0;
  const circulatingSupply = rawCirc > (RESERVE + 1_000_000) ? rawCirc - RESERVE : rawCirc;

  // Estimated next block time (avg 10 min, show countdown from last block)
  const lastBlockTime = blocks[0]?.time ?? 0;
  const secSinceLast = lastBlockTime ? Math.floor(Date.now() / 1000) - lastBlockTime : 0;
  const secToNext = Math.max(0, 600 - secSinceLast);
  const nextBlockEst = secToNext < 60
    ? `~${secToNext}s`
    : `~${Math.floor(secToNext / 60)}m ${secToNext % 60}s`;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e2e8f0' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #00ff88; }
          50% { opacity: 0.5; box-shadow: 0 0 3px #00ff88; }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .block-3d-wrap:hover { filter: brightness(1.15); }
        .tx-row:hover { background: rgba(212,168,67,0.05) !important; }
        .live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #00ff88;
          box-shadow: 0 0 8px #00ff88;
          animation: pulse 2s infinite;
          display: inline-block;
        }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.3); border-radius: 2px; }
      `}</style>

      <Navbar onSearch={handleSearch} />

      {/* ── Stats Ticker Bar ─────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(212,168,67,0.06)',
        borderBottom: '1px solid rgba(212,168,67,0.12)',
        overflow: 'hidden',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
      }}>
        {!loadingStats && (
          <div style={{
            display: 'flex',
            animation: 'ticker 30s linear infinite',
            width: 'max-content',
          }}>
            {[
              { label: 'BLOCK HEIGHT', value: formatNumber(blockHeight) },
              { label: 'HASHRATE', value: formatHashrate(hashrate) },
              { label: 'DIFFICULTY', value: difficulty ? difficulty.toFixed(2) : '—' },
              { label: 'MEMPOOL', value: `${mempoolCount} txs` },
              { label: 'MINED SUPPLY', value: formatSupply(circulatingSupply) },
              { label: 'BLOCK REWARD', value: '50,000 TAR' },
              { label: 'ALGORITHM', value: 'SHA-256d' },
              { label: 'NEXT BLOCK', value: nextBlockEst },
              // duplicate for seamless loop
              { label: 'BLOCK HEIGHT', value: formatNumber(blockHeight) },
              { label: 'HASHRATE', value: formatHashrate(hashrate) },
              { label: 'DIFFICULTY', value: difficulty ? difficulty.toFixed(2) : '—' },
              { label: 'MEMPOOL', value: `${mempoolCount} txs` },
              { label: 'MINED SUPPLY', value: formatSupply(circulatingSupply) },
              { label: 'BLOCK REWARD', value: '50,000 TAR' },
              { label: 'ALGORITHM', value: 'SHA-256d' },
              { label: 'NEXT BLOCK', value: nextBlockEst },
            ].map((item, i) => (
              <StatItem key={i} label={item.label} value={item.value} />
            ))}
          </div>
        )}
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'rgba(255,60,60,0.1)',
              borderBottom: '1px solid rgba(255,60,60,0.3)',
              padding: '0.6rem 2rem',
              color: '#ff6b6b',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            ⚠ API error: {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="main-content" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── Section: Block Conveyor ───────────────────────────────────── */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.2rem' }}>
            <span className="live-dot" />
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', color: 'var(--gold)', letterSpacing: '0.12em' }}>
              LATEST BLOCKS
            </span>
            <span className="updated-label" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>
              {lastUpdated ? `· updated ${lastUpdated.toLocaleTimeString()}` : ''}
            </span>
            <Link href="/blocks" style={{
              marginLeft: 'auto',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '0.75rem',
              color: 'rgba(212,168,67,0.7)',
              textDecoration: 'none',
            }}>
              View all blocks →
            </Link>
          </div>

          {/* Block Conveyor */}
          <div className="block-conveyor" style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '12px',
            scrollSnapType: 'x mandatory',
          }}>
            {/* Pending block slot */}
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ flexShrink: 0 }}
            >
              <div style={{
                width: '140px',
                height: '140px',
                border: '2px dashed rgba(212,168,67,0.25)',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.6rem', color: 'rgba(212,168,67,0.4)', letterSpacing: '0.08em' }}>
                  NEXT BLOCK
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', color: 'rgba(212,168,67,0.5)' }}>
                  {nextBlockEst}
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)' }}>
                  #{formatNumber(blockHeight + 1)}
                </div>
              </div>
            </motion.div>

            {/* Block cards */}
            {loadingBlocks
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{
                    flexShrink: 0,
                    width: '140px',
                    height: '140px',
                    background: 'linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    borderRadius: '10px',
                  }} />
                ))
              : (
                <AnimatePresence mode="popLayout">
                  {blocks.map((block, i) => (
                    <BlockCard
                      key={block.hash}
                      block={block}
                      isNew={block.height === newBlockHeight}
                      index={i}
                    />
                  ))}
                </AnimatePresence>
              )
            }
          </div>
        </div>

        {/* ── Two-Column Grid ───────────────────────────────────────────── */}
        <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* ── Left: Network Stats ───────────────────────────────────── */}
          <div>
            {/* Fee estimator */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '1rem',
              overflow: 'hidden',
            }}>
              <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.1em',
                marginBottom: '12px',
              }}>
                TRANSACTION FEES
              </div>
              <div className="fee-cards-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <FeeCard label="LOW PRIORITY" sat={minFeeRate > 0 ? `${minFeeRate.toFixed(2)} sTAR/vByte` : '— sTAR/vByte'} usd="~any block" color="#22c55e" />
                <FeeCard label="MEDIUM" sat={minFeeRate > 0 ? `${(minFeeRate * 3).toFixed(2)} sTAR/vByte` : '— sTAR/vByte'} usd="next block" color="#f59e0b" />
                <FeeCard label="HIGH" sat={minFeeRate > 0 ? `${(minFeeRate * 10).toFixed(2)} sTAR/vByte` : '— sTAR/vByte'} usd="current block" color="#ef4444" />
              </div>
            </div>

            {/* Network stats grid */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.1em',
                marginBottom: '12px',
              }}>
                NETWORK STATISTICS
              </div>
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Block Height', value: formatNumber(blockHeight) },
                  { label: 'Network Hashrate', value: formatHashrate(hashrate) },
                  { label: 'Difficulty', value: difficulty ? difficulty.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—' },
                  { label: 'Mempool TXs', value: formatNumber(mempoolCount) },
                  { label: 'Block Reward', value: '50,000 TAR' },
                  { label: 'Block Time', value: '~10 min' },
                  { label: 'Max Supply', value: '50B TAR' },
                  { label: 'Mined Supply', value: formatSupply(circulatingSupply) },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>
                      {label}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                      {loadingStats ? '—' : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Latest Transactions ────────────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 16px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
                LATEST TRANSACTIONS
              </span>
              <Link href="/mempool" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(212,168,67,0.7)', textDecoration: 'none' }}>
                Mempool →
              </Link>
            </div>

            <div>
              {txs.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.85rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⛏</div>
                  No pending transactions
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'rgba(255,255,255,0.15)' }}>
                    Miners are processing the chain
                  </div>
                </div>
              ) : (
                txs.map((tx, i) => {
                  const fromAddr = tx.vin?.[0]?.addr ?? tx.vin?.[0]?.address ?? 'coinbase';
                  const toAddr = tx.vout?.[0]?.scriptPubKey?.address ?? '—';
                  const amount = tx.vout?.reduce((s, o) => s + (o.value ?? 0), 0) ?? tx.value ?? 0;
                  const ts = tx.time ?? tx.blocktime;
                  const isCoinbase = fromAddr === 'coinbase';

                  return (
                    <div
                      key={tx.txid}
                      className="tx-row"
                      style={{
                        padding: '10px 16px',
                        borderBottom: i < txs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      {/* Coinbase badge or arrow */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isCoinbase ? 'rgba(212,168,67,0.15)' : 'rgba(0,255,136,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        flexShrink: 0,
                      }}>
                        {isCoinbase ? '⛏' : '⇄'}
                      </div>

                      {/* TxID + addresses */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/tx/${tx.txid}`} style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.72rem',
                          color: 'rgba(212,168,67,0.8)',
                          textDecoration: 'none',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {truncateHash(tx.txid, 10, 10)}
                        </Link>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                          {isCoinbase
                            ? <span style={{ color: 'rgba(212,168,67,0.5)' }}>Block reward</span>
                            : truncateHash(fromAddr, 5, 5)
                          }
                          {' → '}
                          {toAddr !== '—'
                            ? <Link href={`/address/${toAddr}`} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>{truncateHash(toAddr, 5, 5)}</Link>
                            : '—'
                          }
                        </div>
                      </div>

                      {/* Amount + time */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#00ff88', fontWeight: 600 }}>
                          {amount.toFixed(2)} TAR
                        </div>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
                          {ts ? timeAgo(ts) : '—'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Genesis Block ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'rgba(212,168,67,0.04)',
            border: '1px solid rgba(212,168,67,0.15)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem', color: 'rgba(212,168,67,0.6)', letterSpacing: '0.12em', flexShrink: 0 }}>
            ✦ GENESIS BLOCK
          </div>
          <Link href={`/block/${GENESIS_HASH}`} style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
            wordBreak: 'break-all',
            flex: 1,
          }}>
            {GENESIS_HASH}
          </Link>
          <div style={{
            background: 'rgba(212,168,67,0.15)',
            border: '1px solid rgba(212,168,67,0.3)',
            borderRadius: '4px',
            padding: '2px 8px',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '0.62rem',
            color: 'var(--gold)',
            flexShrink: 0,
          }}>
            Height 0
          </div>
        </motion.div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        marginTop: '3rem',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.25)',
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '0.8rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.5rem 1.5rem',
      }}>
        <span>
          <span style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--gold)', fontWeight: 700, marginRight: '0.4rem' }}>TARCOIN</span>
          Explorer · Built on the TARCOIN Network
        </span>
        <span>
          <a href="https://tarcoin.org" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(212,168,67,0.5)', textDecoration: 'none' }}>tarcoin.org</a>
          {' · '}
          <Link href="/mempool" style={{ color: 'rgba(212,168,67,0.5)', textDecoration: 'none' }}>Mempool</Link>
          {' · '}
          <a href="https://github.com/Tarcoin/tarcoin" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(212,168,67,0.5)', textDecoration: 'none' }}>GitHub</a>
        </span>
      </footer>
    </div>
  );
}
