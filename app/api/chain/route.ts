import { NextResponse } from 'next/server';
import { getChain } from '@/lib/blockchain/Blockchain';
import { rustChain, isRustBackendEnabled } from '@/lib/blockchain/RustChainClient';

const fallbackChainJson = () => ({
  name: '20022Chain',
  version: '1.0.0',
  consensus: 'Proof-of-Stake',
  iso20022: true,
  status: 'mainnet',
  chainValid: false,
  stats: { totalBlocks: 0, totalTransactions: 0, activeValidators: 0, tps: 0, marketCap: 0 },
  latestBlock: null,
});

// GET /api/chain — Chain stats + overview
export async function GET() {
  try {
    if (isRustBackendEnabled()) {
      try {
        const data = await rustChain.getChainOverview();
        return NextResponse.json(data);
      } catch (e) {
        console.error('[chain] Rust backend unavailable:', e);
        return NextResponse.json(fallbackChainJson());
      }
    }
    const chain = getChain();
    const stats = chain.getStats();
    const isValid = chain.isChainValid();
    const latest = chain.getLatestBlock();
    return NextResponse.json({
      name: '20022Chain',
      version: '1.0.0',
      consensus: 'Proof-of-Stake',
      iso20022: true,
      status: 'mainnet',
      chainValid: isValid,
      stats,
      latestBlock: latest,
    });
  } catch (e) {
    console.error('[chain] Local chain unavailable:', e);
    return NextResponse.json(fallbackChainJson());
  }
}
