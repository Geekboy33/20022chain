import { NextRequest, NextResponse } from 'next/server';
import { getChain } from '@/lib/blockchain/Blockchain';
import { getDB } from '@/lib/blockchain/Database';
import { rustChain, isRustBackendEnabled } from '@/lib/blockchain/RustChainClient';

// POST /api/transactions — Submit transaction (proxies to Rust when CHAIN_BACKEND=rust)
export async function POST(request: NextRequest) {
  if (isRustBackendEnabled()) {
    try {
      const body = await request.json();
      const res = await rustChain.postTransaction(body);
      return NextResponse.json(res);
    } catch (e) {
      console.error('[transactions] POST Rust error:', e);
      return NextResponse.json({ success: false, error: 'Backend unavailable' }, { status: 503 });
    }
  }
  return NextResponse.json({ success: false, error: 'POST only supported with Rust backend' }, { status: 400 });
}

// GET /api/transactions?count=50&hash=tx:...&address=archt:...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get('hash');
  const address = searchParams.get('address');
  const count = parseInt(searchParams.get('count') || '50');

  if (isRustBackendEnabled()) {
    try {
      if (hash) {
        const tx = await rustChain.getTransaction(hash);
        if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        return NextResponse.json(tx);
      }
      const res = await rustChain.getTransactions({ count, address: address || undefined });
      if (res && typeof res === 'object' && 'error' in res) {
        return NextResponse.json(res, { status: 404 });
      }
      const data = res as { transactions: unknown[]; pending?: number; total?: number };
      return NextResponse.json(data);
    } catch (e) {
      console.error('[transactions] Rust backend unavailable:', e);
    }
  }

  try {
    const chain = getChain();
    const db = getDB();
    if (hash) {
      const tx = chain.getTransaction(hash);
      if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      return NextResponse.json(tx);
    }
    if (address) {
      const txs = db.getTransactionsByAddress(address, count);
      return NextResponse.json({ transactions: txs, total: txs.length });
    }
    const txs = chain.getRecentTransactions(count);
    return NextResponse.json({
      transactions: txs,
      pending: db.getPendingCount(),
    });
  } catch (e) {
    console.error('[transactions] Local chain unavailable:', e);
    return NextResponse.json({ transactions: [], pending: 0 });
  }
}
