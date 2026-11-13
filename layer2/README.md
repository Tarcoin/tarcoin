# Tarcoin Layer-2 (TLN - Tarcoin Lightning Network)

The official Layer-2 off-chain payment network for the Tarcoin blockchain.

## Features
* **Millisecond Settlement:** Transfers execute off-chain in 10–50 ms.
* **Micro-Fees:** Sub-cent transaction costs.
* **L1 Finality:** Anchored to Tarcoin's SHA256d Proof-of-Work blockchain via BIP-141 SegWit & BIP-112 CSV/CLTV smart contracts.
* **Native Invoices:** Standardized `lntar` Bech32 invoice QR codes.

## Port Specifications
* **Tarcoin L1 P2P Port:** `19333`
* **Tarcoin L1 RPC Port:** `19332`
* **Tarcoin L2 Lightning Port:** `19735`

## References
* Specification: [TIP-0002: Tarcoin Lightning Network](../docs/TIP-0002-TLN.md)
