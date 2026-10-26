'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

const API = process.env.NEXT_PUBLIC_EXPLORER_API || 'http://localhost:4000';

function truncate(s: string, h = 8, t = 8) {
  if (!s || s.length <= h + t + 3) return s;
  return `${s.slice(0, h)}...${s.slice(-t)}`;
}

function fmtTime(ts: number) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString();
}

type Tab = 'txs' | 'utxos';

export default function AddressPage() {
  const { address } = useParams<{ address: string }>();
  const [info, setInfo] = useState<any>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [utxos, setUtxos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [txsLoading, setTxsLoading] = useState(false);
  const [utxosLoading, setUtxosLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('txs');

  // Detect address type
  const addrType = address?.startsWith('tar1') ? 'bech32 (SegWit)'
    : address?.startsWith('T') ? 'P2PKH (Base58)'
    : address?.startsWith('3') ? 'P2SH'
    : 'Unknown';

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch(`${API}/api/address/${address}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setInfo(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });

    // Always fetch txs
    setTxsLoading(true);
    fetch(`${API}/api/address/${address}/txs`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setTxs(Array.isArray(d) ? d : []); setTxsLoading(false); })
      .catch(() => setTxsLoading(false));
  }, [address]);

  // Lazy-fetch UTXOs on tab switch
  useEffect(() => {
    if (tab !== 'utxos' || utxos.length > 0) return;
    setUtxosLoading(true);
    fetch(`${API}/api/address/${address}/utxo`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setUtxos(Array.isArray(d) ? d : []); setUtxosLoading(false); })
      .catch(() => setUtxosLoading(false));
  }, [tab, address, utxos.length]);

  const totalUtxoValue = utxos.reduce((s, u) => s + (u.amount || 0), 0);

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
        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>ADDRESS</span>
        <span style={{ color: 'var(--border)', fontSize: '1.2rem' }}>›</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--gold)' }}>{truncate(String(address), 10, 10)}</span>
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
            <div style={{ color: '#ff6b6b', fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>
            <Link href="/" className="link">← Back to Explorer</Link>
          </motion.div>
        )}

        {!loading && (
          <>
            {/* QR / address display */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* QR placeholder */}
              <div style={{
                width: '110px', height: '110px', flexShrink: 0,
                border: '2px solid var(--gold)', borderRadius: '8px',
                background: 'var(--black-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Corner markers */}
                {[['0 0', '12px 0 0 0'], ['auto 0 0 auto', '0 12px 0 0'], ['0 auto auto 0', '0 0 12px 0'], ['auto auto 0 0', '0 0 0 12px']].map(([pos, r], i) => (
                  <div key={i} style={{
                    position: 'absolute', width: '20px', height: '20px',
                    border: '3px solid var(--gold)', inset: pos as any,
                    borderRadius: r, background: 'transparent',
                  }} />
                ))}
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.45rem',
                  color: 'var(--gold)', textAlign: 'center', padding: '4px',
                  wordBreak: 'break-all', lineHeight: 1.3, opacity: 0.7,
                  maxWidth: '80px',
                }}>
                  {address?.slice(0, 20)}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.12em', marginBottom: '0.4rem' }}>
                  TARCOIN ADDRESS
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(0.65rem, 1.5vw, 0.85rem)',
                  color: 'var(--gold)', wordBreak: 'break-all', marginBottom: '0.5rem',
                  userSelect: 'all', cursor: 'text',
                }}>
                  {address}
                </div>
                <span className="badge badge-gray">{addrType}</span>
              </div>
            </motion.div>

            {/* Summary card */}
            <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem', color: 'var(--gold)', letterSpacing: '0.1em', margin: 0 }}>OVERVIEW</h1>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0' }}>
                {[
                  { label: 'Balance', value: <span className="stat-value">{((info?.balance ?? 0)).toFixed(4)} <span style={{ fontSize: '0.7rem' }}>TAR</span></span> },
                  { label: 'Total Received', value: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--neon, #00ff88)', fontSize: '1.1rem' }}>+{(info?.totalReceived ?? 0).toFixed(4)} TAR</span> },
                  { label: 'Total Sent', value: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#ff6b6b', fontSize: '1.1rem' }}>-{(info?.totalSent ?? 0).toFixed(4)} TAR</span> },
                  { label: 'Transactions', value: <span style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--gold)', fontSize: '1.3rem', fontWeight: 700 }}>{(info?.txCount ?? txs.length).toLocaleString()}</span> },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    padding: '1.25rem', borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div className="stat-label" style={{ marginBottom: '0.4rem' }}>{label}</div>
                    {value}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button className={`tab-btn ${tab === 'txs' ? 'active' : ''}`} onClick={() => setTab('txs')}>
                Transactions {txs.length > 0 && `(${txs.length})`}
              </button>
              <button className={`tab-btn ${tab === 'utxos' ? 'active' : ''}`} onClick={() => setTab('utxos')}>
                UTXOs {utxos.length > 0 && `(${utxos.length})`}
              </button>
            </div>

            {/* Transactions tab */}
            {tab === 'txs' && (
              <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {txsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <div className="spinner" />
                  </div>
                ) : txs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>No transactions found</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="explorer-table">
                      <thead>
                        <tr>
                          <th>TxID</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Confirmations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txs.map((tx: any) => {
                          const amount = tx.amount ?? 0;
                          const isPos = amount >= 0;
                          return (
                            <tr key={tx.txid}>
                              <td>
                                <Link href={`/tx/${tx.txid}`} className="hash link">
                                  {truncate(tx.txid)}
                                </Link>
                              </td>
                              <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                                {tx.time ? fmtTime(tx.time) : '—'}
                              </td>
                              <td style={{ fontFamily: 'JetBrains Mono, monospace', color: isPos ? 'var(--neon, #00ff88)' : '#ff6b6b', fontSize: '0.85rem' }}>
                                {isPos ? '+' : ''}{amount.toFixed(8)} TAR
                              </td>
                              <td>
                                {tx.confirmations > 0
                                  ? <span className="badge badge-green">{tx.confirmations.toLocaleString()}</span>
                                  : <span className="badge" style={{ background: 'rgba(255,165,0,0.1)', color: 'orange', border: '1px solid rgba(255,165,0,0.3)' }}>Pending</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* UTXOs tab */}
            {tab === 'utxos' && (
              <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {utxosLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <div className="spinner" />
                  </div>
                ) : utxos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>No UTXOs found</div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="explorer-table">
                        <thead>
                          <tr>
                            <th>TxID:Vout</th>
                            <th>Amount</th>
                            <th>Confirmations</th>
                            <th>Spendable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {utxos.map((u: any) => (
                            <tr key={`${u.txid}:${u.vout}`}>
                              <td>
                                <Link href={`/tx/${u.txid}`} className="hash link">
                                  {truncate(u.txid)}:{u.vout}
                                </Link>
                              </td>
                              <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--neon, #00ff88)', fontSize: '0.85rem' }}>
                                {(u.amount ?? 0).toFixed(8)} TAR
                              </td>
                              <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem' }}>
                                {u.confirmations?.toLocaleString() ?? '—'}
                              </td>
                              <td>
                                {u.spendable
                                  ? <span className="badge badge-green">Spendable</span>
                                  : <span className="badge badge-gray">Watch-only</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>TOTAL UTXO VALUE</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--gold)', fontWeight: 700 }}>{totalUtxoValue.toFixed(8)} TAR</span>
                    </div>
                  </>
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
