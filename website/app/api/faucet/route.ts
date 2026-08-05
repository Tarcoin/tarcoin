import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Proxy the request server-to-server to the Mining Pool backend (Port 3001)
    // This completely bypasses CORS and HTTPS mixed-content blocks!
    const response = await fetch('http://localhost:3001/api/faucet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Faucet Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error connecting to Faucet Backend' }, { status: 500 });
  }
}
