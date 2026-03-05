// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Governance API
// Proposals, voting, treasury
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getGovernanceEngine } from '@/lib/blockchain/GovernanceEngine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') ?? 'overview';
    const engine = getGovernanceEngine();

    if (action === 'overview') {
      const proposals = engine.getProposals();
      const active = proposals.filter(p => p.status === 'active');
      const passed = proposals.filter(p => p.status === 'passed');
      return NextResponse.json({
        success: true,
        data: {
          totalProposals: proposals.length,
          activeCount: active.length,
          passedCount: passed.length,
          treasury: engine.getTreasuryBalance('ARCHT')
        }
      });
    }

    if (action === 'proposals') {
      const status = searchParams.get('status') as 'active' | 'passed' | 'rejected' | undefined;
      return NextResponse.json({ success: true, data: engine.getProposals(status) });
    }

    if (action === 'proposal') {
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ success: false, error: 'Missing id' });
      const p = engine.getProposal(id);
      if (!p) return NextResponse.json({ success: false, error: 'Not found' });
      const votes = engine.getVotes(id);
      return NextResponse.json({ success: true, data: { proposal: p, votes } });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) });
  }
}
