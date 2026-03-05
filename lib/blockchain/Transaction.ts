// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Transaction Engine
// ISO 20022 Native Transactions for RWA Tokenization
// Canonical serialization (identical to Rust backend)
// Ed25519 signature via Crypto.ts
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { signEd25519, verifyEd25519, sha256 } from './Crypto';

export const CHAIN_ID = 20022;

export type ISOMessageType = 
  | 'setr.012'   // Asset Tokenization
  | 'pacs.008'   // Token Transfer
  | 'semt.002'   // Holdings Report
  | 'sese.023'   // Settlement
  | 'seev.031'   // Corporate Action (dividends/yield)
  | 'camt.053'   // Account Statement
  | 'colr.003'   // Collateral Management
  | 'reda.041';  // Reference Data / Oracle

export type RWAType = 'MINE' | 'REAL' | 'BOND' | 'COMM' | 'GEM';

export interface ISO20022Metadata {
  messageType: ISOMessageType;
  rwaType: RWAType;
  isin?: string;           // International Securities Identification Number
  lei?: string;            // Legal Entity Identifier
  instrumentName?: string;
  jurisdiction?: string;
  complianceScore?: number;
}

export interface TransactionData {
  from: string;
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  nonce: number;
  chainId?: number;
  iso20022: ISO20022Metadata;
  data?: string;           // Optional payload
}

// ─────────────────────────────────────────────────────────────
// Address derivation (must match Rust: derive_address_from_pubkey)
// ─────────────────────────────────────────────────────────────

/**
 * Derive address from Ed25519 public key (raw 32 bytes).
 * Format: archt:0x{sha256(pubkey)[0..20].hex}
 * Must match Rust's derive_address_from_pubkey exactly.
 */
export function deriveAddressFromPubkey(pubkeyRaw: Buffer): string {
  const hash = sha256(pubkeyRaw);
  const truncated = hash.subarray(0, 20);
  return `archt:0x${truncated.toString('hex')}`;
}

// ─────────────────────────────────────────────────────────────
// Canonical serialization (MUST match Rust's canonical_payload)
// ─────────────────────────────────────────────────────────────

/**
 * Canonical payload for deterministic hashing.
 * Keys in strict alphabetical order. Only message_type and rwa_type from iso20022.
 * Includes chain_id for replay protection.
 * MUST produce byte-identical output to Rust's Transaction::canonical_payload.
 */
export function canonicalPayload(
  from: string,
  to: string,
  amount: number,
  fee: number,
  timestamp: number,
  nonce: number,
  chainId: number,
  messageType: string,
  rwaType: string,
  data: string,
): string {
  const escapedData = data.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `{"amount":${amount},"chain_id":${chainId},"data":"${escapedData}","fee":${fee},"from":"${from}","iso20022":{"message_type":"${messageType}","rwa_type":"${rwaType}"},"nonce":${nonce},"timestamp":${timestamp},"to":"${to}"}`;
}

// ─────────────────────────────────────────────────────────────
// Transaction class
// ─────────────────────────────────────────────────────────────

export class Transaction {
  public hash: string;
  public from: string;
  public to: string;
  public amount: number;
  public fee: number;
  public timestamp: number;
  public nonce: number;
  public chainId: number;
  public iso20022: ISO20022Metadata;
  public data: string;
  public signature: string;
  public publicKey: string;  // Hex-encoded raw Ed25519 public key (32 bytes)
  public status: 'pending' | 'confirmed' | 'failed';

  constructor(txData: TransactionData) {
    this.from = txData.from;
    this.to = txData.to;
    this.amount = txData.amount;
    this.fee = txData.fee;
    this.timestamp = txData.timestamp || Date.now();
    this.nonce = txData.nonce || 0;
    this.chainId = txData.chainId ?? CHAIN_ID;
    this.iso20022 = txData.iso20022;
    this.data = txData.data || '';
    this.signature = '';
    this.publicKey = '';
    this.status = 'pending';
    this.hash = this.calculateHash();
  }

  /**
   * Calculate transaction hash using canonical serialization.
   * Produces identical hash to Rust backend.
   */
  calculateHash(): string {
    const payload = canonicalPayload(
      this.from,
      this.to,
      this.amount,
      this.fee,
      this.timestamp,
      this.nonce,
      this.chainId,
      this.iso20022.messageType,
      this.iso20022.rwaType,
      this.data,
    );
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Sign the transaction with an Ed25519 private key (DER/PKCS8 format).
   * Sets both signature and publicKey fields.
   */
  signEd25519(privateKeyDER: Buffer, publicKeyRaw: Buffer): void {
    const message = Buffer.from(this.hash, 'utf8');
    const sig = signEd25519(privateKeyDER, message);
    this.signature = sig.toString('hex');
    this.publicKey = publicKeyRaw.toString('hex');
  }

  /**
   * Legacy sign method using RSA/ECDSA (DEPRECATED — use signEd25519).
   * Kept for backward compatibility with existing code.
   * @deprecated Use signEd25519 instead
   */
  sign(privateKey: string): void {
    const sign = crypto.createSign('SHA256');
    sign.update(this.hash);
    this.signature = sign.sign(privateKey, 'hex');
  }

  /**
   * Verify Ed25519 signature against this transaction's hash.
   */
  verifyEd25519Signature(publicKeyDER: Buffer): boolean {
    if (!this.signature) return false;
    const message = Buffer.from(this.hash, 'utf8');
    const sig = Buffer.from(this.signature, 'hex');
    return verifyEd25519(publicKeyDER, message, sig);
  }

  isValid(): boolean {
    // System/genesis/reward transactions don't need signature
    if (this.from.startsWith('archt:genesis:') || this.from.startsWith('archt:system:')) return true;
    // Legacy support
    if (this.from === '0x0000000000000000000000000000000000000000') return true;
    if (!this.signature) return false;
    if (this.amount < 0) return false;
    // Verify hash integrity
    return this.hash === this.calculateHash();
  }

  toJSON() {
    return {
      hash: this.hash,
      from: this.from,
      to: this.to,
      amount: this.amount,
      fee: this.fee,
      timestamp: this.timestamp,
      nonce: this.nonce,
      chainId: this.chainId,
      iso20022: this.iso20022,
      data: this.data,
      signature: this.signature ? this.signature.slice(0, 16) + '...' : '',
      publicKey: this.publicKey ? this.publicKey.slice(0, 16) + '...' : '',
      status: this.status,
    };
  }
}
