# TIP-0002: Tarcoin Lightning Network (TLN)
## Layer-2 Millisecond Off-Chain Settlement Protocol

- **TIP Number:** 0002
- **Title:** Tarcoin Lightning Network (TLN) Specification
- **Author:** Tarcoin Core Developers
- **Status:** Draft
- **Type:** Standards Track (Layer-2 / Off-Chain Consensus)
- **Created:** 2026-11-10
- **Requires:** BIP-141 (SegWit), BIP-65 (CLTV), BIP-112 (CSV), BIP-173 (Bech32)

---

## 1. Abstract

Tarcoin Layer-1 provides high-security, decentralized Proof-of-Work settlement on a 600-second (10-minute) block target. While ideal for base-layer consensus and censorship-resistant settlement, real-world commerce, decentralized exchanges, point-of-sale systems, and peer-to-peer transfers require sub-second confirmation latency.

TIP-0002 specifies the **Tarcoin Lightning Network (TLN)**, an off-chain Layer-2 payment channel protocol that enables:
* **Millisecond Settlement:** Instant state transitions (10–50 ms) without waiting for Layer-1 PoW blocks.
* **Near-Zero Transaction Fees:** Routing fees denominated in micro-TAR (sub-satoshi equivalents).
* **High Scalability:** Millions of transactions per second (TPS) across multi-hop bidirectional channels.
* **Cryptographic Security:** Full Layer-1 dispute arbitrated by Tarcoin SegWit smart contracts (P2WSH).

---

## 2. Network Parameters & Layer-1 Bindings

| Parameter | Mainnet Value | Testnet Value | Regtest Value |
| :--- | :--- | :--- | :--- |
| **L1 P2P Port** | `19333` | `29333` | `19444` |
| **L1 RPC Port** | `19332` | `29332` | `19443` |
| **L2 Lightning Port** | `19735` | `29735` | `39735` |
| **L1 Magic Bytes** | `0xfb 0xb2 0xc3 0xd4` | `0xfd 0xb4 0xc5 0xd6` | `0xfa 0xbf 0xb5 0xda` |
| **L1 Bech32 HRP** | `tar` | `ttar` | `rtar` |
| **L2 Lightning Invoice HRP** | `lntar` | `lntart` | `lntarr` |
| **Coin Type (BIP-44)** | `10101'` | `1'` | `1'` |
| **L1 Block Target** | 600 seconds | 600 seconds | 600 seconds |

---

## 3. Protocol Architecture

### 3.1. Channel Lifecycle

```
[ Alice ]                                                      [ Bob ]
   │                                                              │
   ├──────── 1. Funding TX Broadcasted on L1 (2-of-2 P2WSH) ──────┤
   │                                                              │
   │  ================= OFF-CHAIN STATE UPDATES ================  │
   ├────── Commitment #1 (Alice: 24,000 TAR | Bob: 1,000 TAR) ───┤  <-- 20ms
   ├────── Commitment #2 (Alice: 20,000 TAR | Bob: 5,000 TAR) ───┤  <-- 15ms
   ├────── Commitment #n (Alice: 10,000 TAR | Bob: 15,000 TAR) ──┤  <-- 18ms
   │                                                              │
   ├──────── 2. Mutual Settlement TX Broadcasted on L1 ───────────┤
```

1. **Funding Phase (L1):** 
   - Alice and Bob establish a bidirectional payment channel by funding a 2-of-2 SegWit (`P2WSH`) script on the Tarcoin blockchain.
   - The funding transaction requires standard L1 confirmation (e.g. 1–3 blocks) before the channel is declared open.

2. **Operating Phase (L2 - Millisecond Transfers):**
   - Once open, both parties exchange cryptographically signed commitment transactions off-chain.
   - Each payment updates the balance distribution instantly (10–50 ms).
   - Old states are invalidated using revocable commitment secrets (punishment mechanism).

3. **Settlement Phase (L1):**
   - **Cooperative Close:** When Alice and Bob agree to close the channel, they sign a final settlement transaction distributing their current balances directly to their respective `tar1...` addresses.
   - **Force Close (Dispute):** If one node goes offline or attempts to publish an obsolete state, the honest party publishes the latest commitment or exercises the revocation penalty on L1 using BIP-112 (`OP_CHECKSEQUENCEVERIFY`).

---

## 4. Bolt-11 Invoice Format (`lntar`)

Tarcoin Lightning Invoices follow the Bech32 encoding standard with the human-readable prefix:
* Mainnet: `lntar<amount><multiplier>1<data><checksum>`
* Example: `lntar25000u1p...` (Invoice requesting 25,000 micro-TAR).

---

## 5. Implementation Roadmap

1. **Phase 1: Specification & Core Bindings (Completed)**
   - Author TIP-0002.
   - Configure accurate Mainnet ports (`19333` P2P / `19332` RPC) and protocol constants.

2. **Phase 2: L2 Node Engine Scaffold**
   - Provide a specialized Layer-2 daemon connected to `tarcoind` RPC / ZMQ.
   - Support channel establishment, HTLC generation, and state persistence.

3. **Phase 3: Wallet Integration**
   - Embed instant Lightning payment support into Tarcoin web and desktop wallets.
   - Generate standard `lntar` QR codes for sub-second point-of-sale payments.
