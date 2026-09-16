const { createClient } = require('redis');
const rpc = require('node-bitcoin-rpc');
// Load .env from parent dir just like pool.js usually does
require('dotenv').config({ path: '../.env' }); 

// Adjust these to perfectly match your pool's RPC settings
const RPC_HOST = process.env.RPC_HOST || '127.0.0.1';
const RPC_PORT = process.env.RPC_PORT || 3333; // or whatever port you use
const RPC_USER = process.env.RPC_USER || 'tarcoinrpc';
const RPC_PASS = process.env.RPC_PASS || 'tarcoinpassword';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const REWARD_WALLET = 'ecosystem'; // The wallet account name
const WEEKLY_REWARD = 1000000;
const REQUIRED_UPTIME_DAYS = 6; // Miner needs to be seen on 6 out of 7 days to qualify for 24/7 uptime

rpc.init(RPC_HOST, RPC_PORT, RPC_USER, RPC_PASS);
rpc.setTimeout(30000);

const rpcCall = (method, params = []) => {
  return new Promise((resolve, reject) => {
    rpc.call(method, params, (err, res) => {
      if (err) return reject(err);
      if (res && res.error) return reject(res.error);
      resolve(res.result);
    });
  });
};

async function runPayout() {
  console.log('================================================');
  console.log('🚀 TARCOIN 1 MILLION TAR SUNDAY LOYALTY DROP 🚀');
  console.log('================================================');

  const redis = createClient({ url: REDIS_URL });
  await redis.connect();

  try {
    const keys = await redis.keys('miner:uptime:*');
    console.log(`Found ${keys.length} total miners tracking uptime.`);

    if (keys.length === 0) {
      console.log('No active miners found. Exiting.');
      process.exit(0);
    }

    const eligibleMiners = [];

    // Calculate dates for the last 7 days
    const today = new Date();
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    for (let key of keys) {
      const wallet = key.split(':')[2];
      const activeDays = await redis.smembers(key);
      
      // Count how many of the last 7 days this miner was active
      const activeCount = last7Days.filter(day => activeDays.includes(day)).length;

      if (activeCount >= REQUIRED_UPTIME_DAYS) {
        eligibleMiners.push(wallet);
      }
    }

    console.log(`\n✅ Found ${eligibleMiners.length} eligible miners who maintained 24/7 uptime (>= ${REQUIRED_UPTIME_DAYS} days).`);

    if (eligibleMiners.length === 0) {
      console.log('No miners met the uptime requirement this week.');
      process.exit(0);
    }

    const rewardPerMiner = (WEEKLY_REWARD / eligibleMiners.length).toFixed(8);
    console.log(`💰 Calculating split: 1,000,000 TAR / ${eligibleMiners.length} = ${rewardPerMiner} TAR per miner.`);

    const payoutObj = {};
    for (let miner of eligibleMiners) {
      payoutObj[miner] = parseFloat(rewardPerMiner);
    }

    console.log(`\nExecuting RPC sendmany from account/wallet: ${REWARD_WALLET}...`);
    const txid = await rpcCall('sendmany', [REWARD_WALLET, payoutObj]);

    console.log(`\n🎉 PAYOUT SUCCESSFUL!`);
    console.log(`TXID: ${txid}`);
    console.log('\nUptime sets left intact. The sliding 7-day window will automatically shift for next week.');

  } catch (err) {
    console.error('\n❌ ERROR EXECUTING PAYOUT:', err.message || err);
  } finally {
    await redis.quit();
    process.exit(0);
  }
}

runPayout();
