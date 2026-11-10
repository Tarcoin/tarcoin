# TNS-1 Independent Developer Reproducibility Guide
## Step-by-Step Verification of TIP-0001 & Block #11861 Settlement

This guide provides third-party auditors and developers with the exact steps to independently verify the **TNS-1 Protocol Specification**, replay on-chain mainnet blocks, and audit the **Block #11861** PPLNS settlement.

---

## 1. Environment & Prerequisites

- **Tarcoin Core:** v26+ (compiled from source or official release binary with `-txindex=1`)
- **Runtime:** Node.js v24.0.0+ (native `node:sqlite` and native `fetch` required)
- **Monorepo Audit Commit:** `85f90e3ebd3cff8d0012b3671fa5ad9988644c09`

---

## 2. Setup Tarcoin Core & `tns-service`

### Step 2.1: Start Tarcoin Node with RPC & TxIndex
Ensure `tarcoin.conf` has RPC and transaction indexing enabled:
```ini
server=1
txindex=1
rpcuser=tarcoin
rpcpassword=your_secure_password
rpcport=19332
```
Start `tarcoind` and wait for synchronization:
```bash
./tarcoind -daemon
./tarcoin-cli getblockchaininfo
```

### Step 2.2: Configure & Start `tns-service`
Navigate to the TNS microservice directory:
```bash
cd tns-service
```
Configure your `.env`:
```env
PORT=3005
RPC_HOST=127.0.0.1
RPC_PORT=19332
RPC_USER=tarcoin
RPC_PASSWORD=your_secure_password
```
Start the service:
```bash
node server.js
```
The daemon will initialize `tns.db` in WAL mode and begin indexing from block genesis.

---

## 3. Verifying On-Chain Name Resolution

Query the local REST endpoint to verify that `iamlucky.tar` resolves to the canonical Bech32 payout address:

```bash
curl http://localhost:3005/api/tns/resolve/iamlucky.tar
```

**Expected JSON Response:**
```json
{
  "success": true,
  "domain": "iamlucky.tar",
  "ownerAddress": "tar1qka69hjlnx736nxf3y67lc49y9ym2xlrthrcgya",
  "targetAddress": "tar1qka69hjlnx736nxf3y67lc49y9ym2xlrthrcgya",
  "registeredBlock": 11240,
  "expiresBlock": 63740
}
```

---

## 4. Auditing Block #11861 & PPLNS Settlement

### Step 4.1: Verify Block #11861 on Mainnet
Query the block header and coinbase via `tarcoin-cli`:
```bash
./tarcoin-cli getblock $(./tarcoin-cli getblockhash 11861) 2
```
Verify:
- Block Height: `11861`
- Coinbase Output: `50,000.00000000 TAR`
- Miner: `iamlucky.tar` (worker `nerd1`)

### Step 4.2: Verify Payout Transaction `445100d3...`
Retrieve the decoded payout transaction:
```bash
./tarcoin-cli getrawtransaction "445100d34304ce2099932c2d4eca995685bf3645094f1e5be8f01ecdddf280f2" 1
```

**Auditing the Output Breakdown:**
- Confirm `vout[0]` through `vout[7]` total `49,999.99987110 TAR`.
- Confirm Output #1 pays **`21,625.23358911 TAR`** to:
  ```text
  tar1qka69hjlnx736nxf3y67lc49y9ym2xlrthrcgya
  ```
  *(Matches the TNS resolution of `iamlucky.tar`)*.

---

## 5. Auditing Solo Block #12215 & Solo Mining Coinbase Settlement

In addition to shared PPLNS distribution, TNS-1 natively supports direct Solo Mining via TCP port 3334 (`buildSoloCoinbase`).

### Step 5.1: Verify Solo Block #12215 on Mainnet
Query the block header and coinbase via `tarcoin-cli`:
```bash
./tarcoin-cli getblock $(./tarcoin-cli getblockhash 12215) 2
```
Verify:
- Block Height: `12215`
- Miner Domain: `iamlucky.tar` (Worker: `nerd2`)
- Confirmations: `>= 100` (`matured`)

### Step 5.2: Verify Solo Settlement Transaction `a6af464f...`
Retrieve the decoded settlement transaction:
```bash
./tarcoin-cli getrawtransaction "a6af464ff48f2e28cfb12cb09a5b6347e393e1e27b4f793db78e8858a3edec08" 1
```

**Auditing the Output Breakdown:**
- Confirm solo mining reward: **`49,500.0000495 TAR`** paid directly to:
  ```text
  tar1qka69hjlnx736nxf3y67lc49y9ym2xlrthrcgya
  ```
  *(Matches the TNS resolution of `iamlucky.tar`)*.
- Status: Confirmed (118 Confirmations / Matured).

---

## 6. Reviewing Immutable Evidence Files

The pre-compiled audit logs and explorer records are located in this directory:
- `01_PPLNS/block_11861_payout_log.txt`: Raw server PM2 logs linking `sendmany` to TXID `445100d3...`.
- `02_Explorer_Name_Resolution/`: Confirmed explorer records proving identical balances between `iamlucky.tar` and `tar1qka69h...`.
- `03_PPLNS_Block_Found/`: Block #11861 maturation at 104 confirmations.
- `04_Mining_Worker_Identity/`: Clean PPLNS active miner share table.
- `06_Onchain_Settlement/`: Wallet app inspection and block explorer multi-output receipts.
- `08_Technical_Documentation/TIP-0001.md`: Full specification text.
- `08_Technical_Documentation/TNS_WHITEPAPER.md`: Official Technical Whitepaper v2.0 (Unified Layer-1 Identity Protocol).
- `09_Solo_Mining_Settlement/`: Solo pool dashboard, active solo miners table, block #12215 maturation record (118 confirmations), and wallet application transaction modal verifying TXID `a6af464f...` (+49,500.0000495 TAR).

---

## 7. Deterministic SQLite Replay from Genesis

To verify that the TNS state database is 100% reproducible:
1. Stop the daemon: `pm2 stop tns-service` (or Ctrl+C).
2. Delete the SQLite database: `rm tns.db tns.db-wal tns.db-shm`.
3. Restart `node server.js`.
4. The indexer will replay all blocks from height 0 to the current tip.
5. Re-run `curl http://localhost:3005/api/tns/resolve/iamlucky.tar` and verify the cryptographic result is identical.

— **Tarcoin Core Dev Team**
