import axios, { AxiosInstance } from 'axios';
import http from 'http';

// Validate required credentials at import time
if (!process.env.RPC_USER || !process.env.RPC_PASS) {
  throw new Error(
    'RPC_USER and RPC_PASS environment variables are required. ' +
    'Set them in your .env file or environment before starting the API server.'
  );
}

export const RPC_CONFIG = {
  host: process.env.RPC_HOST || '127.0.0.1',
  port: parseInt(process.env.RPC_PORT || '19332'),
  user: process.env.RPC_USER,
  pass: process.env.RPC_PASS,
};

// Keep-alive agent to reuse TCP connections
const keepAliveAgent = new http.Agent({ keepAlive: true, maxSockets: 10 });

const rpcClient: AxiosInstance = axios.create({
  baseURL: `http://${RPC_CONFIG.host}:${RPC_CONFIG.port}`,
  timeout: 15000,
  httpAgent: keepAliveAgent,
  auth: { username: RPC_CONFIG.user!, password: RPC_CONFIG.pass! },
  headers: { 'content-type': 'application/json' },
});

/**
 * Call a TARCOIN node RPC method with optional retry for transient errors.
 * Retries up to 3 times with exponential backoff on connection failures only.
 * RPC-level errors from the node are thrown immediately without retry.
 */
export async function rpcCall(method: string, params: any[] = []): Promise<any> {
  const maxRetries = 3;
  const backoffMs = [100, 400, 1600];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data } = await rpcClient.post('', {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      });
      if (data.error) throw new Error(data.error.message);
      return data.result;
    } catch (err: any) {
      // If this is an RPC-level error (node responded with an error), don't retry
      if (err.response || err.message?.includes('RPC')) {
        throw err;
      }
      // Connection-level error — retry with backoff
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt]));
        continue;
      }
      throw err;
    }
  }
}
