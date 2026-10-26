import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    
    // Faucet has concluded with the official exchange listing
    return NextResponse.json({ 
      error: 'The bootstrap faucet has officially concluded following the live NestEx exchange listing. All rewards are now allocated to active Proof-of-Work miners.' 
    }, { status: 403 });
  } catch (error: any) {
    console.error('Faucet Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error connecting to Faucet Backend' }, { status: 500 });
  }
}
