import { NextResponse } from 'next/server';

/**
 * Proxy domain registration to the internal TNS-1 microservice (Port 3005)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const targetUrl = 'http://127.0.0.1:3005/api/tns/register';
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'TNS Registration service temporarily unavailable', details: err?.message || String(err) },
      { status: 502 }
    );
  }
}
