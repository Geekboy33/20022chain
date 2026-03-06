import { NextRequest, NextResponse } from 'next/server';
import { getChain } from '@/lib/blockchain/Blockchain';
import { rustChain, isRustBackendEnabled } from '@/lib/blockchain/RustChainClient';

// GET /api/isin?q=ARCHT00001&search=gold
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const search = searchParams.get('search');

  if (isRustBackendEnabled()) {
    try {
      const { registry } = await rustChain.getISINRegistry();
      if (q) {
        const entry = registry.find((r) => r.isin === q.toUpperCase());
        if (!entry) return NextResponse.json({ error: 'ISIN not found' }, { status: 404 });
        return NextResponse.json(entry);
      }
      if (search) {
        const results = registry.filter(
          (r) =>
            r.instrument.toLowerCase().includes(search.toLowerCase()) ||
            r.isin.toLowerCase().includes(search.toLowerCase())
        );
        return NextResponse.json({ results, count: results.length });
      }
      return NextResponse.json({
        registry,
        count: registry.length,
        totalMarketCap: 0,
      });
    } catch (e) {
      console.error('[isin] Rust backend unavailable:', e);
      return NextResponse.json({ registry: [], count: 0, totalMarketCap: 0 });
    }
  }

  try {
    const chain = getChain();
    if (q) {
      const entry = chain.getISIN(q.toUpperCase());
      if (!entry) return NextResponse.json({ error: 'ISIN not found' }, { status: 404 });
      return NextResponse.json(entry);
    }
    if (search) {
      const results = chain.searchISIN(search);
      return NextResponse.json({ results, count: results.length });
    }
    const all = chain.getAllISINs();
    return NextResponse.json({
      registry: all,
      count: all.length,
      totalMarketCap: all.reduce((s, e) => s + (e.price * e.circulatingSupply), 0),
    });
  } catch (e) {
    console.error('[isin] Local chain unavailable:', e);
    return NextResponse.json({ registry: [], count: 0, totalMarketCap: 0 });
  }
}
