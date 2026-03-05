// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Transaction Mempool
// Priority queue, fee market, replace-by-fee, nonce management
// ═══════════════════════════════════════════════════════════════

import { Transaction } from './Transaction';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface MempoolConfig {
  maxSize: number;
  maxTxPerSender: number;
  minFee: number;
  maxGasPrice: number;
  evictionTarget: number;
}

export interface MempoolStats {
  size: number;
  pendingCount: number;
  bySender: number;
  totalGas: number;
  avgGasPrice: number;
  oldestTx: number;
}

export interface PendingTx {
  tx: Transaction;
  addedAt: number;
  gasPrice: number;
  priority: number;
}

// ─────────────────────────────────────────────────────────────
// Default Config
// ─────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: MempoolConfig = {
  maxSize: 10000,
  maxTxPerSender: 64,
  minFee: 1,
  maxGasPrice: 1e12,
  evictionTarget: 8000
};

// ─────────────────────────────────────────────────────────────
// Mempool
// ─────────────────────────────────────────────────────────────

export class Mempool {
  private txs: Map<string, PendingTx> = new Map();
  private bySender: Map<string, Map<string, PendingTx>> = new Map();
  private byNonce: Map<string, PendingTx[]> = new Map();
  private config: MempoolConfig;

  constructor(config: Partial<MempoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  add(tx: Transaction): { ok: boolean; reason?: string } {
    if (this.txs.has(tx.hash)) return { ok: true };
    if (this.txs.size >= this.config.maxSize) {
      const evicted = this.evictLowest();
      if (!evicted) return { ok: false, reason: 'mempool_full' };
    }
    const sender = tx.from;
    const senderTxs = this.bySender.get(sender) ?? new Map();
    if (senderTxs.size >= this.config.maxTxPerSender) {
      const minNonce = Math.min(...Array.from(senderTxs.values()).map(p => p.tx.nonce));
      if (tx.nonce <= minNonce) return { ok: false, reason: 'sender_limit_reached' };
      this.removeBySender(sender, 1);
    }
    if (tx.fee < this.config.minFee) return { ok: false, reason: 'fee_too_low' };
    const gasPrice = tx.fee / 21000;
    if (gasPrice > this.config.maxGasPrice) return { ok: false, reason: 'gas_price_too_high' };
    const priority = gasPrice * 1000 + tx.timestamp;
    const pending: PendingTx = { tx, addedAt: Date.now(), gasPrice, priority };
    this.txs.set(tx.hash, pending);
    senderTxs.set(tx.hash, pending);
    this.bySender.set(sender, senderTxs);
    const nonceKey = `${sender}:${tx.nonce}`;
    if (!this.byNonce.has(nonceKey)) this.byNonce.set(nonceKey, []);
    this.byNonce.get(nonceKey)!.push(pending);
    return { ok: true };
  }

  remove(hash: string): boolean {
    const pending = this.txs.get(hash);
    if (!pending) return false;
    this.txs.delete(hash);
    const sender = pending.tx.from;
    this.bySender.get(sender)?.delete(hash);
    if (this.bySender.get(sender)?.size === 0) this.bySender.delete(sender);
    const nonceKey = `${sender}:${pending.tx.nonce}`;
    const arr = this.byNonce.get(nonceKey);
    if (arr) {
      const idx = arr.findIndex(p => p.tx.hash === hash);
      if (idx >= 0) arr.splice(idx, 1);
      if (arr.length === 0) this.byNonce.delete(nonceKey);
    }
    return true;
  }

  private removeBySender(sender: string, count: number): void {
    const senderTxs = this.bySender.get(sender);
    if (!senderTxs) return;
    const sorted = Array.from(senderTxs.values()).sort((a, b) => a.tx.nonce - b.tx.nonce);
    for (let i = 0; i < Math.min(count, sorted.length); i++) {
      this.remove(sorted[i].tx.hash);
    }
  }

  private evictLowest(): boolean {
    if (this.txs.size <= this.config.evictionTarget) return true;
    const all = Array.from(this.txs.values()).sort((a, b) => a.priority - b.priority);
    for (const p of all) {
      this.remove(p.tx.hash);
      if (this.txs.size <= this.config.evictionTarget) return true;
    }
    return false;
  }

  get(hash: string): PendingTx | undefined {
    return this.txs.get(hash);
  }

  getBySender(sender: string): PendingTx[] {
    const m = this.bySender.get(sender);
    return m ? Array.from(m.values()).sort((a, b) => a.tx.nonce - b.tx.nonce) : [];
  }

  getNextNonce(sender: string): number {
    const txs = this.getBySender(sender);
    if (txs.length === 0) return 0;
    return Math.max(...txs.map(p => p.tx.nonce)) + 1;
  }

  replaceByFee(tx: Transaction): boolean {
    const existing = this.getBySender(tx.from).find(p => p.tx.nonce === tx.nonce);
    if (!existing) return this.add(tx).ok;
    if (tx.fee <= existing.tx.fee * 1.1) return false;
    this.remove(existing.tx.hash);
    return this.add(tx).ok;
  }

  getPending(limit = 100): PendingTx[] {
    return Array.from(this.txs.values())
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }

  getExecutable(sender: string, currentNonce: number): Transaction[] {
    const txs = this.getBySender(sender).sort((a, b) => a.tx.nonce - b.tx.nonce);
    const out: Transaction[] = [];
    let nonce = currentNonce;
    for (const p of txs) {
      if (p.tx.nonce === nonce) {
        out.push(p.tx);
        nonce++;
      }
    }
    return out;
  }

  getStats(): MempoolStats {
    const all = Array.from(this.txs.values());
    const totalGas = all.reduce((s, p) => s + 21000, 0);
    const avgGasPrice = all.length ? all.reduce((s, p) => s + p.gasPrice, 0) / all.length : 0;
    const oldest = all.length ? Math.min(...all.map(p => p.addedAt)) : 0;
    return {
      size: this.txs.size,
      pendingCount: this.txs.size,
      bySender: this.bySender.size,
      totalGas,
      avgGasPrice,
      oldestTx: oldest
    };
  }

  clear(): void {
    this.txs.clear();
    this.bySender.clear();
    this.byNonce.clear();
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────

declare global {
  var __mempool: Mempool | undefined;
}

export function getMempool(): Mempool {
  if (!globalThis.__mempool) {
    globalThis.__mempool = new Mempool();
  }
  return globalThis.__mempool;
}
