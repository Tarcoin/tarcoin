import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  X,
  ShieldCheck,
  Zap,
  Filter,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatFiatAmount } from '../utils/currency';

interface TransactionListProps {
  transactions: Transaction[];
  limit?: number;
  onSelectTransaction?: (tx: Transaction) => void;
  showFilters?: boolean;
  fiatCurrency?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  limit,
  showFilters = true,
  fiatCurrency = 'USD',
}) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'send' | 'receive'>('all');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  const filtered = transactions.filter((tx) => {
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.address.toLowerCase().includes(q) ||
        tx.txHash.toLowerCase().includes(q) ||
        (tx.note && tx.note.toLowerCase().includes(q)) ||
        tx.amountTar.toString().includes(q)
      );
    }
    return true;
  });

  const displayedTxs = limit ? filtered.slice(0, limit) : filtered;

  const handleCopy = (text: string, type: 'hash' | 'address') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Pending status banner alert if there are pending transactions */}
      {pendingCount > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-[#1A1D24] to-amber-900/20 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-4 h-4 animate-spin text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <span>{pendingCount} Pending Electrum Confirmation{pendingCount > 1 ? 's' : ''}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono">
                Awaiting 6 block confirmations on TARCOIN mainnet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-semibold hover:bg-amber-500/30 transition-colors border border-amber-500/30"
          >
            View Pending
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      {showFilters && (
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by address, TX hash, note..."
              className="w-full bg-[#1A1D24] border border-[#262B36] rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 bg-[#1A1D24] p-1 rounded-xl border border-[#262B36]">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium text-[11px] ${
                  statusFilter === 'all'
                    ? 'bg-cyan-400 text-black font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium text-[11px] flex items-center gap-1 ${
                  statusFilter === 'pending'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-gray-400 hover:text-amber-300'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Pending ({transactions.filter(t => t.status === 'pending').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium text-[11px] flex items-center gap-1 ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-400 text-black font-bold'
                    : 'text-gray-400 hover:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Confirmed</span>
              </button>
            </div>

            {/* Type Pills */}
            <div className="flex items-center gap-1.5 bg-[#1A1D24] p-1 rounded-xl border border-[#262B36]">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  typeFilter === 'all' ? 'bg-[#252932] text-white' : 'text-gray-400'
                }`}
              >
                All Types
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('receive')}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  typeFilter === 'receive' ? 'bg-emerald-950 text-emerald-300' : 'text-gray-400'
                }`}
              >
                Received
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('send')}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  typeFilter === 'send' ? 'bg-cyan-950 text-cyan-300' : 'text-gray-400'
                }`}
              >
                Sent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-2.5">
        {displayedTxs.length === 0 ? (
          <div className="p-8 text-center bg-[#1A1D24] border border-[#262B36] rounded-2xl">
            <Filter className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">No transactions found</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Try clearing your search or filter settings</p>
          </div>
        ) : (
          displayedTxs.map((tx) => {
            const isPending = tx.status === 'pending';
            const isCompleted = tx.status === 'completed';
            const isReceive = tx.type === 'receive';

            return (
              <motion.div
                key={tx.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedTx(tx)}
                className={`p-3.5 bg-[#1A1D24] border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                  isPending
                    ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-[#1A1D24] to-[#1A1D24]'
                    : 'border-[#262B36] hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative ${
                      isReceive
                        ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/40'
                        : 'bg-cyan-950/70 text-cyan-400 border border-cyan-800/40'
                    }`}
                  >
                    {isReceive ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}

                    {/* Pending badge overlay dot */}
                    {isPending && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#1A1D24] animate-pulse" />
                    )}
                  </div>

                  {/* Address / Title */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">
                        {isReceive ? 'Received TAR' : 'Sent TAR'}
                      </p>

                      {/* Status Pill Badge */}
                      {isPending ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 animate-spin" />
                          <span>Pending ({tx.confirmations}/6)</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Confirmed</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Failed</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-gray-400 font-mono truncate max-w-[140px] mt-0.5">
                      {tx.address}
                    </p>

                    {tx.note && (
                      <p className="text-[10px] text-cyan-300/80 italic line-clamp-1 mt-0.5">
                        {tx.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Amount & Time */}
                <div className="text-right">
                  <p
                    className={`text-xs font-bold font-mono ${
                      isReceive ? 'text-emerald-400' : 'text-white'
                    }`}
                  >
                    {isReceive ? '+' : '-'}
                    {tx.amountTar.toLocaleString('en-US', { minimumFractionDigits: 2 })} TAR
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    ≈ {formatFiatAmount(tx.amountUsd, fiatCurrency)}
                  </p>
                  <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Transaction Detail Drawer Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-md bg-[#1A1D24] border border-[#262B36] rounded-2xl p-6 text-white shadow-2xl space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#262B36]">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      selectedTx.type === 'receive'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                        : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/40'
                    }`}
                  >
                    {selectedTx.type === 'receive' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Transaction Details</h3>
                    <p className="text-[10px] text-gray-400 font-mono">{selectedTx.id}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="w-7 h-7 rounded-full bg-[#0F1115] flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Hero Amount */}
              <div className="text-center py-2 bg-[#0F1115] border border-[#262B36] rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Amount</p>
                <p
                  className={`text-2xl font-extrabold font-mono ${
                    selectedTx.type === 'receive' ? 'text-emerald-400' : 'text-white'
                  }`}
                >
                  {selectedTx.type === 'receive' ? '+' : '-'}
                  {selectedTx.amountTar} TAR
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  ≈ {formatFiatAmount(selectedTx.amountUsd, fiatCurrency)}
                </p>
              </div>

              {/* Status Timeline Progress */}
              <div className="p-3 bg-[#0F1115] border border-[#262B36] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Status</span>
                  {selectedTx.status === 'pending' ? (
                    <span className="text-amber-400 font-bold font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      Pending ({selectedTx.confirmations}/6 Confirmations)
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmed ({selectedTx.confirmations} Confirmations)
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#1A1D24] h-2 rounded-full overflow-hidden border border-[#262B36]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedTx.status === 'pending'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-emerald-400'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(15, (selectedTx.confirmations / 6) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Metadata Fields */}
              <div className="space-y-3 text-xs font-mono">
                {/* Transaction Hash */}
                <div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                    <span>Transaction Hash (TXID)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedTx.txHash, 'hash')}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-[#0F1115] border border-[#262B36] rounded-xl text-[11px] text-cyan-300 break-all">
                    {selectedTx.txHash}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                    <span>Address</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedTx.address, 'address')}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedAddress ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-[#0F1115] border border-[#262B36] rounded-xl text-[11px] text-gray-300 break-all">
                    {selectedTx.address}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-[#0F1115] border border-[#262B36] rounded-lg">
                    <span className="text-gray-400 block text-[10px]">Network Fee</span>
                    <span className="text-white font-bold">{selectedTx.feeTar} TAR</span>
                  </div>

                  <div className="p-2 bg-[#0F1115] border border-[#262B36] rounded-lg">
                    <span className="text-gray-400 block text-[10px]">Timestamp</span>
                    <span className="text-white font-bold">
                      {new Date(selectedTx.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedTx.note && (
                  <div className="p-2.5 bg-[#0F1115] border border-[#262B36] rounded-xl">
                    <span className="text-[10px] text-gray-400 block">Note</span>
                    <span className="text-cyan-300 font-sans italic">{selectedTx.note}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="w-full py-2.5 bg-[#0F1115] hover:bg-black border border-[#262B36] rounded-xl font-semibold text-xs text-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
