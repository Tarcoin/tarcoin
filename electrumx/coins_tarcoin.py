"""
TARCOIN (TAR) coin class for ElectrumX.

All parameters verified directly from TARCOIN Core source code:
  src/kernel/chainparams.cpp
  src/consensus/amount.h
  src/pow.cpp

HOW TO INSTALL
--------------
1. Clone ElectrumX:
     git clone https://github.com/spesmilo/electrumx.git
     cd electrumx

2. Open electrumx/lib/coins.py

3. Find the class:  class BitcoinTestnet(Bitcoin):
   Paste the TarCoin and TarCoinTestnet classes BEFORE that line.

4. Save the file and restart ElectrumX.
"""

# ---------------------------------------------------------------------------
# Add the following two classes to electrumx/lib/coins.py
# ---------------------------------------------------------------------------

class TarCoin(Bitcoin):
    """
    TARCOIN (TAR) — mainnet.

    A Bitcoin Core v31.x fork with:
      - SHA256d Proof-of-Work
      - DarkGravityWave v3 difficulty algorithm
      - Custom address prefixes (T... legacy, tar1q... SegWit)
      - 50 billion TAR max supply
      - 10-minute block time
      - 400,000-block halving interval

    Source: https://github.com/tarcoin
    Website: https://tarcoin.org
    """

    NAME          = "TarCoin"
    SHORTNAME     = "TAR"
    NET           = "mainnet"

    # From src/kernel/chainparams.cpp — genesis.GetHash() assert line 128
    # Confirmed by Block #1 Previous Block field on live explorer
    GENESIS_HASH  = ('0000e37ee7aa8a88d1254ee3fe7c497c'
                     '8fdaff36b29747eb64d8da68fbd9939e')

    # ElectrumX protocol ports
    # 50001 = plaintext TCP (local/internal only)
    # 50002 = SSL/TLS (public-facing)
    PEER_DEFAULT_PORTS = {'t': '50001', 's': '50002'}

    # No public peers yet — will be populated after servers go live
    PEERS = []

    # -----------------------------------------------------------------------
    # Address encoding — from src/kernel/chainparams.cpp
    # -----------------------------------------------------------------------

    # base58Prefixes[PUBKEY_ADDRESS] = std::vector<unsigned char>(1, 65)
    # Results in addresses starting with 'T'
    P2PKH_VERBYTE  = bytes([65])

    # base58Prefixes[SCRIPT_ADDRESS] = std::vector<unsigned char>(1, 127)
    # Results in addresses starting with 't'
    P2SH_VERBYTES  = [bytes([127])]

    # base58Prefixes[SECRET_KEY] = std::vector<unsigned char>(1, 128)
    WIF_BYTE       = bytes([128])

    # base58Prefixes[EXT_PUBLIC_KEY] = {0x04, 0x88, 0xB2, 0x1E}
    # Same as Bitcoin mainnet — produces xpub... keys
    XPUB_VERBYTES  = bytes.fromhex('0488B21E')

    # base58Prefixes[EXT_SECRET_KEY] = {0x04, 0x88, 0xAD, 0xE4}
    # Same as Bitcoin mainnet — produces xprv... keys
    XPRV_VERBYTES  = bytes.fromhex('0488ADE4')

    # bech32_hrp = "tar"
    # SegWit addresses: tar1q... (P2WPKH), tar1p... (Taproot)
    BECH32_HRP     = 'tar'

    # -----------------------------------------------------------------------
    # Network — from src/chainparamsbase.cpp and src/kernel/chainparams.cpp
    # -----------------------------------------------------------------------

    # RPC port (tarcoind JSON-RPC) — from CreateBaseChainParams MAIN = 19332
    RPC_PORT       = 19332

    # P2P port = 19333 — ElectrumX does not use this directly
    # (ElectrumX connects to tarcoind via RPC only)

    # -----------------------------------------------------------------------
    # Chain statistics (update periodically as chain grows)
    # -----------------------------------------------------------------------

    TX_COUNT        = 1000      # Approximate — update after chain grows
    TX_COUNT_HEIGHT = 375       # Current approximate height at launch
    TX_PER_BLOCK    = 1         # Low traffic expected initially

    REORG_LIMIT     = 200       # Standard Bitcoin-compatible reorg limit

    # -----------------------------------------------------------------------
    # Consensus notes
    # -----------------------------------------------------------------------
    # consensus.nSubsidyHalvingInterval = 400000
    # consensus.nPowTargetSpacing = 10 * 60  (600 seconds)
    # consensus.SegwitHeight = 481824
    #
    # IMPORTANT: SegWit (tar1q... addresses) activates at block 481,824.
    # Until that height, only legacy T... addresses are spendable on-chain.
    # ElectrumX will index SegWit outputs but nodes will not relay them.
    #
    # DarkGravityWave v3 is used for difficulty adjustment (not standard
    # 2016-block retarget). ElectrumX does not validate difficulty itself —
    # it delegates all consensus validation to tarcoind via RPC.


class TarCoinTestnet(TarCoin):
    """
    TARCOIN (TAR) — testnet3.

    From src/kernel/chainparams.cpp CTestNetParams:
      nDefaultPort = 29333
      RPC port     = 29332  (from chainparamsbase.cpp)
      bech32_hrp   = "ttar"
    """

    NAME           = "TarCoin Testnet"
    SHORTNAME      = "TAR"
    NET            = "testnet"

    # Testnet genesis hash — not asserted in source, left empty
    # Update if/when testnet is launched
    GENESIS_HASH   = ''

    # base58Prefixes[PUBKEY_ADDRESS] = std::vector<unsigned char>(1, 111)
    # Standard Bitcoin testnet prefix — m/n addresses
    P2PKH_VERBYTE  = bytes([111])

    # base58Prefixes[SCRIPT_ADDRESS] = std::vector<unsigned char>(1, 196)
    P2SH_VERBYTES  = [bytes([196])]

    # base58Prefixes[SECRET_KEY] = std::vector<unsigned char>(1, 239)
    WIF_BYTE       = bytes([239])

    # base58Prefixes[EXT_PUBLIC_KEY] = {0x04, 0x35, 0x87, 0xCF}
    XPUB_VERBYTES  = bytes.fromhex('043587CF')

    # base58Prefixes[EXT_SECRET_KEY] = {0x04, 0x35, 0x83, 0x94}
    XPRV_VERBYTES  = bytes.fromhex('04358394')

    # bech32_hrp = "ttar"
    BECH32_HRP     = 'ttar'

    # RPC port from chainparamsbase.cpp CreateBaseChainParams TESTNET = 29332
    RPC_PORT       = 29332

    PEERS          = []
    TX_COUNT       = 0
    TX_COUNT_HEIGHT = 0
    TX_PER_BLOCK   = 1
