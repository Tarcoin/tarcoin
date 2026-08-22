// Copyright (c) The Bitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or https://opensource.org/license/mit.

#ifndef BITCOIN_CHAINPARAMSSEEDS_H
#define BITCOIN_CHAINPARAMSSEEDS_H
/**
 * List of fixed seed nodes for the TARCOIN network
 *
 * Each line contains a BIP155 serialized (networkID, addr, port) tuple.
 * Port 19333 = 0x4B75 in big-endian hex
 *
 * NOTE: All Bitcoin mainnet fixed seeds (port 8333 = 0x208D) have been removed.
 * TARCOIN uses DNS seed (seed.tarcoin.org) to discover peers instead.
 *
 * To add a TARCOIN node as a fixed seed (IPv4 format):
 * Format: 0x01, 0x04, <byte1>, <byte2>, <byte3>, <byte4>, 0x4B, 0x75
 * Example: IP 1.2.3.4 port 19333 = { 0x01, 0x04, 0x01, 0x02, 0x03, 0x04, 0x4B, 0x75 }
 */

// TARCOIN mainnet fixed seeds
static const uint8_t chainparams_seed_main[] = {
    // VPS-1: 31.70.104.158:19333
    0x01, 0x04, 0x1F, 0x46, 0x68, 0x9E, 0x4B, 0x75,
    // VPS-2: 66.175.236.170:19333
    0x01, 0x04, 0x42, 0xAF, 0xEC, 0xAA, 0x4B, 0x75,
};

// TARCOIN testnet fixed seeds - empty
static const uint8_t chainparams_seed_test[] = {
    // No testnet seeds
};

// TARCOIN testnet4 fixed seeds - empty
static const uint8_t chainparams_seed_testnet4[] = {
    // No testnet4 seeds
};

// TARCOIN signet fixed seeds - empty
static const uint8_t chainparams_seed_signet[] = {
    // No signet seeds
};

#endif // BITCOIN_CHAINPARAMSSEEDS_H
