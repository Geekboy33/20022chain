#!/usr/bin/env node
/**
 * Verificación rápida de que la blockchain (nodo Rust) está activa.
 * Requiere: nodo 20022chain-rust corriendo en http://127.0.0.1:3002
 *
 * Uso: node scripts/verify-blockchain.js
 *   o: npm run verify-chain
 */

const NODE_URL = process.env.CHAIN_API_URL || 'http://127.0.0.1:3002';

async function check(endpoint, label) {
  const url = `${NODE_URL}${endpoint}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { ok: true, data, label };
  } catch (e) {
    return { ok: false, error: e.message, label };
  }
}

async function main() {
  console.log('Verificando blockchain (nodo Rust)...');
  console.log('URL:', NODE_URL);
  console.log('');

  const [chain, blocks, validators] = await Promise.all([
    check('/api/chain', 'Chain overview'),
    check('/api/blocks?count=5', 'Blocks'),
    check('/api/validators', 'Validators'),
  ]);

  let failed = 0;
  for (const r of [chain, blocks, validators]) {
    if (r.ok) {
      console.log('OK  ', r.label);
      if (r.label === 'Chain overview' && r.data?.stats) {
        const s = r.data.stats;
        console.log('     Blocks:', s.totalBlocks ?? 0, '| Tx:', s.totalTransactions ?? 0, '| Validators:', s.activeValidators ?? 0);
      }
    } else {
      console.log('FAIL', r.label, '-', r.error);
      failed++;
    }
  }

  console.log('');
  if (failed === 0) {
    console.log('Blockchain ACTIVA. Nodo respondiendo correctamente.');
    process.exit(0);
  } else {
    console.log('Blockchain NO conectada. Asegúrate de iniciar el nodo Rust (puerto 3002):');
    console.log('  cd 20022chain-rust && cargo run');
    process.exit(1);
  }
}

main();
