import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

// FORCE NEXT.JS TO FETCH LIVE DATA EVERY TIME (NO CACHING)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const execAsync = promisify(exec);

export async function GET() {
  try {
    // 1. Fetch the live balance of the faucet wallet
    const { stdout: balStdout } = await execAsync('/usr/local/bin/tarcoin-cli -rpcwallet=faucet getbalance');
    const balance = parseFloat(balStdout.trim());

    // 2. Fetch the transactions
    const { stdout: txStdout } = await execAsync('/usr/local/bin/tarcoin-cli -rpcwallet=faucet listtransactions "*" 10000');
    const transactions = JSON.parse(txStdout);

    // Filter for outgoing transactions and hide the 10,000 TAR internal splits
    const payouts = transactions
      .filter((tx: any) => tx.category === 'send')
      .filter((tx: any) => Math.abs(tx.amount) !== 10000) 
      .sort((a: any, b: any) => b.time - a.time); // Newest first

    return NextResponse.json(
      { success: true, balance, payouts },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error("Failed to fetch ledger or balance:", error);
    
    const errorMessage = error.message || String(error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect to node.', 
      details: errorMessage,
      balance: null,
      payouts: [] 
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  }
}
