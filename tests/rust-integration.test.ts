/**
 * Integration tests: Next.js API with Rust backend
 * Run with: CHAIN_BACKEND=rust next dev (and Rust node on 3002)
 */
const RUST_API = process.env.CHAIN_API_URL || 'http://127.0.0.1:3002';

async function fetchOk(path: string) {
  const res = await fetch(`${RUST_API}${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

describe('20022Chain Rust API', () => {
  it('GET /api/chain/stats returns stats', async () => {
    const data = await fetchOk('/api/chain/stats');
    expect(data).toHaveProperty('totalBlocks');
    expect(data).toHaveProperty('totalTransactions');
    expect(data).toHaveProperty('tps');
    expect(typeof data.totalBlocks).toBe('number');
  });

  it('GET /api/chain returns overview', async () => {
    const data = await fetchOk('/api/chain');
    expect(data.name).toBe('20022Chain');
    expect(data.consensus).toBe('Proof-of-Stake');
    expect(data.stats).toBeDefined();
  });

  it('GET /api/validators returns validators', async () => {
    const data = await fetchOk('/api/validators');
    expect(Array.isArray(data.validators)).toBe(true);
    expect(data.totalStaked).toBeGreaterThan(0);
  });

  it('GET /api/blocks returns blocks', async () => {
    const data = await fetchOk('/api/blocks');
    expect(Array.isArray(data.blocks)).toBe(true);
    expect(typeof data.total).toBe('number');
  });

  it('GET /api/transactions returns transactions', async () => {
    const data = await fetchOk('/api/transactions');
    expect(Array.isArray(data.transactions)).toBe(true);
  });

  it('GET /api/isin returns registry', async () => {
    const data = await fetchOk('/api/isin');
    expect(Array.isArray(data.registry)).toBe(true);
  });
});
