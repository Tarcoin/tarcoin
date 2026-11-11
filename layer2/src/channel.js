const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load Layer-2 Configuration
const configPath = path.join(__dirname, '..', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

/**
 * Tarcoin Layer-2 Payment Channel State Engine
 */
class TarcoinChannel {
    constructor(channelId, alicePubkey, bobPubkey, initialCapacity) {
        this.channelId = channelId;
        this.alicePubkey = alicePubkey;
        this.bobPubkey = bobPubkey;
        this.capacity = initialCapacity; // Total locked TAR on L1
        this.aliceBalance = initialCapacity;
        this.bobBalance = 0;
        this.sequence = 0;
        this.stateHistory = [];
    }

    /**
     * Execute an off-chain millisecond state update
     * @param {string} sender 'alice' or 'bob'
     * @param {number} amount TAR amount to transfer
     * @returns {object} Updated state with commitment hash and execution latency
     */
    transfer(sender, amount) {
        const startNs = process.hrtime.bigint();

        if (sender === 'alice') {
            if (this.aliceBalance < amount) throw new Error('Insufficient Alice balance');
            this.aliceBalance -= amount;
            this.bobBalance += amount;
        } else if (sender === 'bob') {
            if (this.bobBalance < amount) throw new Error('Insufficient Bob balance');
            this.bobBalance -= amount;
            this.aliceBalance += amount;
        } else {
            throw new Error('Unknown sender');
        }

        this.sequence += 1;

        // Generate cryptographic commitment hash for this state
        const statePayload = `${this.channelId}:${this.sequence}:${this.aliceBalance}:${this.bobBalance}`;
        const commitmentHash = crypto.createHash('sha256').update(statePayload).digest('hex');

        const endNs = process.hrtime.bigint();
        const latencyMs = Number(endNs - startNs) / 1000000;

        const stateRecord = {
            sequence: this.sequence,
            aliceBalance: this.aliceBalance,
            bobBalance: this.bobBalance,
            commitmentHash,
            latencyMs: latencyMs.toFixed(3)
        };

        this.stateHistory.push(stateRecord);
        return stateRecord;
    }

    /**
     * Generate Bolt-11 style Tarcoin Lightning Invoice
     */
    createInvoice(amount, memo = '') {
        const paymentHash = crypto.randomBytes(32).toString('hex');
        const invoiceString = `${config.lightningHrp}${amount}tar1${paymentHash.slice(0, 24)}`;
        return {
            invoice: invoiceString,
            amount,
            paymentHash,
            memo,
            created: new Date().toISOString()
        };
    }
}

module.exports = { TarcoinChannel, config };

// Self-test if run directly
if (require.main === module) {
    console.log(`[TLN] Initializing Tarcoin Lightning Channel Engine (L1 RPC: ${config.rpcPort}, L1 P2P: ${config.p2pPort})...`);
    const channel = new TarcoinChannel('chan_001', 'tar1q_alice', 'tar1q_bob', 25000);
    console.log(`[TLN] Channel opened with 25,000 TAR locked on Layer-1.`);

    // Perform 3 instant micro-transfers
    const tx1 = channel.transfer('alice', 500);
    console.log(`[TLN] Transfer #1 (500 TAR) -> Latency: ${tx1.latencyMs} ms | Alice: ${tx1.aliceBalance} | Bob: ${tx1.bobBalance}`);

    const tx2 = channel.transfer('alice', 1250);
    console.log(`[TLN] Transfer #2 (1250 TAR) -> Latency: ${tx2.latencyMs} ms | Alice: ${tx2.aliceBalance} | Bob: ${tx2.bobBalance}`);

    const tx3 = channel.transfer('bob', 300);
    console.log(`[TLN] Transfer #3 (300 TAR) -> Latency: ${tx3.latencyMs} ms | Alice: ${tx3.aliceBalance} | Bob: ${tx3.bobBalance}`);

    const invoice = channel.createInvoice(100, 'Coffee Payment');
    console.log(`[TLN] Generated Lightning Invoice: ${invoice.invoice}`);
}
