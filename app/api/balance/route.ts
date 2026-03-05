import { NextRequest, NextResponse } from 'next/server';
import { rustChain, isRustBackendEnabled } from '@/lib/blockchain/RustChainClient';

// GET /api/balance?address=archt:...
export async function GET(request: NextRequest) {
  if (!isRustBackendEnabled()) {
    return NextResponse.json({ error: 'Balance only available with Rust backend' }, { status: 400 });
  }
  const address = request.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 });
  }
  try {
    const res = await rustChain.getBalance(address);
    return NextResponse.json(res);
  } catch (e) {
    console.error('[balance] Error:', e);
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
  }
}
