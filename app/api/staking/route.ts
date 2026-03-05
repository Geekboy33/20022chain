// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Staking API
// Validators, delegations, rewards
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getStakingEngine } from '@/lib/blockchain/StakingEngine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') ?? 'overview';
    const engine = getStakingEngine();

    if (action === 'overview') {
      const validators = engine.getValidators();
      const totalStaked = engine.getTotalStaked();
      return NextResponse.json({
        success: true,
        data: {
          validatorsCount: validators.length,
          totalStaked,
          activeValidators: validators.filter(v => v.status === 'active').length
        }
      });
    }

    if (action === 'validators') {
      return NextResponse.json({ success: true, data: engine.getValidators() });
    }

    if (action === 'validator') {
      const address = searchParams.get('address');
      if (!address) return NextResponse.json({ success: false, error: 'Missing address' });
      const v = engine.getValidator(address);
      return NextResponse.json({ success: !!v, data: v });
    }

    if (action === 'delegation') {
      const delegator = searchParams.get('delegator');
      const validator = searchParams.get('validator');
      if (!delegator || !validator) return NextResponse.json({ success: false, error: 'Missing params' });
      const d = engine.getDelegation(delegator, validator);
      return NextResponse.json({ success: !!d, data: d });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) });
  }
}
