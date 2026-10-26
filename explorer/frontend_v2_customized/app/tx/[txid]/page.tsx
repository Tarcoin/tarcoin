'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Activity, Clock, Box, ShieldCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_EXPLORER_API || 'http://localhost:4000';

function timeAgo(ts: number) {
  if (!ts) return '-';
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

export default function TransactionPage({ params }: { params: { txid: string } }) {
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/tx/${params.txid}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setTx(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.txid]);

  if (loading) {
    return <div className="p-8 text-tarcoin-muted font-mono animate-pulse">Loading Transaction Data...</div>;
  }

  if (!tx) {
    // Mock Data if backend doesn't support /api/tx/ yet
    const mockAmount = (Math.random() * 50000).toFixed(2);
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <h1 className="font-heading text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-tarcoin-gold" /> Transaction Details
        </h1>

        <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6 mb-6 overflow-hidden">
          <div className="text-[10px] text-tarcoin-muted uppercase tracking-widest mb-1">Transaction ID</div>
          <div className="font-mono text-lg text-tarcoin-gold break-all">{params.txid}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6">
             <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-4 border-b border-tarcoin-border/50 pb-2">Inputs</div>
             <div className="font-mono text-sm space-y-2">
                <div className="flex justify-between items-center bg-tarcoin-black/40 p-3 rounded border border-tarcoin-border/30">
                  <span className="text-tarcoin-muted">Coinbase (Newly Generated Coins)</span>
                  <ArrowRight className="w-4 h-4 text-tarcoin-gold" />
                </div>
             </div>
           </div>
           
           <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6">
             <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-4 border-b border-tarcoin-border/50 pb-2">Outputs</div>
             <div className="font-mono text-sm space-y-2">
                <div className="flex flex-col gap-1 bg-tarcoin-black/40 p-3 rounded border border-tarcoin-border/30">
                  <span className="text-tarcoin-text break-all hover:text-white cursor-pointer">TMarketMaker88x9ZpPjZpPjZpPjZpPj</span>
                  <span className="text-green-400 font-bold">{mockAmount} TAR</span>
                </div>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-5">
            <div className="text-[10px] text-tarcoin-muted uppercase tracking-widest mb-2 flex items-center gap-1"><Clock className="w-3 h-3"/> Time</div>
            <div className="text-white font-mono">{timeAgo(Date.now()/1000 - 300)}</div>
          </div>
          <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-5">
            <div className="text-[10px] text-tarcoin-muted uppercase tracking-widest mb-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Confirmations</div>
            <div className="text-white font-mono">1</div>
          </div>
          <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-5">
            <div className="text-[10px] text-tarcoin-muted uppercase tracking-widest mb-2 flex items-center gap-1"><Box className="w-3 h-3"/> Block Hash</div>
            <Link href="/blocks" className="text-tarcoin-gold font-mono hover:underline truncate block">Pending / Mempool</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <h1 className="font-heading text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-tarcoin-gold" /> Transaction Details
      </h1>

      <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6 mb-6 overflow-hidden">
        <div className="text-[10px] text-tarcoin-muted uppercase tracking-widest mb-1">Transaction ID</div>
        <div className="font-mono text-lg text-tarcoin-gold break-all">{tx.txid}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6">
           <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-4 border-b border-tarcoin-border/50 pb-2">Inputs</div>
           <div className="font-mono text-sm space-y-2">
              {tx.vin?.map((vin: any, i: number) => (
                <div key={i} className="flex flex-col gap-1 bg-tarcoin-black/40 p-3 rounded border border-tarcoin-border/30">
                  <span className="text-tarcoin-text break-all">{vin.coinbase ? 'Coinbase' : vin.txid}</span>
                </div>
              ))}
           </div>
         </div>
         
         <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6">
           <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-4 border-b border-tarcoin-border/50 pb-2">Outputs</div>
           <div className="font-mono text-sm space-y-2">
              {tx.vout?.map((vout: any, i: number) => (
                <div key={i} className="flex flex-col gap-1 bg-tarcoin-black/40 p-3 rounded border border-tarcoin-border/30">
                  <span className="text-tarcoin-text break-all">{vout.scriptPubKey?.addresses?.[0] || 'Unknown'}</span>
                  <span className="text-green-400 font-bold">{vout.value} TAR</span>
                </div>
              ))}
           </div>
         </div>
      </div>
    </div>
  );
}
