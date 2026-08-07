/**
 * apply_patches.js
 * =============================================================================
 * JavaScript replacement script to apply TARCOIN changes to BlueWallet.
 * Much more robust than git apply/patch, handles OS line endings automatically.
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

const log = (msg) => console.log(`[PATCH] ${msg}`);

function replaceInFile(filePath, target, replacement) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`[ERROR] File not found: ${filePath}`);
      process.exit(1);
    }
    throw err;
  }
  
  // Normalize line endings to avoid match failures
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedTarget = target.replace(/\r\n/g, '\n');
  
  if (!normalizedContent.includes(normalizedTarget)) {
    log(`Warning: Target not found in ${path.basename(filePath)}. Already patched?`);
    return;
  }
  
  const updatedContent = normalizedContent.replace(normalizedTarget, replacement);
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  log(`Successfully patched: ${path.basename(filePath)}`);
}

// ---------------------------------------------------------------------------
// 1. Overwrite index.js to inject global bitcoinjs-lib network configuration
// ---------------------------------------------------------------------------
replaceInFile(
  'index.js',
  `import './shim.js';`,
  `import './shim.js';

// Inject global TARCOIN parameters into bitcoinjs-lib
import * as bitcoin from 'bitcoinjs-lib';

bitcoin.networks.bitcoin.messagePrefix = '\\x19Tarcoin Signed Message:\\n';
bitcoin.networks.bitcoin.bech32 = 'tar';
bitcoin.networks.bitcoin.bip32 = {
  public: 0x0488b21e,
  private: 0x0488ade4
};
bitcoin.networks.bitcoin.pubKeyHash = 65;  // T...
bitcoin.networks.bitcoin.scriptHash = 127; // t...
bitcoin.networks.bitcoin.wif = 128;

// Testnet params
bitcoin.networks.testnet.messagePrefix = '\\x19Tarcoin Signed Message:\\n';
bitcoin.networks.testnet.bech32 = 'ttar';
bitcoin.networks.testnet.bip32 = {
  public: 0x043587cf,
  private: 0x04358394
};
bitcoin.networks.testnet.pubKeyHash = 111;
bitcoin.networks.testnet.scriptHash = 196;
bitcoin.networks.testnet.wif = 239;
`
);

// ---------------------------------------------------------------------------
// 2. Patch currency.ts
// ---------------------------------------------------------------------------
replaceInFile(
  'blue_modules/currency.ts',
  `function satoshiToBTC(satoshi: number): string {
  return new BigNumber(satoshi).dividedBy(100000000).toString(10);
}`,
  `function satoshiToBTC(satoshi: number): string {
  return new BigNumber(satoshi).dividedBy(100000000).toString(10);
}
export function satoshiToTAR(satoshi: number): string {
  return satoshiToBTC(satoshi);
}
export function TARToSatoshi(tar: number | string): number {
  return new BigNumber(tar).multipliedBy(100000000).toNumber();
}`
);

// ---------------------------------------------------------------------------
// 3. Patch BlueElectrum.ts (ElectrumClient module in v7.0.0)
// ---------------------------------------------------------------------------
replaceInFile(
  'blue_modules/BlueElectrum.ts',
  `const defaultPeer = { host: 'electrum1.bluewallet.io', ssl: '443' };
export const hardcodedPeers: Peer[] = [
  { host: 'mainnet.foundationdevices.com', ssl: '50002' },
  // { host: 'bitcoin.lukechilds.co', ssl: '50002' },
  // { host: 'electrum.jochen-hoenicke.de', ssl: '50006' },
  { host: 'electrum1.bluewallet.io', ssl: '443' },
  { host: 'electrum.acinq.co', ssl: '50002' },
  { host: 'electrum.bitaroo.net', ssl: '50002' },
];`,
  `const defaultPeer = { host: 'electrum.tarcoin.org', ssl: '50002' };
export const hardcodedPeers: Peer[] = [
  { host: 'electrum.tarcoin.org', ssl: '50002' },
];`
);

// ---------------------------------------------------------------------------
// 4. Patch bitcoinUnits.ts
// ---------------------------------------------------------------------------
replaceInFile(
  'models/bitcoinUnits.ts',
  `export const BitcoinUnit = {
  BTC: 'BTC',
  SATS: 'sats',
  LOCAL_CURRENCY: 'local_currency',
  MAX: 'MAX',
} as const;`,
  `export const BitcoinUnit = {
  BTC: 'TAR',
  SATS: 'tar',
  LOCAL_CURRENCY: 'local_currency',
  MAX: 'MAX',
} as const;`
);

// ---------------------------------------------------------------------------
// 5. Patch loc/en.json
// ---------------------------------------------------------------------------
replaceInFile(
  'loc/en.json',
  `    "BTC": "BTC",`,
  `    "BTC": "TAR",`
);

replaceInFile(
  'loc/en.json',
  `    "add_bitcoin": "Bitcoin",`,
  `    "add_bitcoin": "TARCOIN",`
);

replaceInFile(
  'loc/en.json',
  `    "add_bitcoin_explain": "Simple and powerful Bitcoin wallet",`,
  `    "add_bitcoin_explain": "Simple and powerful TARCOIN wallet",`
);
