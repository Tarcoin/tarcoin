"""
TARCOIN ElectrumX Coin Class — Unit Tests
==========================================
Tests all network parameters against verified values from TARCOIN Core source.

Run:
    cd electrumx-tarcoin
    python -m pytest tests/test_coin_class.py -v

Requirements:
    pip install pytest
    (Run after applying the TARCOIN coin class patch to electrumx/lib/coins.py)
"""

import sys
import pytest

# ---------------------------------------------------------------------------
# Import coin classes after applying the patch
# ---------------------------------------------------------------------------
try:
    from electrumx.lib.coins import TarCoin, TarCoinTestnet
except ImportError:
    pytest.skip(
        "TarCoin class not found. Apply coins_tarcoin.py patch first:\n"
        "  python scripts/apply_patch.py",
        allow_module_level=True,
    )


# ===========================================================================
# TarCoin (mainnet) tests
# ===========================================================================

class TestTarCoinMainnet:

    def setup_method(self):
        self.coin = TarCoin

    def test_coin_name(self):
        assert self.coin.NAME == "TarCoin"

    def test_shortname(self):
        assert self.coin.SHORTNAME == "TAR"

    def test_network(self):
        assert self.coin.NET == "mainnet"

    def test_genesis_hash(self):
        """
        Genesis hash verified by Block #1 Previous Block field on live explorer.
        Source: src/kernel/chainparams.cpp assert line 128
        """
        expected = '0000e37ee7aa8a88d1254ee3fe7c497c8fdaff36b29747eb64d8da68fbd9939e'
        assert self.coin.GENESIS_HASH.replace(' ', '').replace('\n', '') == expected

    def test_p2pkh_prefix(self):
        """
        base58Prefixes[PUBKEY_ADDRESS] = std::vector<unsigned char>(1, 65)
        Prefix byte 65 → addresses starting with 'T'
        """
        assert self.coin.P2PKH_VERBYTE == bytes([65])

    def test_p2sh_prefix(self):
        """
        base58Prefixes[SCRIPT_ADDRESS] = std::vector<unsigned char>(1, 127)
        Prefix byte 127 → addresses starting with 't'
        """
        assert self.coin.P2SH_VERBYTES == [bytes([127])]

    def test_wif_prefix(self):
        """
        base58Prefixes[SECRET_KEY] = std::vector<unsigned char>(1, 128)
        """
        assert self.coin.WIF_BYTE == bytes([128])

    def test_xpub_prefix(self):
        """
        base58Prefixes[EXT_PUBLIC_KEY] = {0x04, 0x88, 0xB2, 0x1E}
        Same as Bitcoin mainnet → produces xpub... keys
        """
        assert self.coin.XPUB_VERBYTES == bytes.fromhex('0488B21E')

    def test_xprv_prefix(self):
        """
        base58Prefixes[EXT_SECRET_KEY] = {0x04, 0x88, 0xAD, 0xE4}
        Same as Bitcoin mainnet → produces xprv... keys
        """
        assert self.coin.XPRV_VERBYTES == bytes.fromhex('0488ADE4')

    def test_bech32_hrp(self):
        """
        bech32_hrp = "tar"
        SegWit addresses: tar1q... (P2WPKH), tar1p... (Taproot)
        """
        assert self.coin.BECH32_HRP == 'tar'

    def test_rpc_port(self):
        """
        CreateBaseChainParams MAIN = 19332
        """
        assert self.coin.RPC_PORT == 19332

    def test_peers_is_list(self):
        assert isinstance(self.coin.PEERS, list)

    def test_tx_count_exists(self):
        assert hasattr(self.coin, 'TX_COUNT')
        assert hasattr(self.coin, 'TX_COUNT_HEIGHT')
        assert hasattr(self.coin, 'TX_PER_BLOCK')

    def test_inherits_from_bitcoin(self):
        """TarCoin must inherit from Bitcoin for correct serializer/deserializer."""
        from electrumx.lib.coins import Bitcoin
        assert issubclass(self.coin, Bitcoin)


# ===========================================================================
# TarCoinTestnet tests
# ===========================================================================

class TestTarCoinTestnet:

    def setup_method(self):
        self.coin = TarCoinTestnet

    def test_network(self):
        assert self.coin.NET == "testnet"

    def test_p2pkh_prefix(self):
        """Testnet: base58Prefixes[PUBKEY_ADDRESS] = std::vector<unsigned char>(1, 111)"""
        assert self.coin.P2PKH_VERBYTE == bytes([111])

    def test_p2sh_prefix(self):
        """Testnet: base58Prefixes[SCRIPT_ADDRESS] = std::vector<unsigned char>(1, 196)"""
        assert self.coin.P2SH_VERBYTES == [bytes([196])]

    def test_wif_prefix(self):
        """Testnet: base58Prefixes[SECRET_KEY] = std::vector<unsigned char>(1, 239)"""
        assert self.coin.WIF_BYTE == bytes([239])

    def test_xpub_prefix(self):
        """Testnet: base58Prefixes[EXT_PUBLIC_KEY] = {0x04, 0x35, 0x87, 0xCF}"""
        assert self.coin.XPUB_VERBYTES == bytes.fromhex('043587CF')

    def test_xprv_prefix(self):
        """Testnet: base58Prefixes[EXT_SECRET_KEY] = {0x04, 0x35, 0x83, 0x94}"""
        assert self.coin.XPRV_VERBYTES == bytes.fromhex('04358394')

    def test_bech32_hrp(self):
        """Testnet: bech32_hrp = "ttar" """
        assert self.coin.BECH32_HRP == 'ttar'

    def test_rpc_port(self):
        """Testnet: CreateBaseChainParams TESTNET = 29332"""
        assert self.coin.RPC_PORT == 29332

    def test_inherits_from_tarcoin(self):
        assert issubclass(self.coin, TarCoin)


# ===========================================================================
# Mainnet vs Testnet isolation tests
# ===========================================================================

class TestNetworkIsolation:

    def test_mainnet_testnet_different_bech32(self):
        """Critical: mainnet and testnet must have different Bech32 HRPs."""
        assert TarCoin.BECH32_HRP != TarCoinTestnet.BECH32_HRP

    def test_mainnet_testnet_different_p2pkh(self):
        """Critical: mainnet and testnet must have different P2PKH prefixes."""
        assert TarCoin.P2PKH_VERBYTE != TarCoinTestnet.P2PKH_VERBYTE

    def test_mainnet_testnet_different_rpc_port(self):
        """Critical: mainnet and testnet must use different RPC ports."""
        assert TarCoin.RPC_PORT != TarCoinTestnet.RPC_PORT

    def test_mainnet_testnet_different_genesis(self):
        """Critical: mainnet and testnet must have different genesis hashes."""
        assert TarCoin.GENESIS_HASH != TarCoinTestnet.GENESIS_HASH

    def test_no_bitcoin_mainnet_leak(self):
        """TARCOIN must not accidentally use Bitcoin mainnet P2PKH prefix (0)."""
        assert TarCoin.P2PKH_VERBYTE != bytes([0])

    def test_no_bitcoin_bech32_leak(self):
        """TARCOIN must not use Bitcoin's 'bc' Bech32 HRP."""
        assert TarCoin.BECH32_HRP != 'bc'
        assert TarCoinTestnet.BECH32_HRP != 'tb'
