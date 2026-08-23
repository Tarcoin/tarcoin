import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';
export declare class SearchController {
    private rpc;
    private cache;
    constructor(rpc: RpcClient, cache: CacheManager);
    search(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=SearchController.d.ts.map