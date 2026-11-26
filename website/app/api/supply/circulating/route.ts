import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TOTAL_MINTED_SUPPLY = 10717500000;
const COLD_STORAGE_LOCKED = 9742439000;
const CIRCULATING_SUPPLY = TOTAL_MINTED_SUPPLY - COLD_STORAGE_LOCKED; // ~975,061,000 TAR

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');
  const accept = req.headers.get('accept') || '';

  // Return plain number if requested by aggregator scraper (CoinMarketCap / CoinGecko standard)
  if (format === 'plain' || format === 'text' || accept.includes('text/plain')) {
    return new Response(CIRCULATING_SUPPLY.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  return NextResponse.json({
    circulating: CIRCULATING_SUPPLY,
    circulatingSupply: CIRCULATING_SUPPLY,
    totalMinted: TOTAL_MINTED_SUPPLY,
    coldStorageLocked: COLD_STORAGE_LOCKED,
    maxSupply: 50000000000,
    units: 'TAR',
  }, {
    headers: {
      'Cache-Control': 'public, max-age=60',
    },
  });
}
