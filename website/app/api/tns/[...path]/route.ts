import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  req: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const subpath = Array.isArray(params.path) ? params.path.join('/') : params.path;
    const url = new URL(req.url);
    const targetUrl = `http://127.0.0.1:3005/api/tns/${subpath}${url.search}`;

    const res = await fetch(targetUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'TNS Service unavailable', details: err.message },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const subpath = Array.isArray(params.path) ? params.path.join('/') : params.path;
    const targetUrl = `http://127.0.0.1:3005/api/tns/${subpath}`;
    const body = await req.json();

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'TNS Service unavailable', details: err.message },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}
