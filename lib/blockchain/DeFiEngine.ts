// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — DeFi Engine
// AMM, lending, yield farming, flash loans
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type PoolType = 'constant_product' | 'weighted' | 'stable' | 'concentrated';

export interface Pool {
  id: string;
  type: PoolType;
  tokenA: string;
  tokenB: string;
  reserveA: number;
  reserveB: number;
  lpToken: string;
  feeBps: number;
  weights?: [number, number];
  amp?: number;
  totalLpSupply: number;
  tvl: number;
  volume24h: number;
  createdAt: number;
}

export interface SwapQuote {
  amountIn: number;
  amountOut: number;
  priceImpact: number;
  fee: number;
  route: string[];
}

export interface LendingMarket {
  id: string;
  token: string;
  totalSupply: number;
  totalBorrow: number;
  reserveFactor: number;
  aprSupply: number;
  aprBorrow: number;
  utilizationRate: number;
  collateralFactor: number;
}

export interface Position {
  owner: string;
  marketId: string;
  supplyAmount: number;
  borrowAmount: number;
  collateralValue: number;
  healthFactor: number;
}

export interface FlashLoan {
  id: string;
  borrower: string;
  token: string;
  amount: number;
  feeBps: number;
  initiator: string;
  blockNumber: number;
  repaid: boolean;
}

// ─────────────────────────────────────────────────────────────
// Constant Product AMM (x * y = k)
// ─────────────────────────────────────────────────────────────

export function constantProductOut(amountIn: number, reserveIn: number, reserveOut: number): number {
  if (reserveIn <= 0 || reserveOut <= 0) return 0;
  const k = reserveIn * reserveOut;
  const newReserveIn = reserveIn + amountIn;
  const newReserveOut = k / newReserveIn;
  return reserveOut - newReserveOut;
}

export function constantProductIn(amountOut: number, reserveIn: number, reserveOut: number): number {
  if (reserveIn <= 0 || reserveOut <= 0) return 0;
  const k = reserveIn * reserveOut;
  const newReserveOut = reserveOut - amountOut;
  if (newReserveOut <= 0) return Infinity;
  const newReserveIn = k / newReserveOut;
  return newReserveIn - reserveIn;
}

export function priceImpact(amountIn: number, amountOut: number, reserveIn: number, reserveOut: number): number {
  const spotPrice = reserveOut / reserveIn;
  const executionPrice = amountOut / amountIn;
  return ((spotPrice - executionPrice) / spotPrice) * 100;
}

// ─────────────────────────────────────────────────────────────
// Weighted Pool (e.g. 80/20)
// ─────────────────────────────────────────────────────────────

export function weightedOut(amountIn: number, reserveIn: number, reserveOut: number, weightIn: number, weightOut: number): number {
  const ratioIn = (reserveIn + amountIn) / reserveIn;
  const term = Math.pow(ratioIn, weightIn / weightOut);
  return reserveOut * (1 - 1 / term);
}

// ─────────────────────────────────────────────────────────────
// DeFi Engine
// ─────────────────────────────────────────────────────────────

export class DeFiEngine {
  private pools: Map<string, Pool> = new Map();
  private markets: Map<string, LendingMarket> = new Map();
  private positions: Map<string, Position> = new Map();
  private flashLoans: Map<string, FlashLoan> = new Map();

  createPool(type: PoolType, tokenA: string, tokenB: string, feeBps = 30, weights?: [number, number]): Pool {
    const id = crypto.createHash('sha256').update(`${tokenA}:${tokenB}:${Date.now()}`).digest('hex').slice(0, 16);
    const pool: Pool = {
      id,
      type,
      tokenA,
      tokenB,
      reserveA: 0,
      reserveB: 0,
      lpToken: `lp_${id}`,
      feeBps,
      weights: weights ?? (type === 'weighted' ? [80, 20] : undefined),
      amp: type === 'stable' ? 100 : undefined,
      totalLpSupply: 0,
      tvl: 0,
      volume24h: 0,
      createdAt: Date.now()
    };
    this.pools.set(id, pool);
    return pool;
  }

  addLiquidity(poolId: string, amountA: number, amountB: number, lpMinted: number): void {
    const pool = this.pools.get(poolId);
    if (!pool) return;
    pool.reserveA += amountA;
    pool.reserveB += amountB;
    pool.totalLpSupply += lpMinted;
    pool.tvl = pool.reserveA + pool.reserveB;
  }

  getSwapQuote(poolId: string, tokenIn: string, amountIn: number): SwapQuote | null {
    const pool = this.pools.get(poolId);
    if (!pool) return null;
    const [reserveIn, reserveOut] = pool.tokenA === tokenIn ? [pool.reserveA, pool.reserveB] : [pool.reserveB, pool.reserveA];
    let amountOut = 0;
    if (pool.type === 'constant_product') amountOut = constantProductOut(amountIn, reserveIn, reserveOut);
    else if (pool.type === 'weighted' && pool.weights) amountOut = weightedOut(amountIn, reserveIn, reserveOut, pool.weights[0], pool.weights[1]);
    else amountOut = constantProductOut(amountIn, reserveIn, reserveOut);
    const fee = amountOut * (pool.feeBps / 10000);
    amountOut -= fee;
    const impact = priceImpact(amountIn, amountOut, reserveIn, reserveOut);
    return { amountIn, amountOut, priceImpact: impact, fee, route: [pool.tokenA, pool.tokenB] };
  }

  executeSwap(poolId: string, tokenIn: string, amountIn: number): SwapQuote | null {
    const quote = this.getSwapQuote(poolId, tokenIn, amountIn);
    if (!quote || quote.amountOut <= 0) return null;
    const pool = this.pools.get(poolId)!;
    if (pool.tokenA === tokenIn) {
      pool.reserveA += amountIn;
      pool.reserveB -= quote.amountOut + quote.fee;
    } else {
      pool.reserveB += amountIn;
      pool.reserveA -= quote.amountOut + quote.fee;
    }
    pool.volume24h += amountIn;
    return quote;
  }

  createLendingMarket(token: string, reserveFactor = 0.1, collateralFactor = 0.8): LendingMarket {
    const id = crypto.createHash('sha256').update(`market:${token}:${Date.now()}`).digest('hex').slice(0, 16);
    const market: LendingMarket = {
      id,
      token,
      totalSupply: 0,
      totalBorrow: 0,
      reserveFactor,
      aprSupply: 0,
      aprBorrow: 0,
      utilizationRate: 0,
      collateralFactor
    };
    this.markets.set(id, market);
    return market;
  }

  supply(marketId: string, user: string, amount: number): void {
    const market = this.markets.get(marketId);
    if (!market) return;
    market.totalSupply += amount;
    market.utilizationRate = market.totalBorrow / market.totalSupply || 0;
    market.aprSupply = market.utilizationRate * 0.9 * 10;
    market.aprBorrow = market.utilizationRate * 1.1 * 15;
    const key = `${user}:${marketId}`;
    const pos = this.positions.get(key) ?? { owner: user, marketId, supplyAmount: 0, borrowAmount: 0, collateralValue: 0, healthFactor: Infinity };
    pos.supplyAmount += amount;
    pos.collateralValue += amount;
    this.positions.set(key, pos);
  }

  borrow(marketId: string, user: string, amount: number): boolean {
    const market = this.markets.get(marketId);
    if (!market) return false;
    const key = `${user}:${marketId}`;
    const pos = this.positions.get(key);
    if (!pos || pos.collateralValue * market.collateralFactor < pos.borrowAmount + amount) return false;
    market.totalBorrow += amount;
    market.utilizationRate = market.totalBorrow / market.totalSupply || 0;
    pos.borrowAmount += amount;
    this.positions.set(key, pos);
    pos.healthFactor = (pos.collateralValue * market.collateralFactor) / pos.borrowAmount;
    return true;
  }

  requestFlashLoan(borrower: string, token: string, amount: number, feeBps = 9): FlashLoan {
    const id = crypto.randomUUID();
    const loan: FlashLoan = { id, borrower, token, amount, feeBps, initiator: borrower, blockNumber: 0, repaid: false };
    this.flashLoans.set(id, loan);
    return loan;
  }

  repayFlashLoan(loanId: string): boolean {
    const loan = this.flashLoans.get(loanId);
    if (!loan) return false;
    loan.repaid = true;
    return true;
  }

  getPools(): Pool[] {
    return Array.from(this.pools.values());
  }

  getMarkets(): LendingMarket[] {
    return Array.from(this.markets.values());
  }

  getPosition(user: string, marketId: string): Position | undefined {
    return this.positions.get(`${user}:${marketId}`);
  }
}

declare global {
  var __defiEngine: DeFiEngine | undefined;
}

export function getDeFiEngine(): DeFiEngine {
  if (!globalThis.__defiEngine) globalThis.__defiEngine = new DeFiEngine();
  return globalThis.__defiEngine;
}
