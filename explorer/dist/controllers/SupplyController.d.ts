import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';
export declare class SupplyController {
    private rpc;
    private cache;
    constructor(rpc: RpcClient, cache: CacheManager);
    getSupply(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getCirculating(req: Request, res: Response): Promise<void>;
    getNetworkStats(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getRichList(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=SupplyController.d.ts.map