import { NextResponse } from 'next/server';
import { getChain } from '@/lib/blockchain/Blockchain';
import { rustChain, isRustBackendEnabled } from '@/lib/blockchain/RustChainClient';

// GET /api/validators
export async function GET() {
  if (isRustBackendEnabled()) {
    try {
      const data = await rustChain.getValidators();
      return NextResponse.json(data);
    } catch (e) {
      console.error('[validators] Rust backend unavailable:', e);
    }
  }
  try {
    const chain = getChain();
    return NextResponse.json({
      validators: chain.validators,
      totalStaked: chain.validators.reduce((s, v) => s + v.stake, 0),
      activeCount: chain.validators.filter(v => v.isActive).length,
    });
  } catch (e) {
    console.error('[validators] Local chain unavailable:', e);
    return NextResponse.json({ validators: [], totalStaked: 0, activeCount: 0 });
  }
}
