'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, ArrowDownRight, Lock, ExternalLink, History, Info, Activity, Wallet } from 'lucide-react';

export default function TransparencyPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await fetch('/api/faucet-ledger');
        const data = await res.json();
        if (data.payouts) setPayouts(data.payouts);
        if (data.balance !== undefined && data.balance !== null) setBalance(data.balance);
      } catch (err) {
        console.error("Failed to fetch payouts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-gray-200 font-sans py-16 px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Ecosystem Transparency
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Complete, publicly verifiable ledger of the Tarcoin Genesis Reserve. We believe in absolute transparency for our community and investors.
          </p>
        </div>

        {/* High-Level Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#11141A] border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">Initial Genesis Reserve</div>
            <div className="text-3xl font-bold text-white mb-1">10,000,000,000</div>
            <div className="text-sm text-yellow-500 font-mono">TAR</div>
            <Lock className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-5" />
          </div>

          <div className="bg-[#11141A] border border-green-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="text-xs font-bold tracking-widest text-green-500 uppercase mb-2">Initial Faucet Funding</div>
            <div className="text-3xl font-bold text-white mb-1">5,000,000</div>
            <div className="text-sm text-green-400 font-mono">TAR</div>
            <ArrowDownRight className="absolute -right-4 -bottom-4 w-24 h-24 text-green-500 opacity-5" />
          </div>

          <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-2">Currently Locked</div>
            <div className="text-3xl font-bold text-yellow-500 mb-1">9,995,000,000</div>
            <div className="text-sm text-gray-400 font-mono">TAR</div>
            <ShieldCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-yellow-500 opacity-10" />
          </div>
        </div>

        {/* Ledger Section */}
        <div className="bg-[#11141A] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-800 flex items-center gap-3 bg-[#0D1017]">
            <History className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-white">Public Treasury Ledger</h2>
          </div>
          
          <div className="p-6">
            <div className="relative border-l-2 border-gray-800 ml-3 md:ml-4 space-y-12">
              
              {/* Ledger Item: August 4th, 2026 */}
              <div className="relative pl-8 md:pl-10">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-[#11141A]" />
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">August 04, 2026 &middot; 23:14</span>
                    <h3 className="text-xl font-bold text-white mt-1">Community Faucet & Bounty Allocation</h3>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-lg font-mono font-bold">
                    - 5,000,000 TAR
                  </div>
                </div>

                <div className="bg-[#1A1E26] rounded-xl p-5 border border-gray-800/50 mb-6">
                  <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Purpose of Funds</h4>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    Seed funding extracted from the Genesis Reserve to fuel initial ecosystem growth, incentivize mining decentralization, and reward community engagement.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    <div className="bg-[#11141A] rounded-lg p-3 border border-gray-800">
                      <div className="text-yellow-500 font-bold mb-1">100 TAR</div>
                      <div className="text-xs text-gray-500">Wallet Download Claim</div>
                    </div>
                    <div className="bg-[#11141A] rounded-lg p-3 border border-gray-800">
                      <div className="text-yellow-500 font-bold mb-1">1,000 TAR</div>
                      <div className="text-xs text-gray-500">20k Mining Bonus</div>
                    </div>
                    <div className="bg-[#11141A] rounded-lg p-3 border border-gray-800">
                      <div className="text-yellow-500 font-bold mb-1">2,500 TAR</div>
                      <div className="text-xs text-gray-500">X (Twitter) Bounty</div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-gray-800/50">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider w-24">TxID Proof:</span>
                      <a href="https://explorer.tarcoin.org/tx/e0cf2fc3997fe255fb2848dbc51e26db7f95ed7b4836b5b3d60a327180807447" target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-white font-mono flex items-center gap-1 transition-colors break-all">
                        e0cf2fc3997fe255fb2848dbc51e26db7f95ed7b4836b5b3d60a327180807447 <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* HD Wallet Disclaimer */}
                  <div className="mt-5 bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-bold text-blue-400 mb-1">Technical Note on HD Wallets</h5>
                      <p className="text-xs text-blue-200/70 leading-relaxed">
                        The Tarcoin Faucet operates as a secure HD (Hierarchical Deterministic) wallet. Every time a community bounty is paid out, the remaining funds automatically rotate to a new internal change address for security. Because of this architecture, the original receiving address shown in this TxID will appear empty or fully spent on public block explorers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* LIVE FAUCET PAYOUTS TABLE */}
                <div className="bg-[#0D1017] border border-gray-800 rounded-xl overflow-hidden mt-6">
                  <div className="px-5 py-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Live Faucet Payouts</h4>
                    </div>
                    
                    {/* Live Balance Badge */}
                    <div className="flex items-center gap-3">
                      {loading && <span className="text-xs text-gray-500 animate-pulse">Syncing...</span>}
                      {balance !== null && (
                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg">
                          <Wallet className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-500 font-bold tracking-wider uppercase">Live Balance:</span>
                          <span className="text-sm text-green-400 font-mono font-bold">
                            {balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} TAR
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#11141A] text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3 font-medium">Date</th>
                          <th className="px-5 py-3 font-medium">Address</th>
                          <th className="px-5 py-3 font-medium">TxID</th>
                          <th className="px-5 py-3 font-medium text-right">Amount Sent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50 font-mono text-xs">
                        {!loading && payouts.slice(0, visibleCount).map((tx: any, i: number) => (
                          <tr key={i} className="hover:bg-[#1A1E26] transition-colors">
                            <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                              {new Date(tx.time * 1000).toLocaleDateString()} {new Date(tx.time * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="px-5 py-3 text-gray-300 truncate max-w-[150px] sm:max-w-xs">
                              {tx.address}
                            </td>
                            <td className="px-5 py-3">
                              <a href={`https://explorer.tarcoin.org/tx/${tx.txid}`} target="_blank" rel="noreferrer" className="text-yellow-500 hover:text-yellow-400 truncate block max-w-[100px] sm:max-w-[200px]">
                                {tx.txid}
                              </a>
                            </td>
                            <td className="px-5 py-3 text-right text-green-400 font-bold whitespace-nowrap">
                              {Math.abs(tx.amount).toLocaleString()} TAR
                            </td>
                          </tr>
                        ))}
                        {!loading && payouts.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-5 py-8 text-center text-gray-500 font-sans">
                              No recent payouts found or node disconnected.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Show More Button */}
                  {!loading && visibleCount < payouts.length && (
                    <div className="px-5 py-4 border-t border-gray-800 bg-[#0D1017] flex justify-center">
                      <button 
                        onClick={() => setVisibleCount(prev => prev + 50)}
                        className="px-6 py-2.5 bg-[#11141A] hover:bg-[#1A1E26] text-gray-300 rounded-lg text-sm font-bold border border-gray-700 transition-colors flex items-center gap-2"
                      >
                        Show 50 More <ArrowDownRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                </div>

              </div>

              {/* Ledger Item: Genesis */}
              <div className="relative pl-8 md:pl-10">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-yellow-500 border-4 border-[#11141A]" />
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">Block #1</span>
                    <h3 className="text-xl font-bold text-white mt-1">Genesis Block Creation</h3>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1.5 rounded-lg font-mono font-bold">
                    + 10,000,000,000 TAR
                  </div>
                </div>

                <div className="bg-[#1A1E26] rounded-xl p-5 border border-gray-800/50">
                  <p className="text-gray-400 text-sm leading-relaxed">
                    The Tarcoin network was launched. By consensus rules, an ecosystem treasury of 10 Billion TAR was minted in Block #1 to be held in long-term reserve for future project development, exchange liquidity, and community grants.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
