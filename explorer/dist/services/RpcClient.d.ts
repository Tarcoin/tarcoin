interface RpcConfig {
    host: string;
    port: number;
    username: string;
    password: string;
}
export declare class RpcClient {
    private client;
    private nodeDown;
    private lastNodeDownLog;
    constructor(config: RpcConfig);
    call<T>(method: string, params?: any[]): Promise<T>;
    getBlockCount(): Promise<number>;
    getBlockHash(height: number): Promise<string>;
    getBlock(hash: string, verbosity?: number): Promise<any>;
    getBlockHeader(hash: string): Promise<any>;
    getRawTransaction(txid: string, verbose?: boolean): Promise<any>;
    getTxOut(txid: string, n: number, includemempool?: boolean): Promise<any>;
    validateAddress(address: string): Promise<any>;
    getAddressInfo(address: string): Promise<any>;
    getRawMempool(verbose?: boolean): Promise<any>;
    getMempoolInfo(): Promise<any>;
    getNetworkInfo(): Promise<any>;
    getBlockchainInfo(): Promise<any>;
    getDifficulty(): Promise<number>;
    getNetworkHashrate(): Promise<number>;
    getTxOutSetInfo(): Promise<any>;
}
export {};
//# sourceMappingURL=RpcClient.d.ts.map