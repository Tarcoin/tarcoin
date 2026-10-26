'use client';

import { Pickaxe, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function PoolProfile({ params }: { params: { name: string } }) {
  const decodedName = decodeURIComponent(params.name);
  
  // Whitelist of verified pools
  const isVerified = decodedName === 'Tarcoin Official Pool' || decodedName === 'ArgfaMining';
  const isOfficial = decodedName === 'Tarcoin Official Pool';

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-tarcoin-gold/10 border border-tarcoin-gold/30 rounded-2xl flex items-center justify-center mb-2">
          <Pickaxe className="w-8 h-8 text-tarcoin-gold" />
        </div>
        <h1 className="font-heading text-3xl md:text-5xl font-bold text-white flex items-center justify-center gap-3">
          {decodedName}
          {isVerified && (
            <span className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 font-sans tracking-widest uppercase align-middle">
              <ShieldCheck className="w-3 h-3" /> Verified Pool
            </span>
          )}
        </h1>
        <p className="text-tarcoin-muted text-sm max-w-lg">
          Mining Dashboard & Statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6">
          <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-4 flex items-center gap-2">
            <Zap className="w-3 h-3" /> Estimated Hashrate
          </div>
          <div className="font-heading text-3xl font-bold text-white flex items-baseline gap-2">
            12.4 <span className="text-sm text-tarcoin-muted font-sans">TH/s</span>
          </div>
        </div>

        <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6">
          <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-4 flex items-center gap-2">
            <Pickaxe className="w-3 h-3" /> Blocks Found (24h)
          </div>
          <div className="font-heading text-3xl font-bold text-white">
            142
          </div>
        </div>

        <div className="bg-[#111118] border border-tarcoin-border rounded-xl p-6">
          <div className="text-[10px] font-bold tracking-widest text-tarcoin-muted uppercase mb-4 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Network Share
          </div>
          <div className="font-heading text-3xl font-bold text-green-400">
            22.5%
          </div>
        </div>
      </div>

      {/* Stratum Connection - ONLY SHOW FOR OFFICIAL POOL */}
      {isOfficial && (
        <div className="bg-tarcoin-black border border-tarcoin-border rounded-xl p-8 text-center mt-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-tarcoin-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <Pickaxe className="w-8 h-8 text-tarcoin-gold/50 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-white mb-2">Connect Your Miners</h2>
          <p className="text-tarcoin-muted text-sm mb-6 max-w-md mx-auto">
            Point your SHA-256d ASIC miners to the official stratum pool to start earning TAR.
          </p>
          <div className="inline-block bg-[#111118] border border-tarcoin-gold/30 rounded-lg px-6 py-3 font-mono text-sm text-tarcoin-gold select-all cursor-pointer hover:bg-[#1A1F26] transition-colors">
            stratum+tcp://pool.tarcoin.org:3333
          </div>
        </div>
      )}

    </div>
  );
}
