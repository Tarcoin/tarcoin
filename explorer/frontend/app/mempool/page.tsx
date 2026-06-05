'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_EXPLORER_API || 'http://localhost:4000';
const POLL_INTERVAL = 10000;

// ─── helpers ────────────────────────────────────────────────────────────────

function truncateHash(hash: string, head = 8, tail = 8): string {
  if (!hash || hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}...${hash.slice(-tail)}`;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString();
}

function timeInPool(ts: number): string {
  if (!ts) return '—';
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  return `${Math.floor(diff / 86400)}d ${Math.floor((diff % 86400) / 3600)}h`;
}

// ─── types ───────────────────────────────────────────────────────────────────

interface MempoolTx {
  txid: string;
  size?: number;
  vsize?: number;
  weight?: number;
  fee?: number;
  fees?: { base?: number };
  feerate?: number;
  time?: number;
  firstSeen?: number;
  first_seen?: number;
  descendantcount?: number;
  ancestorcount?: number;
}

interface MempoolStats {
  size?: number;
  count?: number;
  txCount?: number;
  totalSize?: number;
  total_size?: number;
  bytes?: number;
  minFeeRate?: number;
  min_fee_rate?: number;
  minfeerate?: number;
  maxFeeRate?: number;
  totalFees?: number;
  total_fees?: number;
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ width = '100%', height = '1rem' }: { width?: string; height?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width,
        height,
        background: 'linear-gradient(90deg, var(--black-2) 25%, #1a1a1a 50%, var(--black-2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '4px',
        verticalAlign: 'middle',
      }}
    />
  );
}

// ─── stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, loading, accent = false }: {
  label: string;
  value: string;
  sub?: string;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <motion.div
      className="card"
      style={{ flex: '1 1 180px', padding: '1.25rem 1.5rem', textAlign: 'center', minWidth: 0 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
        {label}
      </div>
      {loading ? (
        <Skeleton width="70%" height="1.5rem" />
      ) : (
        <>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 'clamp(1.1rem, 3vw, 1.6rem)',
              fontWeight: 700,
              color: accent ? 'var(--gold)' : 'var(--text)',
              textShadow: accent ? '0 0 16px rgba(212,168,67,0.4)' : 'none',
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>
          {sub && (
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
              {sub}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ─── sort types ──────────────────────────────────────────────────────────────

type SortKey = 'fee' | 'size' | 'feerate' | 'time';
type SortDir = 'asc' | 'desc';

// ─── main ────────────────────────────────────────────────────────────────────

export default function MempoolPage() {
  const [txs, setTxs] = useState<MempoolTx[]>([]);
  const [stats, setStats] = useState<MempoolStats>({});
  const [loadingTxs, setLoadingTxs] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('feerate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [ticker, setTicker] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const PAGE_SIZE = 25;

  // ─ fetch mempool txs ─
  const fetchTxs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/mempool?limit=200`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: MempoolTx[] = Array.isArray(data) ? data : data.txs ?? [];
      setTxs(list);
      setLoadingTxs(false);
      setLastUpdated(new Date());
      setTicker(t => t + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mempool');
      setLoadingTxs(false);
    }
  }, []);

  // ─ fetch mempool stats ─
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/mempool/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MempoolStats = await res.json();
      setStats(data);
      setLoadingStats(false);
    } catch {
      setLoadingStats(false);
    }
  }, []);

  // ─ poll ─
  useEffect(() => {
    fetchTxs();
    fetchStats();

    intervalRef.current = setInterval(() => {
      fetchTxs();
      fetchStats();
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchTxs, fetchStats]);

  // ─ countdown timer display ─
  const [countdown, setCountdown] = useState(POLL_INTERVAL / 1000);
  useEffect(() => {
    setCountdown(POLL_INTERVAL / 1000);
  }, [ticker]);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // ─ derived stats ─
  const txCount = stats.count ?? stats.txCount ?? txs.length;
  const totalSize = stats.totalSize ?? stats.total_size ?? stats.bytes ?? txs.reduce((s, t) => s + (t.size ?? t.vsize ?? 0), 0);
  const minFeeRate = stats.minFeeRate ?? stats.min_fee_rate ?? stats.minfeerate ?? 0;

  // ─ sort ─
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  }

  const sorted = [...txs].sort((a, b) => {
    let av = 0, bv = 0;
    switch (sortKey) {
      case 'fee':
        av = a.fee ?? a.fees?.base ?? 0;
        bv = b.fee ?? b.fees?.base ?? 0;
        break;
      case 'size':
        av = a.size ?? a.vsize ?? 0;
        bv = b.size ?? b.vsize ?? 0;
        break;
      case 'feerate': {
        const aFee = a.fee ?? a.fees?.base ?? 0;
        const aSize = a.vsize ?? a.size ?? 1;
        const bFee = b.fee ?? b.fees?.base ?? 0;
        const bSize = b.vsize ?? b.size ?? 1;
        av = a.feerate ?? (aFee / aSize * 1e8);
        bv = b.feerate ?? (bFee / bSize * 1e8);
        break;
      }
      case 'time':
        av = a.time ?? a.firstSeen ?? a.first_seen ?? 0;
        bv = b.time ?? b.firstSeen ?? b.first_seen ?? 0;
        break;
    }
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ opacity: 0.3, marginLeft: '0.3rem' }}>⇅</span>;
    return <span style={{ marginLeft: '0.3rem', color: 'var(--gold)' }}>{sortDir === 'desc' ? '▼' : '▲'}</span>;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--text)' }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .mp-row:hover { background: rgba(212,168,67,0.06) !important; }
        .sort-th { cursor: pointer; user-select: none; }
        .sort-th:hover { color: var(--gold) !important; }
        .page-btn { background: var(--black-2); border: 1px solid var(--border); color: var(--text); padding: 0.4rem 0.75rem; border-radius: 5px; cursor: pointer; font-family: 'Orbitron', sans-serif; font-size: 0.7rem; transition: all 0.2s; }
        .page-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
        .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .page-btn.active { border-color: var(--gold); color: var(--gold); background: rgba(212,168,67,0.12); }
      `}</style>

      {/* ── top bar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'rgba(0,0,0,0.85)',
          borderBottom: '1px solid var(--border)',
          padding: '0 2rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link href="/" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '1rem', color: 'var(--gold)', textDecoration: 'none', textShadow: '0 0 12px var(--gold)' }}>
          <img src="https://tarcoin.org/logo.png" alt="TARCOIN" style={{ width: '24px', height: '24px', display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '8px' }} /> TARCOIN
        </Link>
        <span style={{ color: 'var(--border)' }}>›</span>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-dim)', fontSize: '0.875rem' }}>Explorer</span>
        <span style={{ color: 'var(--border)' }}>›</span>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text)', fontSize: '0.875rem' }}>Mempool</span>
      </div>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── page header ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: 'clamp(1.2rem, 4vw, 2rem)',
                fontWeight: 900,
                color: 'var(--gold)',
                margin: 0,
                letterSpacing: '0.08em',
                textShadow: '0 0 24px rgba(212,168,67,0.4)',
              }}
            >
              MEMORY POOL
            </motion.h1>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-dim)', fontSize: '0.875rem', margin: '0.4rem 0 0 0' }}>
              Unconfirmed transactions waiting to be mined
            </p>
          </div>

          {/* Live status */}
          <div
            className="glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--neon, #00ff88)',
                display: 'inline-block',
                boxShadow: '0 0 8px var(--neon, #00ff88)',
                animation: 'pulse 2s infinite',
                flexShrink: 0,
              }}
            />
            <span style={{ color: 'var(--text-dim)' }}>
              Auto-refresh in{' '}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)', fontWeight: 700 }}>
                {countdown}s
              </span>
            </span>
            {lastUpdated && (
              <span style={{ color: 'var(--text-dim)', borderLeft: '1px solid var(--border)', paddingLeft: '0.75rem' }}>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => { fetchTxs(); fetchStats(); }}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '0.2rem 0.5rem',
                fontSize: '0.72rem',
                fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '0.05em',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
            >
              ↻ REFRESH
            </button>
          </div>
        </div>

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
              <span>API error: {error}. Retrying…</span>
              <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── stats row ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard
            label="PENDING TRANSACTIONS"
            value={loadingStats ? '…' : formatNumber(txCount)}
            loading={loadingStats}
            accent
          />
          <StatCard
            label="TOTAL SIZE"
            value={loadingStats ? '…' : formatBytes(totalSize)}
            sub="estimated"
            loading={loadingStats}
          />
          <StatCard
            label="MIN FEE RATE"
            value={loadingStats ? '…' : (minFeeRate > 0 ? `${minFeeRate.toFixed(2)}` : '—')}
            sub="sat/vByte"
            loading={loadingStats}
          />
        </div>

        {/* ── main table ────────────────────────────────────────────────── */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ overflow: 'hidden' }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <h2
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                color: 'var(--gold)',
                margin: 0,
              }}
            >
              ⇄ PENDING TRANSACTIONS
              {!loadingTxs && (
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 400, marginLeft: '0.75rem' }}>
                  ({sorted.length})
                </span>
              )}
            </h2>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Click column headers to sort
            </div>
          </div>

          {/* Empty state */}
          <AnimatePresence>
            {!loadingTxs && txs.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4rem 2rem',
                  gap: '1rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '3rem', opacity: 0.4 }}>⬜</div>
                <div
                  style={{
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '0.85rem',
                    letterSpacing: '0.1em',
                    color: 'var(--text-dim)',
                  }}
                >
                  MEMPOOL IS EMPTY
                </div>
                <div
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    color: 'var(--text-dim)',
                    fontSize: '0.875rem',
                    opacity: 0.7,
                    maxWidth: '380px',
                  }}
                >
                  No pending transactions — the mempool is clear. New transactions will appear here in real time.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          {loadingTxs && (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Skeleton width="35%" height="0.875rem" />
                  <Skeleton width="8%" height="0.875rem" />
                  <Skeleton width="12%" height="0.875rem" />
                  <Skeleton width="10%" height="0.875rem" />
                  <Skeleton width="10%" height="0.875rem" />
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          {!loadingTxs && txs.length > 0 && (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="explorer-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>TxID</th>
                      <th
                        className="sort-th"
                        onClick={() => handleSort('size')}
                        style={{ textAlign: 'right', color: sortKey === 'size' ? 'var(--gold)' : undefined }}
                      >
                        Size <SortIcon col="size" />
                      </th>
                      <th
                        className="sort-th"
                        onClick={() => handleSort('fee')}
                        style={{ textAlign: 'right', color: sortKey === 'fee' ? 'var(--gold)' : undefined }}
                      >
                        Fee <SortIcon col="fee" />
                      </th>
                      <th
                        className="sort-th"
                        onClick={() => handleSort('feerate')}
                        style={{ textAlign: 'right', color: sortKey === 'feerate' ? 'var(--gold)' : undefined }}
                      >
                        Fee Rate (sat/vB) <SortIcon col="feerate" />
                      </th>
                      <th
                        className="sort-th"
                        onClick={() => handleSort('time')}
                        style={{ textAlign: 'right', color: sortKey === 'time' ? 'var(--gold)' : undefined }}
                      >
                        Time In Pool <SortIcon col="time" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paged.map((tx, i) => {
                        const fee = tx.fee ?? tx.fees?.base ?? 0;
                        const size = tx.vsize ?? tx.size ?? 0;
                        const feerate = tx.feerate ?? (size > 0 ? fee / size * 1e8 : 0);
                        const ts = tx.time ?? tx.firstSeen ?? tx.first_seen ?? 0;
                        const isHighFee = feerate > 50;
                        const isLowFee = feerate > 0 && feerate < 2;

                        return (
                          <motion.tr
                            key={tx.txid}
                            className="mp-row"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.02 }}
                          >
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: isHighFee ? 'var(--neon, #00ff88)' : isLowFee ? '#ff8c00' : 'var(--gold)',
                                    display: 'inline-block',
                                    flexShrink: 0,
                                    boxShadow: `0 0 4px ${isHighFee ? 'var(--neon, #00ff88)' : isLowFee ? '#ff8c00' : 'var(--gold)'}`,
                                  }}
                                />
                                <Link href={`/tx/${tx.txid}`} className="hash link" style={{ fontSize: '0.8rem' }}>
                                  {truncateHash(tx.txid)}
                                </Link>
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                              {size > 0 ? formatBytes(size) : '—'}
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                              {fee > 0 ? `${fee.toFixed(8)} TAR` : '—'}
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                              {feerate > 0 ? (
                                <span
                                  style={{
                                    color: isHighFee ? 'var(--neon, #00ff88)' : isLowFee ? '#ff8c00' : 'var(--text)',
                                    fontWeight: isHighFee ? 700 : 400,
                                  }}
                                >
                                  {feerate.toFixed(2)}
                                </span>
                              ) : '—'}
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                              {ts ? timeInPool(ts) : '—'}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* ── fee rate legend ─────────────────────────────────────── */}
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                  FEE RATE:
                </span>
                {[
                  { color: 'var(--neon, #00ff88)', label: 'High (>50 sat/vB)' },
                  { color: 'var(--gold)', label: 'Normal' },
                  { color: '#ff8c00', label: 'Low (<2 sat/vB)' },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 4px ${color}` }} />
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.75rem', color: 'var(--text-dim)' }}>{label}</span>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="page-btn"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      ←
                    </button>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      // show pages around current page
                      let pageNum = i;
                      if (totalPages > 7) {
                        if (page < 4) pageNum = i;
                        else if (page > totalPages - 5) pageNum = totalPages - 7 + i;
                        else pageNum = page - 3 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          className={`page-btn${pageNum === page ? ' active' : ''}`}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}

                    <button
                      className="page-btn"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      →
                    </button>

                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '0.25rem' }}>
                      {page + 1} / {totalPages}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* ── info box ──────────────────────────────────────────────────── */}
        <motion.div
          className="glass"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: '1.5rem',
            padding: '1rem 1.5rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            borderLeft: '3px solid rgba(212,168,67,0.4)',
          }}
        >
          <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}>ℹ</span>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            The memory pool contains transactions that have been broadcast to the TARCOIN network but have not yet been included in a block.
            Transactions with higher fee rates are prioritised by miners and confirmed sooner.
            The mempool is auto-refreshed every {POLL_INTERVAL / 1000} seconds.
          </div>
        </motion.div>

        {/* ── back to explorer ──────────────────────────────────────────── */}
        <div style={{ marginTop: '2rem' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.5rem',
              background: 'var(--black-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.06em',
              textDecoration: 'none',
              transition: 'border-color 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            ← BACK TO EXPLORER
          </Link>
        </div>
      </div>
    </div>
  );
}
