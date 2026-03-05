import { NextRequest, NextResponse } from 'next/server';
import { getP2PNode } from '@/lib/blockchain/P2PNode';
import { getDB } from '@/lib/blockchain/Database';

// GET /api/network — P2P network status
export async function GET() {
  const node = getP2PNode();
  const db = getDB();

  return NextResponse.json({
    node: node.getNetworkInfo(),
    chain: {
      blocks: db.getBlockCount(),
      transactions: db.getTransactionCount(),
      validators: db.getValidators().length,
      isins: db.getISINCount(),
    },
    network: {
      protocol: 'WebSocket',
      version: '1.0.0',
      consensus: 'Proof-of-Stake',
      blockTime: '6s',
      p2pPort: node.getPort(),
    },
  });
}

// POST /api/network — Connect to peer, broadcast tx
export async function POST(request: NextRequest) {
  const node = getP2PNode();
  const body = await request.json();
  const { action } = body;

  if (action === 'connect') {
    const { address, port } = body;
    if (!address || !port) return NextResponse.json({ error: 'address and port required' }, { status: 400 });
    node.connectToPeer(address, port);
    return NextResponse.json({ success: true, message: `Connecting to ${address}:${port}` });
  }

  if (action === 'peers') {
    return NextResponse.json({ peers: node.getPeers() });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
