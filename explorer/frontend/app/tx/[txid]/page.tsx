'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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

export default function TxPage() {
  const { txid } = useParams<{ txid: string }>();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!txid) return;
    setLoading(true);
    fetch(`${API}/api/tx/${txid}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { setTx(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [txid]);

  const confirmed = tx?.confirmations > 0;
  const totalOut = tx?.vout?.reduce((s: number, o: any) => s + (o.value || 0), 0) ?? 0;
  const totalIn = tx?.vin?.reduce((s: number, i: any) => s + (i.value || i.prevout?.value || 0), 0) ?? 0;
  const fee = totalIn > 0 ? Math.max(0, totalIn - totalOut) : 0;
  const isCoinbase = tx?.vin?.[0]?.coinbase !== undefined;

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
          ₮ TARCOIN
        </Link>
        <span style={{ color: 'var(--border)', fontSize: '1.2rem' }}>›</span>
        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>TRANSACTION</span>
        <span style={{ color: 'var(--border)', fontSize: '1.2rem' }}>›</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--gold)' }}>{truncate(String(txid), 12, 12)}</span>
      </nav>

      <div className="container" style={{ padding: '2rem' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <div className="spinner" />
          </div>
        )}

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

        {tx && !loading && (
          <>
            {/* Status + title */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1rem', color: 'var(--gold)', letterSpacing: '0.1em', margin: 0 }}>
                TRANSACTION
              </h1>
              {isCoinbase
                ? <span className="badge badge-gold">COINBASE</span>
                : confirmed
                  ? <span className="badge badge-green"><span className="pulse-dot" style={{ marginRight: '4px' }} />CONFIRMED</span>
                  : <span className="badge" style={{ background: 'rgba(255,165,0,0.1)', color: 'orange', border: '1px solid rgba(255,165,0,0.3)' }}><span className="pulse-dot" style={{ background: 'orange', marginRight: '4px' }} />PENDING</span>
              }
              {tx.confirmations > 0 && (
                <span className="badge badge-gray">{tx.confirmations.toLocaleString()} confirmations</span>
              )}
            </motion.div>

            {/* Summary */}
            <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem', color: 'var(--gold)', margin: 0, letterSpacing: '0.1em' }}>SUMMARY</h2>
              </div>
              <div style={{ padding: '0.5rem 1.25rem' }}>
                {[
                  ['TxID', <span className="hash" style={{ fontSize: '0.78rem', userSelect: 'all' }}>{tx.txid}</span>],
                  ['Block Hash', tx.blockhash
                    ? <Link href={`/block/${tx.blockhash}`} className="hash link" style={{ fontSize: '0.78rem' }}>{truncate(tx.blockhash)}</Link>
                    : <span style={{ color: 'var(--text-dim)' }}>Unconfirmed</span>],
                  ['Confirmations', tx.confirmations?.toLocaleString() ?? '0'],
                  ['Timestamp', tx.time ? `${fmtTime(tx.time)} (${timeAgo(tx.time)})` : 'Unconfirmed'],
                  ['Size', tx.size ? `${tx.size.toLocaleString()} bytes` : '—'],
                  ['Virtual Size', tx.vsize ? `${tx.vsize.toLocaleString()} vbytes` : '—'],
                  ['Weight', tx.weight ? `${tx.weight.toLocaleString()} WU` : '—'],
                  ['Version', tx.version],
                  ['LockTime', tx.locktime],
                  ['Total Output', <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--neon, #00ff88)' }}>{totalOut.toFixed(8)} TAR</span>],
                  ['Fee', isCoinbase
                    ? <span style={{ color: 'var(--text-dim)' }}>N/A (coinbase)</span>
                    : fee > 0
                      ? <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--gold)' }}>{fee.toFixed(8)} TAR</span>
                      : <span style={{ color: 'var(--text-dim)' }}>—</span>],
                ].map(([label, value]) => (
                  <div key={String(label)} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value as any}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Inputs */}
              <motion.div className="card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem', color: 'var(--gold)', margin: 0, letterSpacing: '0.1em' }}>INPUTS</h2>
                  <span className="badge badge-gray">{tx.vin?.length ?? 0}</span>
                </div>
                <div style={{ padding: '0.75rem 1.25rem' }}>
                  {tx.vin?.map((inp: any, i: number) => (
                    <div key={i} style={{
                      padding: '0.75rem', marginBottom: '0.5rem',
                      background: 'var(--black-3)', borderRadius: '8px',
                      border: '1px solid rgba(212,168,67,0.06)',
                    }}>
                      {inp.coinbase ? (
                        <div>
                          <span className="badge badge-gold" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>COINBASE</span>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-dim)', wordBreak: 'break-all' }}>
                            {inp.coinbase}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                            {truncate(inp.txid ?? '', 10, 10)}:{inp.vout}
                          </div>
                          {inp.prevout?.scriptpubkey_address && (
                            <Link href={`/address/${inp.prevout.scriptpubkey_address}`} className="link" style={{ fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace' }}>
                              {truncate(inp.prevout.scriptpubkey_address, 10, 10)}
                            </Link>
                          )}
                          {inp.prevout?.value !== undefined && (
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--gold)', marginTop: '0.25rem' }}>
                              {inp.prevout.value.toFixed(8)} TAR
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Outputs */}
              <motion.div className="card" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem', color: 'var(--gold)', margin: 0, letterSpacing: '0.1em' }}>OUTPUTS</h2>
                  <span className="badge badge-gray">{tx.vout?.length ?? 0}</span>
                </div>
                <div style={{ padding: '0.75rem 1.25rem' }}>
                  {tx.vout?.map((out: any, i: number) => {
                    const addr = out.scriptPubKey?.address ?? out.scriptPubKey?.addresses?.[0];
                    const type = out.scriptPubKey?.type ?? '—';
                    return (
                      <div key={i} style={{
                        padding: '0.75rem', marginBottom: '0.5rem',
                        background: 'var(--black-3)', borderRadius: '8px',
                        border: '1px solid rgba(212,168,67,0.06)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div>
                            {addr
                              ? <Link href={`/address/${addr}`} className="link" style={{ fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace' }}>{truncate(addr, 10, 10)}</Link>
                              : <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>{type}</span>
                            }
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.2rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>{type}</div>
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: 'var(--neon, #00ff88)', whiteSpace: 'nowrap' }}>
                            {(out.value ?? 0).toFixed(8)} TAR
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>TOTAL OUT</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--neon, #00ff88)', fontWeight: 700 }}>{totalOut.toFixed(8)} TAR</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Raw hex toggle */}
            {tx.hex && (
              <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <button onClick={() => setShowRaw(!showRaw)} style={{
                  width: '100%', padding: '1rem 1.25rem', background: 'none', border: 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', color: 'var(--text-dim)',
                }}>
                  <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', letterSpacing: '0.1em' }}>RAW HEX</span>
                  <span style={{ color: 'var(--gold)' }}>{showRaw ? '▲' : '▼'}</span>
                </button>
                {showRaw && (
                  <div style={{
                    padding: '0 1.25rem 1.25rem',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                    color: 'var(--text-dim)', wordBreak: 'break-all',
                    borderTop: '1px solid var(--border)', paddingTop: '1rem',
                    maxHeight: '200px', overflowY: 'auto',
                  }}>
                    {tx.hex}
                  </div>
                )}
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
