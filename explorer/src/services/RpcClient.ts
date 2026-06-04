import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface RpcConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export class RpcClient {
  private client: AxiosInstance;

  constructor(config: RpcConfig) {
    this.client = axios.create({
      baseURL: `http://${config.host}:${config.port}`,
      auth: {
        username: config.username,
        password: config.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async call<T>(method: string, params: any[] = []): Promise<T> {
    try {
      const response = await this.client.post('', {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      });
      return response.data.result;
    } catch (error: any) {
      logger.error(`RPC call failed: ${method}`, error.message);
      throw new Error(`RPC error: ${error.message}`);
    }
  }

  // Blockchain methods
  async getBlockCount(): Promise<number> {
    return this.call('getblockcount');
  }

  async getBlockHash(height: number): Promise<string> {
    return this.call('getblockhash', [height]);
  }

  async getBlock(hash: string, verbosity: number = 1): Promise<any> {
    return this.call('getblock', [hash, verbosity]);
  }

  async getBlockHeader(hash: string): Promise<any> {
    return this.call('getblockheader', [hash]);
  }

  // Transaction methods
  async getRawTransaction(txid: string, verbose: boolean = true): Promise<any> {
    return this.call('getrawtransaction', [txid, verbose ? 1 : 0]);
  }

  async getTxOut(txid: string, n: number, includemempool: boolean = true): Promise<any> {
    return this.call('gettxout', [txid, n, includemempool]);
  }

  // Address methods
  async validateAddress(address: string): Promise<any> {
    return this.call('validateaddress', [address]);
  }

  async getAddressInfo(address: string): Promise<any> {
    return this.call('getaddressinfo', [address]);
  }

  // Mempool methods
  async getRawMempool(verbose: boolean = true): Promise<any> {
    return this.call('getrawmempool', [verbose]);
  }

  async getMempoolInfo(): Promise<any> {
    return this.call('getmempoolinfo');
  }

  // Network methods
  async getNetworkInfo(): Promise<any> {
    return this.call('getnetworkinfo');
  }

  async getBlockchainInfo(): Promise<any> {
    return this.call('getblockchaininfo');
  }

  async getDifficulty(): Promise<number> {
    return this.call('getdifficulty');
  }

  async getNetworkHashrate(): Promise<number> {
    return this.call('getnetworkhashrate');
  }

  // Supply methods
  async getTxOutSetInfo(): Promise<any> {
    return this.call('gettxoutsetinfo');
  }
}