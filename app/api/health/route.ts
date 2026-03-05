import { NextResponse } from 'next/server';
import { useRustBackend } from '@/lib/blockchain/RustChainClient';

type CheckResult = {
  ok: boolean;
  status: number | null;
  latencyMs: number;
  error?: string;
};

async function checkUrl(url: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return {
      ok: res.ok,
      status: res.status,
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'unknown error',
    };
  }
}

// GET /api/health
// Unified health endpoint for frontend -> rust node dependency
export async function GET() {
  const rustEnabled = useRustBackend();
  const rustBase = process.env.CHAIN_API_URL || 'http://127.0.0.1:3002';

  const rustChecks = rustEnabled
    ? await Promise.all([
        checkUrl(`${rustBase}/api/chain`),
        checkUrl(`${rustBase}/api/validators`),
        checkUrl(`${rustBase}/api/sync`),
      ])
    : [];

  const rustOk = rustEnabled ? rustChecks.every((x) => x.ok) : true;
  const status = rustOk ? 200 : 503;

  return NextResponse.json(
    {
      ok: rustOk,
      service: '20022chain-frontend',
      timestamp: new Date().toISOString(),
      backend: {
        mode: rustEnabled ? 'rust' : 'local',
        rustBase,
        checks: rustChecks,
        ok: rustOk,
      },
    },
    { status }
  );
}
