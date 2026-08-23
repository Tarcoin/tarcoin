import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';
export declare class MempoolController {
    private rpc;
    private cache;
    constructor(rpc: RpcClient, cache: CacheManager);
    getAll(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getStats(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=MempoolController.d.ts.map