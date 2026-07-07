/**
 * TARCOIN Electrum Server Configuration
 * ======================================
 * Default servers the wallet connects to.
 * Users can add custom servers in Settings → Network.
 *
 * Format: { host, ssl (port), tcp (port) }
 *
 * SSL (port 50002) is always preferred over TCP (port 50001).
 */

export const ELECTRUM_SERVERS_MAINNET = [
  {
    host: 'electrum.tarcoin.org',
    ssl: 50002,
    tcp: 50001,
    version: '1.4',
  },
  // Add more servers here as the network grows
  // {
  //   host: 'electrum2.tarcoin.org',
  //   ssl: 50002,
  //   tcp: 50001,
  // },
];

export const ELECTRUM_SERVERS_TESTNET = [
  {
    host: 'testnet-electrum.tarcoin.org',
    ssl: 60002,
    tcp: 60001,
    version: '1.4',
  },
];

// Minimum Electrum protocol version required
export const ELECTRUM_PROTOCOL_VERSION = '1.4';

// Connection timeouts (milliseconds)
export const ELECTRUM_CONNECT_TIMEOUT    = 5000;
export const ELECTRUM_RESPONSE_TIMEOUT   = 30000;
export const ELECTRUM_KEEPALIVE_INTERVAL = 60000;

// Maximum retry attempts before switching server
export const ELECTRUM_MAX_RETRIES = 3;

// Default server (first in the list)
export const DEFAULT_ELECTRUM_SERVER = ELECTRUM_SERVERS_MAINNET[0];
