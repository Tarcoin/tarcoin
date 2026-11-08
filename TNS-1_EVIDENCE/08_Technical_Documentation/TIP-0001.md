# TIP-0001: TARCOIN Name System (TNS-1)

**Status:** Proposed Technical Improvement  
**Protocol:** TARCOIN Name System  
**Protocol Identifier:** TNS-1  
**Network:** TARCOIN  
**Domain Namespace:** `.tar`  
**Reference Implementation:** `tns-service`, `mining_pool/src/pool.js`, and `my-wallet`  
**Audit Commit:** `85f90e3ebd3cff8d0012b3671fa5ad9988644c09`  
**Sign-off:** Tarcoin Core Dev Team

---

# 1. Abstract

The TARCOIN Name System (TNS-1) is a blockchain-native naming protocol that enables users, wallets, applications, and mining pools to use human-readable `.tar` domain names instead of manually entering long TARCOIN addresses.

TNS-1 operates as an index-enforced Layer-1 meta-protocol. Domain registrations, updates, ownership transfers, and renewals are recorded through standard TARCOIN transactions containing structured JSON data in `OP_RETURN` outputs.

The protocol does not require a TARCOIN hard fork or soft fork. Existing TARCOIN nodes, miners, wallets, and applications can continue processing standard transactions without implementing TNS-1. TNS-aware services interpret the on-chain payloads and maintain the application-level domain state.

The production implementation consists of:

- `tns-service`: A native Node.js daemon that indexes TNS transactions, validates protocol operations, stores domain state, and exposes REST resolution endpoints.
- SQLite in WAL mode: Persistent storage for current domain records, transition history, and indexer synchronization state.
- TNS-aware mining-pool integration: Resolves `.tar` worker identities to canonical TARCOIN addresses and aggregates their PPLNS shares.
- Wallet integration: Resolves `.tar` recipients and displays both the registered name and canonical Bech32 destination before transaction confirmation.

TNS-1 includes first-come-first-served registration, Treasury-based registration and renewal fees, cryptographic ownership authorization, block-based expiration, reorganization recovery, and deterministic indexing.

The protocol also supports mining-pool worker identity aggregation, allowing multiple workers associated with the same `.tar` domain to receive consolidated wallet-level reward calculations.

---

# 2. Motivation

TARCOIN addresses are suitable for blockchain transactions but are difficult for users to remember, communicate, and verify manually.

TNS-1 introduces a human-readable naming layer while preserving standard TARCOIN addresses as the canonical transaction destinations.

The protocol is designed to address the following requirements.

## 2.1 Human-Readable Addresses

Users can register names such as:

```text
iamlucky.tar
```

A TNS-aware wallet or application can resolve the name to its associated TARCOIN address.

## 2.2 Blockchain-Native Registration

Domain ownership and state transitions are recorded in TARCOIN transactions. The blockchain provides the transaction history from which TNS-aware indexers reconstruct domain state.

## 2.3 First-Come-First-Served Ownership

Registration follows first-come-first-served rules. Competing registrations are evaluated in canonical block order, using block height and transaction index to establish the ordering of eligible claims.

A duplicate registration against an active domain produces a TNS protocol NO-OP and does not alter the existing domain state.

## 2.4 Cryptographic Ownership

Updates and transfers require authorization from the current domain owner.

TNS-1 relies on TARCOIN Core's Layer-1 transaction signature validation and applies an additional application-level ownership check against the current indexed owner address.

## 2.5 Application and Mining Integration

TNS-1 allows applications to resolve names without changing the underlying TARCOIN transaction format.

Mining pools can use registered names as worker identities and consolidate shares from multiple workers under one canonical payout address.

## 2.6 No Consensus Upgrade

TNS-1 is designed to operate without changing TARCOIN consensus rules. Its application-level validation and state transitions are performed by the TNS indexing service.

---

# 3. Terminology and Definitions

**TNS-1:** The TARCOIN Name System protocol version defined by this specification.

**`.tar` domain:** A registered human-readable identifier in the TARCOIN Name System.

**TNS payload:** Structured JSON data carried in a TARCOIN transaction `OP_RETURN` output.

**TNS indexer:** The service that reads canonical TARCOIN blocks, identifies TNS payloads, validates operations, and maintains indexed domain state.

**TNS resolver:** The application interface that returns domain information and the associated TARCOIN destination address.

**Domain owner:** The TARCOIN address recorded as the current owner of a registered domain.

**Target address:** The TARCOIN address returned when a domain is resolved. It may differ from the owner address when the owner configures a separate destination.

**Treasury:** The designated TARCOIN address receiving domain registration and renewal fees.

**Registration block:** The canonical block height in which a registration operation is included.

**Expiration block:** The block height at which a domain becomes expired.

**Confirmation depth:** The number of confirmations required by a specific TNS or mining-pool process.

**Protocol NO-OP:** An operation that does not change TNS domain state. A protocol NO-OP may still be contained in a valid TARCOIN Layer-1 transaction.

**FCFS:** First-come-first-served registration ordering.

**PPLNS:** Pay Per Last N Shares reward distribution. In this implementation, eligibility is determined by a seven-day rolling time-window rather than a fixed share count.

**Worker identity:** A mining-pool identity that may contain a TNS domain and a worker suffix.

**Canonical address:** A standard TARCOIN address used as the actual transaction destination.

**sTAR:** The smallest accounting unit used by the implementation, with 100,000,000 sTAR equal to 1 TAR.

---

# 4. TNS-1 Protocol Specification

## 4.1 Domain Naming Rules

TNS-1 uses the `.tar` namespace.

The accepted domain-name pattern is:

```regex
^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\.tar$
```

The naming policy establishes the following restrictions:

- Minimum name length: 3 characters.
- Maximum name length: 64 characters, excluding the `.tar` suffix.
- Only lowercase ASCII letters, digits, and internal hyphens are accepted.
- Names cannot begin or end with a hyphen.
- Underscores and other special characters are rejected.
- Uppercase names are rejected.
- Unicode names are rejected.
- Punycode names are rejected.
- Names of one or two characters are permanently reserved and unavailable for public registration.

Examples:

| Name | Result |
|---|---|
| `iamlucky.tar` | Valid |
| `pool-2026.tar` | Valid |
| `node1.tar` | Valid |
| `ab.tar` | Reserved |
| `test_worker.tar` | Invalid |
| `-lead.tar` | Invalid |
| `trail-.tar` | Invalid |
| `UPPER.tar` | Invalid |
| `xn--bcher.tar` | Invalid |

## 4.2 Transaction Structure

TNS-1 operations are recorded in standard TARCOIN transactions.

The registration transaction uses the following output arrangement:

| Transaction element | Purpose |
|---|---|
| `vin[0]` | Signing input associated with the registering owner |
| `vout[0]` | Required Treasury fee payment |
| `vout[1]` | TNS-1 `OP_RETURN` payload |

The designated Treasury address is:

```text
tar1q3e8a9xg89jd4wg8q97x3ar3l4ew2a7gtamqskq
```

The validator checks that the required fee is paid to this destination.

## 4.3 Payload Encoding

TNS-1 uses structured JSON payloads.

Two payload representations are supported.

**Compact representation:**

```json
{
  "p": "tns",
  "op": "reg",
  "n": "iamlucky",
  "y": 1,
  "a": "tar1qka69h..."
}
```

**Verbose representation:**

```json
{
  "p": "tns",
  "op": "reg",
  "name": "iamlucky",
  "years": 1,
  "addr": "tar1qka69h..."
}
```

The compact representation is designed to fit within the legacy 80-byte data-carrier constraint for broad client compatibility.

The production TARCOIN Core configuration uses:

```text
MAX_OP_RETURN_RELAY = MAX_STANDARD_TX_WEIGHT / WITNESS_SCALE_FACTOR
```

The configured standard relay data-carrier allowance supports payloads up to 100,000 vbytes. Implementations should distinguish the configured standard relay limit from the compact payload's legacy 80-byte compatibility target.

## 4.4 Operation Payload Requirements

TNS-1 defines four principal operations.

### 4.4.1 Registration — `reg`

Required fields:

- `p`: `"tns"`
- `op`: `"reg"`
- `name`
- `years`
- `vout[0]`: Required Treasury fee payment

Optional fields:

- `addr`
- `ipfs`

If `addr` is omitted, the target address defaults to the signing address associated with `vin[0]`.

Registration creates a new domain record if the name is valid, available, and the required fee is paid.

### 4.4.2 Update — `update`

Required fields:

- `p`
- `op`: `"update"`
- `name`
- At least one target update field: `addr` or `ipfs`

The operation must be authorized by the current domain owner.

An update changes the specified target information without transferring domain ownership.

### 4.4.3 Transfer — `transfer`

Required fields:

- `p`
- `op`: `"transfer"`
- `name`
- `addr`: New owner address

The transfer must be authorized by the current owner.

On successful processing, `owner_address` changes to the new owner address. The target address is updated to the new owner address by default.

### 4.4.4 Renewal — `renew`

Required fields:

- `p`
- `op`: `"renew"`
- `name`
- `years`
- `vout[0]`: Required Treasury renewal fee payment

Renewal is accepted only before the domain expiration boundary.

## 4.5 Unknown Fields and Invalid Operations

Unknown optional metadata keys, such as `avatar` and `dns`, are ignored by legacy indexers without changing the validity of an otherwise valid core operation.

Missing required fields or an unknown operation identifier cause the TNS operation to be rejected as a protocol NO-OP.

Unknown optional metadata must not override mandatory ownership, authorization, target-address, expiration, or fee rules.

## 4.6 First-Come-First-Served Registration

TNS-1 uses first-come-first-served registration.

Competing eligible registrations are evaluated according to canonical blockchain ordering:

1. Block height.
2. Transaction index within the block.

The first valid registration in canonical order establishes the domain record.

A second registration for an already active domain produces a protocol NO-OP. The underlying TARCOIN transaction remains valid Layer-1 data and may remain on-chain.

## 4.7 Registration and Renewal Fees

The registration and renewal fee schedule is denominated in USD and paid in TAR.

The production pricing tiers distinguish the protocol's USD-denominated TAR charge from the corresponding retail price.

| Name length | Protocol charge | Retail price |
|---|---:|---:|
| 1–2 characters | Reserved | Not available |
| 3 characters | $375 | $500 |
| 4 characters | $150 | $200 |
| 5 characters | $37.50 | $50 |
| 6–8 characters | $15 | $20 |
| 9–64 characters | $7.50 | $10 |

The production implementation applies a 2× premium multiplier to qualifying premium names, including:

- Pure numeric names, such as those associated with the 999 Club and 10k Club.
- Repeating numeric or character patterns.
- Iconic keywords, including `btc`, `tar`, `vip`, `gold`, `pool`, and `love`.

The required TAR amount is calculated from the applicable USD-denominated protocol charge and the live TAR/USD price.

The fee acceptance condition is:

```javascript
paidTar >= requiredTar * 0.99
```

This provides a 1% payment tolerance.

If the price feed is unavailable, the configured fallback benchmark is:

```text
1 TAR = $0.00000372 USD
```

The validator checks the required fee against the Treasury output at `vout[0]`.

## 4.8 Registration Duration and Expiration

The target block interval is 600 seconds.

The implementation uses 52,560 blocks as one registration year.

The expiration calculation is:

```javascript
expires_block = registered_block + years * 52560;
```

### 4.8.1 Renewal

Renewal is accepted only when:

```text
current_block < expires_block
```

The renewed expiration height is:

```javascript
new_expires_block =
    expires_block + years * 52560;
```

### 4.8.2 Expiration Boundary

Expiration is inclusive.

At:

```text
current_block === expires_block
```

the domain is already expired.

At or after this height:

- Updates are rejected as protocol NO-OPs.
- Renewals are rejected as protocol NO-OPs.
- The name becomes eligible for a new FCFS registration.

A valid new registration may claim the expired name, subject to the normal registration rules and fee requirements.

## 4.9 Cryptographic Ownership Authorization

Updates and transfers require authorization by the current domain owner.

The reference implementation compares the address derived from the first transaction input's previous output against the indexed owner address:

```javascript
tx.vin[0].prevout.scriptPubKey.address ===
    domain.owner_address
```

TARCOIN Core validates the transaction's Layer-1 signatures. The TNS indexer applies the additional ownership comparison.

If the address cannot be derived from a supported single-address previous output, the implementation sets:

```text
senderAddress = 'unknown'
```

The ownership comparison then fails, and the operation is rejected as a protocol NO-OP.

An address supplied in the JSON payload is not accepted as proof of ownership.

## 4.10 TNS Confirmation Requirement

The TNS state machine uses:

```javascript
const REQUIRED_CONFIRMATIONS = 2;
```

The two-confirmation requirement applies to marking ownership and domain state as confirmed in the TNS index.

It is separate from the mining-pool coinbase maturity requirement described in Section 8.

---

# 5. Name Resolution Architecture

## 5.1 Architecture Overview

TNS-1 combines blockchain-native domain state with an application-level resolver.

The blockchain records TNS operations. The `tns-service` daemon indexes those operations and maintains a queryable representation of current domain state.

The resolver provides domain-to-address lookup without requiring every client to scan the blockchain independently.

## 5.2 TNS Service

The production service is named:

```text
tns-service
```

It is implemented using native Node.js functionality, including:

- `node:sqlite`
- `node:crypto`
- Native `fetch`

The service uses SQLite in Write-Ahead Logging mode.

## 5.3 Indexer

The indexer polls TARCOIN Core RPC using:

```text
getblockchaininfo
getblock(height, 2)
```

It extracts TNS payloads from transaction `OP_RETURN` outputs, validates recognized operations, and applies accepted state transitions to the database.

The indexer maintains the last indexed height and checks block hashes for chain consistency.

## 5.4 Deterministic State

Domain state is derived from canonical blockchain history.

If a reorganization is detected, the indexer:

1. Identifies the common ancestor.
2. Rewinds indexed state to that ancestor.
3. Removes or reverses orphaned transitions.
4. Replays canonical blocks.
5. Reconstructs the affected domain records.

The service supports deterministic replay from genesis.

## 5.5 Resolver API

The primary endpoint is:

```http
GET /api/tns/resolve/:name
```

A successful response contains:

```json
{
  "success": true,
  "domain": "iamlucky.tar",
  "ownerAddress": "tar1...",
  "targetAddress": "tar1...",
  "registeredBlock": 11861,
  "expiresBlock": 64421
}
```

The resolver returns indexed domain information and the canonical TARCOIN target address.

## 5.6 Caching

The resolver and its clients may cache domain results to reduce repeated database and RPC access.

Cached results must remain consistent with indexed domain state.

Relevant state changes requiring cache invalidation or refresh include:

- Registration.
- Update.
- Transfer.
- Renewal.
- Expiration.
- Chain rollback and replay.

The resolver must not continue presenting an expired or orphaned domain state as current merely because a cached record remains available.

---

# 6. Wallet Integration

## 6.1 Recipient Recognition

The production wallet integration is maintained in:

```text
my-wallet
```

When a recipient input ends with `.tar`, the wallet triggers TNS resolution.

It queries:

```http
GET /api/tns/resolve/:name
```

The response supplies the canonical TARCOIN address.

## 6.2 Address Resolution

The resolved address, rather than the human-readable name, is used as the actual transaction destination.

TNS names therefore provide a convenient input format without changing the standard TARCOIN transaction address format.

## 6.3 Confirmation Interface

Before the user confirms a transaction, the wallet displays a dual-badge confirmation containing:

- The registered `.tar` name.
- The resolved canonical Bech32 TARCOIN address.

This allows the user to verify the destination before authorizing the transaction.

## 6.4 Compatibility

Wallets that do not implement TNS-1 continue to send and receive TARCOIN using standard addresses.

TNS resolution is an optional application-level capability and is not required for ordinary TARCOIN transactions.

---

# 7. Mining Pool Integration

## 7.1 Overview

TNS-1 integrates with the TARCOIN mining-pool engine to support human-readable worker identities.

The production integration is implemented in:

```text
mining_pool/src/pool.js
```

The integration connects Stratum worker parsing, TNS resolution, wallet-level share aggregation, and PPLNS payout distribution.

## 7.2 Worker Identity Format

A worker identity may contain a TNS domain and a worker suffix.

Example:

```text
iamlucky.tar.nerd1
```

The pool uses:

```javascript
parseMinerWorker()
```

to extract the domain and worker identifier.

The extracted domain is:

```text
iamlucky.tar
```

The worker suffix is:

```text
nerd1
```

## 7.3 Worker Validation

The pool validates and parses worker identities before attempting TNS resolution.

Malformed identities must not be interpreted as valid TNS domains or arbitrary payout destinations.

The domain component is passed to the TNS resolver.

## 7.4 TNS Resolution Hook

The pool uses:

```javascript
resolveTnsToAddress(domain)
```

to query the local TNS daemon.

The response is cached by the pool to reduce repeated resolver requests.

A valid resolution returns the canonical TARCOIN payout address.

## 7.5 Worker Aggregation

The pool aggregates shares by resolved TARCOIN address.

The implementation follows this logic:

```javascript
const rawWallet = parseMinerWorker(worker).wallet;
const walletAddress = await resolveTnsToAddress(rawWallet);

workerShares[walletAddress] =
    (workerShares[walletAddress] || 0) + 1;
```

For example:

```text
iamlucky.tar.nerd1
iamlucky.tar.bitaxe1
```

Both workers resolve to:

```text
tar1qka69hjnlx736nxf3y67lc49y9ym2xlrthrcgya
```

Their shares are combined into one wallet-level reward calculation.

The worker suffix identifies the mining worker; it does not independently establish domain ownership or authorize a different payout address.

---

# 8. PPLNS Reward Distribution

## 8.1 Seven-Day Rolling Time-Window

The mining-pool implementation uses a **7-Day Rolling Time-Window PPLNS** model.

It does not use a fixed share-count window.

The Redis share queue is:

```text
pool:shares
```

It can retain up to 1,000,000 shares, but eligibility is determined by the seven-day time cutoff.

The configured duration is:

```javascript
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
```

The cutoff is:

```javascript
const cutoffTime = Date.now() - SEVEN_DAYS_MS;
```

The eligible share filter is:

```javascript
const shares = allShares.filter(
    s => JSON.parse(s).time > cutoffTime
);
```

Shares older than the seven-day cutoff are excluded from the active PPLNS calculation.

A scheduled cleanup runs at 00:30 UTC:

```cron
30 0 * * *
```

## 8.2 Coinbase Maturity

The pool requires 101 confirmations before using matured coinbase funds for payout execution.

The implementation calls:

```javascript
getbalance("*", 101)
```

The minimum matured balance threshold is:

```text
49,000 TAR
```

The threshold is intended to ensure that the full 50,000 TAR block reward has matured before payout processing proceeds.

The mining-pool maturity rule is independent of the TNS two-confirmation state-machine rule.

## 8.3 Network Fee Reserve

The pool deducts a 0.1 TAR network-fee reserve before calculating the distributable balance.

```text
Sendable Balance = Matured Balance - 0.1 TAR
```

## 8.4 Pool Fee

The configured pool fee is:

```text
1.0%
```

The distributable portion is 99% of the sendable balance.

## 8.5 Worker Reward Calculation

Worker rewards are calculated according to each resolved payout address's proportion of eligible shares.

Workers resolving to the same canonical address are aggregated before the wallet-level payout is calculated.

## 8.6 Precision

Payout calculations use eight decimal places.

```javascript
parseFloat(
    (amountToDistribute * proportion).toFixed(8)
);
```

The native accounting conversion is:

```text
1 TAR = 100,000,000 sTAR
```

## 8.7 Minimum Payout and Dust Policy

The minimum worker payout threshold is:

```text
1.0 TAR
```

The implementation applies:

```javascript
if (workerReward >= 1) {
    payouts[worker] = workerReward;
    totalAssigned += workerReward;
}
```

Sub-1.0 TAR rewards are not retained in a separate off-chain worker ledger.

Instead, all unassigned sub-threshold amounts are included in the final fee-wallet allocation:

```javascript
const finalFee = parseFloat(
    (sendableBalance - totalAssigned).toFixed(8)
);

payouts[feeWallet] = finalFee;
```

The final fee-wallet allocation includes:

- The 1% pool fee.
- All unassigned sub-1.0 TAR dust.
- Any rounding remainder.

This design avoids creating additional Layer-1 outputs for sub-threshold rewards and is intended to reduce UTXO bloat and dust-related transaction overhead.

## 8.8 Payout Destination Validation

Before payout execution, the pool validates payout destinations using TARCOIN Core's:

```text
validateaddress
```

Invalid destinations are excluded from the payout map.

## 8.9 Payout Execution

The payout engine uses:

```javascript
sendmany("", payouts, 101)
```

to submit the multi-output payout transaction through TARCOIN Core.

## 8.10 Payout Intent and History

Before the RPC call, the pool records a payout intent in:

```text
pool:payout:pending
```

The record includes the payout timestamp, intended destinations and amounts, and a transaction ID initially set to `null`.

After TARCOIN Core returns a TXID, the completed payout is recorded in:

```text
pool:payout:history
```

The history is capped at 500 audit entries.

After the completed record is committed, the pending entry is cleared.

## 8.11 Restart Reconciliation

If the daemon restarts with a pending record whose TXID is `null`, the reconciliation routine queries:

```text
listtransactions("*", 10, 0, true)
```

It matches wallet transaction history against the pending payout destinations and timestamp.

If a matching transaction is found, the engine adopts the TXID, records the completed payout in history, and clears the pending entry.

## 8.12 Duplicate-Payout Protection

The pool uses three complementary safeguards:

1. **Matured UTXO balance depletion:** After a payout transaction is broadcast, the wallet's spendable balance is reduced by the committed inputs. A subsequent payout attempt using the same matured funds fails the minimum balance check.
2. **Redis intent locking:** The pending payout record is written before the RPC call.
3. **Execution history and reconciliation:** Completed transactions are recorded in payout history, and unresolved pending records are reconciled against wallet transaction history after restart.

The balance-depletion check is the primary execution barrier against repeating a payout using the same matured funds.

---

# 9. Security Considerations

## 9.1 Cryptographic Authorization and Domain Hijack Prevention

TNS-1 relies on TARCOIN Core to validate Layer-1 transaction signatures.

The TNS indexer independently checks that the address associated with `vin[0]` matches the current domain owner.

The reference ownership comparison is:

```javascript
tx.vin[0].prevout.scriptPubKey.address ===
    domain.owner_address
```

The authorization process therefore has two layers:

1. TARCOIN Core validates the transaction input signatures.
2. The TNS indexer verifies that the input's previous-output address matches the recorded owner.

An unauthorized update or transfer produces a TNS protocol NO-OP.

An address supplied inside the JSON payload is not accepted as proof of ownership.

For supported standard single-address input formats, the indexer uses the previous output's resolved address. If an exotic or non-standard script does not expose a single derivable address, the implementation sets:

```text
senderAddress = 'unknown'
```

This fails the ownership comparison and rejects the operation.

## 9.2 Chain Reorganization Protection

TNS-1 uses a two-confirmation requirement:

```javascript
const REQUIRED_CONFIRMATIONS = 2;
```

This reduces the risk of applying state changes from transactions that are subsequently removed from the active chain.

If a block-hash mismatch is detected, the indexer:

1. Identifies the common ancestor.
2. Rolls back indexed state above that ancestor.
3. Removes or reverses transitions derived from orphaned blocks.
4. Replays canonical blocks.
5. Reconstructs affected domain records.

The two-confirmation gate and rollback/replay mechanism work together to preserve consistency with the canonical TARCOIN chain.

## 9.3 Homoglyph and Punycode Phishing Mitigation

The naming policy restricts names to lowercase ASCII letters, digits, and internal hyphens.

Unicode characters, Punycode names, special characters, and uppercase names are rejected.

Names of two characters or fewer are reserved.

These restrictions reduce risks from Unicode homoglyphs and visually confusable Punycode registrations.

They do not guarantee that every permitted ASCII name is visually or semantically distinct from every other name. Wallets should display the full registered name and resolved TARCOIN address before transaction confirmation.

## 9.4 Resolver Cache Coherency

The resolver and its clients may cache domain information.

Cached data must remain consistent with indexed state.

Cache entries must be invalidated or refreshed after:

- Registration.
- Update.
- Transfer.
- Renewal.
- Expiration.
- Chain rollback.
- Canonical-chain replay.

The resolver must evaluate expiration against the indexed expiration block and current canonical chain height.

It must not return orphaned ownership or target-address information after a reorganization.

## 9.5 Mining Worker Identity Sanitization

The mining pool validates worker identity format before TNS resolution.

The parser distinguishes the domain component from the worker suffix.

The resolved domain is mapped to a canonical TARCOIN address, which is used as the aggregation key.

Malformed identities and failed TNS resolutions must not be silently converted into arbitrary payout destinations.

Multiple workers resolving to the same address are aggregated under that address.

## 9.6 Mining-Pool Payout Protection

The pool combines:

- A 101-confirmation maturity requirement.
- A minimum matured-balance threshold of 49,000 TAR.
- UTXO balance depletion after payout broadcast.
- Redis pending intent records.
- A 500-entry payout history.
- Restart reconciliation through `listtransactions`.

These controls protect against duplicate payout execution using the same matured reward balance.

The pending intent record alone does not prove whether an RPC transaction was broadcast before a crash. The reconciliation routine therefore checks wallet transaction history before resolving an outstanding pending payout.

## 9.7 Security Responsibilities

| Component | Responsibility |
|---|---|
| TARCOIN Core | Layer-1 transaction and signature validation |
| TNS indexer | Protocol validation, ownership checks, canonical-chain tracking, rollback and replay |
| TNS resolver | Current indexed state and cache coherency |
| Wallet | Accurate name and address confirmation |
| Mining-pool service | Worker sanitization, TNS resolution, share aggregation, and payout safeguards |

The security of TNS-1 depends on the correct operation of all these components.

---

# 10. Compatibility

## 10.1 Zero Consensus Impact

TNS-1 is an index-enforced Layer-1 meta-protocol.

It requires:

- No TARCOIN hard fork.
- No TARCOIN soft fork.
- No consensus-rule modification.
- No new transaction type.

TNS operations use standard TARCOIN transactions and `OP_RETURN` data.

Un-upgraded nodes and miners continue to process and relay transactions according to existing TARCOIN consensus and standard transaction-relay rules.

TNS-aware services interpret the payloads and apply application-level domain state transitions.

An invalid TNS operation may still be a valid Layer-1 transaction. It is rejected as a TNS state transition and produces no domain-state change.

## 10.2 Backward Compatibility

Standard TARCOIN Bech32 addresses remain canonical transaction destinations.

Existing wallets, mining pools, and applications can continue using ordinary TARCOIN addresses without modification.

Clients without TNS support do not resolve `.tar` names, but they remain fully compatible with standard TARCOIN transactions.

## 10.3 Forward Compatibility

TNS-1 uses structured JSON payloads that support optional metadata extensions.

Potential future metadata fields include:

- `ipfs`
- `dns`
- `avatar`

Legacy indexers ignore unknown optional metadata keys without changing the validity of an otherwise valid core operation.

Missing required fields and unknown operation identifiers produce protocol NO-OPs.

Unknown optional fields must not change the established meaning of mandatory operation fields or override authorization, fee, ownership, or expiration rules.

Changes to mandatory fields or operation semantics require a documented protocol change.

## 10.4 Client Interoperability Matrix

| Client or service | Standard TARCOIN support | TNS-1 capability | Integration |
|---|---|---|---|
| TARCOIN Core CLI | Native | No native name resolution required | Existing Core RPC and transaction functions |
| Mobile wallets | Address-based transfers | Optional name resolution | TNS resolver integration |
| Desktop wallets | Address-based transfers | Optional name resolution | TNS resolver integration |
| Stratum daemons | Existing mining workflows | Optional worker-name handling | Worker parser and resolver |
| Mining-pool services | Standard payout processing | TNS-aware share aggregation | TNS resolver and PPLNS integration |
| Block explorers | Standard block and transaction indexing | Optional domain display | TNS indexer and lookup integration |

## 10.5 Interoperability Principles

Implementations should:

1. Preserve standard TARCOIN addresses.
2. Keep TNS interpretation outside consensus validation.
3. Distinguish Layer-1 transaction validity from TNS protocol validity.
4. Apply deterministic protocol rules to canonical blockchain history.
5. Ignore unknown optional metadata without changing core operation semantics.
6. Provide standard-address fallback for clients without TNS support.

---

# 11. Testing and Verification

TNS-1 verification is organized into five suites covering naming rules, state transitions, authorization, expiration, reorganizations, and production payout settlement.

A failed TNS operation is a protocol NO-OP. It does not necessarily invalidate the underlying TARCOIN transaction.

## 11.1 Suite A — Name Sanitization and Format Vectors

The accepted naming pattern is:

```regex
^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\.tar$
```

### Valid Vectors

| Input | Expected result | Reason |
|---|---|---|
| `iamlucky.tar` | ACCEPT | Valid lowercase ASCII |
| `pool-2026.tar` | ACCEPT | Internal hyphen and digits |
| `node1.tar` | ACCEPT | Valid alphanumeric name |

### Invalid or Blocked Vectors

| Input | Expected result | Reason |
|---|---|---|
| `ab.tar` | REJECT | Two-character name reserved |
| `test_worker.tar` | REJECT | Underscore prohibited |
| `-lead.tar` | REJECT | Leading hyphen |
| `trail-.tar` | REJECT | Trailing hyphen |
| `UPPER.tar` | REJECT | Uppercase prohibited |
| `xn--bcher.tar` | REJECT | Punycode prohibited |

Acceptance requires strict enforcement of the naming regex and reserved-name policy.

## 11.2 Suite B — State Machine and Authorization Vectors

### Required Fields

| Operation | Required fields |
|---|---|
| `reg` | `p`, `op`, `name`, `years`, Treasury fee at `vout[0]` |
| `update` | `p`, `op`, `name`, and at least one of `addr` or `ipfs` |
| `transfer` | `p`, `op`, `name`, `addr` |
| `renew` | `p`, `op`, `name`, `years`, Treasury fee at `vout[0]` |

For registration, `addr` is optional. If omitted, it defaults to the `vin[0]` signing address.

### State-Transition Vectors

| Test | Condition | Expected result |
|---|---|---|
| Fee underpayment | `paid < required * 0.99` | REJECT — NO-OP |
| Duplicate claim | Second registration on active domain | NO-OP — existing state unchanged |
| Unauthorized update | `vin[0] !== owner_address` | REJECT — NO-OP |
| Authorized transfer | `vin[0] === owner_address` | ACCEPT — owner changes |
| Registration without `addr` | Valid registration, no optional target | ACCEPT — defaults to signing address |
| Update without target | Neither `addr` nor `ipfs` supplied | REJECT — NO-OP |
| Unknown operation | Unknown `op` identifier | REJECT — NO-OP |
| Unknown optional metadata | Valid core operation with unknown optional key | Core operation remains eligible for validation |

A duplicate registration remains valid Layer-1 transaction data but must not alter the active domain record.

## 11.3 Suite C — Expiration and Renewal Boundary Vectors

The expiration formula is:

```javascript
expires_block = registered_block + years * 52560;
```

### Renewal Before Expiration

Condition:

```text
current_block < expires_block
```

Expected result: A valid, authorized renewal with the required fee extends expiration by:

```javascript
years * 52560
```

### Update at or After Expiration

Condition:

```text
current_block >= expires_block
```

Expected result: Update is rejected as a protocol NO-OP.

### Re-registration After Expiration

At or after the expiration block, a new valid FCFS registration may claim the name.

### Boundary Matrix

| Current block | Operation | Expected result |
|---|---|---|
| `expires_block - 1` | Valid renewal | ACCEPT |
| `expires_block - 1` | Authorized update | Eligible for normal validation |
| `expires_block` | Renewal | REJECT — NO-OP |
| `expires_block` | Update | REJECT — NO-OP |
| `expires_block` | New registration | Eligible under FCFS |
| `expires_block + 1` | New registration | Eligible under FCFS |

The expiration boundary is inclusive.

## 11.4 Suite D — Reorganization and Rollback Verification

The indexer uses:

```javascript
const REQUIRED_CONFIRMATIONS = 2;
```

The reorganization test suite verifies:

1. The two-confirmation maturation gate.
2. Block-hash mismatch detection.
3. Common ancestor identification.
4. Rollback of indexed events above the common ancestor.
5. Removal or reversal of orphaned domain transitions.
6. Replay of canonical replacement blocks.
7. Deterministic reconstruction of domain state.
8. Resolver cache invalidation after rollback and replay.

For identical canonical blockchain history and identical TNS implementation rules, replay must produce the same indexed domain state.

## 11.5 Suite E — Production Settlement Audit: Block #11861

This suite documents an observed production payout through the TNS-aware mining-pool implementation.

### Block and Worker Identification

| Item | Production record |
|---|---|
| Block height | `11861` |
| TNS domain | `iamlucky.tar` |
| Worker identifiers | `nerd1`, `bitaxe1` |
| Resolved address | `tar1qka69hjnlx736nxf3y67lc49y9ym2xlrthrcgya` |
| Maturity observed | 104 confirmations |

Both worker identities resolve to the same TARCOIN address and are aggregated for wallet-level reward calculation.

### PPLNS Execution

The production payout function is:

```javascript
processPayouts()
```

in:

```text
mining_pool/src/pool.js
```

The implementation applies the seven-day rolling share filter and configured reward-distribution rules.

### Payout Submission

The production log records:

```text
Submitting block height 11861 to network...
Executing sendmany: {
Payout successful! TXID:
445100d34304ce2099932c2d4eca995685bf3645094f1e5be8f01ecdddf280f2
```

The transaction ID is:

```text
445100d34304ce2099932c2d4eca995685bf3645094f1e5be8f01ecdddf280f2
```

The transaction contains eight outputs.

### On-Chain Settlement

The recorded payment was:

```text
21,625.23358911 TAR
```

Destination:

```text
tar1qka69hjnlx736nxf3y67lc49y9ym2xlrthrcgya
```

### Production Evidence

The evidence is organized under:

```text
TNS-1_EVIDENCE/
```

with the following structure:

```text
01_PPLNS/
    block_11861_payout_log.txt

02_TRANSACTIONS/
    explorer transaction output breakdown
    wallet application inspection modal
    .tar domain explorer record
    Bech32 address explorer record

03_SOURCE_CODE/
    PPLNS rolling-window filter
    TNS resolver and address aggregation logic
```

The evidence documents:

1. A mining worker using a registered `.tar` identity.
2. TNS resolution to a canonical TARCOIN address.
3. Aggregation of workers resolving to the same address.
4. Seven-day rolling PPLNS processing.
5. Matured reward balance satisfying the payout requirement.
6. A multi-output `sendmany` transaction.
7. Settlement of 21,625.23358911 TAR to the resolved address.

This production record demonstrates an operational TNS-to-PPLNS settlement path.

## 11.6 Reproducibility

Test evidence should identify:

- TARCOIN Core version.
- TNS service version.
- Relevant test block height or chain fixture.
- Relevant configuration values.
- Expected and observed results.
- Supporting logs or transaction evidence.

Synthetic test results and production evidence must remain distinguishable.

---

# 12. Reference Implementation

## 12.1 Core Daemon — `tns-service`

The production TNS daemon is implemented using native Node.js functionality.

### Technology Stack

| Component | Implementation |
|---|---|
| Runtime | Node.js 24+ |
| Database | Native `node:sqlite` |
| Cryptographic utilities | Native `node:crypto` |
| HTTP requests | Native `fetch` |
| Blockchain interface | TARCOIN Core RPC |
| Database mode | SQLite WAL |
| Runtime dependencies | No third-party runtime dependencies |

### Persistent Storage

The database implementation is maintained in:

```text
database.js
```

The database uses three principal tables:

**`domains`**

Stores current domain state:

- `name` — primary key.
- `owner_address`
- `target_address`
- `ipfs_cid`
- `registered_block`
- `expires_block`
- `years`
- `txid`
- `created_at`
- `updated_at`

**`history`**

Maintains an append-only audit trail of domain state transitions:

- `reg`
- `update`
- `transfer`
- `renew`

**`indexer_state`**

Stores synchronization information, including:

```text
last_indexed_height
```

## 12.2 Indexer Engine — `indexer.js`

The indexer communicates with TARCOIN Core using:

```text
getblockchaininfo
getblock(height, 2)
```

It extracts TNS payloads from `OP_RETURN` outputs, validates recognized operations, and updates indexed domain state.

The indexer:

- Enforces two confirmations.
- Tracks the last indexed height.
- Detects block-hash mismatches.
- Identifies the common ancestor.
- Rewinds SQLite state.
- Replays canonical blocks.
- Reconstructs domain state from canonical history.

## 12.3 Validator and Sanitizer — `validator.js`

The validator enforces:

- The strict `.tar` naming regex.
- Reserved short-name restrictions.
- Premium keyword and numeric-name detection.
- The 2× premium multiplier.
- Treasury fee verification.
- The 1% fee tolerance.
- Mandatory operation fields.
- Unknown operation rejection.
- Ownership authorization.
- Domain lifecycle rules.

The Treasury destination is:

```text
tar1q3e8a9xg89jd4wg8q97x3ar3l4ew2a7gtamqskq
```

## 12.4 REST Service — `server.js`

The production REST service exposes three endpoints.

| Endpoint | Function |
|---|---|
| `GET /api/tns/resolve/:name` | Resolve a name to domain and address information |
| `GET /api/tns/check/:name` | Check availability, character tier, and required USD/TAR price |
| `GET /api/tns/owner/:address` | Return domains owned by an address |

### Resolve Response

```json
{
  "success": true,
  "domain": "iamlucky.tar",
  "ownerAddress": "tar1...",
  "targetAddress": "tar1...",
  "registeredBlock": 11861,
  "expiresBlock": 64421
}
```

The values are illustrative; actual response values come from indexed domain state.

## 12.5 Mining Pool Engine

The production mining-pool integration is maintained in:

```text
mining_pool/src/pool.js
```

It includes:

- `parseMinerWorker()` for worker identity parsing.
- `resolveTnsToAddress(domain)` for TNS resolution.
- Cached resolver responses.
- Aggregation by canonical TARCOIN address.
- Seven-day rolling PPLNS calculation.
- 101-confirmation coinbase maturity.
- 1% pool fee.
- 0.1 TAR network fee reserve.
- 1.0 TAR minimum worker payout.
- Sub-1 TAR dust sweep to the fee wallet.
- Eight-decimal payout precision.
- `validateaddress` destination checks.
- Redis payout intent and history.
- `sendmany` payout execution.
- Restart reconciliation.

## 12.6 Wallet Integration — `my-wallet`

The wallet recognizes recipients ending in `.tar`.

It queries:

```text
/api/tns/resolve/:name
```

The wallet resolves the name to its canonical TARCOIN address and displays the domain and Bech32 address in the transaction confirmation modal.

The transaction itself uses the standard TARCOIN address.

## 12.7 TARCOIN Core Integration

TNS-1 uses TARCOIN Core for:

- Blockchain access.
- Transaction and block retrieval.
- Layer-1 transaction validation.
- Signature verification.
- Standard transaction relay.
- Wallet balance and payout RPCs.

TNS-specific interpretation and state transitions remain outside the consensus engine.

## 12.8 Reference Repository and Audit Identification

| Item | Reference |
|---|---|
| Repository | Tarcoin Core & Infrastructure Monorepo |
| Audit commit | `85f90e3ebd3cff8d0012b3671fa5ad9988644c09` |
| Sign-off | Tarcoin Core Dev Team |

The audit commit identifies the supplied reference implementation audit point.

---

# Appendix A — TNS-1 Database and Indexing Architecture

## A.1 Database Engine

The reference implementation uses native Node.js SQLite through `node:sqlite`.

The database operates in Write-Ahead Logging mode and is managed by:

```text
database.js
```

## A.2 Database Tables

### A.2.1 `domains`

Stores the current indexed state of registered domains.

| Column | Description |
|---|---|
| `name` | Domain name; primary key |
| `owner_address` | Current owner address |
| `target_address` | Resolution destination |
| `ipfs_cid` | Optional IPFS identifier |
| `registered_block` | Registration block height |
| `expires_block` | Expiration block height |
| `years` | Registration duration |
| `txid` | Associated transaction ID |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

### A.2.2 `history`

Maintains an append-only record of domain state transitions:

- `reg`
- `update`
- `transfer`
- `renew`

### A.2.3 `indexer_state`

Stores indexer synchronization state, including:

```text
last_indexed_height
```

## A.3 Indexer Processing

The indexer uses:

```text
getblockchaininfo
getblock(height, 2)
```

to retrieve blockchain and transaction data.

It identifies TNS payloads in `OP_RETURN` outputs, validates operations, and updates indexed domain state.

## A.4 Reorganization Recovery

The indexer enforces two confirmations and checks block hashes against the canonical chain.

When a reorganization occurs, it identifies the common ancestor, rewinds indexed state, and replays canonical blocks.

## A.5 State Integrity

The database is an indexed representation of protocol state, not an independent ownership authority.

The canonical TARCOIN blockchain remains the source of the transactions from which domain state is derived.

---

# Appendix B — TNS-1 REST API Reference

The REST API is implemented in:

```text
server.js
```

## B.1 Resolve a Domain

**Endpoint**

```http
GET /api/tns/resolve/:name
```

**Example**

```http
GET /api/tns/resolve/iamlucky.tar
```

**Response structure**

```json
{
  "success": true,
  "domain": "iamlucky.tar",
  "ownerAddress": "tar1...",
  "targetAddress": "tar1...",
  "registeredBlock": 11861,
  "expiresBlock": 64421
}
```

| Field | Description |
|---|---|
| `success` | Resolution success indicator |
| `domain` | Registered domain |
| `ownerAddress` | Current owner address |
| `targetAddress` | Canonical resolution destination |
| `registeredBlock` | Registration block height |
| `expiresBlock` | Expiration block height |

## B.2 Check Domain Availability

**Endpoint**

```http
GET /api/tns/check/:name
```

Returns:

- Name availability.
- Character-based pricing tier.
- Required USD price.
- Required TAR price.

The result follows the naming, reservation, premium multiplier, and pricing rules implemented by the validator.

## B.3 List Domains by Owner

**Endpoint**

```http
GET /api/tns/owner/:address
```

Returns an array of domains associated with the specified TARCOIN owner address.

## B.4 API Consumers

The API is used by:

- TNS-aware wallets.
- Mining-pool services.
- Other TNS-aware applications.

Wallets use the resolve endpoint for recipient entry and confirmation.

Mining pools use it to map worker domain identities to canonical payout addresses.

---

# Appendix C — PPLNS Mining-Pool Integration and Production Settlement Evidence

## C.1 Share Queue

The pool stores shares in Redis under:

```text
pool:shares
```

The queue can retain up to 1,000,000 shares.

Payout eligibility uses a seven-day rolling time-window.

```javascript
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const cutoffTime = Date.now() - SEVEN_DAYS_MS;

const shares = allShares.filter(
    s => JSON.parse(s).time > cutoffTime
);
```

Shares older than the cutoff are excluded from the current PPLNS calculation.

The scheduled cleanup runs at:

```cron
30 0 * * *
```

This is 00:30 UTC.

## C.2 Coinbase Maturity

The pool queries:

```javascript
getbalance("*", 101)
```

The configured minimum matured balance is:

```text
49,000 TAR
```

The payout engine waits for the configured 101-confirmation maturity requirement.

## C.3 Network Fee Reserve

The pool deducts:

```text
0.1 TAR
```

before calculating the distributable balance.

```text
Sendable Balance = Matured Balance - 0.1 TAR
```

## C.4 Pool Fee

The configured pool fee is:

```text
1.0%
```

The distributable portion is 99% of the sendable balance.

## C.5 Precision

Payout calculations use eight decimal places.

```javascript
parseFloat(
    (amountToDistribute * proportion).toFixed(8)
);
```

The conversion is:

```text
1 TAR = 100,000,000 sTAR
```

## C.6 Minimum Payout and Dust

The minimum worker payout is:

```text
1.0 TAR
```

```javascript
if (workerReward >= 1) {
    payouts[worker] = workerReward;
    totalAssigned += workerReward;
}
```

Sub-1.0 TAR rewards are not retained in an off-chain worker ledger.

They are included in the fee-wallet remainder:

```javascript
const finalFee = parseFloat(
    (sendableBalance - totalAssigned).toFixed(8)
);

payouts[feeWallet] = finalFee;
```

The fee-wallet allocation includes the 1% pool fee, sub-threshold dust, and rounding remainder.

## C.7 TNS Worker Resolution

The pool parses worker identities using:

```javascript
parseMinerWorker()
```

It resolves domains using:

```javascript
resolveTnsToAddress(domain)
```

The resulting canonical address is used for share aggregation.

Example workers:

```text
iamlucky.tar.nerd1
iamlucky.tar.bitaxe1
```

Both resolve to:

```text
tar1qka69hjnlx736nxf3y67lc49y9ym2xlrthrcgya
```

Their eligible shares are aggregated under that address.

## C.8 Payout Destination Validation

The pool validates destinations through TARCOIN Core:

```text
validateaddress
```

Invalid destinations are excluded from the payout map.

## C.9 Payout Execution

The pool records an intent in:

```text
pool:payout:pending
```

before executing:

```javascript
sendmany("", payouts, 101)
```

After receiving the TXID, it stores the completed record in:

```text
pool:payout:history
```

The history is capped at 500 entries. The pending entry is cleared after successful completion recording.

## C.10 Restart Reconciliation

For an unresolved pending record with `txid === null`, the engine queries:

```text
listtransactions("*", 10, 0, true)
```

It matches transaction history against pending payout destinations and timestamp.

A matching transaction is adopted into payout history, and the pending entry is cleared.

## C.11 Duplicate-Payout Protection

The pool combines:

1. Matured-balance depletion.
2. Redis intent logging.
3. Execution history and restart reconciliation.

After a payout is broadcast, the wallet's spendable balance is reduced by the committed UTXOs. The same matured funds therefore cannot satisfy the payout threshold again.

## C.12 Production Settlement Audit — Block #11861

### Block and Worker Details

| Item | Record |
|---|---|
| Block height | `11861` |
| Domain | `iamlucky.tar` |
| Workers | `nerd1`, `bitaxe1` |
| Resolved address | `tar1qka69hjnlx736nxf3y67lc49y9ym2xlrthrcgya` |
| Coinbase maturity observed | 104 confirmations |

### PPLNS Execution

The production payout function is:

```javascript
processPayouts()
```

in:

```text
mining_pool/src/pool.js
```

It applied the seven-day rolling share filter and the configured payout rules.

### Transaction Submission

The production log recorded:

```text
Submitting block height 11861 to network...
Executing sendmany: {
Payout successful! TXID:
445100d34304ce2099932c2d4eca995685bf3645094f1e5be8f01ecdddf280f2
```

**TXID**

```text
445100d34304ce2099932c2d4eca995685bf3645094f1e5be8f01ecdddf280f2
```

The transaction contains eight outputs.

### On-Chain Settlement

The recorded payment was:

```text
21,625.23358911 TAR
```

to:

```text
tar1qka69hjnlx736nxf3y67lc49y9ym2xlrthrcgya
```

### Evidence Directory

```text
TNS-1_EVIDENCE/
│
├── 01_PPLNS/
│   └── block_11861_payout_log.txt
│
├── 02_TRANSACTIONS/
│   ├── explorer transaction output breakdown
│   ├── wallet application inspection modal
│   ├── .tar domain explorer record
│   └── Bech32 address explorer record
│
└── 03_SOURCE_CODE/
    ├── PPLNS rolling-window filter
    └── TNS resolver and address aggregation logic
```

### Production Audit Conclusion

The block #11861 production record demonstrates the integrated workflow:

1. A worker submitted a registered `.tar` identity.
2. The pool parsed the domain and worker suffix.
3. The TNS resolver returned the canonical TARCOIN address.
4. Shares from workers resolving to that address were aggregated.
5. The seven-day rolling PPLNS calculation was executed.
6. The matured reward balance satisfied the configured payout requirement.
7. The pool submitted a multi-output `sendmany` transaction.
8. The resolved address received 21,625.23358911 TAR.

This provides production evidence of an operational TNS-to-PPLNS mining-pool settlement path.

---

# End of TIP-0001

**TIP-0001: TARCOIN Name System (TNS-1)**

**Reference implementation audit commit:**

```text
85f90e3ebd3cff8d0012b3671fa5ad9988644c09
```

**Sign-off:**

```text
Tarcoin Core Dev Team
```
