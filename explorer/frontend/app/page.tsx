'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_EXPLORER_API || 'http://localhost:4000';
const GENESIS_HASH = '000074c6359f78730790275ea21bbd53f0bc3249604470bad49b9753f44bd7e0';
const POLL_INTERVAL = 15000;

// ─── helpers ────────────────────────────────────────────────────────────────

function truncateHash(hash: string, head = 8, tail = 8): string {
  if (!hash || hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}...${hash.slice(-tail)}`;
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatBytes(bytes: number): string {
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
  connections?: number;
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ width = '100%', height = '1rem', className = '' }: { width?: string; height?: string; className?: string }) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, var(--black-2) 25%, #1a1a1a 50%, var(--black-2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '4px',
      }}
    />
  );
}

// ─── stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <motion.div
      className="card"
      style={{ flex: '1 1 140px', minWidth: 0, textAlign: 'center', padding: '1.1rem 0.8rem' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="stat-label" style={{ marginBottom: '0.4rem' }}>{label}</div>
      {loading ? (
        <Skeleton height="1.6rem" width="70%" className="" />
      ) : (
        <div className="stat-value">{value}</div>
      )}
    </motion.div>
  );
}

// ─── navbar ──────────────────────────────────────────────────────────────────

function Navbar({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(query.trim());
  }

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '0 2rem',
        height: '64px',
        background: 'rgba(0,0,0,0.85)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 900,
            fontSize: '1.25rem',
            color: 'var(--gold)',
            letterSpacing: '0.08em',
            textShadow: '0 0 18px var(--gold)',
          }}
        >
          <img src="https://tarcoin.org/logo.png" alt="TARCOIN" style={{ width: '24px', height: '24px', display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '8px' }} /> TARCOIN
        </span>
        <span
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '0.65rem',
            color: 'var(--text-dim)',
            letterSpacing: '0.15em',
            marginTop: '2px',
          }}
        >
          EXPLORER
        </span>
      </Link>

      {/* Search (desktop inline) */}
      <form onSubmit={handleSubmit} style={{ flex: 1, maxWidth: '480px', display: 'flex', gap: '0.5rem' }}>
        <input
          className="search-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search block / tx / address…"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          style={{
            padding: '0 1rem',
            background: 'var(--gold)',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 700,
            fontSize: '0.75rem',
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          GO
        </button>
      </form>

      <div style={{ flex: 1 }} />

      <Link href="/mempool" className="link" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
        MEMPOOL
      </Link>
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
  const [loadingTxs, setLoadingTxs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─ fetch blocks ─
  const fetchBlocks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blocks?limit=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Block[] = Array.isArray(data) ? data : data.blocks ?? [];

      // ensure genesis is included
      const hasGenesis = list.some(b => b.height === 0 || b.hash === GENESIS_HASH);
      if (!hasGenesis && list.length > 0) {
        try {
          const gRes = await fetch(`${API_BASE}/api/block/${GENESIS_HASH}`);
          if (gRes.ok) {
            const genesis: Block = await gRes.json();
            list.push(genesis);
          }
        } catch {
          /* ignore */
        }
      }

      // sort descending by height
      list.sort((a, b) => b.height - a.height);
      setBlocks(list);
      setLoadingBlocks(false);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
      setLoadingBlocks(false);
    }
  }, []);

  // ─ fetch network stats ─
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

  // ─ fetch recent txs ─
  const fetchTxs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/mempool?limit=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Tx[] = Array.isArray(data) ? data : data.txs ?? [];
      setTxs(list);
      setLoadingTxs(false);
    } catch {
      setLoadingTxs(false);
    }
  }, []);

  // ─ poll ─
  useEffect(() => {
    fetchBlocks();
    fetchStats();
    fetchTxs();

    intervalRef.current = setInterval(() => {
      fetchBlocks();
      fetchStats();
      fetchTxs();
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchBlocks, fetchStats, fetchTxs]);

  // ─ search handler ─
  function handleSearch(query: string) {
    if (!query) return;

    // 64-char hex → block hash or txid
    if (/^[0-9a-fA-F]{64}$/.test(query)) {
      // ambiguous: try block first, fallback to tx
      router.push(`/block/${query}`);
      return;
    }

    // pure number → block height
    if (/^\d+$/.test(query)) {
      // look up by height
      router.push(`/block/${query}`);
      return;
    }

    // looks like a bitcoin address (base58 or bech32)
    if (/^(1|3|bc1|tar1|T)[a-zA-Z0-9]{10,}$/.test(query)) {
      router.push(`/address/${query}`);
      return;
    }

    // fallback: try as block hash
    router.push(`/block/${query}`);
  }

  // ─ derived ─
  const blockHeight = stats.blocks ?? stats.blockHeight ?? (blocks[0]?.height ?? 0);
  const hashrate = stats.hashrate ?? 0;
  const difficulty = stats.difficulty ?? (blocks[0]?.difficulty ?? 0);
  const mempoolSize = stats.mempoolSize ?? stats.mempoolCount ?? 0;
  const totalSupply = stats.totalSupply ?? 50_000_000_000;
  const circulatingSupply = stats.circulatingSupply ?? Math.floor(blockHeight * 50);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--text)' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .table-row-hover:hover { background: rgba(212,168,67,0.07) !important; }
        .nav-pulse {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--neon, #00ff88);
          display: inline-block;
          box-shadow: 0 0 8px var(--neon, #00ff88);
          animation: pulse 2s infinite;
          margin-right: 6px;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      <Navbar onSearch={handleSearch} />

      {/* ── hero search ───────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(212,168,67,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border)',
          padding: '3rem 2rem 2.5rem',
          textAlign: 'center',
        }}
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 'clamp(1.4rem, 4vw, 2.4rem)',
            fontWeight: 900,
            color: 'var(--gold)',
            textShadow: '0 0 30px rgba(212,168,67,0.5)',
            marginBottom: '0.4rem',
            letterSpacing: '0.08em',
          }}
        >
          TARCOIN BLOCKCHAIN EXPLORER
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ color: 'var(--text-dim)', fontFamily: 'Space Grotesk, sans-serif', marginBottom: '1.8rem', fontSize: '0.95rem' }}
        >
          Search blocks, transactions, and addresses on the TARCOIN network
        </motion.p>

        <motion.form
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={e => { e.preventDefault(); handleSearch((e.currentTarget.querySelector('input') as HTMLInputElement).value.trim()); }}
          style={{ display: 'flex', gap: '0.75rem', maxWidth: '700px', margin: '0 auto' }}
        >
          <input
            className="search-input"
            name="q"
            placeholder="Block hash / height / transaction ID / address…"
            style={{ flex: 1, fontSize: '1rem', padding: '0.85rem 1.2rem' }}
          />
          <button
            type="submit"
            style={{
              padding: '0.85rem 2rem',
              background: 'var(--gold)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            SEARCH
          </button>
        </motion.form>
      </div>

      <div className="container" style={{ padding: '2rem' }}>

        {/* ── error banner ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(255,60,60,0.12)',
                border: '1px solid rgba(255,60,60,0.4)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                color: '#ff6b6b',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>⚠</span>
              <span>API error: {error}. Showing cached data.</span>
              <button
                onClick={() => setError(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── stats bar ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <StatCard label="Block Height" value={formatNumber(blockHeight)} loading={loadingStats} />
          <StatCard label="Network Hashrate" value={formatHashrate(hashrate)} loading={loadingStats} />
          <StatCard label="Difficulty" value={difficulty ? difficulty.toFixed(4) : '—'} loading={loadingStats} />
          <StatCard label="Mempool TXs" value={formatNumber(mempoolSize)} loading={loadingStats} />
          <StatCard label="Total Supply" value="50,000,000,000" loading={false} />
          <StatCard label="Circulating" value={formatNumber(circulatingSupply)} loading={loadingStats} />
        </div>

        {/* ── live indicator ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem', gap: '0.5rem' }}>
          <span className="nav-pulse" />
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Live — updates every {POLL_INTERVAL / 1000}s
            {lastUpdated && ` · last updated ${lastUpdated.toLocaleTimeString()}`}
          </span>
        </div>

        {/* ── two-column tables ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>

          {/* ─── Latest Blocks ─────────────────────────────────────────── */}
          <motion.div
            className="card"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.9rem',
                  letterSpacing: '0.1em',
                  color: 'var(--gold)',
                  margin: 0,
                }}
              >
                ▣ LATEST BLOCKS
              </h2>
              <Link href="/blocks" className="link" style={{ fontSize: '0.75rem' }}>
                View all →
              </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="explorer-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Height</th>
                    <th>Hash</th>
                    <th>Time</th>
                    <th>TXs</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingBlocks
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j}><Skeleton height="0.875rem" /></td>
                          ))}
                        </tr>
                      ))
                    : blocks.map(block => (
                        <tr key={block.hash} className="table-row-hover">
                          <td>
                            <Link href={`/block/${block.hash}`} className="link">
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontWeight: 700,
                                  color: 'var(--gold)',
                                  fontSize: '0.85rem',
                                }}
                              >
                                {formatNumber(block.height)}
                              </span>
                            </Link>
                          </td>
                          <td>
                            <Link href={`/block/${block.hash}`} className="hash link">
                              {truncateHash(block.hash)}
                            </Link>
                          </td>
                          <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {block.time ? timeAgo(block.time) : '—'}
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem' }}>
                            {block.nTx ?? block.tx?.length ?? 0}
                          </td>
                          <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                            {formatBytes(block.size)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {!loadingBlocks && blocks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                No blocks found
              </div>
            )}
          </motion.div>

          {/* ─── Latest Transactions ───────────────────────────────────── */}
          <motion.div
            className="card"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.9rem',
                  letterSpacing: '0.1em',
                  color: 'var(--gold)',
                  margin: 0,
                }}
              >
                ⇄ LATEST TRANSACTIONS
              </h2>
              <Link href="/mempool" className="link" style={{ fontSize: '0.75rem' }}>
                Mempool →
              </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="explorer-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>TxID</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Amount</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTxs
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j}><Skeleton height="0.875rem" /></td>
                          ))}
                        </tr>
                      ))
                    : txs.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                          No pending transactions
                        </td>
                      </tr>
                    )
                    : txs.map(tx => {
                        const fromAddr = tx.vin?.[0]?.addr ?? tx.vin?.[0]?.address ?? 'coinbase';
                        const toAddr = tx.vout?.[0]?.scriptPubKey?.address ?? '—';
                        const amount = tx.vout?.reduce((sum, o) => sum + (o.value ?? 0), 0) ?? tx.value ?? 0;
                        const ts = tx.time ?? tx.blocktime;
                        return (
                          <tr key={tx.txid} className="table-row-hover">
                            <td>
                              <Link href={`/tx/${tx.txid}`} className="hash link">
                                {truncateHash(tx.txid)}
                              </Link>
                            </td>
                            <td className="hash" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              {fromAddr === 'coinbase'
                                ? <span style={{ color: 'var(--gold)', fontFamily: 'Space Grotesk, sans-serif' }}>coinbase</span>
                                : truncateHash(fromAddr, 5, 5)}
                            </td>
                            <td className="hash" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              {toAddr !== '—'
                                ? <Link href={`/address/${toAddr}`} className="link">{truncateHash(toAddr, 5, 5)}</Link>
                                : '—'}
                            </td>
                            <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--neon, #00ff88)' }}>
                              {amount.toFixed(4)}
                            </td>
                            <td style={{ color: 'var(--text-dim)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                              {ts ? timeAgo(ts) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* ── genesis block callout ─────────────────────────────────────── */}
        <motion.div
          className="glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: '2rem',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.7rem',
                color: 'var(--gold)',
                letterSpacing: '0.12em',
                marginBottom: '0.25rem',
              }}
            >
              ✦ GENESIS BLOCK
            </div>
            <Link href={`/block/${GENESIS_HASH}`} className="hash link" style={{ fontSize: '0.8rem' }}>
              {GENESIS_HASH}
            </Link>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className="badge badge-gold">Height 0</span>
          </div>
        </motion.div>
      </div>

      {/* ── footer ────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          marginTop: '4rem',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--gold)', fontWeight: 700, marginRight: '0.5rem' }}>
            TARCOIN
          </span>
          Explorer · Built on the TARCOIN Network
        </div>
        <div>
          <a href="https://tarcoin.org" target="_blank" rel="noopener noreferrer" className="link">
            tarcoin.org
          </a>
          {' · '}
          <Link href="/mempool" className="link">Mempool</Link>
        </div>
      </footer>
    </div>
  );
}
