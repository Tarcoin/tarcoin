# TARCOIN Wallet — Mobile (iOS + Android)

Official TARCOIN mobile wallet for iOS and Android.

Built by forking [BlueWallet](https://github.com/BlueWallet/BlueWallet) (MIT license)
and configuring it for the TARCOIN network.

---

## What Was Changed from BlueWallet

| File | Change |
|---|---|
| `blue_modules/network.js` | TARCOIN network params replacing Bitcoin |
| `ElectrumClient.js` | Default servers → `electrum.tarcoin.org:50002` |
| `package.json` | Name → `TARWallet`, displayName → `TARCOIN Wallet` |
| `android/.../strings.xml` | App name → `TARCOIN Wallet` |
| `ios/.../Info.plist` | App name → `TARCOIN Wallet` |
| `blue_modules/tarcoin/` | New directory with all TARCOIN constants |

---

## TARCOIN Network Parameters

All values verified from TARCOIN Core `src/kernel/chainparams.cpp`:

```javascript
const TARCOIN_MAINNET = {
  messagePrefix: '\x19Tarcoin Signed Message:\n',
  bech32:    'tar',          // SegWit: tar1q..., Taproot: tar1p...
  bip32: {
    public:  0x0488b21e,    // xpub... (same as Bitcoin)
    private: 0x0488ade4,    // xprv... (same as Bitcoin)
  },
  pubKeyHash: 65,            // T... addresses
  scriptHash: 127,           // t... addresses
  wif:        128,
};
```

**BIP44 Coin Type: `5050`** — SLIP-0044 PR [satoshilabs/slips#2030](https://github.com/satoshilabs/slips/pull/2030)

| BIP | Path | Address |
|---|---|---|
| BIP44 | `m/44'/5050'/0'/0/0` | `T...` Legacy |
| BIP49 | `m/49'/5050'/0'/0/0` | `t...` P2SH-SegWit |
| BIP84 | `m/84'/5050'/0'/0/0` | `tar1q...` Native SegWit |
| BIP86 | `m/86'/5050'/0'/0/0` | `tar1p...` Taproot |

> **Note:** SegWit and Taproot addresses activate at block **481,824** on mainnet.
> Until then, only `T...` (BIP44 Legacy) addresses are spendable on-chain.
> The wallet supports all address types for receiving and will use Legacy for sending.

---

## Quick Start

### Requirements

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| React Native CLI | latest | `npm install -g react-native-cli` |
| Android Studio | latest | [developer.android.com](https://developer.android.com/studio) |
| JDK | 17 | bundled with Android Studio |
| Xcode (iOS only) | 15+ | Mac App Store |
| CocoaPods (iOS only) | latest | `sudo gem install cocoapods` |

---

### 1. Clone and set up

```bash
git clone https://github.com/tarcoin/tarcoin-wallet.git
cd tarcoin-wallet
chmod +x scripts/*.sh
./scripts/setup.sh
```

This will:
- Clone BlueWallet (pinned version)
- Copy all TARCOIN config files
- Apply network patches
- Install Node dependencies

---

### 2. Run on Android

```bash
# Debug APK
./scripts/build_android.sh debug

# Install on connected device
adb install android/app/build/outputs/apk/debug/app-debug.apk

# OR: run in emulator (Metro dev server)
cd TARWallet && npx react-native run-android
```

---

### 3. Run on iOS (macOS only)

```bash
# iOS Simulator
./scripts/build_ios.sh simulator
cd TARWallet && npx react-native run-ios

# Physical device
./scripts/build_ios.sh device

# App Store / TestFlight archive
./scripts/build_ios.sh archive
```

---

## Default Electrum Servers

```
ssl://electrum.tarcoin.org:50002    ← primary (SSL, production)
tcp://electrum.tarcoin.org:50001    ← fallback (TCP, local testing only)
```

Users can add custom servers in **Settings → Network → Add Server**.

---

## Wallet Features (inherited from BlueWallet)

| Feature | Status |
|---|---|
| BIP39 seed phrase (12/24 words) | ✅ |
| BIP44 Legacy wallets (`T...`) | ✅ |
| BIP49 SegWit P2SH (`t...`) | ✅ (spendable after block 481,824) |
| BIP84 Native SegWit (`tar1q...`) | ✅ (spendable after block 481,824) |
| BIP86 Taproot (`tar1p...`) | ✅ (spendable after block 481,824) |
| Watch-only wallets | ✅ |
| Multi-wallet support | ✅ |
| QR code scan/generate | ✅ |
| Biometric authentication | ✅ |
| Hardware wallet (Ledger/Trezor) | ✅ |
| PSBT (Partially Signed Transactions) | ✅ |
| Coin control | ✅ |
| Custom fee (sat/vbyte) | ✅ |
| Transaction history | ✅ |
| Dark mode | ✅ |

---

## File Structure

```
wallet/
├── src/
│   ├── config/
│   │   ├── network.js        ← TARCOIN bitcoinjs-lib network params
│   │   ├── electrum.js       ← Default ElectrumX servers
│   │   └── app.js            ← Coin constants, BIP paths, supply
│   └── models/
│       └── walletConstants.js ← HD wallet types + address derivation
├── patches/
│   └── 01_tarcoin_all_changes.patch   ← All BlueWallet modifications
├── scripts/
│   ├── setup.sh              ← Clone + patch + install
│   ├── build_android.sh      ← Build APK / AAB
│   └── build_ios.sh          ← Build IPA / Simulator
└── README.md
```

---

## Signing for Release

### Android

1. Generate keystore:
```bash
keytool -genkey -v \
  -keystore tarcoin-release.jks \
  -alias tarcoin \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

2. Create `android/keystore.properties`:
```
storeFile=../tarcoin-release.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=tarcoin
keyPassword=YOUR_KEY_PASSWORD
```

3. Build:
```bash
./scripts/build_android.sh release
```

> ⚠️ **Never commit** `tarcoin-release.jks` or `keystore.properties` to git.

---

### iOS

1. Open Xcode → Signing & Capabilities
2. Set Team to your Apple Developer account
3. Set Bundle Identifier (e.g. `org.tarcoin.wallet`)
4. Build: `./scripts/build_ios.sh archive`

---

## Electrum Protocol

The wallet uses **Electrum protocol v1.4** over SSL (port 50002).

| Method | Description |
|---|---|
| `server.version` | Handshake and version negotiation |
| `blockchain.scripthash.get_balance` | Get address balance |
| `blockchain.scripthash.get_history` | Get transaction history |
| `blockchain.scripthash.listunspent` | Get UTXOs |
| `blockchain.transaction.broadcast` | Broadcast signed transaction |
| `blockchain.estimatefee` | Estimate fee (sat/vbyte) |
| `blockchain.headers.subscribe` | Subscribe to new blocks |

---

## License

MIT License — same as BlueWallet upstream.

TARCOIN-specific additions copyright © TARCOIN Project.
