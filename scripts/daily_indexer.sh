#!/bin/bash

# --- CONFIGURATION ---
OUTPUT_JSON="/root/website/public/richlist.json"
STANDALONE_JSON="/root/website/.next/standalone/public/richlist.json"
TREASURY_ADDRESS="tar1qn56jedak2gzxmaukh94cz0sampnhydnk3n3tah"
FAUCET_ADDRESS="tar1q9r9q9pypn3h5yccwa0nuzff4e0af9rawdetwh8"
POOL_MAIN_ADDRESS="tar1qphshh7hzrx259th7ymeaergt6365wh33xn3lq7"
EXPLORER_API="http://127.0.0.1:4000/api"
VPS2_IP="66.175.236.170"
TOP_N=100
# ---------------------

echo "Starting Daily Rich List Indexer (Full Blockchain Scan Mode)..."

# Step 1: Get current block height
BLOCKCOUNT=$(tarcoin-cli getblockcount)
echo "Scanning $BLOCKCOUNT blocks for all coinbase addresses..."

# Step 2: Scan EVERY block and collect ALL coinbase recipient addresses using Python JSON parsing
TMP_ADDRESSES=$(mktemp)

for i in $(seq 1 $BLOCKCOUNT); do
    BLOCKHASH=$(tarcoin-cli getblockhash $i)

    # Get full block data (verbosity 2) and parse ALL recipient addresses with Python
    ADDRESSES_IN_BLOCK=$(tarcoin-cli getblock "$BLOCKHASH" 2 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    seen = set()
    for tx in d.get('tx', []):
        for vout in tx.get('vout', []):
            spk = vout.get('scriptPubKey', {})
            addr = spk.get('address') or (spk.get('addresses') or [None])[0]
            if addr and addr not in seen:
                seen.add(addr)
                print(addr)
except:
    pass
" 2>/dev/null)

    if [ -n "$ADDRESSES_IN_BLOCK" ]; then
        echo "$ADDRESSES_IN_BLOCK" >> "$TMP_ADDRESSES"
    fi

    # Show progress every 200 blocks
    if [ $((i % 200)) -eq 0 ]; then
        echo "  Scanned $i / $BLOCKCOUNT blocks..."
    fi
done

echo "Block scan complete!"

# Step 3: Also add all Redis miner addresses from VPS1
echo "Adding VPS1 pool miner addresses from Redis..."
redis-cli keys "miner:lifetime:*" | sed 's/miner:lifetime://g' >> "$TMP_ADDRESSES"

# Step 4: Add VPS2 Redis addresses via SSH
echo "Adding VPS2 pool miner addresses via SSH..."
VPS2_KEYS=$(ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$VPS2_IP \
    "redis-cli keys 'miner:lifetime:*'" 2>/dev/null | sed 's/miner:lifetime://g')
[ -n "$VPS2_KEYS" ] && echo "$VPS2_KEYS" >> "$TMP_ADDRESSES"

# Step 5: Deduplicate - remove treasury, faucet, pool main, and empty lines
ALL_ADDRESSES=$(sort -u "$TMP_ADDRESSES" | grep -v '^$' | grep -v "^$TREASURY_ADDRESS$" | grep -v "^$FAUCET_ADDRESS$" | grep -v "^$POOL_MAIN_ADDRESS$")
rm "$TMP_ADDRESSES"

TOTAL=$(echo "$ALL_ADDRESSES" | wc -l)
echo "Total unique addresses to query: $TOTAL"

# Step 6: Query real blockchain balance for each unique address
TMP_BALANCES=$(mktemp)

while IFS= read -r address; do
    [ -z "$address" ] && continue

    RESPONSE=$(curl -s --max-time 30 "$EXPLORER_API/address/$address")

    # Parse balance with Python for reliability
    balance=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    b = d.get('balance', 0)
    if b and float(b) > 0:
        print(float(b))
except:
    pass
" 2>/dev/null)

    if [ -n "$balance" ]; then
        echo "$balance $address" >> "$TMP_BALANCES"
        echo "  ✓ $address -> $balance TAR"
    fi

done <<< "$ALL_ADDRESSES"

# Step 7: Sort by balance highest first
SORTED=$(sort -rn "$TMP_BALANCES")
rm "$TMP_BALANCES"

if [ -z "$SORTED" ]; then
    echo "ERROR: No balances found. Check explorer API is running."
    exit 1
fi

# Step 8: Build JSON
echo "Building JSON..."
JSON_OUTPUT="{\"updated_at\":$(date +%s),\"top_addresses\":["

rank=1
first=true
while IFS=' ' read -r balance address; do
    [ $rank -gt $TOP_N ] && break
    [ "$first" = true ] && first=false || JSON_OUTPUT+=","
    JSON_OUTPUT+="{\"rank\":$rank,\"address\":\"$address\",\"balance\":$balance}"
    rank=$((rank + 1))
done <<< "$SORTED"

JSON_OUTPUT+="]}"

# Step 9: Save to VPS1
echo "$JSON_OUTPUT" > "$OUTPUT_JSON"
cp "$OUTPUT_JSON" "$STANDALONE_JSON" 2>/dev/null
echo "Saved to VPS1!"

# Step 10: Push to VPS2
echo "Pushing to VPS2..."
scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
    "$OUTPUT_JSON" root@$VPS2_IP:/root/website/public/richlist.json 2>/dev/null
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$VPS2_IP \
    "cp /root/website/public/richlist.json /root/website/.next/standalone/public/richlist.json" 2>/dev/null
echo "VPS2 synced!"

echo "Rich List complete! Total ranked: $((rank - 1)) addresses"
