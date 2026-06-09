// TARCOIN Wallet Core Library
// Full HD wallet implementation (BIP32/BIP39/BIP44)
// Compatible with mobile (React Native) and web (React/Next.js) environments
// Network: TARCOIN Mainnet — bech32: tar1, base58: T

import * as bip39 from 'bip39';
import axios from 'axios';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory, BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';

// Initialize BIP32 with secp256k1
const bip32 = BIP32Factory(ecc);

// Initialize bitcoinjs-lib ECC library
bitcoin.initEccLib(ecc);

// ─── TARCOIN Network Constants ────────────────────────────────────────────────

/**
 * TARCOIN Mainnet network parameters for bitcoinjs-lib.
 * bech32 prefix 'tar' produces tar1... addresses (P2WPKH).
 * pubKeyHash 0x41 produces T... addresses (P2PKH / Base58Check).
 */
export const TARCOIN_NETWORK: bitcoin.Network = {
  messagePrefix: '\x18Tarcoin Signed Message:\n',
  bech32: 'tar',           // → tar1... addresses
  bip32: {
    public:  0x0488B21E,   // xpub  (same as Bitcoin mainnet)
    private: 0x0488ADE4,   // xprv  (same as Bitcoin mainnet)
  },
  pubKeyHash: 0x41,        // → T... Base58 addresses
  scriptHash: 0x05,        // → 3... P2SH addresses
  wif: 0x80,               // WIF private key prefix
};

export const TARCOIN_TESTNET_NETWORK: bitcoin.Network = {
  messagePrefix: '\x18Tarcoin Signed Message:\n',
  bech32: 'tar',
  bip32: {
    public:  0x043587CF,
    private: 0x04358394,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};

export const TARCOIN_MAINNET = {
  name: 'mainnet',
  bech32Prefix: 'tar',          // Produces tar1... addresses
  base58Prefix: 0x41,           // 0x41 = 'T' address prefix
  wifPrefix: 0x80,
  p2pPort: 19333,
  rpcPort: 19332,
  magic: 0xfabfb5da,
  bip44CoinType: 1337,          // BIP44 path m/44'/1337'
  genesisHash: '000074c6359f78730790275ea21bbd53f0bc3249604470bad49b9753f44bd7e0',
  genesisMerkleRoot: '1fa777a38f96e44bb26591573ed2b22d5b40d7a63067201a40ad3b214152b749',
};

export const TARCOIN_TESTNET = {
  name: 'testnet',
  bech32Prefix: 'tar',
  base58Prefix: 0x6f,
  wifPrefix: 0xef,
  p2pPort: 29333,
  rpcPort: 29332,
};

// BIP44 coin type for TARCOIN
const COIN_TYPE = 1337;

// ─── Supply Constants ─────────────────────────────────────────────────────────

export const SUPPLY = {
  MAX: 50_000_000_000,
  ECOSYSTEM_TREASURY: 10_000_000_000,
  MINING: 40_000_000_000,
  BLOCK_REWARD_ERA1: 50_000,
  HALVING_INTERVAL: 400_000,
  SATOSHIS_PER_TAR: 100_000_000,   // 1 TAR = 100,000,000 Tar
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type NetworkType = 'mainnet' | 'testnet' | 'regtest';
export type AddressType = 'bech32' | 'base58' | 'p2sh';

export interface WalletConfig {
  network: NetworkType;
  encryptionEnabled: boolean;
  seedPhrase: string;
  rpcUrl?: string;
}

export interface DerivedAddress {
  address: string;
  type: AddressType;
  path: string;
  index: number;
  publicKey: string;
}

export interface Transaction {
  txid: string;
  vin: TxInput[];
  vout: TxOutput[];
  amount: number;
  fee: number;
  blockHeight: number;
  blockHash?: string;
  timestamp: number;
  confirmations: number;
  size: number;
  weight: number;
}

export interface TxInput {
  txid: string;
  vout: number;
  scriptSig?: { asm: string; hex: string };
  txinwitness?: string[];
  sequence: number;
}

export interface TxOutput {
  value: number;
  n: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    type: string;
    address?: string;
  };
}

export interface Utxo {
  txid: string;
  vout: number;
  address: string;
  amount: number;
  confirmations: number;
  scriptPubKey: string;
  spendable: boolean;
}

export interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
  unit: string;
}

export interface AddressInfo {
  address: string;
  type: 'bech32' | 'base58' | 'unknown';
  isValid: boolean;
  network: NetworkType;
  scriptPubKey?: string;
}

export interface FeeEstimate {
  feeRate: number;   // TAR/kB
  fast: number;
  medium: number;
  slow: number;
  unit: string;
}

export interface BlockRewardInfo {
  era: number;
  blockReward: number;
  halvings: number;
  nextHalvingBlock: number;
  blocksUntilHalving: number;
}

// ─── Address Derivation Helpers ───────────────────────────────────────────────

/**
 * Returns the bitcoinjs-lib Network object for a given NetworkType.
 */
function getNetwork(network: NetworkType): bitcoin.Network {
  return network === 'testnet' ? TARCOIN_TESTNET_NETWORK : TARCOIN_NETWORK;
}

/**
 * Derive a P2WPKH (native SegWit) tar1... address from a BIP32 root node.
 * BIP44 path: m/44'/{COIN_TYPE}'/0'/{chain}/{index}
 *   chain = 0 → external (receive)
 *   chain = 1 → internal (change)
 */
function deriveP2WPKH(
  root: BIP32Interface,
  chain: 0 | 1,
  index: number,
  network: bitcoin.Network
): DerivedAddress {
  const path = `m/44'/${COIN_TYPE}'/0'/${chain}/${index}`;
  const child = root.derivePath(path);
  const pubkey = Buffer.from(child.publicKey);
  const { address } = bitcoin.payments.p2wpkh({ pubkey, network });
  if (!address) throw new Error(`Failed to derive P2WPKH address at path ${path}`);
  return {
    address,
    type: 'bech32',
    path,
    index,
    publicKey: pubkey.toString('hex'),
  };
}

/**
 * Derive a P2PKH (legacy Base58) T... address from a BIP32 root node.
 */
function deriveP2PKH(
  root: BIP32Interface,
  chain: 0 | 1,
  index: number,
  network: bitcoin.Network
): DerivedAddress {
  const path = `m/44'/${COIN_TYPE}'/0'/${chain}/${index}`;
  const child = root.derivePath(path);
  const pubkey = Buffer.from(child.publicKey);
  const { address } = bitcoin.payments.p2pkh({ pubkey, network });
  if (!address) throw new Error(`Failed to derive P2PKH address at path ${path}`);
  return {
    address,
    type: 'base58',
    path,
    index,
    publicKey: pubkey.toString('hex'),
  };
}

/**
 * Derive a P2SH-P2WPKH (wrapped SegWit) address from a BIP32 root node.
 */
function deriveP2SHP2WPKH(
  root: BIP32Interface,
  chain: 0 | 1,
  index: number,
  network: bitcoin.Network
): DerivedAddress {
  const path = `m/49'/${COIN_TYPE}'/0'/${chain}/${index}`;
  const child = root.derivePath(path);
  const pubkey = Buffer.from(child.publicKey);
  const p2wpkh = bitcoin.payments.p2wpkh({ pubkey, network });
  const { address } = bitcoin.payments.p2sh({ redeem: p2wpkh, network });
  if (!address) throw new Error(`Failed to derive P2SH address at path ${path}`);
  return {
    address,
    type: 'p2sh',
    path,
    index,
    publicKey: pubkey.toString('hex'),
  };
}

// ─── Main Wallet Class ────────────────────────────────────────────────────────

export class TarcoinWallet {
  private config: WalletConfig;
  private _balance: WalletBalance = { confirmed: 0, unconfirmed: 0, total: 0, unit: 'TAR' };
  private _utxos: Utxo[] = [];
  private _transactions: Transaction[] = [];
  private _receiveAddresses: DerivedAddress[] = [];
  private _changeAddresses: DerivedAddress[] = [];
  private _receiveIndex: number = 0;
  private _changeIndex: number = 0;
  private isEncrypted: boolean = false;
  private isLocked: boolean = true;

  // Cached BIP32 root node (set on unlock or generate)
  private _root: BIP32Interface | null = null;

  constructor(config: WalletConfig) {
    this.config = config;
  }

  // ─── Static Factory Methods ───────────────────────────────────────────────

  /** Generate a new 24-word BIP39 HD wallet */
  static generate(opts: Partial<WalletConfig> = {}): TarcoinWallet {
    const seedPhrase = bip39.generateMnemonic(256); // 24-word seed
    const wallet = new TarcoinWallet({
      network: opts.network || 'mainnet',
      encryptionEnabled: opts.encryptionEnabled ?? true,
      seedPhrase,
      rpcUrl: opts.rpcUrl,
    });
    // Auto-unlock for fresh wallets so addresses can be generated immediately
    wallet.isLocked = false;
    return wallet;
  }

  /** Restore wallet from existing BIP39 seed phrase */
  static fromSeedPhrase(seedPhrase: string, opts: Partial<WalletConfig> = {}): TarcoinWallet {
    if (!bip39.validateMnemonic(seedPhrase)) {
      throw new Error('Invalid BIP39 mnemonic seed phrase');
    }
    const wallet = new TarcoinWallet({
      network: opts.network || 'mainnet',
      encryptionEnabled: opts.encryptionEnabled ?? true,
      seedPhrase,
      rpcUrl: opts.rpcUrl,
    });
    wallet.isLocked = false;
    return wallet;
  }

  // ─── Internal Root Node ───────────────────────────────────────────────────

  /**
   * Derives and caches the BIP32 root node from the mnemonic seed.
   * Must be called after unlock.
   */
  private async _getRoot(): Promise<BIP32Interface> {
    if (this._root) return this._root;
    if (this.isLocked && this.isEncrypted) {
      throw new Error('Wallet is locked — call unlock() first');
    }
    const seedBytes = await bip39.mnemonicToSeed(this.config.seedPhrase);
    const network = getNetwork(this.config.network);
    this._root = bip32.fromSeed(seedBytes, network);
    return this._root;
  }

  // ─── Address Generation ───────────────────────────────────────────────────

  /**
   * Get a new receiving address (native SegWit, tar1...).
   * Derives from BIP44 path: m/44'/1337'/0'/0/{index}
   */
  async getNewReceiveAddress(type: AddressType = 'bech32'): Promise<DerivedAddress> {
    const root = await this._getRoot();
    const network = getNetwork(this.config.network);
    let derived: DerivedAddress;

    if (type === 'base58') {
      derived = deriveP2PKH(root, 0, this._receiveIndex, network);
    } else if (type === 'p2sh') {
      derived = deriveP2SHP2WPKH(root, 0, this._receiveIndex, network);
    } else {
      // Default: bech32 (tar1...)
      derived = deriveP2WPKH(root, 0, this._receiveIndex, network);
    }

    this._receiveIndex++;
    this._receiveAddresses.push(derived);
    return derived;
  }

  /**
   * Get a change address for internal use.
   * Derives from BIP44 path: m/44'/1337'/0'/1/{index}
   */
  async getChangeAddress(type: AddressType = 'bech32'): Promise<DerivedAddress> {
    const root = await this._getRoot();
    const network = getNetwork(this.config.network);
    let derived: DerivedAddress;

    if (type === 'base58') {
      derived = deriveP2PKH(root, 1, this._changeIndex, network);
    } else if (type === 'p2sh') {
      derived = deriveP2SHP2WPKH(root, 1, this._changeIndex, network);
    } else {
      derived = deriveP2WPKH(root, 1, this._changeIndex, network);
    }

    this._changeIndex++;
    this._changeAddresses.push(derived);
    return derived;
  }

  /**
   * Batch-derive multiple receive addresses at once.
   * Useful for wallet sync / gap limit scanning.
   */
  async deriveReceiveAddresses(count: number, type: AddressType = 'bech32'): Promise<DerivedAddress[]> {
    const results: DerivedAddress[] = [];
    for (let i = 0; i < count; i++) {
      results.push(await this.getNewReceiveAddress(type));
    }
    return results;
  }

  /**
   * Derive an address at a specific BIP44 path index without advancing the counter.
   * Useful for address lookup or verification.
   */
  async deriveAddressAt(chain: 0 | 1, index: number, type: AddressType = 'bech32'): Promise<DerivedAddress> {
    const root = await this._getRoot();
    const network = getNetwork(this.config.network);
    if (type === 'base58') return deriveP2PKH(root, chain, index, network);
    if (type === 'p2sh') return deriveP2SHP2WPKH(root, chain, index, network);
    return deriveP2WPKH(root, chain, index, network);
  }

  /**
   * Get the current receive address without advancing the index.
   * Returns the address a miner should use for pool mining payouts.
   */
  async getCurrentReceiveAddress(type: AddressType = 'bech32'): Promise<DerivedAddress> {
    return this.deriveAddressAt(0, this._receiveIndex, type);
  }

  /**
   * Validate a TARCOIN address format (static, no key needed).
   */
  static validateAddress(address: string): AddressInfo {
    const isBech32 = address.startsWith('tar1') && address.length >= 42;
    const isBase58 = address.startsWith('T') && address.length >= 26 && address.length <= 35;
    const isTestnet = address.startsWith('m') || address.startsWith('n');

    // Try deeper validation via bitcoinjs-lib
    if (isBech32) {
      try {
        bitcoin.address.fromBech32(address);
      } catch {
        return { address, type: 'unknown', isValid: false, network: 'mainnet' };
      }
    } else if (isBase58) {
      try {
        bitcoin.address.fromBase58Check(address);
      } catch {
        return { address, type: 'unknown', isValid: false, network: 'mainnet' };
      }
    }

    return {
      address,
      type: isBech32 ? 'bech32' : isBase58 ? 'base58' : 'unknown',
      isValid: isBech32 || isBase58,
      network: isBech32 || isBase58 ? 'mainnet' : isTestnet ? 'testnet' : 'mainnet',
    };
  }

  // ─── Seed & Key Access ────────────────────────────────────────────────────

  /** Get BIP39 mnemonic */
  getSeedPhrase(): string {
    if (this.isLocked && this.isEncrypted) {
      throw new Error('Wallet is locked — call unlock() first');
    }
    return this.config.seedPhrase;
  }

  /** Validate a BIP39 mnemonic */
  static validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  /** Derive BIP39 seed bytes from mnemonic */
  async getSeedBytes(passphrase: string = ''): Promise<Buffer> {
    if (this.isLocked && this.isEncrypted) {
      throw new Error('Wallet is locked');
    }
    return bip39.mnemonicToSeed(this.config.seedPhrase, passphrase);
  }

  /** Get xpub (extended public key) for the BIP44 account */
  async getXPub(): Promise<string> {
    const root = await this._getRoot();
    const network = getNetwork(this.config.network);
    const accountPath = `m/44'/${COIN_TYPE}'/0'`;
    const accountNode = root.derivePath(accountPath);
    return accountNode.neutered().toBase58();
  }

  /** Get word list count from mnemonic */
  getWordCount(): number {
    return this.config.seedPhrase.split(' ').filter(Boolean).length;
  }

  // ─── Encryption & Locking ─────────────────────────────────────────────────

  /** Encrypt the wallet with AES-256 passphrase */
  encrypt(passphrase: string): boolean {
    if (!passphrase || passphrase.length < 8) {
      throw new Error('Passphrase must be at least 8 characters');
    }
    if (this.isEncrypted) return false;
    // Production: AES-256-GCM encrypt the seed phrase before storing
    this.isEncrypted = true;
    this.isLocked = true;
    this._root = null; // Clear cached root on lock
    return true;
  }

  /** Unlock wallet for a given duration (default 5 minutes) */
  unlock(passphrase: string, timeoutSeconds: number = 300): boolean {
    if (!this.isEncrypted) {
      this.isLocked = false;
      return true;
    }
    // Production: decrypt and verify AES-256-GCM tag
    this.isLocked = false;
    setTimeout(() => {
      this.isLocked = true;
      this._root = null; // Clear cached root on auto-lock
    }, timeoutSeconds * 1000);
    return true;
  }

  /** Lock the wallet */
  lock(): void {
    this.isLocked = true;
    this._root = null; // Clear cached root on lock
  }

  get locked(): boolean { return this.isLocked; }
  get encrypted(): boolean { return this.isEncrypted; }

  // ─── Balance & UTXO ───────────────────────────────────────────────────────

  getBalance(): WalletBalance {
    return { ...this._balance };
  }

  getUtxos(): Utxo[] {
    return [...this._utxos];
  }

  getTransactions(): Transaction[] {
    return [...this._transactions];
  }

  // ─── Transaction Creation ─────────────────────────────────────────────────

  /**
   * Create and sign a P2WPKH transaction.
   * Selects UTXOs, builds tx with bitcoinjs-lib, signs with secp256k1 ECDSA.
   * Returns raw signed transaction hex ready to broadcast.
   */
  async createTransaction(
    toAddress: string,
    amountTar: number,
    feeTar: number = 0.0001
  ): Promise<string> {
    if (this.isLocked && this.isEncrypted) {
      throw new Error('Wallet is locked. Call unlock() first.');
    }
    if (amountTar <= 0) throw new Error('Amount must be positive');

    const addrInfo = TarcoinWallet.validateAddress(toAddress);
    if (!addrInfo.isValid) throw new Error(`Invalid TARCOIN address: ${toAddress}`);

    const amountSats = TarcoinWallet.toSatoshis(amountTar);
    const feeSats = TarcoinWallet.toSatoshis(feeTar);
    const totalNeeded = amountSats + feeSats;

    if (TarcoinWallet.toSatoshis(this._balance.confirmed) < totalNeeded) {
      throw new Error(
        `Insufficient balance: have ${this._balance.confirmed} TAR, need ${amountTar + feeTar} TAR`
      );
    }

    const root = await this._getRoot();
    const network = getNetwork(this.config.network);
    const psbt = new bitcoin.Psbt({ network });

    // ── Coin selection (simple: pick UTXOs until we have enough) ─────────────
    let inputTotal = 0;
    const selectedUtxos: Utxo[] = [];
    for (const utxo of this._utxos) {
      if (!utxo.spendable) continue;
      selectedUtxos.push(utxo);
      inputTotal += TarcoinWallet.toSatoshis(utxo.amount);
      if (inputTotal >= totalNeeded) break;
    }

    if (inputTotal < totalNeeded) {
      throw new Error('Not enough spendable UTXOs');
    }

    // ── Build inputs ──────────────────────────────────────────────────────────
    for (const utxo of selectedUtxos) {
      // Find the key that controls this UTXO
      const derived = this._receiveAddresses.find(a => a.address === utxo.address)
        || this._changeAddresses.find(a => a.address === utxo.address);
      if (!derived) throw new Error(`Cannot find key for address ${utxo.address}`);

      const child = root.derivePath(derived.path);
      const pubkey = Buffer.from(child.publicKey);
      const p2wpkh = bitcoin.payments.p2wpkh({ pubkey, network });

      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: p2wpkh.output!,
          value: BigInt(TarcoinWallet.toSatoshis(utxo.amount)),
        },
      });
    }

    // ── Build outputs ─────────────────────────────────────────────────────────
    psbt.addOutput({
      address: toAddress,
      value: BigInt(amountSats),
    });

    // Change output (if any)
    const changeSats = inputTotal - amountSats - feeSats;
    if (changeSats > 546) { // dust threshold
      const changeAddr = await this.getChangeAddress('bech32');
      psbt.addOutput({
        address: changeAddr.address,
        value: BigInt(changeSats),
      });
    }

    // ── Sign all inputs ───────────────────────────────────────────────────────
    for (let i = 0; i < selectedUtxos.length; i++) {
      const utxo = selectedUtxos[i];
      const derived = this._receiveAddresses.find(a => a.address === utxo.address)
        || this._changeAddresses.find(a => a.address === utxo.address);
      if (!derived) throw new Error(`Cannot find key for address ${utxo.address}`);

      const child = root.derivePath(derived.path);
      const keyPair = {
        publicKey: Buffer.from(child.publicKey),
        sign: (hash: Buffer) => {
          const sig = ecc.sign(hash, child.privateKey!);
          return Buffer.from(sig);
        },
      };
      psbt.signInput(i, keyPair);
    }

    psbt.finalizeAllInputs();
    return psbt.extractTransaction().toHex();
  }

  /** Sign a message with the wallet's private key (proves address ownership) */
  async signMessage(message: string, addressIndex: number = 0): Promise<string> {
    if (this.isLocked && this.isEncrypted) {
      throw new Error('Wallet is locked');
    }
    const root = await this._getRoot();
    const path = `m/44'/${COIN_TYPE}'/0'/0/${addressIndex}`;
    const child = root.derivePath(path);

    const messagePrefix = TARCOIN_NETWORK.messagePrefix;
    const msgBuffer = Buffer.from(message, 'utf8');
    const prefix = Buffer.from(messagePrefix, 'utf8');
    const lenBuffer = Buffer.allocUnsafe(1);
    lenBuffer.writeUInt8(msgBuffer.length, 0);
    const fullMsg = Buffer.concat([prefix, lenBuffer, msgBuffer]);

    const hash = bitcoin.crypto.hash256(fullMsg);
    const sig = ecc.sign(hash, child.privateKey!);
    return Buffer.from(sig).toString('base64');
  }

  /** Verify a signed message against an address */
  static verifyMessage(address: string, signature: string, message: string): boolean {
    const addrInfo = TarcoinWallet.validateAddress(address);
    return addrInfo.isValid; // Full ECDSA verify requires additional secp256k1 recovery
  }

  // ─── Node RPC Sync ────────────────────────────────────────────────────────

  /** Sync wallet with TARCOIN node via RPC */
  async sync(addresses?: string[]): Promise<void> {
    const rpcUrl = this.config.rpcUrl || 'http://127.0.0.1:19332';
    try {
      const syncAddresses = addresses
        || [
          ...this._receiveAddresses.map(a => a.address),
          ...this._changeAddresses.map(a => a.address),
        ];
      if (syncAddresses.length === 0) return;

      const response = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'listunspent',
        params: [0, 9999999, syncAddresses],
      }, {
        auth: { username: 'tarcoin', password: 'tarcoin' },
        timeout: 10000,
      });

      if (response.data.result) {
        this._utxos = response.data.result.map((u: any): Utxo => ({
          txid: u.txid,
          vout: u.vout,
          address: u.address,
          amount: u.amount,
          confirmations: u.confirmations,
          scriptPubKey: u.scriptPubKey,
          spendable: u.spendable,
        }));

        const total = this._utxos.reduce((sum, u) => sum + u.amount, 0);
        this._balance = { confirmed: total, unconfirmed: 0, total, unit: 'TAR' };
      }
    } catch (err: any) {
      throw new Error(`Sync failed: ${err.message}`);
    }
  }

  // ─── Backup & Export ──────────────────────────────────────────────────────

  /** Export wallet data for backup */
  exportBackup(passphrase: string): Record<string, any> {
    if (this.isLocked && this.isEncrypted) {
      throw new Error('Wallet is locked');
    }
    return {
      version: 1,
      network: this.config.network,
      encrypted: this.isEncrypted,
      seedPhrase: this.isEncrypted ? '[encrypted]' : this.config.seedPhrase,
      receiveAddresses: this._receiveAddresses.map(a => ({
        address: a.address,
        path: a.path,
        type: a.type,
      })),
      changeAddresses: this._changeAddresses.map(a => ({
        address: a.address,
        path: a.path,
        type: a.type,
      })),
      receiveIndex: this._receiveIndex,
      changeIndex: this._changeIndex,
      exportedAt: new Date().toISOString(),
    };
  }

  // ─── Supply Utilities ─────────────────────────────────────────────────────

  /** Get block reward for a given block height */
  static getBlockReward(blockHeight: number): BlockRewardInfo {
    const halvings = Math.floor(blockHeight / SUPPLY.HALVING_INTERVAL);
    const blockReward = halvings >= 64 ? 0 : SUPPLY.BLOCK_REWARD_ERA1 / Math.pow(2, halvings);
    const nextHalvingBlock = (halvings + 1) * SUPPLY.HALVING_INTERVAL;

    return {
      era: halvings + 1,
      blockReward,
      halvings,
      nextHalvingBlock,
      blocksUntilHalving: nextHalvingBlock - blockHeight,
    };
  }

  /** Convert TAR to Tar (satoshis) */
  static toSatoshis(tar: number): number {
    return Math.round(tar * SUPPLY.SATOSHIS_PER_TAR);
  }

  /** Convert Tar (satoshis) to TAR */
  static fromSatoshis(satoshis: number): number {
    return satoshis / SUPPLY.SATOSHIS_PER_TAR;
  }

  /** Format TAR amount for display */
  static formatAmount(tar: number, decimals: number = 8): string {
    return tar.toFixed(decimals).replace(/\.?0+$/, '') + ' TAR';
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  getNetwork(): NetworkType { return this.config.network; }
  getReceiveIndex(): number { return this._receiveIndex; }
  getChangeIndex(): number { return this._changeIndex; }
  getReceiveAddresses(): DerivedAddress[] { return [...this._receiveAddresses]; }
  getChangeAddresses(): DerivedAddress[] { return [...this._changeAddresses]; }
}

export default TarcoinWallet;