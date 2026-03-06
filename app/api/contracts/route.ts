import { NextRequest, NextResponse } from 'next/server';
import { getContractManager, CONTRACT_TEMPLATES, AI_PROMPTS, auditContract } from '@/lib/blockchain/SmartContract';
import { getVM } from '@/lib/blockchain/ContractVM';
import { getChain } from '@/lib/blockchain/Blockchain';

// GET /api/contracts — List all contracts, templates, AI prompts
export async function GET(request: NextRequest) {
  try {
    const mgr = getContractManager();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const addr = searchParams.get('address');

    if (id) {
      const c = mgr.get(id);
      if (!c) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
      return NextResponse.json(c);
    }
    if (addr) {
      const c = mgr.getByAddress(addr);
      if (!c) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
      return NextResponse.json(c);
    }

    return NextResponse.json({
      contracts: mgr.getAll(),
      templates: Object.entries(CONTRACT_TEMPLATES).map(([k, v]) => ({ id: k, ...v })),
      aiPrompts: AI_PROMPTS,
      totalDeployed: mgr.getAll().filter(c => c.status === 'deployed').length,
    });
  } catch (e) {
    console.error('[contracts] GET error:', e);
    return NextResponse.json({
      contracts: [],
      templates: [],
      aiPrompts: [],
      totalDeployed: 0,
    });
  }
}

// POST /api/contracts — Compile, Deploy, or AI Generate
export async function POST(request: NextRequest) {
  try {
    const mgr = getContractManager();
    const body = await request.json().catch(() => ({}));
    const { action } = body;

  // COMPILE
  if (action === 'compile') {
    const { sourceCode } = body;
    if (!sourceCode) return NextResponse.json({ error: 'sourceCode required' }, { status: 400 });
    const result = mgr.compile(sourceCode);
    return NextResponse.json(result);
  }

  // DEPLOY
  if (action === 'deploy') {
    const { sourceCode, name, description, type, owner } = body;
    if (!sourceCode || !name) return NextResponse.json({ error: 'sourceCode and name required' }, { status: 400 });
    const result = mgr.deploy(sourceCode, name, description || '', type || 'custom', owner);
    return NextResponse.json(result);
  }

  // AI GENERATE
  if (action === 'generate') {
    const { prompt } = body;
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });
    const code = mgr.generateWithAI(prompt);
    return NextResponse.json({ success: true, code, prompt });
  }

  // AI AUDIT
  if (action === 'audit') {
    const { sourceCode } = body;
    if (!sourceCode) return NextResponse.json({ error: 'sourceCode required' }, { status: 400 });
    const result = auditContract(sourceCode);
    return NextResponse.json(result);
  }

  // EXECUTE — Call a method on a deployed contract
  if (action === 'execute') {
    const { address, method, args, caller, value, gasLimit, code: runtimeCode } = body;
    if (!address || !method) return NextResponse.json({ error: 'address and method required' }, { status: 400 });

    const contract = mgr.getByAddress(address);
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    if (contract.status !== 'deployed') return NextResponse.json({ error: 'Contract not deployed' }, { status: 400 });

    const vm = getVM();
    const chain = getChain();
    const latestBlock = chain.getLatestBlock();

    // Use provided runtime code, or the contract's sourceCode if it's pure JS
    const execCode = runtimeCode || contract.sourceCode;

    try {
      const result = await vm.execute(
        execCode,
        {
          caller: caller || 'archt:user:anonymous:000000000000',
          method: method,
          args: args || [],
          value: value || 0,
          gasLimit: gasLimit || 3000000,
        },
        {
          storage: contract.storage || {},
          balance: contract.balance || 0,
          owner: contract.owner,
        },
        latestBlock?.index || 0,
        contract.address,
      );

      // If execution succeeded, update contract storage
      if (result.success && Object.keys(result.stateChanges).length > 0) {
        contract.storage = { ...contract.storage, ...result.stateChanges };
        contract.interactions = (contract.interactions || 0) + 1;
      }

      return NextResponse.json({
        success: result.success,
        gasUsed: result.gasUsed,
        returnValue: result.returnValue,
        logs: result.logs,
        stateChanges: result.stateChanges,
        error: result.error,
        executionTime: result.executionTime,
        blockNumber: latestBlock?.index,
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

    return NextResponse.json({ error: 'Invalid action. Use: compile, deploy, generate, audit, execute' }, { status: 400 });
  } catch (e) {
    console.error('[contracts] POST error:', e);
    return NextResponse.json({ error: 'Contracts service unavailable' }, { status: 503 });
  }
}
