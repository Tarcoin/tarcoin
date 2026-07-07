/**
 * TARCOIN Network Parameters for bitcoinjs-lib
 * =============================================
 * All values verified from TARCOIN Core source code:
 *   src/kernel/chainparams.cpp
 *   src/consensus/amount.h
 *
 * Usage:
 *   import { TARCOIN_MAINNET, TARCOIN_TESTNET } from './network';
 *   const address = bitcoin.payments.p2pkh({ pubkey, network: TARCOIN_MAINNET });
 */

// ---------------------------------------------------------------------------
// Mainnet
// From src/kernel/chainparams.cpp CMainParams
// ---------------------------------------------------------------------------
export const TARCOIN_MAINNET = {
  messagePrefix: '\x19Tarcoin Signed Message:\n',

  // bech32_hrp = "tar"  →  SegWit addresses: tar1q... (P2WPKH), tar1p... (Taproot)
  bech32: 'tar',

  bip32: {
    // base58Prefixes[EXT_PUBLIC_KEY] = {0x04, 0x88, 0xB2, 0x1E}  →  xpub...
    public: 0x0488b21e,
    // base58Prefixes[EXT_SECRET_KEY] = {0x04, 0x88, 0xAD, 0xE4}  →  xprv...
    private: 0x0488ade4,
  },

  // base58Prefixes[PUBKEY_ADDRESS] = std::vector<unsigned char>(1, 65)  →  T...
  pubKeyHash: 65,

  // base58Prefixes[SCRIPT_ADDRESS] = std::vector<unsigned char>(1, 127)  →  t...
  scriptHash: 127,

  // base58Prefixes[SECRET_KEY] = std::vector<unsigned char>(1, 128)
  wif: 128,
};

// ---------------------------------------------------------------------------
// Testnet
// From src/kernel/chainparams.cpp CTestNetParams
// ---------------------------------------------------------------------------
export const TARCOIN_TESTNET = {
  messagePrefix: '\x19Tarcoin Signed Message:\n',

  // bech32_hrp = "ttar"
  bech32: 'ttar',

  bip32: {
    // base58Prefixes[EXT_PUBLIC_KEY] = {0x04, 0x35, 0x87, 0xCF}  →  tpub...
    public: 0x043587cf,
    // base58Prefixes[EXT_SECRET_KEY] = {0x04, 0x35, 0x83, 0x94}  →  tprv...
    private: 0x04358394,
  },

  // base58Prefixes[PUBKEY_ADDRESS] = std::vector<unsigned char>(1, 111)  →  m/n...
  pubKeyHash: 111,

  // base58Prefixes[SCRIPT_ADDRESS] = std::vector<unsigned char>(1, 196)
  scriptHash: 196,

  // base58Prefixes[SECRET_KEY] = std::vector<unsigned char>(1, 239)
  wif: 239,
};

// ---------------------------------------------------------------------------
// Regtest (development only)
// From src/kernel/chainparams.cpp CRegTestParams
// ---------------------------------------------------------------------------
export const TARCOIN_REGTEST = {
  messagePrefix: '\x19Tarcoin Signed Message:\n',
  bech32: 'tarrt',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 111,
  scriptHash: 196,
  wif: 239,
};

// Active network — switch to TARCOIN_TESTNET for testing
export const NETWORK = TARCOIN_MAINNET;
export const IS_MAINNET = true;
