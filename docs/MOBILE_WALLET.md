# TARCOIN Mobile Wallet (TARWallet) — Build & Release Guide

## Overview

TARWallet is the official TARCOIN mobile wallet for iOS and Android.
It is built by forking [BlueWallet](https://github.com/BlueWallet/BlueWallet) (MIT)
and configuring it for the TARCOIN network.

---

## Quick Start

### Requirements

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Git | any | system package |
| Android Studio + JDK 17 | latest | [developer.android.com](https://developer.android.com/studio) |
| Xcode 15+ (iOS only) | latest | Mac App Store |
| CocoaPods (iOS only) | latest | `sudo gem install cocoapods` |

### Clone and setup

```bash
git clone https://github.com/tarcoin/tarcoin-wallet.git
cd tarcoin-wallet
chmod +x scripts/*.sh
./scripts/setup.sh
```

---

## Run in Development

```bash
cd TARWallet

# Start Metro bundler
npx react-native start

# Android (separate terminal)
npx react-native run-android

# iOS (macOS only, separate terminal)
npx react-native run-ios
```

---

## Build for Release

### Android APK / AAB

```bash
# Debug APK (for testing)
./scripts/build_android.sh debug

# Release APK + AAB (for Google Play)
./scripts/build_android.sh release
```

**First-time release setup — generate keystore:**
```bash
keytool -genkey -v \
  -keystore tarcoin-release.jks \
  -alias tarcoin \
  -keyalg RSA -keysize 2048 \
  -validity 10000

# Create android/keystore.properties:
cat > TARWallet/android/keystore.properties <<EOF
storeFile=../../tarcoin-release.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=tarcoin
keyPassword=YOUR_KEY_PASSWORD
EOF
```

> [!CAUTION]
> Never commit `tarcoin-release.jks` or `keystore.properties` to git.
> Back up the keystore file securely — losing it means you cannot update the app.

### iOS IPA

```bash
# iOS Simulator
./scripts/build_ios.sh simulator

# Physical device (Debug)
./scripts/build_ios.sh device

# App Store / TestFlight archive
./scripts/build_ios.sh archive
```

**First-time iOS setup:**
1. Open `TARWallet/ios/TARWallet.xcworkspace` in Xcode
2. Signing & Capabilities → Team → select your Apple Developer account
3. Bundle Identifier → set `org.tarcoin.wallet` (or your preferred ID)

---

## TARCOIN Network Configuration

### Network Parameters (`src/config/network.js`)

```javascript
export const TARCOIN_MAINNET = {
  messagePrefix: '\x19Tarcoin Signed Message:\n',
  bech32: 'tar',           // tar1q... and tar1p... addresses
  bip32: {
    public:  0x0488b21e,  // xpub (same as Bitcoin)
    private: 0x0488ade4,  // xprv (same as Bitcoin)
  },
  pubKeyHash: 65,          // T... addresses
  scriptHash: 127,         // t... addresses
  wif: 128,
};
```

### Default Electrum Servers (`src/config/electrum.js`)

```javascript
export const ELECTRUM_SERVERS_MAINNET = [
  { host: 'electrum.tarcoin.org', ssl: 50002, tcp: 50001 },
];
```

Users can add custom servers in **Settings → Network → Add Server**.

---

## Wallet Types

| Type | BIP | Path | Address | Active |
|---|---|---|---|---|
| Legacy | BIP44 | `m/44'/5050'/0'` | `T...` | ✅ Now |
| SegWit P2SH | BIP49 | `m/49'/5050'/0'` | `t...` | ⏳ Block 481,824 |
| Native SegWit | BIP84 | `m/84'/5050'/0'` | `tar1q...` | ⏳ Block 481,824 |
| Taproot | BIP86 | `m/86'/5050'/0'` | `tar1p...` | ⏳ Block 481,824 |

> **BIP44 coin type 5050** — registered via SLIP-0044 PR [#2030](https://github.com/satoshilabs/slips/pull/2030).
> Legacy `T...` wallets are the default until SegWit activates at block 481,824.

---

## App Store Submission

### Google Play

1. Build the AAB: `./scripts/build_android.sh release`
2. Go to [Google Play Console](https://play.google.com/console)
3. Create app → Upload `app-release.aab`
4. Set category: Finance
5. Complete store listing:
   - App name: **TARCOIN Wallet**
   - Short description: *Official TARCOIN (TAR) mobile wallet*
   - Full description: Include BIP44 coin type 5050, ElectrumX, features list

### Apple App Store

1. Archive the app: `./scripts/build_ios.sh archive`
2. Upload via Transporter or Xcode Organizer
3. Go to [App Store Connect](https://appstoreconnect.apple.com)
4. Create app → Select uploaded build
5. Set category: Finance
6. App name: **TARCOIN Wallet**

---

## Updating BlueWallet Base

When a new BlueWallet version is released:

```bash
cd tarcoin-wallet

# Update the pinned version in setup.sh
nano scripts/setup.sh   # update BLUEWALLET_TAG=vX.Y.Z

# Re-run setup (backs up old TARWallet dir first)
mv TARWallet TARWallet.backup.$(date +%Y%m%d)
./scripts/setup.sh

# Test thoroughly before releasing
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Network request failed` | Check ElectrumX server is running and reachable |
| `Could not connect to server` | Verify `electrum.tarcoin.org:50002` is open |
| `Invalid address` | Confirm address starts with `T` (mainnet legacy) |
| Android build fails | Verify `JAVA_HOME` points to JDK 17 |
| iOS build fails | Run `pod install` in `TARWallet/ios/` |
| `Metro: can't listen on port 8081` | Kill existing Metro: `killall node` |
