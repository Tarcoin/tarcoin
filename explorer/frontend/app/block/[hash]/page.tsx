'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

const API = process.env.NEXT_PUBLIC_EXPLORER_API || 'http://localhost:4000';

function truncate(hash: string, h = 8, t = 8) {
  if (!hash || hash.length <= h + t + 3) return hash;
  return `${hash.slice(0, h)}...${hash.slice(-t)}`;
}

function fmtTime(ts: number) {
  if (!ts) return '—';
  return new Date(ts * 1000).toUTCString();
}

function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function fmtBytes(b: number) {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  return `${(b / 1024).toFixed(1)} KB`;
}

export default function BlockPage() {
  const { hash } = useParams<{ hash: string }>();
  const router = useRouter();
  const [block, setBlock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  useEffect(() => {
    if (!hash) return;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        // Numeric → fetch by height
        let url = `${API}/api/block/${hash}`;
        if (/^\d+$/.test(hash)) {
          url = `${API}/api/block/height/${hash}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Block not found (HTTP ${res.status})`);
        const data = await res.json();
        setBlock(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hash]);

  function navToHeight(h: number) {
    if (h < 0) return;
    router.push(`/block/${h}`);
  }

  const isGenesis = block?.height === 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--text)' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0 2rem', height: '60px',
        background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Link href="/" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '1.1rem', color: 'var(--gold)', textDecoration: 'none', textShadow: '0 0 14px var(--gold)' }}>
          <img src="https://tarcoin.org/logo.png" alt="TARCOIN" style={{ width: '24px', height: '24px', display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '8px' }} /> TARCOIN
        </Link>
        <span style={{ color: 'var(--border)', fontSize: '1.2rem' }}>›</span>
        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>BLOCK</span>
        <span style={{ color: 'var(--border)', fontSize: '1.2rem' }}>›</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--gold)' }}>{truncate(String(hash), 12, 12)}</span>
      </nav>

      <div className="container" style={{ padding: '2rem' }}>
        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <div className="spinner" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{
            border: '1px solid rgba(255,60,60,0.4)', background: 'rgba(255,60,60,0.08)',
            padding: '2rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠</div>
            <div style={{ color: '#ff6b6b', fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>
            <Link href="/" className="link">← Back to Explorer</Link>
          </motion.div>
        )}

        {block && !loading && (
          <>
            {/* Genesis badge */}
            {isGenesis && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'linear-gradient(90deg, rgba(212,168,67,0.15), rgba(212,168,67,0.05))',
                  border: '1px solid rgba(212,168,67,0.4)', borderRadius: '8px',
                  padding: '0.75rem 1.25rem', marginBottom: '1.5rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                <span style={{ fontSize: '1.2rem' }}>✦</span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--gold)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                  GENESIS BLOCK — The first block of the TARCOIN blockchain, mined on {new Date(block.time * 1000).toDateString()}
                </span>
              </motion.div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {block.height > 0 && (
                <button onClick={() => navToHeight(block.height - 1)} style={{
                  background: 'var(--black-2)', border: '1px solid var(--border)',
                  color: 'var(--gold)', padding: '0.5rem 1rem', borderRadius: '8px',
                  fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem', cursor: 'pointer',
                  letterSpacing: '0.08em', transition: 'border-color 0.2s',
                }}>
                  ← PREV
                </button>
              )}
              <button onClick={() => navToHeight(block.height + 1)} style={{
                background: 'var(--black-2)', border: '1px solid var(--border)',
                color: 'var(--gold)', padding: '0.5rem 1rem', borderRadius: '8px',
                fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem', cursor: 'pointer',
                letterSpacing: '0.08em', transition: 'border-color 0.2s',
              }}>
                NEXT →
              </button>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>Block #{block.height?.toLocaleString()}</span>
              </div>
            </div>

            {/* Summary card */}
            <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.95rem', color: 'var(--gold)', letterSpacing: '0.1em', margin: 0 }}>
                  BLOCK DETAILS
                </h1>
              </div>
              <div style={{ padding: '0.5rem 1.25rem' }}>
                {[
                  ['Hash', <span className="hash" style={{ fontSize: '0.8rem', userSelect: 'all' }}>{block.hash}</span>],
                  ['Height', <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--gold)' }}>{block.height?.toLocaleString()}</span>],
                  ['Timestamp', `${fmtTime(block.time)} (${timeAgo(block.time)})`],
                  ['Confirmations', block.confirmations?.toLocaleString() ?? '—'],
                  ['Transactions', block.nTx ?? block.tx?.length ?? 0],
                  ['Size', fmtBytes(block.size)],
                  ['Weight', block.weight ? `${block.weight.toLocaleString()} WU` : '—'],
                  ['Difficulty', block.difficulty?.toFixed(8) ?? '—'],
                  ['nBits', <span className="hash" style={{ fontSize: '0.8rem' }}>{block.bits}</span>],
                  ['Nonce', <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{block.nonce?.toLocaleString()}</span>],
                  ['Version', <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>0x{block.versionHex ?? block.version?.toString(16)}</span>],
                  ['Merkle Root', <span className="hash" style={{ fontSize: '0.75rem', userSelect: 'all' }}>{block.merkleroot}</span>],
                  ['Previous Block', block.previousblockhash
                    ? <Link href={`/block/${block.previousblockhash}`} className="hash link" style={{ fontSize: '0.8rem' }}>{truncate(block.previousblockhash)}</Link>
                    : <span style={{ color: 'var(--text-dim)' }}>Genesis — no previous block</span>],
                  ['Next Block', block.nextblockhash
                    ? <Link href={`/block/${block.nextblockhash}`} className="hash link" style={{ fontSize: '0.8rem' }}>{truncate(block.nextblockhash)}</Link>
                    : <span style={{ color: 'var(--text-dim)' }}>—</span>],
                ].map(([label, value]) => (
                  <div key={String(label)} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value as any}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Transactions */}
            {block.tx && block.tx.length > 0 && (
              <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem', color: 'var(--gold)', letterSpacing: '0.1em', margin: 0 }}>
                    TRANSACTIONS
                  </h2>
                  <span className="badge badge-gray">{block.tx.length}</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="explorer-table">
                    <thead>
                      <tr>
                        <th>TxID</th>
                        <th>Inputs</th>
                        <th>Outputs</th>
                        <th>Value Out</th>
                        <th>Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(typeof block.tx[0] === 'string' ? block.tx : block.tx).map((tx: any, i: number) => {
                        const txid = typeof tx === 'string' ? tx : tx.txid;
                        const isCoinbase = i === 0;
                        const inputs = typeof tx === 'object' ? tx.vin?.length ?? 0 : '—';
                        const outputs = typeof tx === 'object' ? tx.vout?.length ?? 0 : '—';
                        const totalOut = typeof tx === 'object'
                          ? tx.vout?.reduce((s: number, o: any) => s + (o.value || 0), 0).toFixed(4)
                          : '—';

                        return (
                          <tr key={txid} style={{ cursor: 'pointer' }} onClick={() => setExpandedTx(expandedTx === txid ? null : txid)}>
                            <td>
                              <Link href={`/tx/${txid}`} className="hash link" onClick={e => e.stopPropagation()}>
                                {truncate(txid)}
                              </Link>
                              {isCoinbase && <span className="badge badge-gold" style={{ marginLeft: '0.5rem' }}>coinbase</span>}
                            </td>
                            <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem' }}>{inputs}</td>
                            <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem' }}>{outputs}</td>
                            <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: 'var(--neon, #00ff88)' }}>
                              {totalOut} TAR
                            </td>
                            <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                              {typeof tx === 'object' ? fmtBytes(tx.size) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', marginTop: '4rem', padding: '1.5rem 2rem', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.85rem' }}>
        <Link href="/" className="link">← Back to Explorer</Link>
        {' · '}
        <a href="https://tarcoin.org" target="_blank" rel="noopener noreferrer" className="link">tarcoin.org</a>
      </footer>
    </div>
  );
}
