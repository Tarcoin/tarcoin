// TARCOIN Wallet — TypeScript types
// Ported from applet src/types.ts

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
