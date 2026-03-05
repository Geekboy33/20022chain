import { NextRequest, NextResponse } from 'next/server';
import { getBridge } from '@/lib/blockchain/CrossChainBridge';

export async function GET(req: NextRequest) {
  const bridge = getBridge();
  const { searchParams: sp } = new URL(req.url);
  const action = sp.get('action') || 'overview';

  try {
    if (action === 'overview') {
      return NextResponse.json({
        success: true,
        stats: bridge.getStats(),
        chains: bridge.getChains(),
        protocols: bridge.getProtocols(),
        recentTx: bridge.getRecentTransactions(10),
      });
    }

    if (action === 'chains') {
      return NextResponse.json({ success: true, chains: bridge.getChains() });
    }

    if (action === 'tx') {
      const id = sp.get('id');
      if (id) {
        const tx = bridge.getTransaction(id);
        return tx
          ? NextResponse.json({ success: true, transaction: tx })
          : NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, transactions: bridge.getRecentTransactions(50) });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const bridge = getBridge();
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'bridge') {
      const { sourceChain, destChain, token, amount, sender, receiver } = body;
      if (!sourceChain || !destChain || !token || !amount || !sender || !receiver) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }
      const tx = await bridge.initiateBridge({ sourceChain, destChain, token, amount, sender, receiver });
      return NextResponse.json({ success: true, transaction: tx });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
