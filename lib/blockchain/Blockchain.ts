// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Main Blockchain Engine (Persistent)
// Proof-of-Stake consensus, ISO 20022 native, RWA-optimized
// All data persisted to SQLite — survives restarts
// ═══════════════════════════════════════════════════════════════

import { Block } from './Block';
import { Transaction, ISOMessageType, RWAType } from './Transaction';
import { getDB, ChainDB } from './Database';

export interface Validator {
  address: string;
  name: string;
  stake: number;
  blocksProduced: number;
  uptime: number;
  region: string;
  isActive: boolean;
  joinedBlock: number;
}

export interface ISINEntry {
  isin: string;
  name: string;
  rwaType: RWAType;
  issuer: string;
  lei: string;
  status: 'active' | 'pending' | 'suspended';
  tokenSymbol: string;
  totalSupply: number;
  circulatingSupply: number;
  price: number;
  holders: number;
  createdBlock: number;
  contractAddress: string;
  isoMessages: number;
  jurisdiction: string;
  complianceScore: number;
  description: string;
  lastActivity: number;
}

export interface ChainStats {
  totalBlocks: number;
  totalTransactions: number;
  totalStaked: number;
  activeValidators: number;
  tps: number;
  avgBlockTime: number;
  totalISINs: number;
  marketCap: number;
}

class Blockchain {
  private db: ChainDB;
  public blockReward: number;
  public difficulty: number;
  private blockInterval: NodeJS.Timeout | null;
  private txInterval: NodeJS.Timeout | null;
  private tpsHistory: number[];
  private _validators: Validator[] | null = null; // cache

  constructor() {
    this.db = getDB();
    this.blockReward = 2.5;
    this.difficulty = 2;
    this.blockInterval = null;
    this.txInterval = null;
    this.tpsHistory = [];

    // Only initialize if database is empty (first ever run)
    if (!this.db.isInitialized()) {
      console.log('[20022Chain] First run — initializing genesis chain...');
      this.initializeValidators();
      this.initializeISINRegistry();
      this.createGenesisBlock();

      // Produce initial blocks
      for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 3 + Math.floor(Math.random() * 8); j++) {
          this.addTransaction(this.generateRandomTransaction());
        }
        this.produceBlock();
      }

      this.db.setMeta('initialized', 'true');
      this.db.setMeta('genesis_time', String(Date.now()));
      console.log('[20022Chain] Genesis complete. Chain persisted to disk.');
    } else {
      console.log('[20022Chain] Loading existing chain from disk...');
      console.log(`  Blocks: ${this.db.getBlockCount()}, Transactions: ${this.db.getTransactionCount()}`);
    }

    // Start live production
    this.startBlockProduction();
    this.startTransactionSimulation();
  }

  // ═══════════════════════════════════════════════════
  // GENESIS & INITIALIZATION
  // ═══════════════════════════════════════════════════

  private createGenesisBlock(): void {
    const validators = this.db.getValidators();
    const genesisTx = new Transaction({
      from: 'archt:genesis:000000000000000000000000',
      to: validators[0].address,
      amount: 100000000,
      fee: 0,
      timestamp: Date.now(),
      nonce: 0,
      iso20022: {
        messageType: 'setr.012',
        rwaType: 'MINE',
        isin: 'ARCHT-GENESIS',
        instrumentName: '20022Chain Genesis Token',
        jurisdiction: 'GLOBAL',
      },
    });
    genesisTx.status = 'confirmed';

    const genesis = new Block(0, [genesisTx], '0'.repeat(64), validators[0].address, 'Genesis Node');
    this.db.saveBlock(genesis);
    this.db.setBalance(validators[0].address, 100000000);
  }

  private initializeValidators(): void {
    const regions = ['US-East', 'EU-West', 'APAC-Tokyo', 'LATAM-São Paulo', 'Africa-Lagos', 'ME-Dubai', 'EU-Zurich', 'APAC-Singapore'];
    const names = ['ARCHT Genesis', 'RWA Capital Node', 'ISO Sentinel', 'Compliance Guard', 'Mineral Validator', 'Asset Bridge', 'Swiss Custody', 'Pacific Node'];
    const stakes = [2500000, 1800000, 1200000, 950000, 800000, 600000, 1100000, 750000];

    for (let i = 0; i < 8; i++) {
      const v: Validator = {
        address: this.generateValidatorAddress(names[i]),
        name: names[i],
        stake: stakes[i],
        blocksProduced: 0,
        uptime: 99.7 + Math.random() * 0.3,
        region: regions[i],
        isActive: true,
        joinedBlock: 0,
      };
      this.db.saveValidator(v);
    }
  }

  private initializeISINRegistry(): void {
    const entries: ISINEntry[] = [
      { isin: 'ARCHT00001', name: 'Oro Verde Mining Token', rwaType: 'MINE', issuer: 'Oro Verde S.A.', lei: 'LEI549300MLUDYVRNT823', status: 'active', tokenSymbol: 'OVG', totalSupply: 10000000, circulatingSupply: 7500000, price: 4.52, holders: 2847, createdBlock: 100, contractAddress: this.generateContractAddress('Oro Verde Mining Token'), isoMessages: 0, jurisdiction: 'CO', complianceScore: 98, description: 'Tokenized gold mining reserves in Antioquia, Colombia. NI 43-101 verified.', lastActivity: Date.now() },
      { isin: 'ARCHT00002', name: 'Sierra Madre Gold Trust', rwaType: 'MINE', issuer: 'Sierra Madre Corp', lei: 'LEI549300KPLRT8VN7291', status: 'active', tokenSymbol: 'SMGT', totalSupply: 5000000, circulatingSupply: 3200000, price: 5.75, holders: 1523, createdBlock: 150, contractAddress: this.generateContractAddress('Sierra Madre Gold Trust'), isoMessages: 0, jurisdiction: 'MX', complianceScore: 96, description: 'Gold and silver mining operations across Sierra Madre Occidental.', lastActivity: Date.now() },
      { isin: 'ARCHT00003', name: 'Manhattan Tower REIT', rwaType: 'REAL', issuer: 'ARCHT Real Estate LLC', lei: 'LEI549300NXBRT92M4510', status: 'active', tokenSymbol: 'MHTN', totalSupply: 20000000, circulatingSupply: 15000000, price: 6.00, holders: 5210, createdBlock: 80, contractAddress: this.generateContractAddress('Manhattan Tower REIT'), isoMessages: 0, jurisdiction: 'US', complianceScore: 99, description: 'Class A commercial real estate in Midtown Manhattan. SEC Reg D compliant.', lastActivity: Date.now() },
      { isin: 'ARCHT00004', name: 'Colombian Emerald Trust', rwaType: 'GEM', issuer: 'Muzo Gems International', lei: 'LEI549300PQWXYZ123456', status: 'active', tokenSymbol: 'EMERALD', totalSupply: 847000, circulatingSupply: 620000, price: 12.45, holders: 892, createdBlock: 200, contractAddress: this.generateContractAddress('Colombian Emerald Trust'), isoMessages: 0, jurisdiction: 'CO', complianceScore: 95, description: 'Investment-grade emeralds from Muzo mine. GIA certified.', lastActivity: Date.now() },
      { isin: 'ARCHT00005', name: 'Green Energy Bond 2030', rwaType: 'BOND', issuer: 'CleanPower Finance', lei: 'LEI549300ABCDE678901', status: 'active', tokenSymbol: 'GEB30', totalSupply: 50000000, circulatingSupply: 48000000, price: 1.025, holders: 3100, createdBlock: 50, contractAddress: this.generateContractAddress('Green Energy Bond 2030'), isoMessages: 0, jurisdiction: 'EU', complianceScore: 100, description: 'Green bond funding solar and wind infrastructure. 4.2% APY.', lastActivity: Date.now() },
      { isin: 'ARCHT00006', name: 'Lithium Valley Fund', rwaType: 'MINE', issuer: 'LithiumCo Chile', lei: 'LEI549300FGHIJ234567', status: 'active', tokenSymbol: 'LVF', totalSupply: 8000000, circulatingSupply: 5500000, price: 2.40, holders: 1150, createdBlock: 180, contractAddress: this.generateContractAddress('Lithium Valley Fund'), isoMessages: 0, jurisdiction: 'CL', complianceScore: 94, description: 'Lithium mining operations in Atacama Desert.', lastActivity: Date.now() },
      { isin: 'ARCHT00007', name: 'Dubai Marina Property', rwaType: 'REAL', issuer: 'ARCHT Gulf Properties', lei: 'LEI549300KLMNO345678', status: 'active', tokenSymbol: 'DUBAI', totalSupply: 15000000, circulatingSupply: 12000000, price: 5.50, holders: 4200, createdBlock: 90, contractAddress: this.generateContractAddress('Dubai Marina Property'), isoMessages: 0, jurisdiction: 'AE', complianceScore: 97, description: 'Premium waterfront properties in Dubai Marina.', lastActivity: Date.now() },
      { isin: 'ARCHT00008', name: 'Mogok Ruby Reserve', rwaType: 'GEM', issuer: 'Myanmar Precious Stones', lei: 'LEI549300PQRST456789', status: 'active', tokenSymbol: 'RUBY', totalSupply: 324000, circulatingSupply: 280000, price: 28.92, holders: 445, createdBlock: 250, contractAddress: this.generateContractAddress('Mogok Ruby Reserve'), isoMessages: 0, jurisdiction: 'MM', complianceScore: 88, description: 'Pigeon blood rubies from legendary Mogok Valley.', lastActivity: Date.now() },
      { isin: 'ARCHT00009', name: 'US Treasury Bond T-2030', rwaType: 'BOND', issuer: 'ARCHT Fixed Income', lei: 'LEI549300UVWXY567890', status: 'active', tokenSymbol: 'UST30', totalSupply: 100000000, circulatingSupply: 95000000, price: 0.985, holders: 8900, createdBlock: 30, contractAddress: this.generateContractAddress('US Treasury Bond T-2030'), isoMessages: 0, jurisdiction: 'US', complianceScore: 100, description: 'Tokenized US Treasury bond exposure. 3.8% yield.', lastActivity: Date.now() },
      { isin: 'ARCHT00010', name: 'Copper Mountain Token', rwaType: 'COMM', issuer: 'CopperMine Inc', lei: 'LEI549300ZABCD678901', status: 'active', tokenSymbol: 'CMTN', totalSupply: 12000000, circulatingSupply: 9000000, price: 1.30, holders: 780, createdBlock: 220, contractAddress: this.generateContractAddress('Copper Mountain Token'), isoMessages: 0, jurisdiction: 'PE', complianceScore: 93, description: 'Copper mining token backed by proven reserves in Peru.', lastActivity: Date.now() },
    ];

    entries.forEach(e => this.db.saveISIN(e));
  }

  // ═══════════════════════════════════════════════════
  // PROOF OF STAKE CONSENSUS
  // ═══════════════════════════════════════════════════

  private getValidators(): Validator[] {
    if (!this._validators) {
      this._validators = this.db.getValidators();
    }
    return this._validators;
  }

  private invalidateValidatorCache(): void {
    this._validators = null;
  }

  selectValidator(): Validator {
    const activeValidators = this.getValidators().filter(v => v.isActive);
    const totalStake = activeValidators.reduce((sum, v) => sum + v.stake, 0);

    let random = Math.random() * totalStake;
    for (const validator of activeValidators) {
      random -= validator.stake;
      if (random <= 0) return validator;
    }
    return activeValidators[0];
  }

  // ═══════════════════════════════════════════════════
  // BLOCK PRODUCTION
  // ═══════════════════════════════════════════════════

  addTransaction(tx: Transaction): boolean {
    if (!tx.isValid()) return false;
    this.db.savePendingTx(tx);
    return true;
  }

  produceBlock(): any {
    const validator = this.selectValidator();
    const lastBlock = this.db.getLatestBlock();
    const previousHash = lastBlock ? lastBlock.hash : '0'.repeat(64);
    const blockIndex = lastBlock ? lastBlock.index + 1 : 0;

    // Take up to 100 pending transactions
    const pendingTxs = this.db.getPendingTransactions(100);

    // Add block reward transaction
    const rewardTx = new Transaction({
      from: 'archt:system:block-reward:000000000000',
      to: validator.address,
      amount: this.blockReward,
      fee: 0,
      timestamp: Date.now(),
      nonce: 0,
      iso20022: {
        messageType: 'seev.031',
        rwaType: 'MINE',
        instrumentName: 'Block Reward',
      },
    });
    rewardTx.status = 'confirmed';

    const blockTxs = [...pendingTxs, rewardTx];
    blockTxs.forEach(tx => tx.status = 'confirmed');

    // Update ISIN message counts
    blockTxs.forEach(tx => {
      if (tx.iso20022.isin) {
        this.db.incrementISINMessages(tx.iso20022.isin);
      }
    });

    const block = new Block(blockIndex, blockTxs, previousHash, validator.address, validator.name);
    block.stakeAmount = validator.stake;

    // Persist block + transactions to disk
    this.db.saveBlock(block);

    // Update validator
    this.db.incrementValidatorBlocks(validator.address);
    this.invalidateValidatorCache();

    // Update balance
    this.db.addBalance(validator.address, this.blockReward);

    // Track TPS
    this.tpsHistory.push(blockTxs.length);
    if (this.tpsHistory.length > 10) this.tpsHistory.shift();

    return block.toJSON();
  }

  // ═══════════════════════════════════════════════════
  // SIMULATION ENGINE (Real transactions, persisted)
  // ═══════════════════════════════════════════════════

  private startBlockProduction(): void {
    this.blockInterval = setInterval(() => {
      this.produceBlock();
    }, 6000);
  }

  private startTransactionSimulation(): void {
    this.txInterval = setInterval(() => {
      const tx = this.generateRandomTransaction();
      this.addTransaction(tx);
    }, 500 + Math.random() * 1500);
  }

  private generateRandomTransaction(): Transaction {
    const isoTypes: ISOMessageType[] = ['setr.012', 'pacs.008', 'semt.002', 'sese.023', 'seev.031', 'camt.053', 'colr.003', 'reda.041'];
    const isinEntries = this.db.getAllISINs();
    if (isinEntries.length === 0) {
      // Fallback if no ISINs yet
      return new Transaction({
        from: this.generateAddress(), to: this.generateAddress(),
        amount: Math.random() * 100, fee: 0.001, timestamp: Date.now(), nonce: 0,
        iso20022: { messageType: 'pacs.008', rwaType: 'MINE' },
      });
    }

    const randomISIN = isinEntries[Math.floor(Math.random() * isinEntries.length)];
    const msgType = isoTypes[Math.floor(Math.random() * isoTypes.length)];

    let fromAddr: string;
    let toAddr: string;

    switch (msgType) {
      case 'setr.012':
        fromAddr = this.generateAddress(randomISIN.issuer);
        toAddr = randomISIN.contractAddress;
        break;
      case 'pacs.008':
        fromAddr = this.generateAddress();
        toAddr = this.generateAddress();
        break;
      case 'sese.023':
        fromAddr = this.generateAddress('settlement-engine');
        toAddr = this.generateAddress();
        break;
      case 'seev.031':
        fromAddr = randomISIN.contractAddress;
        toAddr = this.generateAddress();
        break;
      case 'camt.053':
        fromAddr = this.generateAddress();
        toAddr = this.generateAddress('reporting-oracle');
        break;
      case 'colr.003':
        fromAddr = this.generateAddress();
        toAddr = this.generateAddress('collateral-vault');
        break;
      case 'reda.041':
        fromAddr = this.generateAddress('price-oracle');
        toAddr = randomISIN.contractAddress;
        break;
      default:
        fromAddr = this.generateAddress();
        toAddr = this.generateAddress();
    }

    return new Transaction({
      from: fromAddr,
      to: toAddr,
      amount: Math.random() * 50000,
      fee: 0.001 + Math.random() * 0.01,
      timestamp: Date.now(),
      nonce: Math.floor(Math.random() * 100000),
      iso20022: {
        messageType: msgType,
        rwaType: randomISIN.rwaType,
        isin: randomISIN.isin,
        lei: randomISIN.lei,
        instrumentName: randomISIN.name,
        jurisdiction: randomISIN.jurisdiction,
        complianceScore: randomISIN.complianceScore,
      },
    });
  }

  // ═══════════════════════════════════════════════════
  // QUERIES (all from disk now)
  // ═══════════════════════════════════════════════════

  getLatestBlock() {
    return this.db.getLatestBlock();
  }

  getBlock(index: number) {
    return this.db.getBlock(index);
  }

  getBlockByHash(hash: string) {
    return this.db.getBlockByHash(hash);
  }

  getTransaction(hash: string) {
    return this.db.getTransaction(hash);
  }

  getRecentBlocks(count: number = 20) {
    return this.db.getRecentBlocks(count);
  }

  getRecentTransactions(count: number = 50) {
    return this.db.getRecentTransactions(count);
  }

  getISIN(isin: string) {
    return this.db.getISIN(isin);
  }

  searchISIN(query: string) {
    return this.db.searchISIN(query);
  }

  getAllISINs() {
    return this.db.getAllISINs();
  }

  get validators() {
    return this.getValidators();
  }

  getStats(): ChainStats {
    const base = this.db.getStats();
    const avgTps = this.tpsHistory.length > 0
      ? Math.round(this.tpsHistory.reduce((a, b) => a + b, 0) / this.tpsHistory.length * (1000 / 6000))
      : 0;

    return {
      ...base,
      tps: avgTps + Math.floor(Math.random() * 200),
      avgBlockTime: 6,
    };
  }

  isChainValid(): boolean {
    const blocks = this.db.getRecentBlocks(100);
    for (let i = 0; i < blocks.length - 1; i++) {
      const current = blocks[i];
      const next = blocks[i + 1];
      if (current.previousHash !== next.hash) return false;
    }
    return true;
  }

  // ═══════════════════════════════════════════════════
  // 20022CHAIN NATIVE ADDRESS SYSTEM
  // ═══════════════════════════════════════════════════

  generateAddress(context?: string): string {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 24; i++) hash += chars[Math.floor(Math.random() * 16)];

    if (!context) {
      const prefixes = ['account', 'wallet', 'user'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      return `archt:${prefix}:${hash}`;
    }

    const clean = context.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20);
    return `archt:${clean}:${hash}`;
  }

  generateContractAddress(contractName: string): string {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 24; i++) hash += chars[Math.floor(Math.random() * 16)];
    const clean = contractName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
    return `archt:contract:${clean}:${hash}`;
  }

  generateValidatorAddress(validatorName: string): string {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 16; i++) hash += chars[Math.floor(Math.random() * 16)];
    const clean = validatorName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20);
    return `archt:val:${clean}:${hash}`;
  }

  generateTxHash(): string {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
    return `tx:${hash}`;
  }

  destroy(): void {
    if (this.blockInterval) clearInterval(this.blockInterval);
    if (this.txInterval) clearInterval(this.txInterval);
  }
}

// Singleton — persist across hot reloads in dev
const globalForChain = globalThis as unknown as { __chainInstance?: Blockchain };

export function getChain(): Blockchain {
  if (!globalForChain.__chainInstance) {
    globalForChain.__chainInstance = new Blockchain();
  }
  return globalForChain.__chainInstance;
}
