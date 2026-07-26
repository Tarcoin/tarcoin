#!/usr/bin/env python3
"""
apply_patch.py — Inserts the TarCoin coin class into electrumx/lib/coins.py

Run once during Docker build:
    python apply_patch.py

This script:
1. Reads electrumx/lib/coins.py
2. Finds the insertion point (before BitcoinTestnet class)
3. Reads the TarCoin class definition from coins_tarcoin.py
4. Inserts it at the correct location
5. Writes the patched coins.py back

Safe to run multiple times — checks if already patched.
"""

import re
import sys
from pathlib import Path

COINS_FILE   = Path("src/electrumx/lib/coins.py")
PATCH_FILE   = Path("coins_tarcoin.py")
MARKER_CLASS = "class TarCoin("
INSERT_BEFORE = "class BitcoinTestnet("


def main():
    if not COINS_FILE.exists():
        print(f"ERROR: {COINS_FILE} not found. Run from electrumx root.", file=sys.stderr)
        sys.exit(1)

    if not PATCH_FILE.exists():
        print(f"ERROR: {PATCH_FILE} not found.", file=sys.stderr)
        sys.exit(1)

    coins_text = COINS_FILE.read_text(encoding="utf-8")

    # Idempotency check — don't apply twice
    if MARKER_CLASS in coins_text:
        print("Patch already applied — TarCoin class found in coins.py. Skipping.")
        return

    # Extract only the class definitions from the patch file
    # (strip module docstring and comments at the top)
    patch_text = PATCH_FILE.read_text(encoding="utf-8")

    # Remove everything before the first 'class TarCoin' line
    class_match = re.search(r'^class TarCoin\(', patch_text, re.MULTILINE)
    if not class_match:
        print("ERROR: Could not find 'class TarCoin(' in patch file.", file=sys.stderr)
        sys.exit(1)
    class_code = patch_text[class_match.start():]

    # Find insertion point in coins.py
    insert_match = re.search(r'^class BitcoinTestnet\(', coins_text, re.MULTILINE)
    if not insert_match:
        # Fallback: append before the last class or at the end of the Bitcoin section
        print("WARNING: BitcoinTestnet not found. Appending TarCoin at end of file.")
        patched = coins_text.rstrip() + "\n\n\n" + class_code + "\n"
    else:
        pos = insert_match.start()
        patched = (
            coins_text[:pos]
            + "\n\n# --- TARCOIN (TAR) ---\n\n"
            + class_code
            + "\n\n"
            + coins_text[pos:]
        )

    COINS_FILE.write_text(patched, encoding="utf-8")
    print(f"SUCCESS: TarCoin and TarCoinTestnet classes inserted into {COINS_FILE}")
    print(f"Insertion point: before '{INSERT_BEFORE}'")


if __name__ == "__main__":
    main()
