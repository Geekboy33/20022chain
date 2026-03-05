// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — NFT Engine
// Mint, transfer, marketplace, royalties
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface NFT {
  tokenId: string;
  collectionId: string;
  owner: string;
  metadata: Record<string, unknown>;
  royaltyBps: number;
  royaltyRecipient: string;
  mintedAt: number;
  txHash: string;
}

export interface Collection {
  id: string;
  name: string;
  symbol: string;
  creator: string;
  totalSupply: number;
  royaltyDefaultBps: number;
  mintedAt: number;
}

export interface Listing {
  id: string;
  tokenId: string;
  collectionId: string;
  seller: string;
  price: number;
  token: string;
  status: 'active' | 'sold' | 'cancelled';
  createdAt: number;
  expiresAt?: number;
}

export interface Offer {
  id: string;
  tokenId: string;
  collectionId: string;
  bidder: string;
  amount: number;
  status: 'active' | 'accepted' | 'cancelled';
  createdAt: number;
  expiresAt?: number;
}

// ─────────────────────────────────────────────────────────────
// NFT Engine
// ─────────────────────────────────────────────────────────────

export class NFTEngine {
  private collections: Map<string, Collection> = new Map();
  private nfts: Map<string, NFT> = new Map();
  private listings: Map<string, Listing> = new Map();
  private offers: Map<string, Offer> = new Map();

  createCollection(name: string, symbol: string, creator: string, royaltyBps = 500): Collection {
    const id = crypto.createHash('sha256').update(`${name}:${creator}:${Date.now()}`).digest('hex').slice(0, 16);
    const col: Collection = { id, name, symbol, creator, totalSupply: 0, royaltyDefaultBps: royaltyBps, mintedAt: Date.now() };
    this.collections.set(id, col);
    return col;
  }

  mint(collectionId: string, to: string, metadata: Record<string, unknown>, royaltyBps?: number, txHash = ''): NFT {
    const col = this.collections.get(collectionId);
    if (!col) throw new Error('Collection not found');
    const tokenId = `${collectionId}:${col.totalSupply}`;
    const nft: NFT = {
      tokenId,
      collectionId,
      owner: to,
      metadata,
      royaltyBps: royaltyBps ?? col.royaltyDefaultBps,
      royaltyRecipient: col.creator,
      mintedAt: Date.now(),
      txHash
    };
    this.nfts.set(tokenId, nft);
    col.totalSupply++;
    return nft;
  }

  transfer(tokenId: string, from: string, to: string): boolean {
    const nft = this.nfts.get(tokenId);
    if (!nft || nft.owner !== from) return false;
    nft.owner = to;
    return true;
  }

  list(tokenId: string, seller: string, price: number, token = 'ARCHT', expiresIn?: number): Listing | null {
    const nft = this.nfts.get(tokenId);
    if (!nft || nft.owner !== seller) return null;
    const id = crypto.randomUUID();
    const listing: Listing = {
      id,
      tokenId,
      collectionId: nft.collectionId,
      seller,
      price,
      token,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined
    };
    this.listings.set(id, listing);
    return listing;
  }

  buy(listingId: string, buyer: string): boolean {
    const listing = this.listings.get(listingId);
    if (!listing || listing.status !== 'active') return false;
    if (listing.expiresAt && Date.now() > listing.expiresAt) {
      listing.status = 'cancelled';
      return false;
    }
    const nft = this.nfts.get(listing.tokenId)!;
    nft.owner = buyer;
    listing.status = 'sold';
    return true;
  }

  makeOffer(tokenId: string, bidder: string, amount: number, expiresIn?: number): Offer | null {
    const nft = this.nfts.get(tokenId);
    if (!nft) return null;
    const id = crypto.randomUUID();
    const offer: Offer = {
      id,
      tokenId,
      collectionId: nft.collectionId,
      bidder,
      amount,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined
    };
    this.offers.set(id, offer);
    return offer;
  }

  acceptOffer(offerId: string, owner: string): boolean {
    const offer = this.offers.get(offerId);
    if (!offer || offer.status !== 'active') return false;
    const nft = this.nfts.get(offer.tokenId)!;
    if (nft.owner !== owner) return false;
    nft.owner = offer.bidder;
    offer.status = 'accepted';
    return true;
  }

  getRoyalty(tokenId: string, salePrice: number): { recipient: string; amount: number } {
    const nft = this.nfts.get(tokenId);
    if (!nft) return { recipient: '', amount: 0 };
    const amount = (salePrice * nft.royaltyBps) / 10000;
    return { recipient: nft.royaltyRecipient, amount };
  }

  getNFT(tokenId: string): NFT | undefined {
    return this.nfts.get(tokenId);
  }

  getCollection(id: string): Collection | undefined {
    return this.collections.get(id);
  }

  getListings(collectionId?: string): Listing[] {
    const all = Array.from(this.listings.values()).filter(l => l.status === 'active');
    return collectionId ? all.filter(l => l.collectionId === collectionId) : all;
  }
}

declare global {
  var __nftEngine: NFTEngine | undefined;
}

export function getNFTEngine(): NFTEngine {
  if (!globalThis.__nftEngine) globalThis.__nftEngine = new NFTEngine();
  return globalThis.__nftEngine;
}
