import { NextRequest, NextResponse } from 'next/server';
import { rustChain, isRustBackendEnabled } from '@/lib/blockchain/RustChainClient';

// GET /api/nonce?address=archt:...
export async function GET(request: NextRequest) {
  if (!isRustBackendEnabled()) {
    return NextResponse.json({ error: 'Nonce only available with Rust backend' }, { status: 400 });
  }
  const address = request.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 });
  }
  try {
    const res = await rustChain.getNextNonce(address);
    return NextResponse.json(res);
  } catch (e) {
    console.error('[nonce] Error:', e);
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
  }
}
