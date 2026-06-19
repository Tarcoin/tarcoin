import * as bitcoin from 'bitcoinjs-lib';
/**
 * TARCOIN Mainnet network parameters for bitcoinjs-lib.
 * bech32 prefix 'tar' produces tar1... addresses (P2WPKH).
 * pubKeyHash 0x41 produces T... addresses (P2PKH / Base58Check).
 */
export declare const TARCOIN_NETWORK: bitcoin.Network;
export declare const TARCOIN_TESTNET_NETWORK: bitcoin.Network;
export declare const TARCOIN_MAINNET: {
    name: string;
    bech32Prefix: string;
    base58Prefix: number;
    wifPrefix: number;
    p2pPort: number;
    rpcPort: number;
    magic: number;
    bip44CoinType: number;
    genesisHash: string;
    genesisMerkleRoot: string;
};
export declare const TARCOIN_TESTNET: {
    name: string;
    bech32Prefix: string;
    base58Prefix: number;
    wifPrefix: number;
    p2pPort: number;
    rpcPort: number;
};
export declare const SUPPLY: {
    readonly MAX: 50000000000;
    readonly ECOSYSTEM_TREASURY: 10000000000;
    readonly MINING: 40000000000;
    readonly BLOCK_REWARD_ERA1: 50000;
    readonly HALVING_INTERVAL: 400000;
    readonly SATOSHIS_PER_TAR: 100000000;
};
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
    scriptSig?: {
        asm: string;
        hex: string;
    };
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
    feeRate: number;
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
export declare class TarcoinWallet {
    private config;
    private _balance;
    private _utxos;
    private _transactions;
    private _receiveAddresses;
    private _changeAddresses;
    private _receiveIndex;
    private _changeIndex;
    private isEncrypted;
    private isLocked;
    private _root;
    constructor(config: WalletConfig);
    /** Generate a new 24-word BIP39 HD wallet */
    static generate(opts?: Partial<WalletConfig>): TarcoinWallet;
    /** Restore wallet from existing BIP39 seed phrase */
    static fromSeedPhrase(seedPhrase: string, opts?: Partial<WalletConfig>): TarcoinWallet;
    /**
     * Derives and caches the BIP32 root node from the mnemonic seed.
     * Must be called after unlock.
     */
    private _getRoot;
    /**
     * Get a new receiving address (native SegWit, tar1...).
     * Derives from BIP44 path: m/44'/1337'/0'/0/{index}
     */
    getNewReceiveAddress(type?: AddressType): Promise<DerivedAddress>;
    /**
     * Get a change address for internal use.
     * Derives from BIP44 path: m/44'/1337'/0'/1/{index}
     */
    getChangeAddress(type?: AddressType): Promise<DerivedAddress>;
    /**
     * Batch-derive multiple receive addresses at once.
     * Useful for wallet sync / gap limit scanning.
     */
    deriveReceiveAddresses(count: number, type?: AddressType): Promise<DerivedAddress[]>;
    /**
     * Derive an address at a specific BIP44 path index without advancing the counter.
     * Useful for address lookup or verification.
     */
    deriveAddressAt(chain: 0 | 1, index: number, type?: AddressType): Promise<DerivedAddress>;
    /**
     * Get the current receive address without advancing the index.
     * Returns the address a miner should use for pool mining payouts.
     */
    getCurrentReceiveAddress(type?: AddressType): Promise<DerivedAddress>;
    /**
     * Validate a TARCOIN address format (static, no key needed).
     */
    static validateAddress(address: string): AddressInfo;
    /** Get BIP39 mnemonic */
    getSeedPhrase(): string;
    /** Validate a BIP39 mnemonic */
    static validateMnemonic(mnemonic: string): boolean;
    /** Derive BIP39 seed bytes from mnemonic */
    getSeedBytes(passphrase?: string): Promise<Buffer>;
    /** Get xpub (extended public key) for the BIP44 account */
    getXPub(): Promise<string>;
    /** Get word list count from mnemonic */
    getWordCount(): number;
    /** Encrypt the wallet with AES-256 passphrase */
    encrypt(passphrase: string): boolean;
    /** Unlock wallet for a given duration (default 5 minutes) */
    unlock(passphrase: string, timeoutSeconds?: number): boolean;
    /** Lock the wallet */
    lock(): void;
    get locked(): boolean;
    get encrypted(): boolean;
    getBalance(): WalletBalance;
    getUtxos(): Utxo[];
    getTransactions(): Transaction[];
    /**
     * Create and sign a P2WPKH transaction.
     * Selects UTXOs, builds tx with bitcoinjs-lib, signs with secp256k1 ECDSA.
     * Returns raw signed transaction hex ready to broadcast.
     */
    createTransaction(toAddress: string, amountTar: number, feeTar?: number): Promise<string>;
    /** Sign a message with the wallet's private key (proves address ownership) */
    signMessage(message: string, addressIndex?: number): Promise<string>;
    /** Verify a signed message against an address */
    static verifyMessage(address: string, signature: string, message: string): boolean;
    /** Sync wallet with TARCOIN node via RPC */
    sync(addresses?: string[]): Promise<void>;
    /** Export wallet data for backup */
    exportBackup(passphrase: string): Record<string, any>;
    /** Get block reward for a given block height */
    static getBlockReward(blockHeight: number): BlockRewardInfo;
    /** Convert TAR to Tar (satoshis) */
    static toSatoshis(tar: number): number;
    /** Convert Tar (satoshis) to TAR */
    static fromSatoshis(satoshis: number): number;
    /** Format TAR amount for display */
    static formatAmount(tar: number, decimals?: number): string;
    getNetwork(): NetworkType;
    getReceiveIndex(): number;
    getChangeIndex(): number;
    getReceiveAddresses(): DerivedAddress[];
    getChangeAddresses(): DerivedAddress[];
}
export default TarcoinWallet;
