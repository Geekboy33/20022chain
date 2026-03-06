// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Smart Contract Virtual Machine
// Real contract execution in isolated sandbox
// Supports: state management, token operations, RWA functions
// ═══════════════════════════════════════════════════════════════

let ivm: any;
try { ivm = require('isolated-vm'); } catch { ivm = null; }

export interface ContractState {
  storage: Record<string, any>;
  balance: number;
  owner: string;
}

export interface ExecutionResult {
  success: boolean;
  gasUsed: number;
  returnValue?: any;
  logs: string[];
  stateChanges: Record<string, any>;
  error?: string;
  executionTime: number;
}

export interface ContractCall {
  caller: string;
  method: string;
  args: any[];
  value: number;    // ARCHT sent with call
  gasLimit: number;
}

// ═══════════════════════════════════════════════════
// CONTRACT RUNTIME (injected into sandbox)
// ═══════════════════════════════════════════════════

const CONTRACT_RUNTIME = `
  // Global contract state accessible to contract code
  const __state = JSON.parse(__initialState);
  const __logs = [];
  const __stateChanges = {};
  let __gasUsed = 0;

  // Gas metering
  function useGas(amount) {
    __gasUsed += amount;
    if (__gasUsed > __gasLimit) throw new Error('OUT_OF_GAS');
  }

  // Storage API
  const storage = {
    get(key) { useGas(200); return __state.storage[key]; },
    set(key, value) { useGas(5000); __state.storage[key] = value; __stateChanges[key] = value; },
    has(key) { useGas(200); return key in __state.storage; },
    delete(key) { useGas(5000); delete __state.storage[key]; __stateChanges[key] = undefined; },
  };

  // Blockchain context
  const msg = {
    sender: __caller,
    value: __value,
  };

  const block = {
    timestamp: Date.now(),
    number: __blockNumber,
  };

  const contract = {
    address: __contractAddress,
    balance: __state.balance + __value,
    owner: __state.owner,
  };

  // Token standard (ERC-20 like)
  const token = {
    name() { useGas(100); return storage.get('_tokenName') || ''; },
    symbol() { useGas(100); return storage.get('_tokenSymbol') || ''; },
    totalSupply() { useGas(100); return storage.get('_totalSupply') || 0; },
    balanceOf(addr) { useGas(200); return storage.get('_balance_' + addr) || 0; },
    transfer(to, amount) {
      useGas(20000);
      const from = msg.sender;
      const fromBal = storage.get('_balance_' + from) || 0;
      if (fromBal < amount) throw new Error('INSUFFICIENT_BALANCE');
      storage.set('_balance_' + from, fromBal - amount);
      storage.set('_balance_' + to, (storage.get('_balance_' + to) || 0) + amount);
      emit('Transfer', { from, to, amount });
      return true;
    },
    mint(to, amount) {
      useGas(20000);
      if (msg.sender !== contract.owner) throw new Error('ONLY_OWNER');
      storage.set('_balance_' + to, (storage.get('_balance_' + to) || 0) + amount);
      storage.set('_totalSupply', (storage.get('_totalSupply') || 0) + amount);
      emit('Mint', { to, amount });
      return true;
    },
    burn(from, amount) {
      useGas(20000);
      const bal = storage.get('_balance_' + from) || 0;
      if (bal < amount) throw new Error('INSUFFICIENT_BALANCE');
      storage.set('_balance_' + from, bal - amount);
      storage.set('_totalSupply', (storage.get('_totalSupply') || 0) - amount);
      emit('Burn', { from, amount });
      return true;
    },
  };

  // RWA functions
  const rwa = {
    setAssetData(key, value) { useGas(5000); storage.set('_rwa_' + key, value); },
    getAssetData(key) { useGas(200); return storage.get('_rwa_' + key); },
    certify(certifier, report) {
      useGas(10000);
      if (msg.sender !== contract.owner) throw new Error('ONLY_OWNER');
      storage.set('_certified', true);
      storage.set('_certifier', certifier);
      storage.set('_certReport', report);
      storage.set('_certDate', Date.now());
      emit('AssetCertified', { certifier, report });
    },
    isCertified() { useGas(100); return storage.get('_certified') || false; },
  };

  // Event emission
  function emit(name, data) {
    useGas(1000);
    __logs.push(JSON.stringify({ event: name, data, timestamp: Date.now() }));
  }

  // Require (revert on false)
  function require(condition, message) {
    useGas(100);
    if (!condition) throw new Error(message || 'REQUIRE_FAILED');
  }

  // Only owner modifier
  function onlyOwner() {
    require(msg.sender === contract.owner, 'ONLY_OWNER');
  }
`;

// ═══════════════════════════════════════════════════
// VM CLASS
// ═══════════════════════════════════════════════════

export class ContractVM {
  private isolate: any;
  private memoryLimit: number;

  constructor(memoryLimit: number = 32) {
    this.memoryLimit = memoryLimit;
    if (!ivm) throw new Error('isolated-vm not available');
    this.isolate = new ivm.Isolate({ memoryLimit });
  }

  async execute(
    sourceCode: string,
    call: ContractCall,
    state: ContractState,
    blockNumber: number,
    contractAddress: string,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const logs: string[] = [];

    try {
      const context = await this.isolate.createContext();
      const jail = context.global;

      // Inject state and call context
      await jail.set('__initialState', JSON.stringify(state));
      await jail.set('__caller', call.caller);
      await jail.set('__value', call.value);
      await jail.set('__gasLimit', call.gasLimit);
      await jail.set('__blockNumber', blockNumber);
      await jail.set('__contractAddress', contractAddress);

      // Build the execution script
      const script = `
        ${CONTRACT_RUNTIME}

        // --- USER CONTRACT CODE ---
        ${sourceCode}
        // --- END USER CODE ---

        // Execute the called method
        let __result;
        if (typeof ${call.method} === 'function') {
          __result = ${call.method}(${call.args.map(a => JSON.stringify(a)).join(', ')});
        } else {
          throw new Error('METHOD_NOT_FOUND: ${call.method}');
        }

        // Return execution results
        JSON.stringify({
          success: true,
          gasUsed: __gasUsed,
          returnValue: __result,
          logs: __logs,
          stateChanges: __stateChanges,
          storage: __state.storage,
        });
      `;

      const compiledScript = await this.isolate.compileScript(script);
      const resultStr = await compiledScript.run(context, { timeout: 5000 }) as string;
      const result = JSON.parse(resultStr);

      context.release();

      return {
        success: true,
        gasUsed: result.gasUsed,
        returnValue: result.returnValue,
        logs: result.logs,
        stateChanges: result.stateChanges,
        executionTime: Date.now() - startTime,
      };

    } catch (err: any) {
      const message = err.message || 'UNKNOWN_ERROR';

      // Parse gas from error if it was out of gas
      return {
        success: false,
        gasUsed: call.gasLimit,
        logs,
        stateChanges: {},
        error: message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  destroy(): void {
    this.isolate.dispose();
  }
}

// ═══════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════

const globalForVM = globalThis as unknown as { __contractVM?: ContractVM };

export function getVM(): ContractVM {
  if (!globalForVM.__contractVM) {
    globalForVM.__contractVM = new ContractVM(32);
  }
  return globalForVM.__contractVM;
}
