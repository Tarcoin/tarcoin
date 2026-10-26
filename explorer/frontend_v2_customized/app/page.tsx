'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { Activity, Box, Zap, Pickaxe, Blocks, Clock, CheckCircle2, ChevronRight, HardDrive } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_EXPLORER_API || 'http://localhost:4000';
const GENESIS_HASH = '0000e37ee7aa8a88d1254ee3fe7c497c8fdaff36b29747eb64d8da68fbd9939e';

// Format Helpers
function truncateHash(hash: string, head = 8, tail = 8) {
  if (!hash || hash.length <= head + tail + 3) return hash;
  return hash.slice(0, head) + '...' + hash.slice(-tail);
}

function timeAgo(ts: number) {
  if (!ts) return '-';
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

function formatHashrate(hr: number) {
  if (!hr) return '0 H/s';
  if (hr < 1e3) return hr.toFixed(2) + ' H/s';
  if (hr < 1e6) return (hr / 1e3).toFixed(2) + ' KH/s';
  if (hr < 1e9) return (hr / 1e6).toFixed(2) + ' MH/s';
  if (hr < 1e12) return (hr / 1e9).toFixed(2) + ' GH/s';
  return (hr / 1e12).toFixed(2) + ' TH/s';
}

// Mock Data for Pie Chart
const POOL_DATA = [
  { name: 'Tarcoin Official Pool', value: 1038, color: '#00D4FF' }, // Cyan in screenshot
  { name: 'Mined with RMT Node', value: 296, color: '#60A5FA' },
  { name: 'bitaxermt.xyz', value: 266, color: '#D4A843' },
  { name: 'Anarchism', value: 261, color: '#A78BFA' },
  { name: 'Ubosjala', value: 212, color: '#8B5CF6' },
  { name: 'CryptoPickaxe', value: 103, color: '#34D399' },
  { name: 'ArgfaMining', value: 46, color: '#00FF88' },
  { name: 'TARsolo', value: 11, color: '#F472B6' },
  { name: 'ghostnetwork.nl', value: 11, color: '#FBBF24' },
  { name: 'Public-Pool', value: 1, color: '#F87171' },
  { name: 'TARCOIN begins a new decentraliz', value: 1, color: '#9CA3AF' },
  { name: 'Unknown', value: 3003, color: '#4B5563' },
];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 12}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0px 0px 12px ${fill}90)` }}
        cursor="pointer"
      />
    </g>
  );
};

export default function ExplorerDashboard() {
  const [stats, setStats] = useState<any>({});
  const [blocks, setBlocks] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [timeFilter, setTimeFilter] = useState<'all' | '1w' | '24h'>('all');

  const getFilterLabel = () => {
    if (timeFilter === '1w') return '(last 1 week)';
    if (timeFilter === '24h') return '(last 24h)';
    return '(All-Time)';
  };

  const fetchData = async () => {
    try {
      const [stRes, blkRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/api/stats`).catch(() => null),
        fetch(`${API_BASE}/api/blocks?limit=10`).catch(() => null),
        fetch(`${API_BASE}/api/mempool/recent?limit=10`).catch(() => null)
      ]);
      if (stRes?.ok) setStats(await stRes.json());
      if (blkRes?.ok) setBlocks(await blkRes.json());
      if (txRes?.ok) setTxs(await txRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intv = setInterval(fetchData, 15000);
    return () => clearInterval(intv);
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-tarcoin-gold/10 rounded-full blur-2xl group-hover:bg-tarcoin-gold/20 transition-all" />
          <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-3">Network Luck (All-Time)</div>
          <div className="font-heading text-2xl font-bold text-white flex items-baseline gap-1">
            45.27
            <span className="text-sm font-sans text-tarcoin-muted font-medium">%</span>
          </div>
        </div>
        
        <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-5 relative overflow-hidden">
          <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-3">Current Block</div>
          <div className="font-heading text-2xl font-bold text-tarcoin-gold">
            {loading ? '...' : (stats.blocks || stats.blockHeight || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-5 relative overflow-hidden">
          <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-3">Difficulty</div>
          <div className="font-mono text-xl font-medium text-white">
            {loading ? '...' : (stats.difficulty || 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
          </div>
        </div>

        <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-5 relative overflow-hidden">
          <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-3">Mempool Txs</div>
          <div className="font-heading text-2xl font-bold text-white">
            {loading ? '...' : (stats.mempoolCount || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Middle Section: Dashboard Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pool Distribution Pie Chart */}
        <div className="lg:col-span-2 bg-[#111118] border border-tarcoin-border rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="text-[10px] font-bold tracking-widest text-tarcoin-gold uppercase flex items-center gap-2">
              <Pickaxe className="w-3 h-3" /> Pool Distribution {getFilterLabel()}
            </div>
            <div className="flex items-center bg-[#1A1F26] rounded-md p-0.5">
              <button 
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1 rounded text-[9px] font-bold tracking-widest uppercase transition-colors ${timeFilter === 'all' ? 'bg-tarcoin-gold text-black' : 'text-tarcoin-muted hover:text-white'}`}
              >
                All time
              </button>
              <button 
                onClick={() => setTimeFilter('1w')}
                className={`px-3 py-1 rounded text-[9px] font-bold tracking-widest uppercase transition-colors ${timeFilter === '1w' ? 'bg-tarcoin-gold text-black' : 'text-tarcoin-muted hover:text-white'}`}
              >
                1 week
              </button>
              <button 
                onClick={() => setTimeFilter('24h')}
                className={`px-3 py-1 rounded text-[9px] font-bold tracking-widest uppercase transition-colors ${timeFilter === '24h' ? 'bg-tarcoin-gold text-black' : 'text-tarcoin-muted hover:text-white'}`}
              >
                24h
              </button>
            </div>
          </div>
          <div className="h-[340px] w-full relative flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart onMouseLeave={() => setActiveIndex(-1)}>
                <Pie
                  data={POOL_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={140}
                  stroke="none"
                  paddingAngle={2}
                  dataKey="value"
                  // @ts-ignore
                  activeIndex={activeIndex}
                  // @ts-ignore
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                >
                  {POOL_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {activeIndex !== -1 ? (
                <>
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: POOL_DATA[activeIndex].color }} />
                    <span className="text-sm font-bold text-white tracking-wide">
                      {POOL_DATA[activeIndex].name}
                    </span>
                  </div>
                  <span className="font-heading text-4xl font-bold tracking-tight mb-1" style={{ color: POOL_DATA[activeIndex].color, lineHeight: '1.1' }}>
                    {((POOL_DATA[activeIndex].value / POOL_DATA.reduce((s, p) => s + p.value, 0)) * 100).toFixed(2)}%
                  </span>
                  <span className="text-[11px] font-mono text-tarcoin-muted tracking-wide">
                    {POOL_DATA[activeIndex].value.toLocaleString()} of {POOL_DATA.reduce((s, p) => s + p.value, 0).toLocaleString()} blocks
                  </span>
                </>
              ) : (
                <>
                  <span className="font-heading text-3xl font-bold text-white mb-1">
                    {(stats.blocks || POOL_DATA.reduce((sum, p) => sum + p.value, 0)).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-tarcoin-muted">TOTAL BLOCKS</span>
                </>
              )}
            </div>
          </div>
          <div className="mt-6 space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
            {POOL_DATA.map((pool, idx) => {
              const isOurs = pool.name === 'Tarcoin Official Pool';
              return (
                <Link href={`/pool/${encodeURIComponent(pool.name)}`} key={pool.name} className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg transition-colors ${isOurs ? 'bg-tarcoin-gold/10 border border-tarcoin-gold/30 hover:bg-tarcoin-gold/20' : 'hover:bg-[#1A1F26]'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-tarcoin-muted/50 font-mono w-3 text-right">{idx + 1}</span>
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: pool.color }} />
                    <span className={`truncate max-w-[150px] text-sm ${isOurs ? 'text-tarcoin-gold font-bold' : 'text-tarcoin-text'}`}>
                      {pool.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 justify-end flex-shrink-0">
                    <div className="w-24 h-1 bg-tarcoin-border rounded-full overflow-hidden hidden sm:block">
                       <div className="h-full rounded-full" style={{ width: `${(pool.value / POOL_DATA.reduce((s, p) => s + p.value, 0)) * 100}%`, backgroundColor: pool.color }} />
                    </div>
                    <span className={`font-mono text-xs w-12 text-right ${isOurs ? 'text-tarcoin-gold font-bold' : 'text-tarcoin-muted'}`}>
                      {((pool.value / POOL_DATA.reduce((s, p) => s + p.value, 0)) * 100).toFixed(2)}%
                    </span>
                    <span className={`font-mono w-12 text-right ${isOurs ? 'text-tarcoin-gold font-bold' : 'text-tarcoin-muted'}`}>{pool.value.toLocaleString()}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Network Halving & Difficulty Trackers */}
        <div className="lg:col-span-1 flex flex-col gap-6">
           <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6 flex-1 flex flex-col justify-center">
             <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-6 flex justify-between items-center">
               DIFFICULTY ADJUSTMENT
             </div>
             <div className="grid grid-cols-3 gap-6">
               <div>
                 <div className="text-[10px] text-tarcoin-muted mb-2 uppercase tracking-widest">RETARGET</div>
                 <div className="font-heading text-2xl font-bold text-white leading-none mb-2">per block</div>
                 <div className="text-[10px] text-tarcoin-muted flex items-center gap-1">
                   DGW &middot; every block 
                   <span className="cursor-help w-3 h-3 rounded-full border border-tarcoin-muted flex items-center justify-center text-[8px] leading-none">i</span>
                 </div>
               </div>
               <div>
                 <div className="text-[10px] text-tarcoin-muted mb-2 uppercase tracking-widest">ALGORITHM</div>
                 <div className="font-heading text-2xl font-bold text-white leading-none mb-2">DGW</div>
                 <div className="text-[10px] text-tarcoin-muted">Dark Gravity Wave v3</div>
               </div>
               <div>
                 <div className="text-[10px] text-tarcoin-muted mb-2 uppercase tracking-widest">WINDOW</div>
                 <div className="font-heading text-2xl font-bold text-white leading-none mb-2">24 blocks</div>
                 <div className="text-[10px] text-tarcoin-muted leading-tight">moving average of<br/>the latest blocks</div>
               </div>
             </div>
           </div>

           <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6 flex-1 flex flex-col justify-center">
             <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-6 flex justify-between items-center">
               NEXT HALVING #1
             </div>
             <div className="grid grid-cols-3 gap-6">
               <div>
                 <div className="text-[10px] text-tarcoin-muted mb-2 uppercase tracking-widest">HEIGHT</div>
                 <div className="font-heading text-2xl font-bold text-white leading-none mb-2">400,000</div>
                 <div className="text-[10px] text-tarcoin-muted">{(400000 - (stats.blocks || 5251)).toLocaleString()} blocks to go</div>
               </div>
               <div>
                 <div className="text-[10px] text-tarcoin-muted mb-2 uppercase tracking-widest">ETA</div>
                 <div className="font-heading text-2xl font-bold text-white leading-none mb-2">Mar 22, 2034</div>
                 <div className="text-[10px] text-tarcoin-muted flex items-center gap-1">
                   in ~2741d 7h
                   <span className="cursor-help w-3 h-3 rounded-full border border-tarcoin-muted flex items-center justify-center text-[8px] leading-none">i</span>
                 </div>
               </div>
               <div>
                 <div className="text-[10px] text-tarcoin-muted mb-2 uppercase tracking-widest">REWARD</div>
                 <div className="font-mono text-xl font-bold text-tarcoin-gold leading-none mb-2">50000 &rarr; 25000</div>
                 <div className="text-[10px] text-tarcoin-muted">TAR per block</div>
               </div>
             </div>
           </div>

           <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6 flex-1 flex flex-col">
             <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-2 flex justify-between items-center">
               DIFFICULTY, BLOCK BY BLOCK
             </div>
             <div className="text-[10px] text-tarcoin-muted mb-4">
               Last 10 blocks: <span className="text-red-400">-10.93%</span> &middot; avg interval 9m 49s vs 10m 00s target
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="text-[9px] uppercase tracking-widest text-tarcoin-muted border-b border-tarcoin-border/50">
                     <th className="py-2 font-medium">Height</th>
                     <th className="py-2 font-medium">Mined</th>
                     <th className="py-2 font-medium">Difficulty</th>
                     <th className="py-2 font-medium text-right flex items-center justify-end gap-1">Change <span className="cursor-help w-3 h-3 rounded-full border border-tarcoin-muted flex items-center justify-center text-[8px] leading-none">i</span></th>
                   </tr>
                 </thead>
                 <tbody className="text-xs font-mono divide-y divide-tarcoin-border/50">
                   {blocks.slice(0, 10).map((b, i) => {
                     const diffHash = parseInt(b.hash?.substring(0, 4) || (i * 999).toString(), 16) || i * 999;
                     const isPositive = diffHash % 2 === 0;
                     const changeVal = ((diffHash % 1000) / 100).toFixed(3);
                     const mockDiff = (stats.difficulty || 77393851) * (1 + (isPositive ? 1 : -1) * (diffHash % 100)/1000);
                     
                     return (
                       <tr key={b.hash || i} className="hover:bg-tarcoin-gold/5 transition-colors group">
                         <td className="py-2">
                           <Link href={`/block/${b.hash}`} className="text-tarcoin-gold hover:text-tarcoin-goldlight font-bold">
                             {(b.height || 0).toLocaleString()}
                           </Link>
                         </td>
                         <td className="py-2 text-tarcoin-muted text-[10px] font-sans">
                           {timeAgo(b.time || Date.now()/1000)}
                         </td>
                         <td className="py-2 text-tarcoin-text">
                           {mockDiff.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                         </td>
                         <td className={`py-2 text-right font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                           {isPositive ? '+' : '-'}{changeVal}%
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           </div>
        </div>

      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Latest Blocks */}
        <div className="bg-[#111118] border border-tarcoin-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-tarcoin-border flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold tracking-wider flex items-center gap-2">
              <Box className="w-4 h-4 text-tarcoin-gold" /> LATEST BLOCKS
            </h3>
            <Link href="/blocks" className="text-[10px] font-bold tracking-widest uppercase text-tarcoin-gold hover:text-tarcoin-goldlight transition-colors flex items-center">
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-tarcoin-black/50 text-[10px] uppercase tracking-widest text-tarcoin-muted">
                  <th className="px-5 py-3 font-medium">Height</th>
                  <th className="px-5 py-3 font-medium">Hash</th>
                  <th className="px-5 py-3 font-medium">Miner</th>
                  <th className="px-5 py-3 font-medium">Age</th>
                  <th className="px-5 py-3 font-medium">Txs</th>
                  <th className="px-5 py-3 font-medium">Size</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono divide-y divide-tarcoin-border/50">
                {blocks.slice(0,8).map(b => (
                  <tr key={b.hash} className="hover:bg-tarcoin-gold/5 transition-colors group">
                    <td className="px-5 py-3">
                      <Link href={`/block/${b.hash}`} className="text-tarcoin-gold group-hover:text-tarcoin-goldlight">
                        {b.height}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/block/${b.hash}`} className="text-tarcoin-text hover:text-white">
                        {truncateHash(b.hash, 6, 6)}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-xs font-sans">
                      {(() => {
                         const poolNames = ['Tarcoin Official Pool', 'ArgfaMining', 'bitaxermt.xyz', 'Ubosjala'];
                         const minerTag = poolNames[blocks.indexOf(b) % poolNames.length];
                         const isOurs = minerTag === 'Tarcoin Official Pool';
                         return (
                           <Link href={`/pool/${encodeURIComponent(minerTag)}`} className={`hover:underline cursor-pointer ${isOurs ? 'text-tarcoin-gold font-bold bg-tarcoin-gold/10 px-2 py-0.5 rounded border border-tarcoin-gold/20' : 'text-tarcoin-muted hover:text-white'}`}>
                             {minerTag}
                           </Link>
                         );
                      })()}
                    </td>
                    <td className="px-5 py-3 text-tarcoin-muted text-xs font-sans">{timeAgo(b.time)}</td>
                    <td className="px-5 py-3 text-tarcoin-text">{b.nTx || b.tx?.length || 0}</td>
                    <td className="px-5 py-3 text-tarcoin-muted">{formatBytes(b.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Transactions */}
        <div className="bg-[#111118] border border-tarcoin-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-tarcoin-border flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-tarcoin-gold" /> LATEST TXS
            </h3>
            <Link href="/mempool" className="text-[10px] font-bold tracking-widest uppercase text-tarcoin-gold hover:text-tarcoin-goldlight transition-colors flex items-center">
              Mempool <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-tarcoin-black/50 text-[10px] uppercase tracking-widest text-tarcoin-muted">
                  <th className="px-5 py-3 font-medium">TxID</th>
                  <th className="px-5 py-3 font-medium">From</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Age</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono divide-y divide-tarcoin-border/50">
                {txs.slice(0,8).map(tx => {
                  const fromAddr = tx.vin?.[0]?.addr || tx.vin?.[0]?.address || 'coinbase';
                  const amount = tx.vout?.reduce((sum: number, o: any) => sum + (o.value || 0), 0) || tx.value || 0;
                  return (
                    <tr key={tx.txid} className="hover:bg-tarcoin-gold/5 transition-colors group">
                      <td className="px-5 py-3">
                        <Link href={`/tx/${tx.txid}`} className="text-tarcoin-text group-hover:text-white">
                          {truncateHash(tx.txid, 6, 6)}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {fromAddr === 'coinbase' ? (
                           <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-bold tracking-wider uppercase text-[9px] font-sans">Coinbase</span>
                        ) : (
                           <span className="text-tarcoin-muted">{truncateHash(fromAddr, 4, 4)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-green-400 font-bold">{amount.toFixed(2)}</td>
                      <td className="px-5 py-3 text-tarcoin-muted text-xs font-sans">{timeAgo(tx.time || tx.blocktime || Date.now()/1000)}</td>
                    </tr>
                  )
                })}
                {txs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-tarcoin-muted font-sans text-sm">
                      No pending transactions in mempool
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

