// Copyright (c) The Bitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or https://opensource.org/license/mit.

#ifndef BITCOIN_CHAINPARAMSSEEDS_H
#define BITCOIN_CHAINPARAMSSEEDS_H
/**
 * List of fixed seed nodes for the TARCOIN network
 * TARCOIN mainnet seeds on port 19333 (0x4B75 in big-endian)
 *
 * Each line contains a BIP155 serialized (networkID, addr, port) tuple.
 * networkID 0x01 = IPv4, length = 0x04 (4 bytes), then 4 IP bytes, then 2 port bytes
 *
 * Port 19333 = 0x4B75 in big-endian hex
 *
 * NOTE: These are TARCOIN-specific seeds on port 19333.
 * Bitcoin seeds (port 8333 = 0x208D) have been removed.
 *
 * Add your TARCOIN node IPs here in BIP155 format:
 * Format for IPv4: 0x01, 0x04, <4 IP bytes>, 0x4B, 0x75
 * Example: IP 1.2.3.4 port 19333 = 0x01, 0x04, 0x01, 0x02, 0x03, 0x04, 0x4B, 0x75
 */
static const uint8_t chainparams_seed_main[] = {
    // TARCOIN mainnet node: seed.tarcoin.org (resolved IP goes here)
    // Format: networkID=0x01(IPv4), len=0x04, IP bytes, port=19333(0x4B75)
    // Add real TARCOIN node IPs below when available.
    // Currently empty - wallet will use DNS seed (seed.tarcoin.org) to find peers.
};

static const uint8_t chainparams_seed_test[] = {
    // TARCOIN testnet - no fixed seeds
};

#endif // BITCOIN_CHAINPARAMSSEEDS_H
