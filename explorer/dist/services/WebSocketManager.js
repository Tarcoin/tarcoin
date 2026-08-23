"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = void 0;
const socket_io_1 = require("socket.io");
class WebSocketManager {
    constructor(server) {
        this.blockSubscribers = new Set();
        this.txSubscribers = new Set();
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || 'https://tarcoin.org',
                methods: ['GET', 'POST'],
            },
            transports: ['websocket', 'polling'],
        });
        this.io.on('connection', (socket) => {
            console.log(`WebSocket client connected: ${socket.id}`);
            socket.on('subscribe:blocks', () => {
                this.blockSubscribers.add(socket.id);
                socket.join('blocks');
            });
            socket.on('subscribe:transactions', () => {
                this.txSubscribers.add(socket.id);
                socket.join('transactions');
            });
            socket.on('subscribe:mempool', () => {
                socket.join('mempool');
            });
            socket.on('disconnect', () => {
                this.blockSubscribers.delete(socket.id);
                this.txSubscribers.delete(socket.id);
                console.log(`WebSocket client disconnected: ${socket.id}`);
            });
        });
    }
    broadcastBlock(block) {
        this.io.to('blocks').emit('new-block', block);
    }
    broadcastTransaction(tx) {
        this.io.to('transactions').emit('new-transaction', tx);
    }
    broadcastMempoolUpdate(txid, action) {
        this.io.to('mempool').emit('mempool-update', { txid, action });
    }
    broadcastNetworkStats(stats) {
        this.io.emit('network-stats', stats);
    }
}
exports.WebSocketManager = WebSocketManager;
//# sourceMappingURL=WebSocketManager.js.map