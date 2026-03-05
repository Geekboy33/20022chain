// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Developer SDK
// Provider abstraction, signers, contract interaction
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface RPCRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown[];
}

export interface RPCResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

export interface Provider {
  request<T>(args: { method: string; params?: unknown[] }): Promise<T>;
}

export interface Signer {
  getAddress(): Promise<string>;
  signMessage(message: string): Promise<string>;
  signTransaction(tx: TransactionRequest): Promise<string>;
}

export interface TransactionRequest {
  from: string;
  to?: string;
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
  nonce?: number;
}

export interface ContractCall {
  to: string;
  data: string;
  value?: bigint;
  gasLimit?: bigint;
}

// ─────────────────────────────────────────────────────────────
// HTTP Provider
// ─────────────────────────────────────────────────────────────

export class HttpProvider implements Provider {
  constructor(private url: string) {}

  async request<T>(args: { method: string; params?: unknown[] }): Promise<T> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: args.method, params: args.params ?? [] })
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result as T;
  }
}

// ─────────────────────────────────────────────────────────────
// Contract Interface
// ─────────────────────────────────────────────────────────────

export class Contract {
  constructor(
    public address: string,
    public abi: Record<string, unknown>[],
    private provider: Provider,
    private signer?: Signer
  ) {}

  async call(method: string, args: unknown[]): Promise<unknown> {
    const fragment = this.abi.find((a: Record<string, unknown>) => a.name === method && a.type === 'function');
    if (!fragment) throw new Error(`Method ${method} not found`);
    const sig = `${method}(${(fragment as { inputs?: { type: string }[] }).inputs?.map((i: { type: string }) => i.type).join(',') ?? ''})`;
    return this.provider.request({ method: 'eth_call', params: [{ to: this.address, data: '0x' + sig }, 'latest'] });
  }

  async estimateGas(method: string, args: unknown[]): Promise<bigint> {
    const data = '0x';
    const result = await this.provider.request<string>({ method: 'eth_estimateGas', params: [{ to: this.address, data }] });
    return BigInt(result);
  }
}

// ─────────────────────────────────────────────────────────────
// Wallet (Signer)
// ─────────────────────────────────────────────────────────────

export class Wallet implements Signer {
  constructor(public address: string, private signFn: (msg: string) => Promise<string>) {}

  async getAddress(): Promise<string> {
    return this.address;
  }

  async signMessage(message: string): Promise<string> {
    return this.signFn(message);
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    const payload = JSON.stringify(tx);
    return this.signFn(payload);
  }
}

// ─────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────

export class ArchTClient {
  constructor(private provider: Provider) {}

  async getBlockNumber(): Promise<number> {
    const hex = await this.provider.request<string>({ method: 'eth_blockNumber' });
    return parseInt(hex ?? '0x0', 16);
  }

  async getBalance(address: string): Promise<bigint> {
    const hex = await this.provider.request<string>({ method: 'eth_getBalance', params: [address, 'latest'] });
    return BigInt(hex ?? '0x0');
  }

  getContract(address: string, abi: Record<string, unknown>[]): Contract {
    return new Contract(address, abi, this.provider);
  }
}
