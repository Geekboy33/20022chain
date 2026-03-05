// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Event System
// Event indexing, Bloom filters, subscriptions
// ═══════════════════════════════════════════════════════════════

import { createBloomFilter } from './Crypto';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface LogEntry {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  txHash: string;
  logIndex: number;
  removed: boolean;
}

export interface EventSubscription {
  id: string;
  filter: LogFilter;
  callback: (log: LogEntry) => void;
  created: number;
}

export interface LogFilter {
  address?: string | string[];
  topics?: (string | string[] | null)[];
  fromBlock?: number;
  toBlock?: number;
}

// ─────────────────────────────────────────────────────────────
// Event System
// ─────────────────────────────────────────────────────────────

export class EventSystem {
  private bloom = createBloomFilter(4096, 4);
  private logs: LogEntry[] = [];
  private subscriptions: Map<string, EventSubscription> = new Map();

  emit(address: string, topics: string[], data: string, blockNumber: number, txHash: string): LogEntry {
    const log: LogEntry = {
      address,
      topics,
      data,
      blockNumber,
      txHash,
      logIndex: this.logs.length,
      removed: false
    };
    this.logs.push(log);
    this.bloom.add(txHash);
    this.bloom.add(address);
    for (const t of topics) this.bloom.add(t);
    this.notifySubscriptions(log);
    return log;
  }

  private notifySubscriptions(log: LogEntry): void {
    for (const sub of this.subscriptions.values()) {
      if (this.matchesFilter(log, sub.filter)) sub.callback(log);
    }
  }

  private matchesFilter(log: LogEntry, filter: LogFilter): boolean {
    if (filter.address) {
      const addrs = Array.isArray(filter.address) ? filter.address : [filter.address];
      if (!addrs.includes(log.address)) return false;
    }
    if (filter.topics) {
      for (let i = 0; i < filter.topics.length; i++) {
        const t = filter.topics[i];
        if (t === null) continue;
        const topics = Array.isArray(t) ? t : [t];
        if (!topics.includes(log.topics[i] ?? '')) return false;
      }
    }
    if (filter.fromBlock && log.blockNumber < filter.fromBlock) return false;
    if (filter.toBlock && log.blockNumber > filter.toBlock) return false;
    return true;
  }

  subscribe(filter: LogFilter, callback: (log: LogEntry) => void): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.subscriptions.set(id, { id, filter, callback, created: Date.now() });
    return id;
  }

  unsubscribe(id: string): void {
    this.subscriptions.delete(id);
  }

  getLogs(filter: LogFilter, limit = 100): LogEntry[] {
    return this.logs.filter(l => this.matchesFilter(l, filter)).slice(-limit);
  }

  mightContain(topic: string): boolean {
    return this.bloom.contains(topic);
  }

  getLogCount(): number {
    return this.logs.length;
  }
}

declare global {
  var __eventSystem: EventSystem | undefined;
}

export function getEventSystem(): EventSystem {
  if (!globalThis.__eventSystem) globalThis.__eventSystem = new EventSystem();
  return globalThis.__eventSystem;
}
