import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TOTAL_MINTED_SUPPLY = 10717500000;
const MAX_SUPPLY = 50000000000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');
  const accept = req.headers.get('accept') || '';

  // Return plain number if requested by aggregator scraper
  if (format === 'plain' || format === 'text' || accept.includes('text/plain')) {
    return new Response(TOTAL_MINTED_SUPPLY.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  return NextResponse.json({
    total: TOTAL_MINTED_SUPPLY,
    totalSupply: TOTAL_MINTED_SUPPLY,
    maxSupply: MAX_SUPPLY,
    units: 'TAR',
  }, {
    headers: {
      'Cache-Control': 'public, max-age=60',
    },
  });
}
