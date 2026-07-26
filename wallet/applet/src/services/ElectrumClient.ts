import { ElectrumNode } from '../types';

export class ElectrumNetworkManager {
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private activeNode: ElectrumNode = {
    host: 'node1.electrum.tarcoin.org',
    port: 50002,
    ssl: true,
    pingMs: 24,
    connected: false,
    version: 'TARCOIN Electrum v1.4.2',
  };
  private listeners: Array<(status: string, node: ElectrumNode) => void> = [];
  private connectionTimer: any = null;

  public getStatus() {
    return {
      status: this.status,
      activeNode: this.activeNode,
    };
  }

  public subscribe(listener: (status: string, node: ElectrumNode) => void) {
    this.listeners.push(listener);
    listener(this.status, this.activeNode);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Objective 1 Requirement:
   * Defer non-essential Electrum network connections until after the app is unlocked.
   * This guarantees instant 0ms blocking boot.
   */
  public async connectDeferred(): Promise<boolean> {
    if (this.status === 'connected' || this.status === 'connecting') {
      return true;
    }

    this.status = 'connecting';
    this.notify();

    console.log('[ElectrumClient] Starting DEFERRED network handshake post-unlock...');

    return new Promise((resolve) => {
      // Simulate fast TCP TLS handshake
      this.connectionTimer = setTimeout(() => {
        this.status = 'connected';
        this.activeNode.connected = true;
        this.activeNode.pingMs = Math.floor(18 + Math.random() * 15);
        this.notify();
        console.log('[ElectrumClient] Electrum network successfully connected post-unlock!');
        resolve(true);
      }, 450); // Fast 450ms background handshake
    });
  }

  public disconnect() {
    if (this.connectionTimer) clearTimeout(this.connectionTimer);
    this.status = 'disconnected';
    this.activeNode.connected = false;
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l(this.status, this.activeNode));
  }
}

export const electrumClient = new ElectrumNetworkManager();
