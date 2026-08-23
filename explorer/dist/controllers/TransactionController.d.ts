import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';
export declare class TransactionController {
    private rpc;
    private cache;
    constructor(rpc: RpcClient, cache: CacheManager);
    getByTxid(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    broadcast(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=TransactionController.d.ts.map