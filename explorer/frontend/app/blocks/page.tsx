'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// --- Types ---
interface Block {
  hash: string;
  height: number;
  time?: number;
  tx?: any[];
  nTx?: number;
  size?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_EXPLORER_API || 'http://localhost:4000';
const GENESIS_HASH = process.env.NEXT_PUBLIC_GENESIS_HASH || '0000e37ee7aa8a88d1254ee3fe7c497c8fdaff36b29747eb64d8da68fbd9939e';

// --- Utils ---
function truncateHash(hash: string): string {
  if (!hash || hash.length < 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

function timeAgo(ts: number): string {
  if (!ts) return '—';
  const ms = ts * 1000;
  const now = Date.now();
  const diff = now - ms;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// --- Component ---
function Skeleton({ height }: { height: string }) {
  return (
    <div
      style={{
        height,
        backgroundColor: 'var(--border)',
        borderRadius: '4px',
        animation: 'pulse 1.5s infinite ease-in-out',
        width: '100%',
      }}
    />
  );
}

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blocks?limit=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Block[] = Array.isArray(data) ? data : data.blocks ?? [];

      const hasGenesis = list.some(b => b.height === 0 || b.hash === GENESIS_HASH);
      if (!hasGenesis && list.length > 0 && list.length < 100) {
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

      list.sort((a, b) => b.height - a.height);
      setBlocks(list);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load blocks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 10000);
    return () => clearInterval(interval);
  }, [fetchBlocks]);

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--text)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href="/" className="link" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1rem', color: 'var(--gold)' }}>
          ← BACK TO HOME
        </Link>
      </nav>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--gold)', margin: 0 }}>RECENT BLOCKS</h1>
        </div>

        <div style={{ overflowX: 'auto', padding: '1rem' }}>
          {error && <div style={{ color: '#ff4444', padding: '1rem' }}>Error: {error}</div>}
          
          <table className="explorer-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Height</th>
                <th style={{ padding: '1rem' }}>Hash</th>
                <th style={{ padding: '1rem' }}>Time</th>
                <th style={{ padding: '1rem' }}>TXs</th>
                <th style={{ padding: '1rem' }}>Size</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 15 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} style={{ padding: '1rem' }}><Skeleton height="1rem" /></td>
                      ))}
                    </tr>
                  ))
                : blocks.map(block => (
                    <tr key={block.hash} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <Link href={`/block/${block.hash}`} className="link">
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--gold)' }}>
                            {formatNumber(block.height)}
                          </span>
                        </Link>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <Link href={`/block/${block.hash}`} className="hash link">
                          {truncateHash(block.hash)}
                        </Link>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-dim)' }}>
                        {block.time ? timeAgo(block.time) : '—'}
                      </td>
                      <td style={{ padding: '1rem', fontFamily: 'JetBrains Mono, monospace' }}>
                        {block.nTx ?? block.tx?.length ?? 0}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-dim)' }}>
                        {block.size ? `${formatNumber(block.size)} B` : '—'}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </main>
  );
}
