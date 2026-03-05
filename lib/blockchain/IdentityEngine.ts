// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Identity Engine
// DID, verifiable credentials, reputation
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface DIDDocument {
  id: string;
  controller: string;
  verificationMethods: VerificationMethod[];
  authentication: string[];
  service?: Service[];
  created: number;
  updated: number;
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyJwk?: Record<string, unknown>;
}

export interface VerifiableCredential {
  id: string;
  type: string[];
  issuer: string;
  subject: string;
  issuanceDate: string;
  expirationDate?: string;
  claims: Record<string, unknown>;
  proof: Proof;
}

export interface Proof {
  type: string;
  created: string;
  verificationMethod: string;
  proofValue: string;
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface ReputationScore {
  did: string;
  score: number;
  category: string;
  factors: ReputationFactor[];
  updatedAt: number;
}

export interface ReputationFactor {
  name: string;
  weight: number;
  value: number;
}

// ─────────────────────────────────────────────────────────────
// Identity Engine
// ─────────────────────────────────────────────────────────────

export class IdentityEngine {
  private documents: Map<string, DIDDocument> = new Map();
  private credentials: Map<string, VerifiableCredential> = new Map();
  private reputation: Map<string, ReputationScore> = new Map();

  createDID(controller: string, methods: VerificationMethod[]): DIDDocument {
    const id = `did:archt:${crypto.createHash('sha256').update(`${controller}:${Date.now()}`).digest('hex').slice(0, 32)}`;
    const doc: DIDDocument = {
      id,
      controller,
      verificationMethods: methods,
      authentication: methods.map(m => m.id),
      created: Date.now(),
      updated: Date.now()
    };
    this.documents.set(id, doc);
    return doc;
  }

  resolveDID(did: string): DIDDocument | undefined {
    return this.documents.get(did);
  }

  issueCredential(issuer: string, subject: string, type: string, claims: Record<string, unknown>, expiresIn?: number): VerifiableCredential {
    const id = `vc:${crypto.randomUUID()}`;
    const issuance = new Date().toISOString();
    const expiration = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined;
    const payload = JSON.stringify({ id, type: ['VerifiableCredential', type], issuer, subject, issuanceDate: issuance, expirationDate: expiration, claims });
    const proofValue = crypto.createHash('sha256').update(payload).digest('hex');
    const vc: VerifiableCredential = {
      id,
      type: ['VerifiableCredential', type],
      issuer,
      subject,
      issuanceDate: issuance,
      expirationDate: expiration,
      claims,
      proof: { type: 'ArchT2022', created: issuance, verificationMethod: issuer, proofValue }
    };
    this.credentials.set(id, vc);
    return vc;
  }

  verifyCredential(vcId: string): boolean {
    const vc = this.credentials.get(vcId);
    if (!vc) return false;
    if (vc.expirationDate && new Date(vc.expirationDate) < new Date()) return false;
    return true;
  }

  setReputation(did: string, category: string, factors: ReputationFactor[]): ReputationScore {
    const score = factors.reduce((s, f) => s + f.weight * f.value, 0) / factors.reduce((s, f) => s + f.weight, 0);
    const r: ReputationScore = { did, score, category, factors, updatedAt: Date.now() };
    this.reputation.set(`${did}:${category}`, r);
    return r;
  }

  getReputation(did: string, category?: string): ReputationScore[] {
    const all = Array.from(this.reputation.values()).filter(r => r.did === did);
    return category ? all.filter(r => r.category === category) : all;
  }
}

declare global {
  var __identityEngine: IdentityEngine | undefined;
}

export function getIdentityEngine(): IdentityEngine {
  if (!globalThis.__identityEngine) globalThis.__identityEngine = new IdentityEngine();
  return globalThis.__identityEngine;
}
