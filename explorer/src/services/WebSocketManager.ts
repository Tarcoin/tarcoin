import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export class WebSocketManager {
  private io: Server;
  private blockSubscribers: Set<string> = new Set();
  private txSubscribers: Set<string> = new Set();

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'https://tarcoin.org',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket: Socket) => {
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

  broadcastBlock(block: any) {
    this.io.to('blocks').emit('new-block', block);
  }

  broadcastTransaction(tx: any) {
    this.io.to('transactions').emit('new-transaction', tx);
  }

  broadcastMempoolUpdate(txid: string, action: 'added' | 'removed') {
    this.io.to('mempool').emit('mempool-update', { txid, action });
  }

  broadcastNetworkStats(stats: any) {
    this.io.emit('network-stats', stats);
  }
}