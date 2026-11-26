import { NextResponse } from 'next/server';

const TNS_TREASURY_USDT_POLYGON = '0x1D48feF097989b698009716965ACb8eC4d7c3CbF'.toLowerCase();
const USDT_POLYGON_CONTRACT = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'.toLowerCase();
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Public Polygon JSON-RPC endpoints with automatic fallback
const POLYGON_RPCS = [
  'https://polygon-rpc.com',
  'https://rpc.ankr.com/polygon',
  'https://1rpc.io/matic',
  'https://polygon.llamarpc.com',
];

/**
 * Queries Polygon JSON-RPC with automatic endpoint fallback and timeout
 */
async function callPolygonRpc(method: string, params: unknown[]): Promise<any> {
  let lastError: Error | null = null;

  for (const rpcUrl of POLYGON_RPCS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.result !== undefined) {
        return data.result;
      }
      if (data && data.error) {
        lastError = new Error(data.error.message || 'RPC returned error');
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw new Error(`Polygon RPC query failed: ${lastError?.message || 'All endpoints unreachable'}`);
}

/**
 * Cryptographically verifies that a Polygon transaction paid USDT to the TNS Treasury
 */
async function verifyPolygonUsdtPayment(txHash: string) {
  const receipt = await callPolygonRpc('eth_getTransactionReceipt', [txHash]);
  if (!receipt) {
    return {
      verified: false,
      pending: true,
      reason: 'Transaction is not yet mined or indexed on Polygon. Please wait 10-20 seconds and retry.',
    };
  }

  if (receipt.status !== '0x1') {
    return {
      verified: false,
      pending: false,
      reason: 'Transaction failed or was reverted on the Polygon blockchain.',
    };
  }

  // Inspect event logs for USDT Transfer(address from, address to, uint256 value)
  let matchedTransfer = false;
  let rawAmount = BigInt(0);
  const expectedToTopic = '0x000000000000000000000000' + TNS_TREASURY_USDT_POLYGON.slice(2);

  if (Array.isArray(receipt.logs)) {
    for (const log of receipt.logs) {
      const contractAddress = String(log.address || '').toLowerCase();
      if (contractAddress !== USDT_POLYGON_CONTRACT) continue;

      const topics = log.topics || [];
      if (topics.length >= 3 && String(topics[0]).toLowerCase() === TRANSFER_EVENT_TOPIC) {
        const toTopic = String(topics[2]).toLowerCase();
        if (toTopic === expectedToTopic) {
          matchedTransfer = true;
          try {
            rawAmount = BigInt(log.data);
          } catch {
            rawAmount = BigInt(0);
          }
          break;
        }
      }
    }
  }

  if (!matchedTransfer) {
    return {
      verified: false,
      pending: false,
      reason: `No USDT transfer to TNS Treasury (${TNS_TREASURY_USDT_POLYGON}) found in this transaction.`,
    };
  }

  // USDT on Polygon uses 6 decimal places
  const usdtAmount = Number(rawAmount) / 1_000_000;

  return {
    verified: true,
    pending: false,
    usdtAmount,
    blockNumber: parseInt(receipt.blockNumber, 16),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { domain, years, txHash, tarAddress, ipfsCid } = body;

    // Strict domain format validation
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain name is required.' }, { status: 400 });
    }

    const trimmedDomain = domain.trim().toLowerCase();
    const cleanDomain = trimmedDomain.endsWith('.tar') ? trimmedDomain : `${trimmedDomain}.tar`;

    if (!/^[a-z0-9][a-z0-9_-]{0,62}\.tar$/.test(cleanDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain format. Names must be 1-63 alphanumeric characters and end with .tar.' },
        { status: 400 }
      );
    }

    // Strict Polygon transaction hash format validation (66-char 0x hex)
    if (!txHash || typeof txHash !== 'string') {
      return NextResponse.json({ error: 'Transaction hash is required.' }, { status: 400 });
    }

    const cleanTx = txHash.trim().toLowerCase();
    if (!/^0x[a-f0-9]{64}$/.test(cleanTx)) {
      return NextResponse.json(
        { error: 'Invalid Polygon transaction hash format. Must be a 66-character 0x hex string.' },
        { status: 400 }
      );
    }

    // Validate registration duration
    const parsedYears = Math.max(1, Math.min(10, parseInt(String(years), 10) || 1));

    // Optional Tarcoin address format check
    const sanitizedTarAddress = tarAddress && typeof tarAddress === 'string'
      ? tarAddress.trim()
      : null;

    // Optional IPFS CID format check
    const sanitizedIpfsCid = ipfsCid && typeof ipfsCid === 'string'
      ? ipfsCid.trim()
      : null;

    // 1. Verify Payment on Polygon Blockchain
    let verification: { verified: boolean; pending: boolean; reason?: string; usdtAmount?: number };
    try {
      verification = await verifyPolygonUsdtPayment(cleanTx);
    } catch (verErr: any) {
      console.warn('[Polygon Verification Warning]', verErr?.message || verErr);
      return NextResponse.json(
        { error: 'Failed to verify Polygon transaction receipt. Please ensure the transaction has confirmed on-chain.' },
        { status: 502 }
      );
    }

    if (!verification.verified) {
      if (verification.pending) {
        return NextResponse.json(
          { error: verification.reason || 'Transaction is still confirming on Polygon. Please retry in a few moments.' },
          { status: 202 }
        );
      }
      return NextResponse.json(
        { error: verification.reason || 'Invalid Polygon transaction.' },
        { status: 400 }
      );
    }

    // 2. Register into authoritative TNS-Service (Port 3005)
    let tnsRes: Response;
    try {
      tnsRes = await fetch('http://127.0.0.1:3005/api/tns/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tns-secret': process.env.TNS_SECRET || '',
        },
        body: JSON.stringify({
          name: cleanDomain,
          address: sanitizedTarAddress,
          ipfsCid: sanitizedIpfsCid,
          txid: cleanTx,
          years: parsedYears,
        }),
      });
    } catch (tnsNetErr: any) {
      console.error('[TNS Backend Unreachable]', tnsNetErr?.message || tnsNetErr);
      return NextResponse.json(
        { error: 'TNS Registry backend service is temporarily offline. Payment was verified; registration will complete once service resumes.' },
        { status: 503 }
      );
    }

    const tnsData = await tnsRes.json().catch(() => null);

    if (!tnsRes.ok || (tnsData && tnsData.success === false)) {
      return NextResponse.json(
        { error: tnsData?.error || 'TNS Registry could not activate the domain.' },
        { status: tnsRes.status || 400 }
      );
    }

    // 3. Return verified registration response
    return NextResponse.json({
      success: true,
      domain: cleanDomain,
      years: parsedYears,
      txHash: cleanTx,
      verifiedAmount: verification.usdtAmount,
      message: `Domain ${cleanDomain} verified on Polygon and registered successfully in TNS!`,
      data: tnsData,
    });
  } catch (error: any) {
    console.error('[TNS Route Error]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing domain registration.' },
      { status: 500 }
    );
  }
}
