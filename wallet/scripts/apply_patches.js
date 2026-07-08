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
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] File not found: ${filePath}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
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

// 1. Patch currency.js
replaceInFile(
  'blue_modules/currency.js',
  `const COIN_TICKER = 'BTC';
const COIN_DECIMALS = 8;

export const satoshiToBTC = (satoshi) => satoshi / 100000000;`,
  `const COIN_TICKER = 'TAR';
const COIN_DECIMALS = 8;

export const satoshiToBTC = (satoshi) => satoshi / 100000000;
export const satoshiToTAR = (satoshi) => satoshi / 100000000;
export const TARToSatoshi = (tar) => Math.round(tar * 100000000);`
);

// 2. Patch network.js (complete overwrite is safer)
const networkJsContent = `import * as bitcoin from 'bitcoinjs-lib';

// TARCOIN mainnet network parameters
export const TARCOIN_MAINNET = {
  messagePrefix: '\\x19Tarcoin Signed Message:\\n',
  bech32: 'tar',
  bip32: { public: 0x0488b21e, private: 0x0488ade4 },
  pubKeyHash: 65,
  scriptHash: 127,
  wif: 128,
};

// TARCOIN testnet network parameters
export const TARCOIN_TESTNET = {
  messagePrefix: '\\x19Tarcoin Signed Message:\\n',
  bech32: 'ttar',
  bip32: { public: 0x043587cf, private: 0x04358394 },
  pubKeyHash: 111,
  scriptHash: 196,
  wif: 239,
};

export const NETWORK = TARCOIN_MAINNET;
export const network = TARCOIN_MAINNET;
`;
fs.writeFileSync('blue_modules/network.js', networkJsContent, 'utf8');
log('Successfully patched: network.js');

// 3. Patch ElectrumClient.js
replaceInFile(
  'ElectrumClient.js',
  `const defaultPeer = { host: 'electrum1.bluewallet.io', ssl: '443', tcp: '50001' };`,
  `// TARCOIN ElectrumX servers
const defaultPeer = { host: 'electrum.tarcoin.org', ssl: '50002', tcp: '50001' };

const hardcodedPeers = [
  { host: 'electrum.tarcoin.org', ssl: '50002', tcp: '50001' },
];`
);
