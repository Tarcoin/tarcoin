'use client';

import { Pickaxe, ShieldCheck, Zap, Activity, ExternalLink } from 'lucide-react';

const POOL_DATA: Record<string, { stratum: string, link: string, type: string }> = {
  'tarcoin official pool': { 
    stratum: 'stratum+tcp://stratum.tarcoin.org:3333', 
    link: 'https://pool.tarcoin.org/',
    type: 'Official (Shared / SOLO)'
  },
  'bitaxermt': { 
    stratum: 'stratum+tcp://bitaxermt.xyz:3335', 
    link: 'https://bitaxermt.xyz/',
    type: 'Community (SOLO) 🇬🇧'
  },
  'cryptopickaxe': { 
    stratum: 'stratum+tcp://stratum.cryptopickaxe.co.uk:6020', 
    link: 'https://cryptopickaxe.co.uk/',
    type: 'Community (Shared / SOLO) 🇬🇧'
  },
  'ghostnetwork': { 
    stratum: 'stratum+tcp://pool.ghostnetwork.nl:3333', 
    link: 'http://pool.ghostnetwork.nl/',
    type: 'Community (Shared / SOLO) 🇳🇱'
  },
  'argfamining': { 
    stratum: 'Global regions available (see website)', 
    link: 'https://argfamining.com/tar_how_to_mine.html',
    type: 'Community (Shared / SOLO) 🌐'
  }
};

export default function PoolProfile({ params }: { params: { name: string } }) {
  const decodedName = decodeURIComponent(params.name);
  
  // Find matching pool data (case-insensitive partial match)
  const poolKey = Object.keys(POOL_DATA).find(k => decodedName.toLowerCase().includes(k));
  const isVerified = !!poolKey;
  const poolDetails = poolKey ? POOL_DATA[poolKey] : null;

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
          {poolDetails ? poolDetails.type : 'Mining Dashboard & Statistics'}
        </p>
      </div>

      {/* Stats removed - pointing users to the real pool dashboards instead */}

      {/* Stratum Connection - SHOW FOR ALL VERIFIED POOLS */}
      {poolDetails && (
        <div className="bg-tarcoin-black border border-tarcoin-border rounded-xl p-8 text-center mt-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-tarcoin-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <Pickaxe className="w-8 h-8 text-tarcoin-gold/50 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-white mb-2">Connect Your Miners</h2>
          <p className="text-tarcoin-muted text-sm mb-6 max-w-md mx-auto">
            Point your SHA-256d ASIC miners to this verified stratum pool to start earning TAR.
          </p>
          <div className="inline-block bg-[#111118] border border-tarcoin-gold/30 rounded-lg px-6 py-3 font-mono text-sm text-tarcoin-gold select-all cursor-pointer hover:bg-[#1A1F26] transition-colors mb-4">
            {poolDetails.stratum}
          </div>
          <div>
            <a href={poolDetails.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-tarcoin-muted hover:text-tarcoin-gold transition-colors">
              Visit Pool Dashboard <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
