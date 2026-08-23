import { Server as HttpServer } from 'http';
export declare class WebSocketManager {
    private io;
    private blockSubscribers;
    private txSubscribers;
    constructor(server: HttpServer);
    broadcastBlock(block: any): void;
    broadcastTransaction(tx: any): void;
    broadcastMempoolUpdate(txid: string, action: 'added' | 'removed'): void;
    broadcastNetworkStats(stats: any): void;
}
//# sourceMappingURL=WebSocketManager.d.ts.map