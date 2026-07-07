/**
 * TARCOIN App-Wide Constants
 * ===========================
 * Central source of truth for all TARCOIN-specific values
 * used throughout the mobile wallet UI and logic.
 *
 * All network values verified from TARCOIN Core source:
 *   src/kernel/chainparams.cpp
 *   src/consensus/amount.h
 */

// ---------------------------------------------------------------------------
// Coin identity
// ---------------------------------------------------------------------------
export const APP_NAME        = 'TARCOIN Wallet';
export const APP_SHORT_NAME  = 'TARWallet';
export const COIN_NAME       = 'TARCOIN';
export const COIN_TICKER     = 'TAR';
export const COIN_DECIMALS   = 8;              // 1 TAR = 100,000,000 tar (satoshis)
export const COIN_UNIT       = 'TAR';
export const COIN_UNIT_SMALL = 'tar';          // Smallest unit (equivalent to satoshi)
export const COIN_WEBSITE    = 'https://tarcoin.org';
export const COIN_EXPLORER   = 'https://tarcoin.org/explorer';

// ---------------------------------------------------------------------------
// Supply — from src/consensus/amount.h
// ---------------------------------------------------------------------------
// static const CAmount MAX_MONEY = 50000000000LL * COIN;
export const MAX_SUPPLY_TAR  = 50_000_000_000;          // 50 billion TAR
export const COIN_SATOSHIS   = 100_000_000;             // 10^8 tar per TAR
export const MAX_SUPPLY_SATS = MAX_SUPPLY_TAR * COIN_SATOSHIS;

// ---------------------------------------------------------------------------
// Block parameters — from src/kernel/chainparams.cpp
// ---------------------------------------------------------------------------
// consensus.nPowTargetSpacing = 10 * 60
export const BLOCK_TIME_SECONDS     = 600;              // 10 minutes

// consensus.nSubsidyHalvingInterval = 400000
export const HALVING_INTERVAL       = 400_000;          // blocks

// consensus.SegwitHeight = 481824
export const SEGWIT_ACTIVATION_HEIGHT = 481_824;

// ---------------------------------------------------------------------------
// BIP44 derivation — SLIP-0044 PR #2030
// ---------------------------------------------------------------------------
// Coin type 5050 registered at: github.com/satoshilabs/slips/pull/2030
export const BIP44_COIN_TYPE = 5050;

export const DERIVATION_PATHS = {
  // BIP44 — Legacy P2PKH  →  T... addresses
  BIP44:  `m/44'/${BIP44_COIN_TYPE}'/0'`,
  // BIP49 — P2SH-SegWit   →  t... addresses
  BIP49:  `m/49'/${BIP44_COIN_TYPE}'/0'`,
  // BIP84 — Native SegWit →  tar1q... addresses (active after block 481,824)
  BIP84:  `m/84'/${BIP44_COIN_TYPE}'/0'`,
  // BIP86 — Taproot       →  tar1p... addresses (active after block 481,824)
  BIP86:  `m/86'/${BIP44_COIN_TYPE}'/0'`,
};

// Default wallet type shown on "Create Wallet" screen
// Legacy until SegWit activates at block 481,824
export const DEFAULT_WALLET_TYPE = 'BIP44';

// ---------------------------------------------------------------------------
// Address prefixes — for validation display hints
// ---------------------------------------------------------------------------
export const ADDRESS_PREFIXES = {
  MAINNET: {
    P2PKH:   'T',        // Base58, starts with T
    P2SH:    't',        // Base58, starts with t
    BECH32:  'tar1q',    // Native SegWit
    TAPROOT: 'tar1p',    // Taproot
  },
  TESTNET: {
    P2PKH:   ['m', 'n'], // Standard testnet
    P2SH:    '2',
    BECH32:  'ttar1q',
    TAPROOT: 'ttar1p',
  },
};

// ---------------------------------------------------------------------------
// Fee defaults (sat/vbyte)
// ---------------------------------------------------------------------------
export const FEE_RATE = {
  SLOW:   1,    // sat/vbyte — confirmed within ~60 min
  MEDIUM: 2,    // sat/vbyte — confirmed within ~20 min
  FAST:   5,    // sat/vbyte — next block
};

// ---------------------------------------------------------------------------
// UI display
// ---------------------------------------------------------------------------
export const BLOCK_EXPLORER_TX_URL  = (txid)    => `${COIN_EXPLORER}/tx/${txid}`;
export const BLOCK_EXPLORER_ADDR_URL = (address) => `${COIN_EXPLORER}/address/${address}`;
export const BLOCK_EXPLORER_BLOCK_URL = (hash)  => `${COIN_EXPLORER}/block/${hash}`;

// Confirmations required to consider a transaction "final"
export const CONFIRMATIONS_REQUIRED = 6;

// How often to poll Electrum for new transactions (milliseconds)
export const WALLET_REFRESH_INTERVAL = 30_000;

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------
export const WALLET_VERSION   = '1.0.0';
export const MIN_ELECTRUM_VER = '1.4';
