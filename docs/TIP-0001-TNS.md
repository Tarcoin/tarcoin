# TIP-0001: Tarcoin Name System (TNS)
## Native On-Chain Domain Name and Address Resolution Standard for Layer-1 Proof-of-Work

```
TIP: 0001
Title: Tarcoin Name System (TNS) - Native L1 Domain & Address Resolution Protocol
Author: Tarcoin Core Developers <tarcoin@atomicmail.io>
Discussions-To: https://discord.com/invite/QXm4CxDzJC
Status: Final / Deployed
Type: Standards Track (Protocol & Application)
Created: 2026-10-15
Updated: 2026-11-04
Requires: BIP-141 (SegWit), BIP-341 (Taproot)
License: MIT Software License
```

---

## 1. Abstract

This specification defines the **Tarcoin Name System (TNS)**, the first native protocol-level domain name and address aliasing standard designed specifically for a Layer-1 Proof-of-Work (PoW) SHA-256d blockchain. 

Unlike Ethereum Name Service (ENS), which relies on heavy EVM smart contracts, or Monero OpenAlias, which depends on centralized ICANN DNS TXT records, TNS operates natively on the Tarcoin Layer-1 ledger using standardized `OP_RETURN` script payloads. TNS maps human-readable names (`<name>.tar`) directly to Native SegWit (`tar1q...`), Taproot (`tar1p...`), and Legacy (`T...`) addresses, enabling frictionless peer-to-peer payments and stratum mining payouts without third-party middleware.

---

## 2. Motivation

For over fifteen years since the inception of Bitcoin, Proof-of-Work networks have required users and miners to interact with 42+ character cryptographic hashes (Base58Check and Bech32/Bech32m strings). This design creates severe usability and security friction:
1. **Transcription & Clipboard Hijacking:** Copy-paste malware can silently alter clipboard strings, leading to irreversible loss of funds.
2. **Miner Payout Configuration:** ASIC and GPU miners operating on stratum pools are forced to configure cumbersome 42-character strings into rig dashboards.
3. **Smart Contract Overhead:** Existing Web3 naming protocols require Turing-complete virtual machines (EVM/Wasm), introducing attack surfaces, high gas fees, and re-entrancy risks incompatible with sound PoW money.

TNS resolves these challenges by introducing lightweight, verifiable on-chain registration directly inside native Bitcoin Core v31-compatible transactions.

---

## 3. Specification

### 3.1 Domain Name Syntax

A valid TNS domain name must satisfy the following lexical grammar:
* **Allowed Characters:** Lowercase ASCII alphanumeric characters `[a-z0-9]`.
* **TLD:** Strict suffix `.tar`.
* **Length:** 3 to 64 characters (excluding the `.tar` suffix).
* **Reserved Namespace:** 1-character and 2-character names are reserved for protocol core services, network infrastructure, and critical exchange routing.

### 3.2 Registration Transaction Structure

A TNS registration is executed via a standard Bitcoin-style transaction containing three primary outputs:

```
[Transaction Inputs (UTXOs)]
       │
       ├── Output 0: Treasury Fee Output (P2WPKH / Bech32)
       │             Destination: TNS Protocol Treasury
       │             Value: Dynamic Fee in Stella / sTAR (1 TAR = 100,000,000 sTAR)
       │
       ├── Output 1: Data Carrier Output (OP_RETURN)
       │             Script: OP_RETURN <TNS-1 JSON Payload Buffer>
       │             Value: 0 sTAR
       │
       └── Output 2: Change Output (P2WPKH)
                     Destination: User Change Address
```

### 3.3 On-Chain Data Payload Schema (`TNS-1`)

The `OP_RETURN` output contains a compact JSON payload complying with the `TNS-1` protocol specification:

```json
{
  "p": "tns",
  "op": "reg",
  "name": "miner.tar",
  "years": 4,
  "addr": "tar1qdjvv7g76tjx8djspvr2agul3gyhxfcm98js6km",
  "prem": 1,
  "ipfs": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
}
```

#### Field Definitions:
* `p` (Protocol): String, must be `"tns"`.
* `op` (Operation): String, supported operations: `"reg"` (Register), `"upd"` (Update Target Address), `"xfer"` (Transfer Ownership).
* `name` (Domain): String, the fully qualified domain name ending in `.tar`.
* `years` (Duration): Integer, registration duration (e.g., 1 or 4 years).
* `addr` (Target Address): String, the destination Tarcoin Bech32/Bech32m address that resolves to this domain.
* `prem` (Premium Flag, Optional): Integer (`1`), indicates ultra-premium tier qualification.
* `ipfs` (Decentralized Web Hash, Optional): String, IPFS Content Identifier (CID) for decentralized hosting.

### 3.4 Tiered Pricing & Economic Disincentives Against Squatting

To prevent namespace front-running and spam squatting, TNS establishes an economic tier model enforced at the wallet and validator verification layers:

| Tier | Character Length | Base Annual Rate (USDT equivalent) | Discounted TAR Rate (25% Off) |
| :--- | :--- | :--- | :--- |
| **Reserved** | 1 – 2 chars | Protocol Locked | Protocol Locked |
| **Tier 1** | 3 chars | $500.00 USDT | $375.00 in TAR |
| **Tier 2** | 4 chars | $200.00 USDT | $150.00 in TAR |
| **Tier 3** | 5 chars | $50.00 USDT | $37.50 in TAR |
| **Standard** | 6 – 8 chars | $20.00 USDT | $15.00 in TAR |
| **Extended** | 9+ chars | $10.00 USDT | $7.50 in TAR |

* **Ultra-Premium Multiplier (2x):** Pure numeric digit sequences (e.g. `111.tar`, `999.tar`), repeating patterns, and iconic crypto dictionary keywords incur a 2x rate multiplier.
* **Long-Term Incentive:** 4-year registrations grant 1 year free (Pay 3 years, receive 4).

---

## 4. Name Resolution Protocol

### 4.1 Resolution Hierarchy
When a client (wallet, node, or stratum pool backend) encounters a recipient identifier formatted as `<name>.tar`:
1. **Syntax Validation:** Verify RFC-compliant alphanumeric structure.
2. **On-Chain Indexer Lookup:** Query ElectrumX / Core RPC index for the most recent valid `p: "tns"` transaction affecting `<name>.tar`.
3. **Expiration Check:** Verify block height timestamp:
   $$\text{BlockTimestamp}_{\text{current}} < \text{BlockTimestamp}_{\text{registration}} + (\text{Years} \times 31536000\text{s})$$
4. **Resolution Output:** Return the cryptographic target address (`addr`).

### 4.2 Stratum Miner Integration
Stratum mining pools supporting TIP-0001 parse the stratum username field:
```
stratum+tcp://pool.tarcoin.org:3333 -u miner1.tar.worker01 -p x
```
The pool's stratum backend resolves `miner1.tar` to the miner's on-chain Bech32 address at block template creation time, assigning the coinbase output reward directly to the resolved address.

---

## 5. Prior Art Comparison

| Feature | Tarcoin TNS (TIP-0001) | Namecoin (.bit) | Ethereum ENS (.eth) | Monero OpenAlias |
| :--- | :--- | :--- | :--- | :--- |
| **Consensus Model** | Layer-1 PoW (SHA-256d) | Merge-Mined PoW | Proof-of-Stake (EVM) | PoW (RandomX) |
| **Primary Design Goal** | Direct Wallet & Miner Payouts | Decentralized DNS | Web3 Identity & Smart Contracts | Legacy Email Aliasing |
| **Execution Layer** | Native L1 OP_RETURN | Bespoke Name Operations | Turing-Complete EVM | Centralized ICANN DNS TXT |
| **Miner Stratum Compatibility** | **Native** | No (Requires Base58 address) | N/A (PoS) | No (Blocked by pool daemons) |
| **Gas / Smart Contract Risk** | **Zero (No contracts)** | None | High (Smart Contract exploits) | None |

---

## 6. Reference Implementation

The official reference implementation of TIP-0001 is maintained in the following repositories:
* **Protocol Service:** `https://github.com/Tarcoin/tarcoin/tree/master/tns-service`
* **Wallet Implementation:** `https://github.com/Tarcoin/my-wallet/blob/main/src/services/TnsService.ts`
* **On-Chain Resolution API:** `https://tarcoin.org/api/tns/resolve/:domain`

---

## 7. Copyright & Attribution

Copyright (c) 2026 Tarcoin Core Developers.

This specification is licensed under the MIT Open Source License. Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, subject to the condition that **the above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software**.
