// TARCOIN Wallet — AsyncStorage Service
// React Native port of applet src/services/EncryptStorage.ts
// Replaces localStorage with @react-native-async-storage/async-storage

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WalletVault, Transaction } from '../types';

const KEY_VAULT = 'tarcoin_wallet_vault';
const KEY_PIN = 'tarcoin_pin_hash';
const KEY_BIOMETRICS = 'tarcoin_biometrics_enabled';

// Simple hash matching applet implementation
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `pin_hash_${Math.abs(hash)}_${pin.length}`;
}

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_100',
    type: 'receive',
    amountTar: 75.0,
    amountUsd: 750.0,
    address: 'tar1q5u4v3w2x1y0z9a8b7c6d5e4f3g2h1j0k9l8m',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    status: 'pending',
    confirmations: 1,
    feeTar: 0.0015,
    txHash: '3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b',
    note: 'Inbound pool reward',
  },
  {
    id: 'tx_101',
    type: 'receive',
    amountTar: 450.0,
    amountUsd: 4500.0,
    address: 'tar1q8x9y7z6w5v4u3t2s1r0q9p8o7n6m5l4k3j2h1',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'completed',
    confirmations: 12,
    feeTar: 0.001,
    txHash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
    note: 'Mining pool rewards',
  },
  {
    id: 'tx_102',
    type: 'send',
    amountTar: 120.5,
    amountUsd: 1205.0,
    address: 'tar1q2w3e4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'completed',
    confirmations: 144,
    feeTar: 0.002,
    txHash: '1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e',
    note: 'Exchange deposit',
  },
  {
    id: 'tx_103',
    type: 'receive',
    amountTar: 1000.0,
    amountUsd: 10000.0,
    address: 'tar1q9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2h1',
    timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
    status: 'completed',
    confirmations: 432,
    feeTar: 0.001,
    txHash: '7e6f5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    note: 'Initial seed transfer',
  },
];

const DEFAULT_VAULT: WalletVault = {
  pin: '1234',
  useBiometrics: true,
  seedPhrase: 'obsidian cake tarcoin speed velocity crystal quantum matrix bloom zenith apex',
  address: 'tar1q7k9v2m8x4w6y3z1p5q9r8t2s4u6v8x0y1z3a4b',
  balanceTar: 1329.5,
  tarPriceUsd: 10.0,
  transactions: DEFAULT_TRANSACTIONS,
  contacts: [],
  lastBackup: new Date().toISOString(),
};

class StorageServiceClass {
  private cachedVault: WalletVault | null = null;

  async init(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(KEY_VAULT);
      if (raw) {
        this.cachedVault = JSON.parse(raw);
      } else {
        this.cachedVault = DEFAULT_VAULT;
        await AsyncStorage.setItem(KEY_VAULT, JSON.stringify(DEFAULT_VAULT));
      }

      const storedPin = await AsyncStorage.getItem(KEY_PIN);
      if (!storedPin) {
        await AsyncStorage.setItem(KEY_PIN, hashPin('1234'));
      }
    } catch (e) {
      this.cachedVault = DEFAULT_VAULT;
    }
  }

  async validatePin(pin: string): Promise<boolean> {
    try {
      const storedHash = await AsyncStorage.getItem(KEY_PIN);
      const hash = storedHash || hashPin('1234');
      return hash === hashPin(pin);
    } catch {
      return false;
    }
  }

  async savePin(pin: string): Promise<void> {
    await AsyncStorage.setItem(KEY_PIN, hashPin(pin));
    if (this.cachedVault) {
      this.cachedVault.pin = pin;
      await this.persist();
    }
  }

  async getVault(): Promise<WalletVault> {
    if (!this.cachedVault) {
      await this.init();
    }
    return this.cachedVault!;
  }

  async updateVault(updater: (v: WalletVault) => WalletVault): Promise<WalletVault> {
    if (!this.cachedVault) {
      await this.init();
    }
    this.cachedVault = updater(this.cachedVault!);
    await this.persist();
    return this.cachedVault;
  }

  async isBiometricsEnabled(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEY_BIOMETRICS);
    return val !== 'false';
  }

  async setBiometricsEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(KEY_BIOMETRICS, enabled ? 'true' : 'false');
    if (this.cachedVault) {
      this.cachedVault.useBiometrics = enabled;
      await this.persist();
    }
  }

  private async persist(): Promise<void> {
    if (this.cachedVault) {
      await AsyncStorage.setItem(KEY_VAULT, JSON.stringify(this.cachedVault));
    }
  }
}

export const StorageService = new StorageServiceClass();
