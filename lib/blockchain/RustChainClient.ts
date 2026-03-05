/**
 * 20022Chain — Rust API Client
 * Fetches from Rust backend at localhost:3002 when CHAIN_BACKEND=rust
 */

const RUST_API = process.env.CHAIN_API_URL || 'http://127.0.0.1:3002';
const FETCH_TIMEOUT_MS = 15000;

function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

async function fetchJson<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, RUST_API);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetchWithTimeout(url.toString());
  if (!res.ok) throw new Error(`Rust API error: ${res.status}`);
  return res.json();
}

async function fetchPost<T>(path: string, body: object): Promise<T> {
  const res = await fetchWithTimeout(`${RUST_API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Rust API error: ${res.status}`);
  return res.json();
}

export const rustChain = {
  async getChainOverview() {
    return fetchJson<{
      name: string;
      version: string;
      consensus: string;
      iso20022: boolean;
      status: string;
      chainValid: boolean;
      stats: Record<string, unknown>;
      latestBlock: Record<string, unknown> | null;
    }>('/api/chain');
  },

  async getStats() {
    return fetchJson<{
      totalBlocks: number;
      totalTransactions: number;
      pendingTransactions?: number;
      avgBlockTime: number;
      tps: number;
    }>('/api/chain/stats');
  },

  async getChainStats() {
    return fetchJson<{
      txVolume: Array<{ block: number; txCount: number; gasUsed: number; timestamp: number; reward: number }>;
      isoDistribution: Record<string, number>;
      rwaDistribution: Record<string, number>;
      uniqueAccounts: number;
      totalSupply: number;
      circulatingSupply: number;
      pendingTxCount: number;
    }>('/api/stats');
  },

  async getBlocks(params?: { count?: number; index?: number; hash?: string }) {
    const p: Record<string, string> = {};
    if (params?.count) p.count = String(params.count);
    if (params?.index) p.index = String(params.index);
    if (params?.hash) p.hash = params.hash;
    return fetchJson<{ blocks: unknown[]; total: number } | unknown>('/api/blocks', Object.keys(p).length ? p : undefined);
  },

  async getBlock(index: number) {
    const res = await fetchJson<unknown | { error: string }>('/api/blocks', { index: String(index) });
    if (res && typeof res === 'object' && 'error' in res) return null;
    return res;
  },

  async getBlockByHash(hash: string) {
    const res = await fetchJson<unknown | { error: string }>('/api/blocks', { hash });
    if (res && typeof res === 'object' && 'error' in res) return null;
    return res;
  },

  async getLatestBlock() {
    const res = await fetchJson<{ block: Record<string, unknown> | null }>('/api/chain/latest');
    return res.block;
  },

  async getValidators() {
    return fetchJson<{
      validators: Array<{
        address: string;
        name: string;
        stake: number;
        blocksProduced: number;
        uptime: number;
        region: string;
        isActive: boolean;
        joinedBlock: number;
      }>;
      totalStaked: number;
      activeCount: number;
    }>('/api/validators');
  },

  async getTransactions(params?: { count?: number; hash?: string; address?: string }) {
    const p: Record<string, string> = {};
    if (params?.count) p.count = String(params.count);
    if (params?.hash) p.hash = params.hash || '';
    if (params?.address) p.address = params.address;
    return fetchJson<
      | { transactions: unknown[]; pending?: number; total?: number }
      | { error: string }
      | unknown
    >('/api/transactions', Object.keys(p).length ? p : undefined);
  },

  async getTransaction(hash: string) {
    const res = await fetchJson<unknown | { error: string }>('/api/transactions', { hash });
    if (res && typeof res === 'object' && 'error' in res) return null;
    return res;
  },

  async getISINRegistry() {
    return fetchJson<{ registry: Array<{ isin: string; instrument: string; rwaType: string; issuer: string; jurisdiction: string }> }>('/api/isin');
  },

  async postTransaction(body: { from: string; to: string; amount: number; fee?: number; messageType?: string; rwaType?: string; signature?: string; publicKey?: string }) {
    return fetchPost<{ success: boolean; hash?: string; error?: string }>('/api/transactions', body);
  },

  async getNextNonce(address: string) {
    return fetchJson<{ address: string; nonce: number }>('/api/nonce', { address });
  },

  async faucet(address: string, amount?: number) {
    return fetchPost<{ success: boolean; address: string; amount: number; error?: string }>('/api/faucet', { address, amount: amount ?? 10000 });
  },

  async getBalance(address: string) {
    return fetchJson<{ address: string; balance: number }>('/api/balance', { address });
  },
};

export function isRustBackendEnabled(): boolean {
  return process.env.CHAIN_BACKEND === 'rust';
}

// Backward-compatible alias (avoid React Hook naming false positives in server files)
export const useRustBackend = isRustBackendEnabled;
