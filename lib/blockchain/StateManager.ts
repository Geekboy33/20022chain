// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — State Manager
// Trie-backed state with checkpoints and revert
// ═══════════════════════════════════════════════════════════════

import { MerkleTrie } from './MerkleTrie';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface StateCheckpoint {
  id: number;
  root: string;
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────
// State Manager
// ─────────────────────────────────────────────────────────────

export class StateManager {
  private trie: MerkleTrie = new MerkleTrie();
  private checkpoints: StateCheckpoint[] = [];
  private checkpointId = 0;

  get(key: string): Buffer | null {
    return this.trie.get(key);
  }

  put(key: string, value: Buffer): void {
    this.trie.put(key, value);
  }

  delete(key: string): boolean {
    return this.trie.delete(key);
  }

  getRoot(): string {
    return this.trie.getRoot();
  }

  checkpoint(): number {
    this.checkpointId++;
    this.checkpoints.push({
      id: this.checkpointId,
      root: this.getRoot(),
      timestamp: Date.now()
    });
    return this.checkpointId;
  }

  revertToCheckpoint(id: number): boolean {
    const idx = this.checkpoints.findIndex(c => c.id === id);
    if (idx < 0) return false;
    const snap = this.trie.snapshot();
    this.checkpoints = this.checkpoints.slice(0, idx);
    this.trie = MerkleTrie.fromSnapshot(snap);
    return true;
  }

  commit(): void {
    this.checkpoints = [];
  }

  getProof(key: string) {
    return this.trie.getProof(key);
  }
}

declare global {
  var __stateManager: StateManager | undefined;
}

export function getStateManager(): StateManager {
  if (!globalThis.__stateManager) globalThis.__stateManager = new StateManager();
  return globalThis.__stateManager;
}
