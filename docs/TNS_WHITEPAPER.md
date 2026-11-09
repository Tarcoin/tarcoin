# TARCOIN
## A Unified Layer-1 Identity Protocol for Proof-of-Work Mining, Payments, and Decentralized Web Hosting

**Technical Whitepaper — Version 2.0**

**Project:** TARCOIN (TAR)  
**Protocol:** Tarcoin Name System (TNS-1)  
**Consensus:** SHA-256d Proof-of-Work  
**Architecture:** Bitcoin-derived UTXO Layer-1  
**Naming Namespace:** `.tar`  
**Sign-off:** Tarcoin Core Dev Team

---

## Abstract

TARCOIN is the world's first Proof-of-Work blockchain to integrate native Layer-1 domain resolution directly into Stratum mining identities (PPLNS and Solo) and automated coinbase reward distribution, alongside native IPFS decentralized web hosting on a pure Bitcoin UTXO architecture.

Built on SHA-256d Proof-of-Work and Bitcoin-derived UTXO infrastructure, TARCOIN introduces the Tarcoin Name System (TNS-1), a native Layer-1 naming protocol that transforms human-readable `.tar` domains into unified decentralized identities.

Through TNS-1, a single domain can simultaneously serve as:

- **Mining Identity:** Native Stratum worker identification with automatic domain resolution for PPLNS and Solo mining rewards.
- **Payment Identity:** Human-readable Layer-1 payment addressing with resolution to native TARCOIN UTXO addresses.
- **Web3 Identity:** Native IPFS content resolution, connecting `.tar` domains to decentralized websites and applications.

TNS-1 records domain registrations and updates directly within Layer-1 blockchain transactions using Bitcoin-architecture OP_RETURN payloads. Domain ownership is established through cryptographic UTXO authorization, while deterministic indexing reconstructs authoritative naming state from the blockchain.

By unifying mining, payments, and decentralized web hosting under one blockchain-native naming system, TARCOIN eliminates the need for disconnected identity mechanisms across these applications.

**One domain. Multiple decentralized identities. One Proof-of-Work Layer-1 foundation.**

---

# 1. Introduction

Blockchain addresses are cryptographically useful but difficult for humans to remember, communicate, and manage.

Traditional cryptocurrency infrastructure requires users to interact with long wallet addresses. Mining pools generally require miners to configure raw payout addresses. Decentralized websites require users to work with content identifiers or specialized gateways.

These systems operate independently, creating unnecessary complexity.

TARCOIN addresses this fragmentation by introducing native Layer-1 naming through TNS-1.

A single `.tar` domain can represent:

- A cryptocurrency payment destination.
- A mining identity (PPLNS and Solo).
- A decentralized website.
- An IPFS content reference.

This architecture turns domain names into reusable blockchain-native identities rather than limiting them to conventional website addressing.

---

# 2. Blockchain Architecture

TARCOIN is built on a Bitcoin-derived UTXO architecture using SHA-256d Proof-of-Work.

Its architecture preserves the fundamental characteristics of Bitcoin-style transaction processing while introducing an application-level naming protocol.

### 2.1 Core characteristics

| Component | Implementation |
|---|---|
| Consensus | SHA-256d Proof-of-Work |
| Ledger | UTXO (Unspent Transaction Output) |
| Architecture | Bitcoin-derived Layer-1 |
| Block interval | 10 minutes |
| Block reward | 50,000 TAR |
| Atomic unit | Stella / sTAR (1 TAR = 100,000,000 sTAR) |
| Maximum supply | 50 billion TAR |
| Naming protocol | TNS-1 |
| Domain namespace | `.tar` |
| Domain records | OP_RETURN transactions (`0x54415201`) |
| Decentralized content | IPFS (InterPlanetary File System) |
| Mining integration | Stratum (TCP port 3333 PPLNS, port 3334 Solo) |
| Pool rewards | PPLNS and Direct Solo Coinbase Minting |

### 2.2 Architectural philosophy

TNS-1 does not require an EVM execution environment or conventional smart-contract deployment.

Instead, it uses blockchain transactions as the permanent source of naming records. A deterministic indexing service interprets these records and reconstructs the current domain state.

This cleanly separates three responsibilities:
- **Blockchain:** Authoritative transaction history.
- **TNS indexer:** Domain-state reconstruction and validation.
- **Applications:** Domain resolution and utilization.

---

# 3. Tarcoin Name System (TNS-1)

TNS-1 is TARCOIN's native Layer-1 naming protocol. It allows users to register, update, and resolve human-readable `.tar` domains through blockchain transactions.

### 3.1 Protocol identification

TNS-1 transactions use the following four-byte protocol identifier:

`0x54415201` (ASCII: `TAR`)

The identifier distinguishes TNS protocol payloads from unrelated OP_RETURN data.

### 3.2 Registration payload

A domain registration embeds a JSON record into an OP_RETURN transaction output.

Example registration of `tarcoin.tar`:

```json
{
  "p": "tns",
  "op": "reg",
  "name": "tarcoin.tar",
  "addr": "tar1qp9mrlvusj09lrund56rqgdrwvqrvzhnftzxc2x",
  "ipfs": "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku"
}
```

The record establishes:
- Protocol: TNS.
- Operation: Registration.
- Domain: `tarcoin.tar`.
- Owner/payment address: TAR Layer-1 address.
- Website destination: IPFS CID.

### 3.3 Domain updates

Domain owners can update associated records through cryptographically authorized transactions. For example, an IPFS destination can be changed without transferring domain ownership:

```json
{
  "p": "tns",
  "op": "update",
  "name": "tarcoin.tar",
  "ipfs": "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku"
}
```

The update is authorized through the domain owner's UTXO signing key, allowing website content to evolve while maintaining the exact same human-readable domain identity.

### 3.4 Ownership and state management

TNS-1 uses blockchain transaction history to establish domain ownership and reconstruct domain state. The protocol implementation includes:
- Cryptographic ownership verification.
- Domain expiration and renewal handling.
- Canonical transaction ordering and conflict handling.
- Reorganization rollback.
- Deterministic re-indexing from genesis.
- Replay protection.

---

# 4. Deterministic Domain Resolution

TNS-1 includes an indexing and resolution service referred to as `tns-service`.

The service processes blockchain transactions, validates domain operations, and maintains a canonical representation of registered domains.

### 4.1 Resolution endpoint

Example API request:

```http
GET /api/tns/resolve/tarcoin.tar
```

Example response:

```json
{
  "success": true,
  "domain": "tarcoin.tar",
  "owner": "tar1qp9mrlvusj09lrund56rqgdrwvqrvzhnftzxc2x",
  "targetAddress": "tar1qp9mrlvusj09lrund56rqgdrwvqrvzhnftzxc2x",
  "ipfs_cid": "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
  "content_hash": "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
  "registered_height": 11861,
  "is_expired": false
}
```

### 4.2 Deterministic indexing

The indexer reconstructs domain state from the blockchain transaction history:
1. Identifying TNS-1 protocol payloads.
2. Validating registration and update operations.
3. Establishing domain ownership.
4. Applying valid updates in canonical transaction order.
5. Handling expiration and renewal.
6. Rolling back affected records during chain reorganizations.
7. Reconstructing the identical state through deterministic re-indexing from genesis.

---

# 5. Unified Mining Identity

One of TNS-1's defining innovations is direct integration with Stratum Proof-of-Work mining infrastructure.

Conventional mining pools require miners to configure 42-character raw wallet addresses manually. TARCOIN allows miners to use `.tar` domain identities instead.

### 5.1 Stratum authentication

The mining pool implementation includes:

`resolveTnsToAddress(rawWallet)`

When a miner connects using a `.tar` username, the pool identifies the domain and resolves it through TNS. The resolved Layer-1 address becomes the canonical payout identity.

Example:

```text
Worker username: iamlucky.tar.nerd1
```

The pool resolves `iamlucky.tar` into its associated TARCOIN payment address. The worker suffix remains available for hardware telemetry while the domain determines the payout destination.

### 5.2 PPLNS reward distribution

The mining pool integrates domain resolution into its PPLNS payout engine:
1. Receive Stratum worker authentication.
2. Identify the `.tar` domain.
3. Resolve the domain to its canonical Layer-1 address.
4. Associate the worker with that address.
5. Track mining shares in a 7-day rolling window.
6. Calculate PPLNS reward allocations.
7. Distribute coinbase rewards to the resolved payout identity.

### 5.3 Solo mining & direct coinbase block minting

In addition to shared PPLNS pooling, TNS-1 integrates directly with the Solo Stratum engine (TCP port `3334`).

When a solo miner connects with a `.tar` domain:
1. The Stratum daemon resolves the domain to its Layer-1 address via `resolveTnsToAddress()`.
2. The daemon builds a custom block template via `buildSoloCoinbase(minerAddress, template)`, writing the miner's resolved address directly into the block's coinbase output script (`scriptPubKey`).
3. When the solo miner finds a block, the network mints the 50,000 TAR coinbase reward directly to the resolved `.tar` domain address on-chain.

This ensures zero pool custody and zero intermediate payout transactions—the newly mined block on the blockchain ledger is minted directly to the owner of the `.tar` domain at the consensus level.

---

# 6. Decentralized Website Hosting Through IPFS

TNS-1 extends domain functionality beyond payments and mining. A `.tar` domain associates a human-readable identity with an IPFS content identifier (CID), allowing the domain to resolve to decentralized website content.

### 6.1 Browser resolution pipeline

TARCOIN's Chrome and Brave browser extension provides native `.tar` navigation support:
1. The user enters a `.tar` domain in the browser omnibox.
2. The browser extension intercepts the navigation request.
3. The extension queries the local or remote TNS resolver.
4. The resolver returns the canonical domain record and IPFS CID.
5. The browser routes the request to IPFS (`ipfs://<CID>`) or a compatible HTTP gateway proxy (e.g. `https://tarcoin.tar.tarcoin.org`).
6. The decentralized website content is retrieved and rendered.

### 6.2 Separation of naming and content delivery

TNS-1 deliberately separates domain ownership from content retrieval:

| Layer | Responsibility |
|---|---|
| TARCOIN blockchain | Domain ownership authority (Layer-1 UTXO) |
| TNS-1 | Naming protocol and payload format |
| TNS indexer | Canonical domain state resolution |
| Browser extension | Navigation interception and routing |
| IPFS network | Decentralized content storage and retrieval |
| Gateway | Conventional HTTP compatibility bridge |

---

# 7. Peer-to-Peer Payment Identity

TNS-1 functions as a human-readable payment addressing system. Instead of sharing long blockchain addresses, users can share clean handles such as `satoshi.tar`.

A compatible wallet resolves the domain into its associated TARCOIN Layer-1 address. The resulting payment remains a standard Layer-1 transaction using the blockchain's UTXO architecture. This creates a reusable identity layer for cryptocurrency payments without requiring a separate smart-contract execution environment.

---

# 8. Unified Architecture

The primary innovation of TARCOIN is the convergence of multiple decentralized applications under one unified domain namespace.

### 8.1 Architecture diagram

```text
                 TARCOIN LAYER-1
             SHA-256d Proof-of-Work
                  Bitcoin UTXO
                        |
                        |
                TNS-1 PROTOCOL
             OP_RETURN: TAR
                        |
                        |
               TNS INDEXER/SERVICE
          Deterministic Domain Resolution
                        |
                        |
                 .tar IDENTITY
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
       MINING        PAYMENTS       WEB3 HOSTING
          |             |             |
       Stratum       TAR Address     IPFS CID
          |             |             |
       PPLNS           UTXO       Browser Extension
       Solo            Payments    IPFS / Gateway
          |             |             |
          +-------------+-------------+
                        |
               UNIFIED IDENTITY
```

### 8.2 Identity convergence

| Application | Domain function | Result |
|---|---|---|
| Mining | Stratum worker identity | Resolved mining payout |
| PPLNS | Shared worker identity | Canonical reward destination |
| Solo | Human-readable mining destination | Direct on-chain coinbase block minting |
| Payments | Payment recipient | Native TAR address |
| Web hosting | Website identity | Decentralized IPFS content |
| Browser | `.tar` navigation | Censorship-resistant web access |

---

# 9. Security and Reliability

- **Blockchain reorganization handling:** Deterministic rollback and re-indexing when chain reorganizations occur.
- **Deterministic reconstruction:** The naming database can be rebuilt from genesis using only canonical block history.
- **Cryptographic ownership verification:** Domain updates strictly require authorization from the owner's UTXO signing key.
- **Replay protection:** Protocol-level nonce and height validation prevent unauthorized reuse of past operations.
- **Domain expiration:** Block-height based expiration and renewal rules manage namespace lifecycles.
- **IPFS content integrity:** Cryptographic content-addressed hashes (CIDs) guarantee that retrieved content matches the on-chain pointer.

---

# 10. Mainnet Reference Example

TNS-1's reference implementation identifies the live registration of `iamlucky.tar` at block height 11,861:
- Owner / Target: `tar1qp9mrlvusj09lrund56rqgdrwvqrvzhnftzxc2x`
- Protocol payload: OP_RETURN `0x54415201`
- Active Mining: Currently hashing on the official pool with confirmed blocks mined.

The reference IPFS-enabled domain:
- Domain: `tarcoin.tar`
- IPFS CID: `bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku`

---

# 11. Industry Positioning and Technical Differentiation

Blockchain naming systems have historically addressed decentralized domain registration and human-readable blockchain identities.

Projects such as Namecoin and Handshake established important foundations for blockchain-based naming. TARCOIN advances this concept by integrating native domain resolution directly into Proof-of-Work mining infrastructure and decentralized content delivery.

TARCOIN introduces a unified architecture in which the same Layer-1 domain functions across mining, payments, and IPFS website hosting.

## 11.1 Technical comparison

| Capability | Namecoin (`.bit`, 2011) | Handshake (`HNS`, 2020) | ENS (`.eth`, 2017) | TARCOIN (`.tar`, 2026) |
|---|:---:|:---:|:---:|:---:|
| **Proof-of-Work consensus** | Yes | Yes | No (PoS) | **Yes (SHA-256d)** |
| **Native blockchain naming** | Yes | Yes | No (EVM Contract) | **Yes (OP_RETURN / UTXO)** |
| **Bitcoin-style UTXO architecture** | Yes | Yes | No | **Yes** |
| **Native Stratum domain identities** | No | No | No | **Yes (PPLNS & Solo)** |
| **Domain-resolved PPLNS payouts** | No | No | No | **Yes** |
| **Domain-resolved Solo mining** | No | No | No | **Yes (`buildSoloCoinbase`)** |
| **Automated mining reward routing** | No | No | No | **Yes** |
| **Native IPFS domain resolution** | No | No | Yes | **Yes (`ipfs_cid`)** |
| **Unified mining, payment and web identity** | No | No | No | **Yes** |

## 11.2 TARCOIN's defining innovation

TARCOIN is the world's first Proof-of-Work blockchain to bring native Layer-1 domain resolution directly into the mining reward infrastructure.

Through TNS-1, miners can use human-readable `.tar` domains as Stratum identities instead of manually configuring raw cryptocurrency addresses. The mining pool resolves these identities into canonical Layer-1 payout addresses, enabling automatic reward distribution through PPLNS and Solo mining infrastructure.

This integration creates a direct connection between blockchain-native identity and Proof-of-Work participation.

## 11.3 Beyond mining: unified decentralized identity

TARCOIN extends the same naming infrastructure into two additional application domains:
- **Payments:** Human-readable `.tar` identities resolve into native TARCOIN payment addresses, simplifying peer-to-peer cryptocurrency transfers.
- **Decentralized Web Hosting:** TNS-1 associates domains with IPFS content identifiers, enabling browser-based decentralized website resolution through the TARCOIN browser extension and compatible IPFS gateways.

## 11.4 One domain, multiple decentralized identities

TARCOIN unifies three traditionally separate functions under a single Layer-1 naming protocol:
1. Mining identity and automated reward distribution (PPLNS & Solo).
2. Human-readable peer-to-peer payment identity.
3. Decentralized IPFS website identity.

All three operate through a common domain namespace and a shared blockchain-based ownership authority.

This represents TARCOIN's central architectural distinction: **a native Proof-of-Work Layer-1 naming system that connects mining, financial identity, and decentralized web infrastructure into one unified protocol.**

---

# 12. Conclusion

TARCOIN introduces a unified Layer-1 identity architecture built around Proof-of-Work consensus and native UTXO transactions.

Through TNS-1, human-readable `.tar` domains connect mining infrastructure, cryptocurrency payments, and decentralized web hosting.

The blockchain establishes naming authority. The indexing layer reconstructs domain state. Mining pools resolve domain identities into payout addresses. Wallets resolve payment identities. Browser extensions connect domains to IPFS content.

The result is a single naming system serving multiple decentralized applications.

**TARCOIN is built around a simple principle: one domain, multiple decentralized identities, one Layer-1 foundation.**

---

## Technical References

- **TARCOIN Core Repository:** https://github.com/Tarcoin/tarcoin
- **TNS-1 Protocol Specification:** https://github.com/Tarcoin/tarcoin/blob/master/docs/TIP-0001-TNS.md
- **Official Website:** https://tarcoin.org
- **Mining Pool & Stratum Engine:** https://pool.tarcoin.org
- **Protocol Identifier:** `0x54415201` (`TAR`)
