import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, QrCode, Copy, Check, ArrowDownLeft, ArrowUpRight, ShieldCheck, Zap, Camera, BookUser } from 'lucide-react';
import { Transaction, WalletVault } from '../types';
import { formatTarToFiat } from '../utils/currency';
import { QrScannerModal } from './QrScannerModal';

interface SendReceiveModalProps {
  mode: 'send' | 'receive' | null;
  onClose: () => void;
  vault: WalletVault;
  onSendSuccess: (newTx: Transaction) => void;
  onOpenAddressBook?: () => void;
  initialRecipient?: string;
  fiatCurrency?: string;
}

export const SendReceiveModal: React.FC<SendReceiveModalProps> = ({
  mode,
  onClose,
  vault,
  onSendSuccess,
  onOpenAddressBook,
  initialRecipient = '',
  fiatCurrency = 'USD',
}) => {
  // Send state
  const [recipient, setRecipient] = useState<string>(initialRecipient);
  const [amountTar, setAmountTar] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);

  if (!mode) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(vault.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountTar);
    if (!recipient || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid recipient address and amount.');
      return;
    }

    if (parsedAmount > vault.balanceTar) {
      alert(`Insufficient TARCOIN balance. Available: ${vault.balanceTar} TAR`);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        type: 'send',
        amountTar: parsedAmount,
        amountUsd: parsedAmount * vault.tarPriceUsd,
        address: recipient,
        timestamp: new Date().toISOString(),
        status: 'completed',
        confirmations: 1,
        feeTar: 0.0015,
        txHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        note: note || 'TARCOIN wallet transfer',
      };

      setIsSubmitting(false);
      onSendSuccess(newTx);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-[#1A1D24] border border-[#262B36] rounded-2xl p-6 text-white shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#262B36] mb-5">
          <div className="flex items-center gap-2">
            {mode === 'send' ? (
              <div className="w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold">
                {mode === 'send' ? 'Send TARCOIN' : 'Receive TARCOIN'}
              </h2>
              <p className="text-[11px] text-gray-400">
                {mode === 'send' ? 'Instant Electrum Broadcast' : 'Deposit Address & QR Code'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0F1115] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* RECEIVE MODE */}
        {mode === 'receive' ? (
          <div className="flex flex-col items-center text-center">
            {/* Simulated QR Code Canvas */}
            <div className="p-4 bg-white rounded-2xl shadow-xl mb-4 relative group">
              <div className="w-48 h-48 bg-gray-900 rounded-lg p-2 flex flex-col justify-between items-center relative overflow-hidden">
                <div className="w-full h-full grid grid-cols-6 gap-1.5 opacity-90 p-1">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i * 7) % 3 === 0 || i % 2 === 0 ? 'bg-cyan-400' : 'bg-gray-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-lg bg-black border-2 border-cyan-400 flex items-center justify-center">
                    <span className="text-cyan-400 font-bold text-xs">TAR</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-2 font-mono">Your TARCOIN Deposit Address</p>

            <div className="w-full bg-[#0F1115] border border-[#262B36] rounded-xl p-3 flex items-center justify-between gap-2 mb-5">
              <span className="text-xs font-mono text-cyan-300 truncate">{vault.address}</span>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-300 font-semibold flex items-center gap-1 hover:bg-cyan-900 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="w-full p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-xl flex items-center gap-2 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-[11px] text-emerald-300/90 leading-tight">
                Funds deposited to this address will automatically sync after Electrum node verification.
              </span>
            </div>
          </div>
        ) : (
          /* SEND MODE */
          <form onSubmit={handleSendSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                  Recipient TARCOIN Address
                </label>
                <div className="flex items-center gap-1.5">
                  {onOpenAddressBook && (
                    <button
                      type="button"
                      onClick={onOpenAddressBook}
                      className="text-[10px] text-cyan-400 font-bold hover:text-cyan-300 flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50"
                    >
                      <BookUser className="w-3 h-3 text-cyan-400" />
                      <span>Contacts</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsQrScannerOpen(true)}
                    className="text-[10px] text-cyan-400 font-bold hover:text-cyan-300 flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Scan QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRecipient('tar1q8x9y7z6w5v4u3t2s1r0q9p8o7n6m5l4k3j2h1')
                    }
                    className="text-[10px] text-gray-400 hover:underline"
                  >
                    Demo
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="tar1q..."
                  className="w-full bg-[#0F1115] border border-[#262B36] rounded-xl p-3 pr-10 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(true)}
                  title="Scan TARCOIN QR Code"
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-cyan-400 p-1"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Qr Scanner Modal Component */}
            <QrScannerModal
              isOpen={isQrScannerOpen}
              onClose={() => setIsQrScannerOpen(false)}
              onScanSuccess={(address) => setRecipient(address)}
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                  Amount (TAR)
                </label>
                <span className="text-[11px] text-gray-400 font-mono">
                  Avail: {vault.balanceTar.toFixed(2)} TAR
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  value={amountTar}
                  onChange={(e) => setAmountTar(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#0F1115] border border-[#262B36] rounded-xl p-3 text-sm text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setAmountTar((vault.balanceTar * 0.99).toFixed(2))}
                  className="absolute right-3 top-2.5 text-[10px] font-bold uppercase bg-cyan-950 border border-cyan-800 text-cyan-400 px-2 py-1 rounded"
                >
                  MAX
                </button>
              </div>
              {amountTar && !isNaN(parseFloat(amountTar)) && (
                <p className="text-[11px] text-gray-400 mt-1 font-mono">
                  ≈ {formatTarToFiat(parseFloat(amountTar), vault.tarPriceUsd, fiatCurrency)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Note / Description (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Cake Wallet swap or coffee payment"
                className="w-full bg-[#0F1115] border border-[#262B36] rounded-xl p-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-[#0F1115] border border-[#262B36] rounded-xl flex items-center justify-between text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>Electrum Est. Fee</span>
              </span>
              <span className="text-white">0.0015 TAR</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-bold text-xs text-black bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              {isSubmitting ? (
                <span>Broadcasting to Electrum...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send TARCOIN Now</span>
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
