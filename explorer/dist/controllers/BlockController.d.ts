import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';
export declare class BlockController {
    private rpc;
    private cache;
    constructor(rpc: RpcClient, cache: CacheManager);
    getByHash(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getByHeight(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getRecent(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=BlockController.d.ts.map