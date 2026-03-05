import { NextRequest, NextResponse } from 'next/server';
import { rustChain, isRustBackendEnabled } from '@/lib/blockchain/RustChainClient';

// POST /api/faucet — Sandbox faucet (proxies to Rust)
export async function POST(request: NextRequest) {
  if (!isRustBackendEnabled()) {
    return NextResponse.json({ success: false, error: 'Faucet only available with Rust backend' }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { address, amount } = body;
    if (!address) {
      return NextResponse.json({ success: false, error: 'address required' }, { status: 400 });
    }
    const res = await rustChain.faucet(address, amount);
    return NextResponse.json(res);
  } catch (e) {
    console.error('[faucet] Error:', e);
    return NextResponse.json({ success: false, error: 'Rust backend unavailable' }, { status: 503 });
  }
}
