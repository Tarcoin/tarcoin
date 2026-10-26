'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Trophy, ChevronRight, Coins, Search, ShieldCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_EXPLORER_API || 'http://localhost:4000';

function truncateHash(hash: string, head = 12, tail = 12) {
  if (!hash || hash.length <= head + tail + 3) return hash;
  return hash.slice(0, head) + '...' + hash.slice(-tail);
}

// Mock Data matching the new layout request
const RESERVE_WALLET = {
  address: 'TRX7u9aK7ZpPjZpPjZpPjZpPjZpPjZpPj',
  balance: 10000000000,
  percentage: 97.4,
  label: 'Genesis Reserve'
};

const MOCK_RICHLIST = [
  { address: 'TMarketMaker88x9ZpPjZpPjZpPjZpPj', balance: 2500000, percentage: 7.3, rank: 1, label: 'Exchange Hot Wallet' },
  { address: 'TOfficialPool33x9ZpPjZpPjZpPjZp', balance: 1250000, percentage: 4.1, rank: 2, label: 'Tarcoin Official Pool' },
  { address: 'TPoolReward77x9ZpPjZpPjZpPjZpPj', balance: 750000, percentage: 2.5, rank: 3, label: 'ArgfaMining Pool' },
  { address: 'TWhale99x9ZpPjZpPjZpPjZpPjZpPjZ', balance: 320000, percentage: 1.1, rank: 4 },
  { address: 'TAnon55x9ZpPjZpPjZpPjZpPjZpPjZp', balance: 180000, percentage: 0.6, rank: 5 },
  { address: 'TMiner22x9ZpPjZpPjZpPjZpPjZpPjZ', balance: 140000, percentage: 0.4, rank: 6 },
  { address: 'THodler11x9ZpPjZpPjZpPjZpPjZpPj', balance: 90000, percentage: 0.3, rank: 7 },
  { address: 'TNewGuy44x9ZpPjZpPjZpPjZpPjZpPj', balance: 50000, percentage: 0.1, rank: 8 },
];

export default function RichListPage() {
  const [list, setList] = useState(MOCK_RICHLIST);
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8 font-sans">
      
      {/* Search Bar matching Argfa layout */}
      <div className="relative w-full">
         <input 
           type="text" 
           placeholder="Block height (e.g. 5156) &middot; block hash &middot; transaction id &middot; address (tar1... / T... / t...) &middot; pool name" 
           className="w-full bg-[#1A1F26] border border-tarcoin-border rounded-lg py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-tarcoin-gold transition-colors placeholder:text-tarcoin-muted/70" 
         />
         <button className="absolute right-3 top-3 bg-tarcoin-gold text-black p-1.5 rounded-md hover:bg-tarcoin-goldlight transition-colors">
            <Search className="w-4 h-4" />
         </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Holders */}
        <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6">
          <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-4">
            Holders
          </div>
          <div className="font-heading text-3xl font-bold text-white mb-2">
            140
          </div>
          <div className="text-xs text-tarcoin-muted">
            addresses & scripts with a balance
          </div>
        </div>

        {/* Circulating Supply */}
        <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6">
          <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-4 flex justify-between items-center">
            CIRCULATING SUPPLY
            <span className="text-[8px] bg-tarcoin-gold/10 text-tarcoin-gold px-1.5 py-0.5 rounded uppercase">Mined Only</span>
          </div>
          <div className="font-heading text-3xl font-bold text-white mb-2 flex items-baseline gap-2">
            262,750,000 <span className="text-sm font-sans text-tarcoin-gold">TAR</span>
          </div>
          <div className="text-xs text-tarcoin-muted">
            Total Supply: 10,262,750,000 TAR <br/>
            <span className="text-[10px] opacity-70">(10,000,000,000 reserved &middot; 262,750,000 mined)</span>
          </div>
        </div>

        {/* Top 10 Concentration */}
        <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6">
          <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-4">
            Top 10 concentration &middot; excl. reserve wallet
          </div>
          <div className="font-heading text-3xl font-bold text-white mb-2">
            51.2%
          </div>
          <div className="text-xs text-tarcoin-muted">
            top1 7.3% &middot; top100 100.0% &middot; 98.6% with it
          </div>
        </div>

      </div>

            {/* Table Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
              Rich List &middot; <span className="text-tarcoin-muted text-sm font-normal">top holders &middot; excluding the reserve</span>
            </h2>
          </div>
          <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase">
            BALANCES LIVE FROM THE NODE &middot; UTXO SNAPSHOT @ #5,256
          </div>
        </div>

        {/* Genesis Reserve Banner */}
        <div className="group relative bg-[#111118] border border-tarcoin-gold/30 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors hover:border-tarcoin-gold/60 cursor-help">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-tarcoin-gold">??</span>
              <span className="font-bold text-white">Reserved Supply</span>
            </div>
            <Link href={{pathname: '/address/tar1qn56jedak2gzxmaukh94cz0sampnhydnk3n3tah'}} className="font-mono text-sm text-tarcoin-gold hover:underline truncate max-w-[200px] sm:max-w-md">
              tar1qn56jedak2gzxmaukh94cz0sampnhydnk3n3tah
            </Link>
            <div className="hidden lg:flex items-center gap-1 text-[10px] text-tarcoin-muted">
              Genesis wallet &middot; <Link href="/block/1" className="hover:text-tarcoin-gold transition-colors">block #1</Link>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="font-mono text-tarcoin-gold font-bold">
              9,994,999,999.99999749 TAR
            </div>
            <div className="text-xs text-white font-mono">
              97.3911% of supply
            </div>
            <div className="text-xs text-tarcoin-muted font-mono">
              1 UTXO
            </div>
          </div>

          {/* Hover Tooltip matching screenshot */}
          <div className="absolute top-full left-0 mt-2 w-full z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="bg-[#1A1F26] border border-tarcoin-gold/50 text-tarcoin-text text-xs p-3 rounded shadow-xl">
              This address received the 10,000,000,000 TAR created by consensus in block #1 as the project's reserved supply. Its balance is what remains there today. It is kept out of the ranking and of the Top 10 concentration; its share is still measured against the whole supply
            </div>
          </div>
        </div>
      </div>

      {/* Miner Rankings */}
      <div className="bg-[#111118] border border-tarcoin-border rounded-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-tarcoin-border flex items-center gap-3 bg-tarcoin-black/40">
           <Trophy className="w-4 h-4 text-tarcoin-gold" />
           <h2 className="font-heading text-sm font-bold tracking-widest text-white uppercase">Top Miners & Holders Ranking</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-tarcoin-black/80 text-[10px] uppercase tracking-widest text-tarcoin-muted border-b border-tarcoin-border/50">
                <th className="px-6 py-4 font-bold w-16 text-tarcoin-muted">#</th>
                <th className="px-6 py-4 font-bold text-tarcoin-muted">ADDRESS</th>
                <th className="px-6 py-4 font-bold text-tarcoin-muted">BALANCE (TAR)</th>
                <th className="px-6 py-4 font-bold text-tarcoin-muted">SHARE</th>
                <th className="px-6 py-4 font-bold text-right text-tarcoin-muted">UTXOS</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono divide-y divide-tarcoin-border/40">
              {list.map((item, i) => {
                const isOurs = item.label === 'Tarcoin Official Pool';
                return (
                  <motion.tr 
                    key={item.address}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-[#1A1F26] transition-colors group"
                  >
                    <td className="px-6 py-4 text-tarcoin-muted font-bold text-xs">{item.rank}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={{pathname: '/address/tar1qn56jedak2gzxmaukh94cz0sampnhydnk3n3tah'}} className={hover:underline truncate max-w-[200px] sm:max-w-md }>
                          {item.address}
                        </Link>
                        {item.label && (
                          <span className={px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase ml-2 hidden sm:inline-block }>
                            {item.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-tarcoin-gold font-bold">{item.balance.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-tarcoin-border rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-tarcoin-gold rounded-full" style={{ width: ${item.percentage * 10}% }} />
                        </div>
                        <span className="text-white w-16">{item.percentage.toFixed(4)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-white">
                      {Math.floor(Math.random() * 400) + 10}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



