// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — NFT API
// Collections, NFTs, listings, offers
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getNFTEngine } from '@/lib/blockchain/NFTEngine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') ?? 'overview';
    const engine = getNFTEngine();

    if (action === 'overview') {
      const listings = engine.getListings();
      return NextResponse.json({
        success: true,
        data: {
          activeListings: listings.length,
          totalVolume: 0
        }
      });
    }

    if (action === 'listings') {
      const collectionId = searchParams.get('collectionId');
      return NextResponse.json({ success: true, data: engine.getListings(collectionId ?? undefined) });
    }

    if (action === 'nft') {
      const tokenId = searchParams.get('tokenId');
      if (!tokenId) return NextResponse.json({ success: false, error: 'Missing tokenId' });
      const nft = engine.getNFT(tokenId);
      return NextResponse.json({ success: !!nft, data: nft });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) });
  }
}
