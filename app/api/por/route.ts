import { NextRequest, NextResponse } from 'next/server';
import { getPoR } from '@/lib/blockchain/ChainlinkPoR';

export async function GET(req: NextRequest) {
  const por = getPoR();
  const { searchParams: sp } = new URL(req.url);
  const action = sp.get('action') || 'overview';

  try {
    if (action === 'overview') {
      return NextResponse.json({
        success: true,
        stats: por.getStats(),
        feeds: por.getAllFeeds().map(f => ({ ...f, history: undefined })),  // Omit full history for overview
        recentAttestations: por.getAttestations(undefined, 10),
      });
    }

    if (action === 'feed') {
      const id = sp.get('id');
      if (!id) return NextResponse.json({ success: false, error: 'Feed id required' }, { status: 400 });
      const feed = por.getFeed(id);
      if (!feed) return NextResponse.json({ success: false, error: 'Feed not found' }, { status: 404 });
      return NextResponse.json({
        success: true,
        feed,
        attestations: por.getAttestations(id, 20),
      });
    }

    if (action === 'verify') {
      const feedId = sp.get('feedId');
      if (!feedId) return NextResponse.json({ success: false, error: 'feedId required' }, { status: 400 });
      const result = por.verifyReserve(feedId);
      return NextResponse.json({ success: true, verification: result });
    }

    if (action === 'attestations') {
      const feedId = sp.get('feedId') || undefined;
      const limit = parseInt(sp.get('limit') || '20', 10);
      return NextResponse.json({ success: true, attestations: por.getAttestations(feedId, limit) });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
