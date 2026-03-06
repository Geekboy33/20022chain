// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — P2P Network Layer
// WebSocket-based peer-to-peer node communication
// Handles: block propagation, tx broadcast, peer discovery, consensus
// ═══════════════════════════════════════════════════════════════

let WebSocket: any, WebSocketServer: any;
try { const ws = require('ws'); WebSocket = ws.WebSocket; WebSocketServer = ws.WebSocketServer; } catch { }
import { getDB } from './Database';

export interface PeerInfo {
  id: string;
  address: string;
  port: number;
  lastSeen: number;
  blockHeight: number;
  version: string;
  latency: number;
  status: 'connected' | 'disconnected' | 'syncing';
}

export interface P2PMessage {
  type: 'BLOCK' | 'TX' | 'PEER_DISCOVERY' | 'SYNC_REQUEST' | 'SYNC_RESPONSE' | 'PING' | 'PONG' | 'HANDSHAKE' | 'CONSENSUS_VOTE';
  payload: any;
  sender: string;
  timestamp: number;
  nonce: number;
}

// ═══════════════════════════════════════════════════
// P2P NODE
// ═══════════════════════════════════════════════════

export class P2PNode {
  private nodeId: string;
  private port: number;
  private server: WebSocketServer | null = null;
  private peers: Map<string, { ws: WebSocket; info: PeerInfo }> = new Map();
  private knownPeers: PeerInfo[] = [];
  private messageHandlers: Map<string, (msg: P2PMessage) => void> = new Map();
  private blockHeight: number = 0;
  private startTime: number = Date.now();
  private messageCount: number = 0;
  private broadcastedBlocks: Set<string> = new Set(); // prevent re-broadcast

  constructor(port: number = 6001) {
    this.port = port;
    this.nodeId = `node-${port}-${Math.random().toString(36).slice(2, 10)}`;
    this.blockHeight = getDB().getBlockCount();
  }

  // ═══════════════════════════════════════════════════
  // START/STOP
  // ═══════════════════════════════════════════════════

  start(): void {
    try {
      this.server = new WebSocketServer({ port: this.port });

      this.server.on('connection', (ws, req) => {
        const peerAddr = req.socket.remoteAddress || 'unknown';
        console.log(`[P2P] Incoming connection from ${peerAddr}`);

        ws.on('message', (data) => {
          try {
            const msg: P2PMessage = JSON.parse(data.toString());
            this.handleMessage(msg, ws);
          } catch { /* ignore malformed */ }
        });

        ws.on('close', () => {
          // Remove peer
          for (const [id, peer] of this.peers) {
            if (peer.ws === ws) {
              peer.info.status = 'disconnected';
              this.peers.delete(id);
              console.log(`[P2P] Peer ${id} disconnected`);
              break;
            }
          }
        });

        // Send handshake
        this.send(ws, {
          type: 'HANDSHAKE',
          payload: {
            nodeId: this.nodeId,
            port: this.port,
            blockHeight: this.blockHeight,
            version: '1.0.0',
            timestamp: Date.now(),
          },
          sender: this.nodeId,
          timestamp: Date.now(),
          nonce: this.messageCount++,
        });
      });

      console.log(`[P2P] Node ${this.nodeId} listening on port ${this.port}`);

      // Start heartbeat
      setInterval(() => this.heartbeat(), 15000);

    } catch (err: any) {
      console.log(`[P2P] Could not start on port ${this.port}: ${err.message}`);
    }
  }

  // ═══════════════════════════════════════════════════
  // CONNECT TO PEER
  // ═══════════════════════════════════════════════════

  connectToPeer(address: string, port: number): void {
    const url = `ws://${address}:${port}`;
    const peerId = `${address}:${port}`;

    if (this.peers.has(peerId)) return;

    try {
      const ws = new WebSocket(url);

      ws.on('open', () => {
        console.log(`[P2P] Connected to peer ${peerId}`);
        this.send(ws, {
          type: 'HANDSHAKE',
          payload: {
            nodeId: this.nodeId,
            port: this.port,
            blockHeight: this.blockHeight,
            version: '1.0.0',
          },
          sender: this.nodeId,
          timestamp: Date.now(),
          nonce: this.messageCount++,
        });
      });

      ws.on('message', (data) => {
        try {
          const msg: P2PMessage = JSON.parse(data.toString());
          this.handleMessage(msg, ws);
        } catch { /* ignore */ }
      });

      ws.on('close', () => {
        const peer = this.peers.get(peerId);
        if (peer) peer.info.status = 'disconnected';
        this.peers.delete(peerId);
      });

      ws.on('error', () => {
        this.peers.delete(peerId);
      });

    } catch { /* connection failed */ }
  }

  // ═══════════════════════════════════════════════════
  // MESSAGE HANDLING
  // ═══════════════════════════════════════════════════

  private handleMessage(msg: P2PMessage, ws: WebSocket): void {
    switch (msg.type) {
      case 'HANDSHAKE': {
        const info: PeerInfo = {
          id: msg.payload.nodeId,
          address: 'localhost',
          port: msg.payload.port,
          lastSeen: Date.now(),
          blockHeight: msg.payload.blockHeight,
          version: msg.payload.version || '1.0.0',
          latency: Date.now() - msg.timestamp,
          status: 'connected',
        };
        this.peers.set(info.id, { ws, info });
        console.log(`[P2P] Handshake with ${info.id} (height: ${info.blockHeight})`);

        // If peer has more blocks, request sync
        if (info.blockHeight > this.blockHeight) {
          this.send(ws, {
            type: 'SYNC_REQUEST',
            payload: { fromBlock: this.blockHeight },
            sender: this.nodeId,
            timestamp: Date.now(),
            nonce: this.messageCount++,
          });
        }
        break;
      }

      case 'BLOCK': {
        const blockHash = msg.payload?.hash;
        if (blockHash && !this.broadcastedBlocks.has(blockHash)) {
          this.broadcastedBlocks.add(blockHash);
          this.blockHeight = Math.max(this.blockHeight, msg.payload?.index || 0);
          // Notify handlers
          const handler = this.messageHandlers.get('BLOCK');
          if (handler) handler(msg);
          // Re-broadcast to other peers
          this.broadcast(msg, msg.sender);
        }
        break;
      }

      case 'TX': {
        const handler = this.messageHandlers.get('TX');
        if (handler) handler(msg);
        // Re-broadcast
        this.broadcast(msg, msg.sender);
        break;
      }

      case 'PING': {
        this.send(ws, {
          type: 'PONG',
          payload: { blockHeight: this.blockHeight },
          sender: this.nodeId,
          timestamp: Date.now(),
          nonce: msg.nonce,
        });
        break;
      }

      case 'PONG': {
        const peer = this.findPeerByWs(ws);
        if (peer) {
          peer.info.lastSeen = Date.now();
          peer.info.latency = Date.now() - msg.timestamp;
          peer.info.blockHeight = msg.payload?.blockHeight || peer.info.blockHeight;
        }
        break;
      }

      case 'PEER_DISCOVERY': {
        // Share known peers
        const peerList = Array.from(this.peers.values()).map(p => ({
          id: p.info.id, address: p.info.address, port: p.info.port,
        }));
        this.send(ws, {
          type: 'PEER_DISCOVERY',
          payload: { peers: peerList },
          sender: this.nodeId,
          timestamp: Date.now(),
          nonce: this.messageCount++,
        });
        break;
      }

      default:
        break;
    }
  }

  // ═══════════════════════════════════════════════════
  // BROADCASTING
  // ═══════════════════════════════════════════════════

  broadcastBlock(blockData: any): void {
    if (this.broadcastedBlocks.has(blockData.hash)) return;
    this.broadcastedBlocks.add(blockData.hash);
    this.blockHeight = Math.max(this.blockHeight, blockData.index || 0);

    const msg: P2PMessage = {
      type: 'BLOCK',
      payload: blockData,
      sender: this.nodeId,
      timestamp: Date.now(),
      nonce: this.messageCount++,
    };
    this.broadcast(msg);
  }

  broadcastTransaction(txData: any): void {
    const msg: P2PMessage = {
      type: 'TX',
      payload: txData,
      sender: this.nodeId,
      timestamp: Date.now(),
      nonce: this.messageCount++,
    };
    this.broadcast(msg);
  }

  private broadcast(msg: P2PMessage, excludeSender?: string): void {
    for (const [id, peer] of this.peers) {
      if (id === excludeSender) continue;
      if (peer.ws.readyState === WebSocket.OPEN) {
        this.send(peer.ws, msg);
      }
    }
  }

  private send(ws: WebSocket, msg: P2PMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  // ═══════════════════════════════════════════════════
  // HEARTBEAT
  // ═══════════════════════════════════════════════════

  private heartbeat(): void {
    this.blockHeight = getDB().getBlockCount();

    for (const [id, peer] of this.peers) {
      if (peer.ws.readyState !== WebSocket.OPEN) {
        peer.info.status = 'disconnected';
        this.peers.delete(id);
        continue;
      }

      this.send(peer.ws, {
        type: 'PING',
        payload: { blockHeight: this.blockHeight },
        sender: this.nodeId,
        timestamp: Date.now(),
        nonce: this.messageCount++,
      });
    }

    // Cleanup old broadcasted blocks (keep last 200)
    if (this.broadcastedBlocks.size > 200) {
      const arr = Array.from(this.broadcastedBlocks);
      arr.slice(0, arr.length - 200).forEach(h => this.broadcastedBlocks.delete(h));
    }
  }

  // ═══════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════

  onMessage(type: string, handler: (msg: P2PMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  // ═══════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════

  getNodeId(): string { return this.nodeId; }
  getPort(): number { return this.port; }
  getPeerCount(): number { return this.peers.size; }
  getUptime(): number { return Date.now() - this.startTime; }
  getBlockHeight(): number { return this.blockHeight; }
  getMessageCount(): number { return this.messageCount; }

  getPeers(): PeerInfo[] {
    return Array.from(this.peers.values()).map(p => p.info);
  }

  getNetworkInfo() {
    return {
      nodeId: this.nodeId,
      port: this.port,
      peers: this.getPeers(),
      peerCount: this.peers.size,
      blockHeight: this.blockHeight,
      uptime: this.getUptime(),
      messageCount: this.messageCount,
      version: '1.0.0',
    };
  }

  private findPeerByWs(ws: WebSocket) {
    for (const peer of this.peers.values()) {
      if (peer.ws === ws) return peer;
    }
    return null;
  }

  destroy(): void {
    for (const peer of this.peers.values()) {
      peer.ws.close();
    }
    this.peers.clear();
    this.server?.close();
  }
}

// ═══════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════

const globalForP2P = globalThis as unknown as { __p2pNode?: P2PNode };

export function getP2PNode(): P2PNode {
  if (!globalForP2P.__p2pNode) {
    const node = new P2PNode(6001);
    node.start();
    globalForP2P.__p2pNode = node;
  }
  return globalForP2P.__p2pNode;
}
