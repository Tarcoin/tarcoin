import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  RefreshCw,
  Search,
  KeyRound,
  Fingerprint,
  Radio,
  Clock,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Settings,
  History,
  TrendingUp,
  Cpu,
  Zap,
  QrCode,
  BookUser,
  Globe,
  Coins,
  DollarSign,
  Check,
} from 'lucide-react';
import { WalletVault, Transaction, BootMetrics, ElectrumNode } from '../types';
import { electrumClient } from '../services/ElectrumClient';
import { encryptStorage } from '../services/EncryptStorage';
import { FIAT_CURRENCIES, getFiatConfig, formatTarToFiat } from '../utils/currency';
import tarcoinLogo from '../assets/images/tarcoin_logo.svg';
import { SendReceiveModal } from './SendReceiveModal';
import { TransactionList } from './TransactionList';
import { QrScannerModal } from './QrScannerModal';
import { AddressBookModal } from './AddressBookModal';

interface WalletDashboardProps {
  vault: WalletVault;
  bootMetrics: BootMetrics;
  onLock: () => void;
  onVaultUpdate: (updatedVault: WalletVault) => void;
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({
  vault,
  bootMetrics,
  onLock,
  onVaultUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'wallet' | 'history' | 'security'>('wallet');
  const [modalMode, setModalMode] = useState<'send' | 'receive' | null>(null);
  const [isDashboardQrOpen, setIsDashboardQrOpen] = useState<boolean>(false);
  const [isAddressBookOpen, setIsAddressBookOpen] = useState<boolean>(false);
  const [initialSendAddress, setInitialSendAddress] = useState<string>('');
  
  // Electrum network deferred connection status state
  const [electrumStatus, setElectrumStatus] = useState<string>('connecting');
  const [activeNode, setActiveNode] = useState<ElectrumNode | null>(null);
  
  // Biometrics toggle state
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(vault.useBiometrics);

  // Fiat Currency display preference state
  const [fiatCurrency, setFiatCurrency] = useState<string>(() => {
    return localStorage.getItem('tarcoin_fiat_currency') || 'USD';
  });
  const [fiatStatusMsg, setFiatStatusMsg] = useState<string | null>(null);

  const handleCurrencyChange = (newCode: string) => {
    setFiatCurrency(newCode);
    localStorage.setItem('tarcoin_fiat_currency', newCode);
    const cfg = getFiatConfig(newCode);
    setFiatStatusMsg(`Display currency set to ${cfg.name} (${cfg.code} ${cfg.symbol})`);
    setTimeout(() => setFiatStatusMsg(null), 3000);
  };

  // New PIN modal state
  const [showChangePinModal, setShowChangePinModal] = useState<boolean>(false);
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string | null>(null);

  const [biometricsStatusMsg, setBiometricsStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = electrumClient.subscribe((status, node) => {
      setElectrumStatus(status);
      setActiveNode(node);
    });
    return unsubscribe;
  }, []);

  const handleBiometricsToggle = async () => {
    const nextVal = !biometricsEnabled;
    setBiometricsEnabled(nextVal);
    await encryptStorage.setBiometricsEnabled(nextVal);
    onVaultUpdate({ ...vault, useBiometrics: nextVal });

    setBiometricsStatusMsg(
      nextVal
        ? 'Biometric unlock enabled & saved to encrypted storage'
        : 'Biometric unlock disabled — 4-digit PIN required on startup'
    );
    setTimeout(() => setBiometricsStatusMsg(null), 3000);
  };

  const handleSendSuccess = (newTx: Transaction) => {
    const updatedVault = encryptStorage.updateVault((prev) => ({
      ...prev,
      balanceTar: Math.max(0, prev.balanceTar - newTx.amountTar),
      transactions: [newTx, ...prev.transactions],
    }));
    onVaultUpdate(updatedVault);
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);

    const isValid = await encryptStorage.validatePin(oldPin);
    if (!isValid) {
      setPinChangeMsg('Current PIN is incorrect.');
      return;
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setPinChangeMsg('New PIN must be exactly 4 digits.');
      return;
    }

    await encryptStorage.savePin(newPin);
    setPinChangeMsg('Success! PIN changed.');
    setTimeout(() => {
      setShowChangePinModal(false);
      setOldPin('');
      setNewPin('');
      setPinChangeMsg(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col max-w-md mx-auto relative border-x border-[#1A1D24] shadow-2xl">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0F1115]/95 backdrop-blur-md px-5 py-3.5 border-b border-[#262B36] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src={tarcoinLogo}
            alt="TARCOIN Logo"
            width={64}
            height={64}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-2xl object-cover shadow-md shrink-0 border border-amber-500/30"
          />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>TARCOIN Wallet</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/40">
                v2.4
              </span>
            </h1>
            <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${electrumStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
              <span>{electrumStatus === 'connected' ? 'Electrum Sync Active' : 'Connecting Node...'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddressBookOpen(true)}
            title="Open Address Book"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1D24] hover:bg-[#252932] border border-[#262B36] text-xs font-medium text-cyan-300 hover:text-white transition-colors"
          >
            <BookUser className="w-3.5 h-3.5 text-cyan-400" />
            <span>Contacts</span>
          </button>

          <button
            type="button"
            onClick={onLock}
            title="Lock Wallet Now"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1D24] hover:bg-[#252932] border border-[#262B36] text-xs font-medium text-gray-300 hover:text-white transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-5 py-5 pb-24 overflow-y-auto space-y-6">
        {/* OBJECTIVE 1 DEFERRED METRICS BANNER */}
        <div className="p-3 bg-gradient-to-r from-cyan-950/40 via-[#1A1D24] to-blue-950/30 border border-cyan-800/30 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="font-semibold text-cyan-300 flex items-center gap-1">
                <span>Fast Launch: {bootMetrics.splashTimeMs}ms Splash</span>
                <Sparkles className="w-3 h-3 text-yellow-400" />
              </div>
              <p className="text-[10px] text-gray-400 font-mono">
                Storage: {bootMetrics.storageLoadTimeMs}ms • Electrum: Deferred Post-Unlock
              </p>
            </div>
          </div>
        </div>

        {/* Cake Wallet Style Balance Hero Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1A1D24] via-[#14171E] to-[#0D0F13] border border-[#262B36] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest font-mono">
              Total Balance
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 font-mono border border-emerald-800/40 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>1 TAR = {formatTarToFiat(1, vault.tarPriceUsd, fiatCurrency)}</span>
            </span>
          </div>

          <div className="mb-6">
            <div className="text-3xl font-extrabold tracking-tight text-white font-mono flex items-baseline gap-2">
              <span>{vault.balanceTar.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span className="text-lg font-bold text-cyan-400">TAR</span>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              ≈ {formatTarToFiat(vault.balanceTar, vault.tarPriceUsd, fiatCurrency)}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setModalMode('send')}
              className="py-3 px-3 rounded-xl font-bold text-xs text-black bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Send</span>
            </button>

            <button
              type="button"
              onClick={() => setModalMode('receive')}
              className="py-3 px-3 rounded-xl font-bold text-xs text-white bg-[#252932] hover:bg-[#2E3440] border border-[#323948] transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>Receive</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDashboardQrOpen(true)}
              className="py-3 px-3 rounded-xl font-bold text-xs text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/50 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>Scan QR</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#1A1D24] p-1 rounded-xl border border-[#262B36] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'wallet' ? 'bg-cyan-400 text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'history' ? 'bg-cyan-400 text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'security' ? 'bg-cyan-400 text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & TRANSACTIONS */}
        {activeTab === 'wallet' && (
          <div className="space-y-5">
            {/* Recent Transactions Preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Recent Activity
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  <span>View All ({vault.transactions.length})</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <TransactionList
                transactions={vault.transactions}
                limit={3}
                showFilters={false}
                fiatCurrency={fiatCurrency}
              />
            </div>

            {/* Address Book Quick Access Card */}
            <div className="p-4 bg-gradient-to-r from-[#1A1D24] via-[#161920] to-cyan-950/20 border border-[#262B36] hover:border-cyan-500/30 rounded-2xl text-xs space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
                    <BookUser className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Saved Address Book</span>
                    <span className="text-[10px] text-gray-400">
                      {(vault.contacts || []).length} Saved Contacts
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddressBookOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-[11px] flex items-center gap-1 transition-colors shadow-sm"
                >
                  <span>Manage</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sample contact badges preview */}
              <div className="flex gap-2 overflow-x-auto pt-1 pb-0.5">
                {(vault.contacts || []).slice(0, 3).map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => {
                      setInitialSendAddress(contact.address);
                      setModalMode('send');
                    }}
                    className="p-2 bg-[#0F1115] hover:bg-[#13161D] border border-[#262B36] hover:border-cyan-500/40 rounded-xl flex items-center gap-2 shrink-0 transition-all text-left"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${
                        contact.avatarColor || 'from-cyan-500 to-blue-600'
                      } flex items-center justify-center text-white font-bold text-[10px] shrink-0`}
                    >
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-white block truncate max-w-[90px]">
                        {contact.name}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono block truncate max-w-[90px]">
                        {contact.address}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Electrum Node Connectivity Card */}
            <div className="p-4 bg-[#1A1D24] border border-[#262B36] rounded-2xl text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="font-bold">Electrum Node Pool</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  {activeNode?.pingMs}ms Latency
                </span>
              </div>

              <div className="bg-[#0F1115] p-2.5 rounded-xl border border-[#262B36] font-mono text-[11px] text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Host:</span>
                  <span className="text-white">{activeNode?.host}</span>
                </div>
                <div className="flex justify-between">
                  <span>Port & SSL:</span>
                  <span className="text-cyan-300">{activeNode?.port} (TLS 1.3)</span>
                </div>
                <div className="flex justify-between">
                  <span>Client:</span>
                  <span className="text-gray-300">{activeNode?.version}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVITY & SEARCH */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <TransactionList
              transactions={vault.transactions}
              showFilters={true}
              fiatCurrency={fiatCurrency}
            />
          </div>
        )}

        {/* TAB 3: SECURITY & SETTINGS MANAGEMENT */}
        {activeTab === 'security' && (
          <div className="space-y-4 text-xs">
            {/* Fiat Display Currency Panel */}
            <div className="p-4 bg-[#1A1D24] border border-[#262B36] rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Fiat Display Currency</h3>
                    <p className="text-[10px] text-gray-400">Switch preferred currency for prices & valuation</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 font-mono text-[11px] font-bold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{fiatCurrency}</span>
                </span>
              </div>

              {/* Status Message Notification */}
              {fiatStatusMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-xl border bg-cyan-950/50 text-cyan-300 border-cyan-800/50 text-[11px] font-medium flex items-center gap-2"
                >
                  <Check className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>{fiatStatusMsg}</span>
                </motion.div>
              )}

              {/* Currency Selector Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FIAT_CURRENCIES.map((curr) => {
                  const isSelected = curr.code === fiatCurrency;
                  const unitPrice = formatTarToFiat(1, vault.tarPriceUsd, curr.code);

                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => handleCurrencyChange(curr.code)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950/90 to-[#1A1D24] border-cyan-500/70 text-white shadow-lg shadow-cyan-500/10'
                          : 'bg-[#0F1115] hover:bg-[#14171E] border-[#262B36] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="text-sm">{curr.flag}</span>
                          <span>{curr.code}</span>
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-cyan-400 text-black'
                              : 'bg-[#1A1D24] text-gray-400'
                          }`}
                        >
                          {curr.symbol}
                        </span>
                      </div>

                      <div className="text-[10px] text-gray-400 font-mono truncate">
                        {curr.name}
                      </div>

                      <div className="text-[9px] text-cyan-300/90 font-mono mt-1 font-semibold">
                        1 TAR = {unitPrice}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-2.5 bg-[#0F1115] border border-[#262B36] rounded-xl flex items-center justify-between text-[10px] text-gray-400">
                <span>Active Exchange Valuation:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  1 TAR = {formatTarToFiat(1, vault.tarPriceUsd, fiatCurrency)}
                </span>
              </div>
            </div>

            {/* PIN Settings */}
            <div className="p-4 bg-[#1A1D24] border border-[#262B36] rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white">4-Digit PIN Security</h3>
              </div>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Cake Wallet obsidian PIN protection keeps your TARCOIN vault encrypted at rest.
              </p>

              <button
                type="button"
                onClick={() => setShowChangePinModal(true)}
                className="w-full py-2.5 bg-[#0F1115] hover:bg-black border border-[#262B36] rounded-xl font-semibold text-cyan-300 flex items-center justify-center gap-2"
              >
                <span>Change 4-Digit PIN</span>
              </button>
            </div>

            {/* Biometrics Toggle Settings */}
            <div className="p-4 bg-[#1A1D24] border border-[#262B36] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Biometric Unlock</h3>
                    <p className="text-[10px] text-gray-400">Unlock vault with Face ID or Fingerprint</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBiometricsToggle}
                  aria-label="Toggle Biometric Unlock"
                  className={`w-12 h-6 rounded-full transition-colors p-1 relative ${
                    biometricsEnabled ? 'bg-cyan-400' : 'bg-gray-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-black transition-transform ${
                      biometricsEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {biometricsStatusMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-2.5 rounded-xl border text-[11px] font-medium flex items-center gap-2 ${
                    biometricsEnabled
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50'
                      : 'bg-amber-950/50 text-amber-300 border-amber-800/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{biometricsStatusMsg}</span>
                </motion.div>
              )}

              <div className="p-2.5 bg-[#0F1115] border border-[#262B36] rounded-xl flex items-center justify-between text-[10px] text-gray-400">
                <span>Storage status:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {biometricsEnabled ? 'AES-256 Encrypted (Enabled)' : 'PIN Verification Only'}
                </span>
              </div>
            </div>

            {/* Seed Phrase Backup View */}
            <div className="p-4 bg-[#1A1D24] border border-[#262B36] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white">Encrypted Seed Phrase</h3>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Verified Backup</span>
              </div>

              <div className="p-3 bg-[#0F1115] border border-[#262B36] rounded-xl font-mono text-[11px] text-gray-300 leading-relaxed select-all">
                {vault.seedPhrase}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Change PIN Modal */}
      <AnimatePresence>
        {showChangePinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#1A1D24] border border-[#262B36] rounded-2xl p-6 text-white shadow-2xl"
            >
              <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <span>Change 4-Digit PIN</span>
              </h3>

              {pinChangeMsg && (
                <div
                  className={`mb-4 text-xs p-2.5 rounded-lg border ${
                    pinChangeMsg.includes('Success')
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                      : 'bg-red-950/40 text-red-400 border-red-800/40'
                  }`}
                >
                  {pinChangeMsg}
                </div>
              )}

              <form onSubmit={handleChangePinSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Current PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value)}
                    placeholder="****"
                    className="w-full bg-[#0F1115] border border-[#262B36] rounded-xl p-2.5 text-center tracking-widest text-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">New 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="****"
                    className="w-full bg-[#0F1115] border border-[#262B36] rounded-xl p-2.5 text-center tracking-widest text-lg text-white font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowChangePinModal(false)}
                    className="flex-1 py-2.5 bg-[#0F1115] hover:bg-black border border-[#262B36] rounded-xl text-xs text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-cyan-400 hover:bg-cyan-300 rounded-xl text-xs font-bold text-black"
                  >
                    Save PIN
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send/Receive Modal */}
      <SendReceiveModal
        mode={modalMode}
        onClose={() => {
          setModalMode(null);
          setInitialSendAddress('');
        }}
        vault={vault}
        onSendSuccess={handleSendSuccess}
        onOpenAddressBook={() => {
          setModalMode(null);
          setIsAddressBookOpen(true);
        }}
        initialRecipient={initialSendAddress}
        fiatCurrency={fiatCurrency}
      />

      {/* Dashboard Quick Scan QR Modal */}
      <QrScannerModal
        isOpen={isDashboardQrOpen}
        onClose={() => setIsDashboardQrOpen(false)}
        onScanSuccess={(scannedAddress) => {
          setIsDashboardQrOpen(false);
          setInitialSendAddress(scannedAddress);
          setModalMode('send');
        }}
      />

      {/* Address Book Modal */}
      <AddressBookModal
        isOpen={isAddressBookOpen}
        onClose={() => setIsAddressBookOpen(false)}
        vault={vault}
        onUpdateVault={onVaultUpdate}
        onSelectContactForSend={(selectedAddress) => {
          setInitialSendAddress(selectedAddress);
          setModalMode('send');
        }}
      />
    </div>
  );
};
