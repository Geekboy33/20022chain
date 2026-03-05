// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — DeFi API
// Pools, swaps, lending, flash loans
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getDeFiEngine } from '@/lib/blockchain/DeFiEngine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') ?? 'overview';
    const engine = getDeFiEngine();

    if (action === 'overview') {
      const pools = engine.getPools();
      const markets = engine.getMarkets();
      return NextResponse.json({
        success: true,
        data: {
          pools: pools.length,
          markets: markets.length,
          totalTvl: pools.reduce((s, p) => s + p.tvl, 0),
          totalVolume24h: pools.reduce((s, p) => s + p.volume24h, 0)
        }
      });
    }

    if (action === 'pools') {
      return NextResponse.json({ success: true, data: engine.getPools() });
    }

    if (action === 'markets') {
      return NextResponse.json({ success: true, data: engine.getMarkets() });
    }

    if (action === 'quote') {
      const poolId = searchParams.get('poolId');
      const tokenIn = searchParams.get('tokenIn');
      const amountIn = parseFloat(searchParams.get('amountIn') ?? '0');
      if (!poolId || !tokenIn) return NextResponse.json({ success: false, error: 'Missing params' });
      const quote = engine.getSwapQuote(poolId, tokenIn, amountIn);
      return NextResponse.json({ success: !!quote, data: quote });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) });
  }
}
