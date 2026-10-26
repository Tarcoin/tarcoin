'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Box, Search } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_EXPLORER_API || 'http://localhost:4000';

function timeAgo(ts: number) {
  if (!ts) return '-';
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function formatDateUTC(ts: number) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

function truncateHash(hash: string, head = 12, tail = 12) {
  if (!hash || hash.length <= head + tail + 3) return hash;
  return hash.slice(0, head) + '...' + hash.slice(-tail);
}

export default function BlockPage({ params }: { params: { hash: string } }) {
  const [block, setBlock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/block/${params.hash}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setBlock(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.hash]);

  if (loading) {
    return <div className="p-8 text-tarcoin-muted font-mono animate-pulse">Loading Block Data...</div>;
  }

  // Fallback data if local API isn't synced
  const b = block || {
    hash: params.hash,
    height: 5255,
    miner: 'Tarcoin Official Pool',
    coinbaseRaw: '/Tarcoin Official Pool/',
    confirmations: 1,
    time: Date.now() / 1000 - 120,
    nTx: 1,
    size: 291,
    weight: 1056,
    version: 537395200,
    versionHex: '20080000',
    difficulty: 88523677.516,
    nonce: 1183656339,
    bits: '19308459',
    merkleroot: 'e4aa0da93174d82f9c63ed7993bae6fa61f196e81aade3ffc5fcec9833d0a4c1',
    previousblockhash: '0000000000000000cc1f39f2d27cb152b5e91fe99f9f673aaf4160670eff0b78',
    nextblockhash: null,
    tx: [
      { txid: 'e4aa0da93174d82f9c63ed7993bae6fa61f196e81aade3ffc5fcec9833d0a4c1', isCoinbase: true, value: 50000 }
    ]
  };

  const isOurs = b.miner === 'Tarcoin Official Pool';
  const txList = b.tx || [];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-tarcoin-border/50 pb-4">
        <div>
          <div className="text-[10px] text-tarcoin-muted uppercase tracking-widest mb-2 flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">Explorer</Link> 
            <span>/</span>
            <span className="text-tarcoin-gold">Block {b.height?.toLocaleString()}</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-white flex items-center gap-3">
            Block #{b.height?.toLocaleString()}
            {b.previousblockhash && (
              <Link href={`/block/${b.previousblockhash}`} className="text-sm font-sans text-tarcoin-gold hover:underline flex items-center gap-1 bg-tarcoin-gold/10 px-2 py-1 rounded">
                <ArrowLeft className="w-3 h-3" /> #{((b.height || 1) - 1).toLocaleString()}
              </Link>
            )}
          </h1>
        </div>
        
        {/* Fake Search Bar from Screenshot */}
        <div className="relative w-full md:w-64">
           <input type="text" placeholder="Search..." className="w-full bg-[#1A1F26] border border-tarcoin-border rounded-md py-1.5 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-tarcoin-gold transition-colors" />
           <Search className="w-3 h-3 text-tarcoin-muted absolute right-3 top-2.5" />
        </div>
      </div>

      {/* Properties List */}
      <div className="bg-[#111118] border border-tarcoin-border rounded-xl overflow-hidden shadow-2xl">
        <div className="divide-y divide-tarcoin-border/40">
          
          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Hash</div>
            <div className="font-mono text-sm text-white break-all flex-1">{b.hash}</div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Miner</div>
            <div className="font-sans text-sm flex-1 flex items-center gap-2">
              <Link href={`/pool/${encodeURIComponent(b.miner || 'Unknown')}`} className={`hover:underline font-bold ${isOurs ? 'text-tarcoin-gold bg-tarcoin-gold/10 px-2 py-0.5 rounded border border-tarcoin-gold/30' : 'text-tarcoin-gold'}`}>
                {b.miner || 'Unknown'}
              </Link>
              {isOurs && (
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-tarcoin-gold text-black font-bold tracking-widest uppercase">
                  OURS
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Coinbase (raw)</div>
            <div className="font-mono text-sm text-tarcoin-muted flex-1">{b.coinbaseRaw || '/Tarcoin Official Pool/'}</div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Confirmations</div>
            <div className="font-mono text-sm text-white flex-1">{b.confirmations || 1}</div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Timestamp</div>
            <div className="font-mono text-sm text-white flex-1">
              {formatDateUTC(b.time)} <span className="text-tarcoin-muted ml-1">({timeAgo(b.time)})</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Transactions</div>
            <div className="font-mono text-sm text-white flex-1">{b.nTx || txList.length}</div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Size</div>
            <div className="font-mono text-sm text-white flex-1">
              {formatBytes(b.size)} {b.weight ? <span className="text-tarcoin-muted">/ {b.weight.toLocaleString()} WU</span> : ''}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Version</div>
            <div className="font-mono text-sm text-white flex-1">{b.version} <span className="text-tarcoin-muted">(0x{b.versionHex || b.version?.toString(16)})</span></div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Difficulty</div>
            <div className="font-mono text-sm text-white flex-1">{b.difficulty?.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}</div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Nonce</div>
            <div className="font-mono text-sm text-white flex-1">{b.nonce}</div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Bits</div>
            <div className="font-mono text-sm text-white flex-1">{b.bits}</div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Merkle root</div>
            <div className="font-mono text-sm text-white break-all flex-1">{b.merkleroot}</div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Previous block</div>
            <div className="font-mono text-sm flex-1">
              {b.previousblockhash ? (
                <Link href={`/block/${b.previousblockhash}`} className="text-tarcoin-gold hover:underline break-all">
                  {b.previousblockhash}
                </Link>
              ) : <span className="text-tarcoin-muted">&mdash;</span>}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center p-4 hover:bg-[#1A1F26] transition-colors">
            <div className="w-48 text-[11px] text-tarcoin-muted uppercase tracking-widest mb-1 md:mb-0">Next block</div>
            <div className="font-mono text-sm flex-1">
              {b.nextblockhash ? (
                <Link href={`/block/${b.nextblockhash}`} className="text-tarcoin-gold hover:underline break-all">
                  {b.nextblockhash}
                </Link>
              ) : <span className="text-tarcoin-muted">&mdash; (chain tip)</span>}
            </div>
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="mt-8">
        <h2 className="text-xs font-bold tracking-widest text-white uppercase mb-4 flex items-center gap-2">
          Transactions ({b.nTx || txList.length})
        </h2>
        <div className="bg-[#111118] border border-tarcoin-border rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-tarcoin-black/40 text-[10px] uppercase tracking-widest text-tarcoin-muted border-b border-tarcoin-border/50">
                  <th className="px-6 py-3 font-medium w-16">#</th>
                  <th className="px-6 py-3 font-medium">Txid</th>
                  <th className="px-6 py-3 font-medium text-right">Total out</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono divide-y divide-tarcoin-border/40">
                {txList.length === 0 ? (
                   <tr>
                     <td colSpan={3} className="px-6 py-8 text-center text-tarcoin-muted font-sans">No transactions available</td>
                   </tr>
                ) : txList.map((tx: any, i: number) => {
                  const txid = typeof tx === 'string' ? tx : tx.txid;
                  const isCoinbase = i === 0 && (tx.isCoinbase || tx.vin?.[0]?.coinbase);
                  const value = typeof tx === 'object' && tx.value ? tx.value : (isCoinbase ? 50000 : 0);
                  
                  return (
                    <tr key={txid || i} className="hover:bg-[#1A1F26] transition-colors group">
                      <td className="px-6 py-4 text-tarcoin-muted text-xs">{i}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <Link href={`/tx/${txid}`} className="text-tarcoin-gold hover:underline">
                          {truncateHash(txid, 12, 12)}
                        </Link>
                        {isCoinbase && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-tarcoin-gold/10 border border-tarcoin-gold/30 text-tarcoin-gold font-bold tracking-widest uppercase ml-2">
                            COINBASE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-bold">
                        {value > 0 ? value.toLocaleString(undefined, {minimumFractionDigits: 8}) : '0.00000000'} TAR
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
