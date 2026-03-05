// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Analytics Engine
// On-chain indexer, metrics, dashboards
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AddressProfile {
  address: string;
  txCount: number;
  volume: number;
  firstSeen: number;
  lastSeen: number;
  tags: string[];
  contractInteractions: string[];
}

export interface TokenMetrics {
  symbol: string;
  holders: number;
  circulatingSupply: number;
  volume24h: number;
  volume7d: number;
  priceChange24h: number;
  topHolders: { address: string; balance: number }[];
}

export interface ChainMetrics {
  blocksPerDay: number;
  txsPerDay: number;
  avgBlockTime: number;
  gasUsed24h: number;
  activeAddresses24h: number;
  newAddresses24h: number;
}

export interface DeFiMetrics {
  tvl: number;
  volume24h: number;
  uniqueUsers24h: number;
  topPools: { id: string; tvl: number; volume24h: number }[];
}

// ─────────────────────────────────────────────────────────────
// Analytics Engine
// ─────────────────────────────────────────────────────────────

export class AnalyticsEngine {
  private addressProfiles: Map<string, AddressProfile> = new Map();
  private tokenMetrics: Map<string, TokenMetrics> = new Map();
  private chainHistory: ChainMetrics[] = [];
  private defiHistory: DeFiMetrics[] = [];

  indexAddress(address: string, txCount: number, volume: number, tags: string[] = [], contracts: string[] = []): AddressProfile {
    const existing = this.addressProfiles.get(address);
    const now = Date.now();
    const profile: AddressProfile = {
      address,
      txCount: (existing?.txCount ?? 0) + txCount,
      volume: (existing?.volume ?? 0) + volume,
      firstSeen: existing?.firstSeen ?? now,
      lastSeen: now,
      tags: [...new Set([...existing?.tags ?? [], ...tags])],
      contractInteractions: [...new Set([...existing?.contractInteractions ?? [], ...contracts])]
    };
    this.addressProfiles.set(address, profile);
    return profile;
  }

  getAddressProfile(address: string): AddressProfile | undefined {
    return this.addressProfiles.get(address);
  }

  updateTokenMetrics(symbol: string, metrics: Partial<TokenMetrics>): void {
    const existing = this.tokenMetrics.get(symbol) ?? {
      symbol,
      holders: 0,
      circulatingSupply: 0,
      volume24h: 0,
      volume7d: 0,
      priceChange24h: 0,
      topHolders: []
    };
    this.tokenMetrics.set(symbol, { ...existing, ...metrics });
  }

  getTokenMetrics(symbol: string): TokenMetrics | undefined {
    return this.tokenMetrics.get(symbol);
  }

  recordChainMetrics(metrics: ChainMetrics): void {
    this.chainHistory.push(metrics);
    if (this.chainHistory.length > 100) this.chainHistory.shift();
  }

  recordDeFiMetrics(metrics: DeFiMetrics): void {
    this.defiHistory.push(metrics);
    if (this.defiHistory.length > 100) this.defiHistory.shift();
  }

  getChainTrends(): ChainMetrics[] {
    return [...this.chainHistory];
  }

  getDeFiTrends(): DeFiMetrics[] {
    return [...this.defiHistory];
  }
}

declare global {
  var __analyticsEngine: AnalyticsEngine | undefined;
}

export function getAnalyticsEngine(): AnalyticsEngine {
  if (!globalThis.__analyticsEngine) globalThis.__analyticsEngine = new AnalyticsEngine();
  return globalThis.__analyticsEngine;
}
