import { NextRequest, NextResponse } from 'next/server';
import { getOracle } from '@/lib/blockchain/PriceOracle';

// GET /api/oracle — Real-time price feeds
// ?symbol=OVG — Get price for specific token
// ?all=1 — Get all prices
export async function GET(request: NextRequest) {
  const oracle = getOracle();
  const { searchParams } = new URL(request.url);

  const symbol = searchParams.get('symbol');

  if (symbol) {
    const price = oracle.getPrice(symbol);
    if (!price) return NextResponse.json({ error: 'Symbol not found' }, { status: 404 });
    return NextResponse.json(price);
  }

  // Return all prices + reference data
  return NextResponse.json({
    feeds: oracle.getAllPrices(),
    reference: {
      metals: oracle.getMetalPrices(),
      crypto: oracle.getCryptoPrices(),
    },
    lastUpdate: oracle.getLastUpdate(),
    updateFrequency: '30s',
    source: '20022Chain Price Oracle',
  });
}
