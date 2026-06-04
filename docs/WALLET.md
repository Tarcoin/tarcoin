# TARCOIN Wallet Guide

## Overview

TARCOIN supports multiple wallet types to suit different use cases:
- **tarcoind + tarcoin-cli** — Full node + command-line wallet (**currently available**)
- **tarcoin-qt** — Desktop GUI wallet (Windows, macOS, Linux) *(coming soon)*
- **Cold Storage** — Air-gapped offline wallet for maximum security

> **Mainnet is live.** Genesis block `000074c6...f44bd7e0` is confirmed at height 0.
> Binary location: `blockchain_core/tarcoin-core/build/bin/`

## Wallet Types

### 1. tarcoin-qt (Desktop GUI)

The full-featured desktop wallet with graphical interface.

**Features:**
- Send and receive TAR
- QR code generation
- Transaction history
- Encrypted wallet support
- Seed backup and restore
- Multi-wallet support
- Address book

**Download:** [https://tarcoin.org/download](https://tarcoin.org/download)

**Installation:**

```bash
# Windows
tarcoin-qt-win64.exe

# macOS
open tarcoin-qt-macos.dmg

# Linux
tar -xzf tarcoin-qt-linux.tar.gz
./tarcoin-qt
```

### 2. tarcoin-cli (Command Line)

For power users and automated systems.

**Setup:**
```bash
# Binary is at (WSL path):
# /mnt/d/TARCOIN/blockchain_core/tarcoin-core/build/bin/

# Create configuration
mkdir -p ~/.tarcoin
cat > ~/.tarcoin/tarcoin.conf << EOF
rpcuser=tarcoin
rpcpassword=your_secure_password
rpcallowip=127.0.0.1
daemon=1
txindex=1
server=1
listen=1
listenonion=0
EOF

# Start daemon
./build/bin/tarcoind -daemon

# Create wallet
./build/bin/tarcoin-cli createwallet "default"

# Generate address
ADDRESS=$(./build/bin/tarcoin-cli getnewaddress)
echo "Your TAR address: $ADDRESS"
```

**Common Commands:**
```bash
# Balance
tarcoin-cli getbalance

# Send TAR
tarcoin-cli sendtoaddress <address> <amount>

# Receive
tarcoin-cli getnewaddress

# Transaction history
tarcoin-cli listtransactions

# Wallet info
tarcoin-cli getwalletinfo

# Encrypt wallet
tarcoin-cli encryptwallet <passphrase>

# Backup wallet
tarcoin-cli backupwallet ~/tarcoin-wallet-backup.dat
```

### 3. Cold Storage (Offline/Paper Wallet)

For long-term secure storage of large amounts.

**Procedure:**

```bash
# Step 1: Boot air-gapped machine (NEVER connect to internet)
# Step 2: Install tarcoin-qt from USB drive
# Step 3: Generate wallet
tarcoin-qt

# Step 4: Record addresses (write down or print)
# Step 5: Create encrypted backup
tarcoin-cli backupwallet /media/usb/tarcoin-backup.dat
tarcoin-cli encryptwallet <strong_passphrase>

# Step 6: Write down seed phrase (24 words)
tarcoin-cli mnemonic

# Step 7: Verify backup
tarcoin-cli importwallet /media/usb/tarcoin-backup.dat

# Step 8: Power off and remove USB
# Step 9: Store USB + paper backup in secure, separate locations
```

**Sending from Cold Storage (Offline Signing):**
```bash
# Online machine - create unsigned transaction
tarcoin-cli createrawtransaction \
  '[{"txid":"...","vout":0}]' \
  '{"tar1...": 100}'

# Copy raw transaction to air-gapped machine via USB
# Sign on air-gapped machine
tarcoin-cli signrawtransactionwithwallet <unsigned_hex>

# Copy signed transaction back to online machine
# Broadcast
tarcoin-cli sendrawtransaction <signed_hex>
```

## Security Best Practices

### Wallet Encryption
```bash
# Encrypt existing wallet
tarcoin-cli encryptwallet "your-strong-passphrase"

# To unlock for transactions
tarcoin-cli walletpassphrase "your-strong-passphrase" 300

# Lock wallet
tarcoin-cli walletlock
```

### Seed Backup
- Write down the 24-word seed phrase on paper
- Store in a fireproof safe
- Create multiple copies in different locations
- NEVER store digitally or screenshot
- Consider steel seed backup for disaster protection

### Cold Storage Rules
- Private keys must NEVER touch internet-connected systems
- Use dedicated air-gapped hardware
- Create multiple encrypted backups
- Verify backups before relying on them
- Store backups in geographically separated locations

## Wallet File Locations

```bash
# Windows
%APPDATA%\Tarcoin\

# macOS
~/Library/Application Support/Tarcoin/

# Linux
~/.tarcoin/
```

## Recovery

### From Seed Phrase
```bash
tarcoin-cli restorewallet "recovered" "abandon abandon abandon..."
```

### From Wallet Backup
```bash
tarcoin-cli importwallet /path/to/wallet-backup.dat
```

### Verify Recovery
```bash
# List all addresses
tarcoin-cli listreceivedbyaddress 0 true

# Check balance
tarcoin-cli getbalance
```

## Multi-Signature (Advanced)

```bash
# Create multisig address (2-of-3)
tarcoin-cli createmultisig 2 '["pubkey1","pubkey2","pubkey3"]'

# Create multisig transaction
# (Requires offline coordination between signers)