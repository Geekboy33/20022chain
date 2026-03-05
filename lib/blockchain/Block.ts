// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Block Structure
// Each block contains ISO 20022 compliant transactions
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { Transaction } from './Transaction';

export class Block {
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public previousHash: string;
  public hash: string;
  public nonce: number;
  public validator: string;          // PoS validator address
  public validatorName: string;
  public stakeAmount: number;        // Validator's stake
  public reward: number;             // Block reward in ARCHT
  public gasUsed: number;
  public gasLimit: number;
  public size: number;               // Block size in bytes
  public merkleRoot: string;

  constructor(
    index: number,
    transactions: Transaction[],
    previousHash: string,
    validator: string = '',
    validatorName: string = 'Genesis'
  ) {
    this.index = index;
    this.timestamp = Date.now();
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.validator = validator;
    this.validatorName = validatorName;
    this.stakeAmount = 0;
    this.reward = 2.5;                // Base block reward
    this.gasUsed = transactions.reduce((sum, tx) => sum + tx.fee * 1000000, 0);
    this.gasLimit = 30000000;
    this.merkleRoot = this.calculateMerkleRoot();
    this.size = JSON.stringify(this).length;
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    const payload = `${this.index}${this.timestamp}${this.merkleRoot}${this.previousHash}${this.nonce}${this.validator}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  calculateMerkleRoot(): string {
    if (this.transactions.length === 0) {
      return crypto.createHash('sha256').update('empty').digest('hex');
    }
    
    let hashes = this.transactions.map(tx => tx.hash);
    
    while (hashes.length > 1) {
      const newHashes: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = i + 1 < hashes.length ? hashes[i + 1] : left;
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        newHashes.push(combined);
      }
      hashes = newHashes;
    }
    
    return hashes[0];
  }

  hasValidTransactions(): boolean {
    return this.transactions.every(tx => tx.isValid());
  }

  toJSON() {
    return {
      index: this.index,
      timestamp: this.timestamp,
      hash: this.hash,
      previousHash: this.previousHash,
      merkleRoot: this.merkleRoot,
      nonce: this.nonce,
      validator: this.validator,
      validatorName: this.validatorName,
      stakeAmount: this.stakeAmount,
      reward: this.reward,
      gasUsed: this.gasUsed,
      gasLimit: this.gasLimit,
      size: this.size,
      transactionCount: this.transactions.length,
      transactions: this.transactions.map(tx => tx.toJSON()),
    };
  }
}
