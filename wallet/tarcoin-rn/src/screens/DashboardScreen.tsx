// TARCOIN Wallet — Dashboard Screen
// Ported from applet src/components/WalletDashboard.tsx
// Native React Native implementation with Cake Wallet Obsidian aesthetics

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Clipboard,
  Alert,
} from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import type { WalletVault, Transaction } from '../types';
import { StorageService } from '../services/StorageService';

interface DashboardScreenProps {
  vault: WalletVault;
  onLock: () => void;
  onVaultUpdate: (vault: WalletVault) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  vault,
  onLock,
  onVaultUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'wallet' | 'history' | 'security'>('wallet');
  const [modalMode, setModalMode] = useState<'send' | 'receive' | null>(null);

  // Send state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [sendMsg, setSendMsg] = useState('');

  // Security state
  const [showSeed, setShowSeed] = useState(false);

  const handleSend = () => {
    const numAmount = parseFloat(amount);
    if (!recipient || isNaN(numAmount) || numAmount <= 0) {
      setSendMsg('Please enter a valid recipient address and amount.');
      return;
    }
    if (numAmount > vault.balanceTar) {
      setSendMsg('Insufficient balance.');
      return;
    }

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'send',
      amountTar: numAmount,
      amountUsd: numAmount * vault.tarPriceUsd,
      address: recipient,
      timestamp: new Date().toISOString(),
      status: 'completed',
      confirmations: 1,
      feeTar: 0.001,
      txHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      note: note || 'Transfer',
    };

    StorageService.updateVault((prev) => ({
      ...prev,
      balanceTar: Math.max(0, prev.balanceTar - numAmount),
      transactions: [newTx, ...prev.transactions],
    })).then((updated) => {
      onVaultUpdate(updated);
      setModalMode(null);
      setRecipient('');
      setAmount('');
      setNote('');
      setSendMsg('');
      Alert.alert('Success', `Sent ${numAmount} TAR successfully!`);
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.miniLogo}>
            <Text style={styles.miniLogoText}>TAR</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>TARCOIN</Text>
            <Text style={styles.headerSubtitle}>Cake Obsidian Vault</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.lockButton} onPress={onLock}>
          <Text style={styles.lockButtonText}>🔒 Lock</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'wallet' && (
          <View style={styles.tabContent}>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
              <Text style={styles.balanceTar}>
                {vault.balanceTar.toLocaleString()} <Text style={styles.unitText}>TAR</Text>
              </Text>
              <Text style={styles.balanceUsd}>
                ≈ ${ (vault.balanceTar * vault.tarPriceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) } USD
              </Text>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.sendBtn]}
                  onPress={() => setModalMode('send')}
                >
                  <Text style={styles.sendBtnText}>↗ Send</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.receiveBtn]}
                  onPress={() => setModalMode('receive')}
                >
                  <Text style={styles.receiveBtnText}>↙ Receive</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Address Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>YOUR TARCOIN ADDRESS</Text>
              <Text style={styles.addressText} numberOfLines={1} ellipsisMode="middle">
                {vault.address}
              </Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => copyToClipboard(vault.address, 'Address')}
              >
                <Text style={styles.copyBtnText}>Copy Address</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Activity Brief */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>RECENT ACTIVITY</Text>
              {vault.transactions.slice(0, 3).map((tx) => (
                <View key={tx.id} style={styles.txRow}>
                  <View style={styles.txIconContainer}>
                    <Text style={tx.type === 'receive' ? styles.txReceiveIcon : styles.txSendIcon}>
                      {tx.type === 'receive' ? '↙' : '↗'}
                    </Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{tx.note || (tx.type === 'receive' ? 'Received TAR' : 'Sent TAR')}</Text>
                    <Text style={styles.txDate}>{new Date(tx.timestamp).toLocaleDateString()}</Text>
                  </View>
                  <Text style={tx.type === 'receive' ? styles.txAmountReceive : styles.txAmountSend}>
                    {tx.type === 'receive' ? '+' : '-'}{tx.amountTar} TAR
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>TRANSACTION HISTORY</Text>
              {vault.transactions.map((tx) => (
                <View key={tx.id} style={styles.txRow}>
                  <View style={styles.txIconContainer}>
                    <Text style={tx.type === 'receive' ? styles.txReceiveIcon : styles.txSendIcon}>
                      {tx.type === 'receive' ? '↙' : '↗'}
                    </Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{tx.note || (tx.type === 'receive' ? 'Received TAR' : 'Sent TAR')}</Text>
                    <Text style={styles.txSub}>{tx.txHash.substring(0, 16)}...</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={tx.type === 'receive' ? styles.txAmountReceive : styles.txAmountSend}>
                      {tx.type === 'receive' ? '+' : '-'}{tx.amountTar} TAR
                    </Text>
                    <Text style={styles.txStatusText}>{tx.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'security' && (
          <View style={styles.tabContent}>
            {/* Seed Phrase Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>RECOVERY SEED PHRASE</Text>
              <Text style={styles.securityDesc}>
                Keep your 12-word recovery phrase secret. Never share it.
              </Text>
              {showSeed ? (
                <View style={styles.seedBox}>
                  <Text style={styles.seedText}>{vault.seedPhrase}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.showSeedBtn}
                  onPress={() => setShowSeed(true)}
                >
                  <Text style={styles.showSeedBtnText}>Show Seed Phrase</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Export JSON Backup */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>RAW JSON VAULT BACKUP</Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => copyToClipboard(JSON.stringify(vault, null, 2), 'Vault JSON Backup')}
              >
                <Text style={styles.copyBtnText}>Copy Vault JSON</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Bar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('wallet')}
        >
          <Text style={[styles.navIcon, activeTab === 'wallet' && styles.navActive]}>👛</Text>
          <Text style={[styles.navText, activeTab === 'wallet' && styles.navActive]}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.navIcon, activeTab === 'history' && styles.navActive]}>📜</Text>
          <Text style={[styles.navText, activeTab === 'history' && styles.navActive]}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('security')}
        >
          <Text style={[styles.navIcon, activeTab === 'security' && styles.navActive]}>⚙️</Text>
          <Text style={[styles.navText, activeTab === 'security' && styles.navActive]}>Security</Text>
        </TouchableOpacity>
      </View>

      {/* Modal: Send / Receive */}
      <Modal
        visible={modalMode !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalMode(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalMode === 'send' ? (
              <>
                <Text style={styles.modalTitle}>Send TARCOIN</Text>
                {sendMsg ? <Text style={styles.errorText}>{sendMsg}</Text> : null}
                <TextInput
                  style={styles.input}
                  placeholder="Recipient TAR Address"
                  placeholderTextColor={colors.textMuted}
                  value={recipient}
                  onChangeText={setRecipient}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Amount (TAR)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Note / Description (Optional)"
                  placeholderTextColor={colors.textMuted}
                  value={note}
                  onChangeText={setNote}
                />
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSend}>
                  <Text style={styles.modalConfirmText}>Confirm Send</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Receive TARCOIN</Text>
                <Text style={styles.modalSub}>Scan or copy your address below:</Text>
                <View style={styles.addressBoxModal}>
                  <Text style={styles.addressTextModal}>{vault.address}</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => copyToClipboard(vault.address, 'Address')}
                >
                  <Text style={styles.copyBtnText}>Copy Address</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalMode(null)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLogoText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 10,
  },
  lockButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.button,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  lockButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  tabContent: {
    gap: spacing.lg,
  },
  balanceCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.card,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  balanceLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  balanceTar: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
  },
  unitText: {
    color: colors.accentCyan,
    fontSize: 20,
  },
  balanceUsd: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.button,
    alignItems: 'center',
  },
  sendBtn: {
    backgroundColor: colors.accentCyan,
  },
  sendBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  receiveBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  receiveBtnText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardTitle: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 12,
    fontWeight: '600',
  },
  addressText: {
    color: colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 12,
  },
  copyBtn: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingVertical: 10,
    borderRadius: radii.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  copyBtnText: {
    color: colors.accentCyan,
    fontWeight: '600',
    fontSize: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  txIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txReceiveIcon: {
    color: colors.accentSuccess,
    fontSize: 16,
  },
  txSendIcon: {
    color: colors.accentDanger,
    fontSize: 16,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  txDate: {
    color: colors.textMuted,
    fontSize: 11,
  },
  txSub: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  txAmountReceive: {
    color: colors.accentSuccess,
    fontWeight: '700',
    fontSize: 14,
  },
  txAmountSend: {
    color: colors.accentDanger,
    fontWeight: '700',
    fontSize: 14,
  },
  txStatusText: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  securityDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  seedBox: {
    backgroundColor: colors.bgPrimary,
    padding: 12,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  seedText: {
    color: colors.accentCyan,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  showSeedBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 10,
    borderRadius: radii.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  showSeedBtnText: {
    color: colors.accentDanger,
    fontWeight: '600',
    fontSize: 12,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  navText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  navActive: {
    color: colors.accentCyan,
    opacity: 1,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  modalConfirmBtn: {
    backgroundColor: colors.accentCyan,
    paddingVertical: 12,
    borderRadius: radii.button,
    alignItems: 'center',
    marginTop: 8,
  },
  modalConfirmText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  modalCloseBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  modalCloseText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  errorText: {
    color: colors.accentDanger,
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  addressBoxModal: {
    backgroundColor: colors.bgPrimary,
    padding: 12,
    borderRadius: radii.button,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  addressTextModal: {
    color: colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 11,
    textAlign: 'center',
  },
});
