// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Compliance Engine
// AML, KYC, sanctions, risk scoring
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SanctionsCheck {
  address: string;
  flagged: boolean;
  lists: string[];
  score: number;
  timestamp: number;
}

export interface AMLAlert {
  id: string;
  type: string;
  address: string;
  riskScore: number;
  description: string;
  txHashes: string[];
  createdAt: number;
  status: 'open' | 'resolved' | 'false_positive';
}

export interface KYCLevel {
  level: number;
  name: string;
  requirements: string[];
  limits: { daily: number; monthly: number };
}

// ─────────────────────────────────────────────────────────────
// Compliance Engine
// ─────────────────────────────────────────────────────────────

export class ComplianceEngine {
  private sanctionsList: Set<string> = new Set();
  private amlAlerts: AMLAlert[] = [];
  private kycLevels: Map<string, number> = new Map();
  private txVolume: Map<string, { daily: number; monthly: number; lastReset: number }> = new Map();

  addToSanctionsList(address: string): void {
    this.sanctionsList.add(address.toLowerCase());
  }

  removeFromSanctionsList(address: string): void {
    this.sanctionsList.delete(address.toLowerCase());
  }

  checkSanctions(address: string): SanctionsCheck {
    const normalized = address.toLowerCase();
    const flagged = this.sanctionsList.has(normalized);
    const lists = flagged ? ['OFAC', 'UN'] : [];
    return {
      address,
      flagged,
      lists,
      score: flagged ? 100 : 0,
      timestamp: Date.now()
    };
  }

  setKYCLevel(address: string, level: number): void {
    this.kycLevels.set(address, level);
  }

  getKYCLevel(address: string): number {
    return this.kycLevels.get(address) ?? 0;
  }

  recordTransaction(address: string, amount: number): void {
    const key = address.toLowerCase();
    let vol = this.txVolume.get(key);
    if (!vol) vol = { daily: 0, monthly: 0, lastReset: Date.now() };
    const now = Date.now();
    const dayMs = 86400000;
    if (now - vol.lastReset > dayMs) {
      vol.daily = 0;
      if (now - vol.lastReset > 30 * dayMs) vol.monthly = 0;
      vol.lastReset = now;
    }
    vol.daily += amount;
    vol.monthly += amount;
    this.txVolume.set(key, vol);
  }

  calculateRiskScore(address: string, amount: number): number {
    const sanctions = this.checkSanctions(address);
    if (sanctions.flagged) return 100;
    const kyc = this.getKYCLevel(address);
    let score = 50 - kyc * 10;
    const vol = this.txVolume.get(address.toLowerCase());
    if (vol && amount > vol.daily * 2) score += 20;
    if (vol && amount > vol.monthly * 0.5) score += 15;
    return Math.min(100, Math.max(0, score));
  }

  createAMLAlert(type: string, address: string, riskScore: number, description: string, txHashes: string[]): AMLAlert {
    const id = crypto.randomUUID();
    const alert: AMLAlert = { id, type, address, riskScore, description, txHashes, createdAt: Date.now(), status: 'open' };
    this.amlAlerts.push(alert);
    return alert;
  }

  getAlerts(status?: 'open' | 'resolved'): AMLAlert[] {
    return status ? this.amlAlerts.filter(a => a.status === status) : [...this.amlAlerts];
  }

  resolveAlert(id: string, asFalsePositive = false): void {
    const a = this.amlAlerts.find(x => x.id === id);
    if (a) a.status = asFalsePositive ? 'false_positive' : 'resolved';
  }
}

declare global {
  var __complianceEngine: ComplianceEngine | undefined;
}

export function getComplianceEngine(): ComplianceEngine {
  if (!globalThis.__complianceEngine) globalThis.__complianceEngine = new ComplianceEngine();
  return globalThis.__complianceEngine;
}
