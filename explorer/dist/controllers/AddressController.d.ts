import { Request, Response } from 'express';
import { RpcClient } from '../services/RpcClient';
import { CacheManager } from '../services/CacheManager';
export declare class AddressController {
    private rpc;
    private cache;
    constructor(rpc: RpcClient, cache: CacheManager);
    getByAddress(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getTransactions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUtxo(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=AddressController.d.ts.map