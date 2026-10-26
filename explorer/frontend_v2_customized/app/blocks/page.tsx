'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Box, Clock, ChevronRight, Activity, Loader2 } from 'lucide-react';

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

// --- Utils ---
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

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchBlocks = async (currentOffset: number, isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      
      const res = await fetch(`${API_BASE}/api/blocks?limit=50&offset=${currentOffset}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        if (isLoadMore) {
          setBlocks(prev => [...prev, ...data]);
        } else {
          setBlocks(data);
        }
        if (data.length < 50) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchBlocks(0, false);
  }, []);

  const handleLoadMore = () => {
    const nextOffset = offset + 50;
    setOffset(nextOffset);
    fetchBlocks(nextOffset, true);
  };

  const poolNames = ['Tarcoin Official Pool', 'ArgfaMining', 'bitaxermt.xyz', 'Ubosjala'];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      
      <div className="flex items-center justify-between mb-8">
         <div>
           <h1 className="font-heading text-2xl font-bold text-white mb-1">Explore Chain</h1>
           <p className="text-tarcoin-muted text-[10px] uppercase tracking-widest mt-1">
             Chain tip &middot; height {(blocks[0]?.height || 5253).toLocaleString()} &middot; difficulty 76,526,462.76 &middot; chain: mainlive
           </p>
         </div>
      </div>

      <div className="bg-[#111118] border border-tarcoin-border rounded-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-tarcoin-border flex items-center gap-3 bg-tarcoin-black/40">
           <Box className="w-5 h-5 text-tarcoin-gold" />
           <h2 className="font-heading text-sm font-bold tracking-widest text-white uppercase">Latest Blocks</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-tarcoin-black/80 text-[10px] uppercase tracking-widest text-tarcoin-muted border-b border-tarcoin-border/50">
                <th className="px-6 py-4 font-bold sticky top-0 bg-tarcoin-black/80 backdrop-blur-md">Height</th>
                <th className="px-6 py-4 font-bold sticky top-0 bg-tarcoin-black/80 backdrop-blur-md">Hash</th>
                <th className="px-6 py-4 font-bold sticky top-0 bg-tarcoin-black/80 backdrop-blur-md">Miner</th>
                <th className="px-6 py-4 font-bold sticky top-0 bg-tarcoin-black/80 backdrop-blur-md">Age</th>
                <th className="px-6 py-4 font-bold sticky top-0 bg-tarcoin-black/80 backdrop-blur-md">Txs</th>
                <th className="px-6 py-4 font-bold sticky top-0 bg-tarcoin-black/80 backdrop-blur-md">Size</th>
                <th className="px-6 py-4 font-bold sticky top-0 bg-tarcoin-black/80 backdrop-blur-md text-right">Conf.</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono divide-y divide-tarcoin-border/40">
              {loading ? (
                Array.from({length: 15}).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-tarcoin-border/50 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-tarcoin-border/50 rounded w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-tarcoin-border/50 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-tarcoin-border/50 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-tarcoin-border/50 rounded w-8"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-tarcoin-border/50 rounded w-16"></div></td>
                  </tr>
                ))
              ) : blocks.map((b, i) => {
                const minerTag = poolNames[i % poolNames.length];
                const isOurs = minerTag === 'Tarcoin Official Pool';
                
                return (
                  <motion.tr 
                    key={b.hash + i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % 50) * 0.02 }}
                    className="hover:bg-[#1A1F26] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/block/${b.hash}`} className="text-tarcoin-gold font-bold hover:underline">
                        {(b.height || 0).toLocaleString()}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/block/${b.hash}`} className="text-tarcoin-text hover:text-white transition-colors">
                        {truncateHash(b.hash, 8, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-xs font-sans">
                      <Link href={`/pool/${encodeURIComponent(minerTag)}`} className={`hover:underline cursor-pointer ${isOurs ? 'text-tarcoin-gold font-bold bg-tarcoin-gold/10 px-2.5 py-1 rounded border border-tarcoin-gold/20' : 'text-tarcoin-muted hover:text-white'}`}>
                        {minerTag}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-tarcoin-muted text-xs font-sans flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3" /> {timeAgo(b.time || 0)}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{b.nTx || b.tx?.length || 0}</td>
                    <td className="px-6 py-4 text-tarcoin-muted">{formatBytes(b.size || 0)}</td>
                    <td className="px-6 py-4 text-white font-mono text-right">{i + 1}</td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
          
          {!loading && blocks.length === 0 && (
            <div className="py-12 text-center text-tarcoin-muted font-sans text-sm">
              No blocks found on the network.
            </div>
          )}
        </div>
        
        {/* Load More Button Container */}
        {!loading && hasMore && blocks.length > 0 && (
          <div className="px-6 py-6 border-t border-tarcoin-border/50 bg-tarcoin-black/20 flex justify-center">
            <button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-[#1A1F26] hover:bg-[#252C36] border border-tarcoin-border text-white font-sans text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-tarcoin-gold" /> Loading...
                </>
              ) : (
                'Show More 50'
              )}
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
}

