import { NextRequest, NextResponse } from 'next/server';
import { getContractManager } from '@/lib/blockchain/SmartContract';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const mgr = getContractManager();
  const decoded = decodeURIComponent(address);
  const contract = mgr.getByAddress(decoded);
  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  return NextResponse.json(contract);
}
