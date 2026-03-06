import { NextRequest, NextResponse } from 'next/server';
import { getChain } from '@/lib/blockchain/Blockchain';
import { getDB } from '@/lib/blockchain/Database';
import { rustChain, isRustBackendEnabled } from '@/lib/blockchain/RustChainClient';

// GET /api/blocks?count=20&index=123
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const index = searchParams.get('index');
  const hash = searchParams.get('hash');
  const count = parseInt(searchParams.get('count') || '20');

  if (isRustBackendEnabled()) {
    try {
      if (index) {
        const block = await rustChain.getBlock(parseInt(index));
        if (!block) return NextResponse.json({ error: 'Block not found' }, { status: 404 });
        return NextResponse.json(block);
      }
      if (hash) {
        const block = await rustChain.getBlockByHash(hash);
        if (!block) return NextResponse.json({ error: 'Block not found' }, { status: 404 });
        return NextResponse.json(block);
      }
      const data = await rustChain.getBlocks({ count });
      return NextResponse.json(data);
    } catch (e) {
      console.error('[blocks] Rust backend unavailable:', e);
      return NextResponse.json({ blocks: [], total: 0 });
    }
  }

  try {
    const chain = getChain();
    const db = getDB();
    if (index) {
      const block = chain.getBlock(parseInt(index));
      if (!block) return NextResponse.json({ error: 'Block not found' }, { status: 404 });
      return NextResponse.json(block);
    }
    if (hash) {
      const block = chain.getBlockByHash(hash);
      if (!block) return NextResponse.json({ error: 'Block not found' }, { status: 404 });
      return NextResponse.json(block);
    }
    const blocks = chain.getRecentBlocks(count);
    return NextResponse.json({
      blocks,
      total: db.getBlockCount(),
    });
  } catch (e) {
    console.error('[blocks] Local chain unavailable:', e);
    return NextResponse.json({ blocks: [], total: 0 });
  }
}
