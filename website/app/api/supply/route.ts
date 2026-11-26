import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TOTAL_MINTED_SUPPLY = 10717500000;
const COLD_STORAGE_LOCKED = 9742439000;
const CIRCULATING_SUPPLY = TOTAL_MINTED_SUPPLY - COLD_STORAGE_LOCKED; // ~975,061,000 TAR
const MAX_SUPPLY = 50000000000;

export async function GET(req: NextRequest) {
  return NextResponse.json({
    totalSupply: MAX_SUPPLY,
    totalMinted: TOTAL_MINTED_SUPPLY,
    circulating: CIRCULATING_SUPPLY,
    coldStorageLocked: COLD_STORAGE_LOCKED,
    ecosystemTreasuryAllocation: 10000000000,
    publicMiningSupply: 40000000000,
    units: 'TAR',
    lastUpdated: Date.now(),
  }, {
    headers: {
      'Cache-Control': 'public, max-age=60',
    },
  });
}
