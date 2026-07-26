export interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amountTar: number;
  amountUsd: number;
  address: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  confirmations: number;
  feeTar: number;
  txHash: string;
  note?: string;
}

export interface ContactAddress {
  id: string;
  name: string;
  address: string;
  category?: 'personal' | 'merchant' | 'pool' | 'exchange' | 'other';
  avatarColor?: string;
  note?: string;
  createdAt: string;
}

export interface WalletVault {
  pin: string;
  useBiometrics: boolean;
  seedPhrase: string;
  address: string;
  balanceTar: number;
  tarPriceUsd: number;
  transactions: Transaction[];
  contacts?: ContactAddress[];
  lastBackup: string;
}

export interface ElectrumNode {
  host: string;
  port: number;
  ssl: boolean;
  pingMs: number;
  connected: boolean;
  version: string;
}

export interface BootMetrics {
  splashTimeMs: number;
  storageLoadTimeMs: number;
  electrumDeferTimeMs: number;
  totalBootTimeMs: number;
  status: 'instant_launch' | 'loading' | 'unlocked';
}
