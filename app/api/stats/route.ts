import { NextResponse } from 'next/server';
import { getChain } from '@/lib/blockchain/Blockchain';
import { getDB } from '@/lib/blockchain/Database';
import { rustChain, isRustBackendEnabled } from '@/lib/blockchain/RustChainClient';

// GET /api/stats — Network statistics + chart data
export async function GET() {
  if (isRustBackendEnabled()) {
    try {
      const data = await rustChain.getChainStats();
      return NextResponse.json(data);
    } catch (e) {
      console.error('[stats] Rust backend unavailable:', e);
      return NextResponse.json({
        txVolume: [],
        isoDistribution: {},
        rwaDistribution: {},
        topAccounts: [],
        uniqueAccounts: 0,
        totalSupply: 100000000,
        circulatingSupply: 0,
        pendingTxCount: 0,
      });
    }
  }
  try {
    const chain = getChain();
    const db = getDB();
    const recentBlocks = chain.getRecentBlocks(20);
    const txVolume = recentBlocks.map((b: any) => ({
      block: b.index,
      txCount: b.transactionCount || 0,
      gasUsed: b.gasUsed,
      timestamp: b.timestamp,
      reward: b.reward,
    }));
    const isoDistribution: Record<string, number> = {};
    const rwaDistribution: Record<string, number> = {};
    const recentTxs = chain.getRecentTransactions(200);
    recentTxs.forEach((tx: any) => {
      const msg = tx.iso20022?.messageType || 'unknown';
      const rwa = tx.iso20022?.rwaType || 'unknown';
      isoDistribution[msg] = (isoDistribution[msg] || 0) + 1;
      rwaDistribution[rwa] = (rwaDistribution[rwa] || 0) + 1;
    });
    const totalAccounts = new Set<string>();
    recentTxs.forEach((tx: any) => {
      totalAccounts.add(tx.from);
      totalAccounts.add(tx.to);
    });
    const validators = chain.validators;
    return NextResponse.json({
      txVolume,
      isoDistribution,
      rwaDistribution,
      topAccounts: [],
      uniqueAccounts: totalAccounts.size,
      totalSupply: 100000000,
      circulatingSupply: db.getBalance(validators[0]?.address || ''),
      pendingTxCount: db.getPendingCount(),
    });
  } catch (e) {
    console.error('[stats] Local chain unavailable:', e);
    return NextResponse.json({
      txVolume: [],
      isoDistribution: {},
      rwaDistribution: {},
      topAccounts: [],
      uniqueAccounts: 0,
      totalSupply: 100000000,
      circulatingSupply: 0,
      pendingTxCount: 0,
    });
  }
}
