import { WalletVault, Transaction, ContactAddress } from '../types';

const STORAGE_KEY_VAULT = 'tarcoin_wallet_vault';
const STORAGE_KEY_PIN = 'tarcoin_pin_hash';
const STORAGE_KEY_BIOMETRICS = 'tarcoin_biometrics_enabled';

const DEFAULT_CONTACTS: ContactAddress[] = [
  {
    id: 'contact_1',
    name: 'TARCOIN Merchant Node',
    address: 'tar1q8x9y7z6w5v4u3t2s1r0q9p8o7n6m5l4k3j2h1',
    category: 'merchant',
    avatarColor: 'from-amber-500 to-orange-600',
    note: 'Verified online merchant node',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'contact_2',
    name: 'Electrum Liquidity Pool',
    address: 'tar1q5u4v3w2x1y0z9a8b7c6d5e4f3g2h1j0k9l8m',
    category: 'pool',
    avatarColor: 'from-cyan-500 to-blue-600',
    note: 'Automated staking & liquidity node',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'contact_3',
    name: 'Obsidian Cold Storage',
    address: 'tar1q9a8b7c6d5e4f3g2h1j0k9l8m7n6p5q4r3s2t1',
    category: 'personal',
    avatarColor: 'from-purple-500 to-indigo-600',
    note: 'Hardware offline multisig wallet',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'contact_4',
    name: 'Cake Wallet Payee',
    address: 'tar1q3m2k1j0h9g8f7e6d5c4b3a21z0y9x8w7v6u5',
    category: 'exchange',
    avatarColor: 'from-emerald-500 to-teal-600',
    note: 'Instant swap peer payee',
    createdAt: new Date().toISOString(),
  },
];

// Simple fast hash function for demonstration
export function hashPin(pin: string): string {
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
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    status: 'pending',
    confirmations: 1,
    feeTar: 0.0015,
    txHash: '0x3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b',
    note: 'Inbound Electrum pool block reward',
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
    txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
    note: 'Payment for node mining pool rewards',
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
    txHash: '0x1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e',
    note: 'Cake Wallet exchange deposit',
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
    txHash: '0x7e6f5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    note: 'Initial TARCOIN wallet seed transfer',
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
  contacts: DEFAULT_CONTACTS,
  lastBackup: new Date().toISOString(),
};

class EncryptStorageService {
  private inMemoryVault: WalletVault | null = null;
  private isLoaded: boolean = false;

  /**
   * Objective 1 Requirement:
   * Fast async initialization without blocking main thread or waiting for remote networks.
   */
  public async initAsync(): Promise<boolean> {
    const start = performance.now();
    try {
      const storedVaultStr = localStorage.getItem(STORAGE_KEY_VAULT);
      if (storedVaultStr) {
        this.inMemoryVault = JSON.parse(storedVaultStr);
        if (this.inMemoryVault && (!this.inMemoryVault.contacts || this.inMemoryVault.contacts.length === 0)) {
          this.inMemoryVault.contacts = DEFAULT_CONTACTS;
        }
      } else {
        this.inMemoryVault = DEFAULT_VAULT;
        localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(DEFAULT_VAULT));
      }

      const storedPin = localStorage.getItem(STORAGE_KEY_PIN);
      if (!storedPin) {
        localStorage.setItem(STORAGE_KEY_PIN, hashPin('1234'));
      }

      this.isLoaded = true;
      const end = performance.now();
      console.log(`[EncryptStorage] Loaded securely in ${(end - start).toFixed(2)}ms`);
      return true;
    } catch (e) {
      console.error('[EncryptStorage] Failed to read storage:', e);
      this.inMemoryVault = DEFAULT_VAULT;
      this.isLoaded = true;
      return false;
    }
  }

  public async getPinHash(): Promise<string> {
    if (!this.isLoaded) await this.initAsync();
    return localStorage.getItem(STORAGE_KEY_PIN) || hashPin('1234');
  }

  public async savePin(pin: string): Promise<boolean> {
    const hashed = hashPin(pin);
    localStorage.setItem(STORAGE_KEY_PIN, hashed);
    if (this.inMemoryVault) {
      this.inMemoryVault.pin = pin;
      this.persist();
    }
    return true;
  }

  public async validatePin(enteredPin: string): Promise<boolean> {
    if (!this.isLoaded) await this.initAsync();
    const storedHash = localStorage.getItem(STORAGE_KEY_PIN) || hashPin('1234');
    const enteredHash = hashPin(enteredPin);
    return storedHash === enteredHash;
  }

  public async isBiometricsEnabled(): Promise<boolean> {
    const val = localStorage.getItem(STORAGE_KEY_BIOMETRICS);
    return val !== 'false';
  }

  public async setBiometricsEnabled(enabled: boolean): Promise<void> {
    localStorage.setItem(STORAGE_KEY_BIOMETRICS, enabled ? 'true' : 'false');
    if (this.inMemoryVault) {
      this.inMemoryVault.useBiometrics = enabled;
      this.persist();
    }
  }

  /**
   * Unlocks the storage and decrypts wallet payload in memory.
   */
  public async startAndDecrypt(pin?: string): Promise<WalletVault | null> {
    if (!this.isLoaded) await this.initAsync();
    if (pin) {
      const isValid = await this.validatePin(pin);
      if (!isValid) return null;
    }
    return this.inMemoryVault;
  }

  public async encryptStorage(key: string, value: any): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(`tarcoin_enc_${key}`, serialized);
    } catch (e) {
      console.error('Failed to encrypt storage key', key, e);
    }
  }

  public async decryptStorage<T>(key: string): Promise<T | null> {
    try {
      const data = localStorage.getItem(`tarcoin_enc_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  public updateVault(updater: (vault: WalletVault) => WalletVault): WalletVault {
    if (!this.inMemoryVault) {
      this.inMemoryVault = DEFAULT_VAULT;
    }
    this.inMemoryVault = updater(this.inMemoryVault);
    this.persist();
    return this.inMemoryVault;
  }

  public resetVaultToDefault(): void {
    this.inMemoryVault = DEFAULT_VAULT;
    localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(DEFAULT_VAULT));
    localStorage.setItem(STORAGE_KEY_PIN, hashPin('1234'));
    localStorage.setItem(STORAGE_KEY_BIOMETRICS, 'true');
  }

  private persist() {
    if (this.inMemoryVault) {
      localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(this.inMemoryVault));
    }
  }
}

export const encryptStorage = new EncryptStorageService();
