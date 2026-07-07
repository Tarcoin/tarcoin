/**
 * TARCOIN HD Wallet Models
 * =========================
 * Wallet type definitions with BIP derivation paths,
 * address generators and display metadata.
 *
 * Coin type 5050 — SLIP-0044 PR: github.com/satoshilabs/slips/pull/2030
 */

import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { TARCOIN_MAINNET, TARCOIN_TESTNET } from './network';
import { BIP44_COIN_TYPE, SEGWIT_ACTIVATION_HEIGHT } from './app';

const bip32 = BIP32Factory(ecc);

// ---------------------------------------------------------------------------
// Wallet type registry
// ---------------------------------------------------------------------------
export const WALLET_TYPES = {

  /**
   * BIP44 — Legacy P2PKH
   * Derivation: m/44'/5050'/account'/change/index
   * Address:    T... (Base58Check, prefix byte 65)
   * Status:     ✅ Active on mainnet from block 0
   */
  BIP44: {
    id:          'BIP44',
    label:       'Legacy',
    description: 'Standard Bitcoin-compatible addresses (T...)',
    path:        (account = 0) => `m/44'/${BIP44_COIN_TYPE}'/${account}'`,
    addressType: 'p2pkh',
    addressPrefix: 'T',
    supported:   true,
    segwitRequired: false,
  },

  /**
   * BIP49 — P2SH-P2WPKH (wrapped SegWit)
   * Derivation: m/49'/5050'/account'/change/index
   * Address:    t... (Base58Check, prefix byte 127)
   * Status:     ⏳ Spendable after block 481,824 on mainnet
   */
  BIP49: {
    id:          'BIP49',
    label:       'SegWit (P2SH)',
    description: 'Wrapped SegWit addresses (t...) — lower fees',
    path:        (account = 0) => `m/49'/${BIP44_COIN_TYPE}'/${account}'`,
    addressType: 'p2sh-p2wpkh',
    addressPrefix: 't',
    supported:   true,
    segwitRequired: true,
    activationHeight: SEGWIT_ACTIVATION_HEIGHT,
  },

  /**
   * BIP84 — Native P2WPKH (native SegWit)
   * Derivation: m/84'/5050'/account'/change/index
   * Address:    tar1q... (Bech32, HRP "tar")
   * Status:     ⏳ Spendable after block 481,824 on mainnet
   */
  BIP84: {
    id:          'BIP84',
    label:       'Native SegWit',
    description: 'Lowest fee addresses (tar1q...) — recommended',
    path:        (account = 0) => `m/84'/${BIP44_COIN_TYPE}'/${account}'`,
    addressType: 'p2wpkh',
    addressPrefix: 'tar1q',
    supported:   true,
    segwitRequired: true,
    activationHeight: SEGWIT_ACTIVATION_HEIGHT,
  },

  /**
   * BIP86 — P2TR (Taproot)
   * Derivation: m/86'/5050'/account'/change/index
   * Address:    tar1p... (Bech32m, HRP "tar")
   * Status:     ⏳ Spendable after block 481,824 on mainnet
   */
  BIP86: {
    id:          'BIP86',
    label:       'Taproot',
    description: 'Maximum privacy addresses (tar1p...)',
    path:        (account = 0) => `m/86'/${BIP44_COIN_TYPE}'/${account}'`,
    addressType: 'p2tr',
    addressPrefix: 'tar1p',
    supported:   true,
    segwitRequired: true,
    activationHeight: SEGWIT_ACTIVATION_HEIGHT,
  },
};

// ---------------------------------------------------------------------------
// Address generation helpers
// ---------------------------------------------------------------------------

/**
 * Derive a TARCOIN address from an extended public key node.
 *
 * @param {object}  node     - BIP32 node (bip32.fromBase58 or child node)
 * @param {string}  type     - Wallet type: 'BIP44' | 'BIP49' | 'BIP84' | 'BIP86'
 * @param {boolean} testnet  - Use testnet network params
 * @returns {string} TARCOIN address
 */
export function deriveAddress(node, type = 'BIP44', testnet = false) {
  const network = testnet ? TARCOIN_TESTNET : TARCOIN_MAINNET;
  const pubkey  = node.publicKey;

  switch (type) {
    case 'BIP44':
      return bitcoin.payments.p2pkh({ pubkey, network }).address;

    case 'BIP49': {
      const p2wpkh = bitcoin.payments.p2wpkh({ pubkey, network });
      return bitcoin.payments.p2sh({ redeem: p2wpkh, network }).address;
    }

    case 'BIP84':
      return bitcoin.payments.p2wpkh({ pubkey, network }).address;

    case 'BIP86':
      // Taproot — requires tweaked internal key
      return bitcoin.payments.p2tr({
        internalPubkey: pubkey.slice(1, 33), // x-only pubkey
        network,
      }).address;

    default:
      throw new Error(`Unknown wallet type: ${type}`);
  }
}

/**
 * Validate a TARCOIN address (mainnet or testnet).
 *
 * @param {string}  address
 * @param {boolean} testnet
 * @returns {boolean}
 */
export function isValidAddress(address, testnet = false) {
  if (!address || typeof address !== 'string') return false;
  const network = testnet ? TARCOIN_TESTNET : TARCOIN_MAINNET;

  try {
    bitcoin.address.toOutputScript(address, network);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect address type from a TARCOIN address string.
 *
 * @param {string} address
 * @returns {'P2PKH'|'P2SH'|'P2WPKH'|'P2TR'|'UNKNOWN'}
 */
export function detectAddressType(address) {
  if (!address) return 'UNKNOWN';
  if (address.startsWith('T'))      return 'P2PKH';    // Legacy mainnet
  if (address.startsWith('t'))      return 'P2SH';     // P2SH mainnet
  if (address.startsWith('tar1q'))  return 'P2WPKH';   // Native SegWit mainnet
  if (address.startsWith('tar1p'))  return 'P2TR';     // Taproot mainnet
  if (address.match(/^[mn]/))       return 'P2PKH';    // Legacy testnet
  if (address.startsWith('ttar1q')) return 'P2WPKH';   // Native SegWit testnet
  return 'UNKNOWN';
}
