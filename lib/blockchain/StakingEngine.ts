// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Staking Engine
// Delegation, rewards, unbonding, slashing
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ValidatorStake {
  address: string;
  moniker: string;
  commission: number;
  totalStake: number;
  selfStake: number;
  delegatedStake: number;
  delegators: number;
  status: 'active' | 'jailed' | 'inactive';
  jailedUntil?: number;
}

export interface Delegation {
  delegator: string;
  validator: string;
  amount: number;
  shares: number;
  unbonding: UnbondingEntry[];
}

export interface UnbondingEntry {
  amount: number;
  shares: number;
  completionTime: number;
}

export interface Reward {
  delegator: string;
  validator: string;
  amount: number;
  blockNumber: number;
  claimed: boolean;
}

// ─────────────────────────────────────────────────────────────
// Staking Engine
// ─────────────────────────────────────────────────────────────

export class StakingEngine {
  private validators: Map<string, ValidatorStake> = new Map();
  private delegations: Map<string, Delegation> = new Map();
  private rewards: Reward[] = [];
  private unbondingPeriod = 21 * 86400;

  registerValidator(address: string, moniker: string, commission = 0.1, initialStake = 0): ValidatorStake {
    const v: ValidatorStake = {
      address,
      moniker,
      commission,
      totalStake: initialStake,
      selfStake: initialStake,
      delegatedStake: 0,
      delegators: 0,
      status: 'active'
    };
    this.validators.set(address, v);
    return v;
  }

  delegate(delegator: string, validator: string, amount: number): boolean {
    const v = this.validators.get(validator);
    if (!v || v.status !== 'active') return false;
    const key = `${delegator}:${validator}`;
    const del = this.delegations.get(key) ?? {
      delegator,
      validator,
      amount: 0,
      shares: 0,
      unbonding: []
    };
    const shares = v.totalStake > 0 ? (amount * v.totalStake) / (v.totalStake + amount) : amount;
    del.amount += amount;
    del.shares += shares;
    this.delegations.set(key, del);
    v.totalStake += amount;
    v.delegatedStake += amount;
    v.delegators = new Set(Array.from(this.delegations.values()).filter(d => d.validator === validator).map(d => d.delegator)).size;
    return true;
  }

  undelegate(delegator: string, validator: string, amount: number): boolean {
    const key = `${delegator}:${validator}`;
    const del = this.delegations.get(key);
    if (!del || del.amount < amount) return false;
    const v = this.validators.get(validator)!;
    const shareRatio = amount / del.amount;
    const sharesToRemove = del.shares * shareRatio;
    del.amount -= amount;
    del.shares -= sharesToRemove;
    del.unbonding.push({
      amount,
      shares: sharesToRemove,
      completionTime: Date.now() + this.unbondingPeriod * 1000
    });
    v.totalStake -= amount;
    v.delegatedStake -= amount;
    return true;
  }

  claimUnbonding(delegator: string, validator: string): number {
    const key = `${delegator}:${validator}`;
    const del = this.delegations.get(key);
    if (!del) return 0;
    const now = Date.now();
    const completed = del.unbonding.filter(u => u.completionTime <= now);
    const total = completed.reduce((s, u) => s + u.amount, 0);
    del.unbonding = del.unbonding.filter(u => u.completionTime > now);
    return total;
  }

  distributeRewards(validator: string, blockReward: number): void {
    const v = this.validators.get(validator);
    if (!v) return;
    const commission = blockReward * v.commission;
    const toDelegators = blockReward - commission;
    const delegs = Array.from(this.delegations.values()).filter(d => d.validator === validator);
    const totalShares = delegs.reduce((s, d) => s + d.shares, 0);
    for (const d of delegs) {
      const share = totalShares > 0 ? (d.shares / totalShares) * toDelegators : 0;
      this.rewards.push({ delegator: d.delegator, validator, amount: share, blockNumber: 0, claimed: false });
    }
  }

  claimRewards(delegator: string, validator: string): number {
    const unclaimed = this.rewards.filter(r => r.delegator === delegator && r.validator === validator && !r.claimed);
    const total = unclaimed.reduce((s, r) => s + r.amount, 0);
    for (const r of unclaimed) r.claimed = true;
    return total;
  }

  slash(validator: string, amount: number): void {
    const v = this.validators.get(validator);
    if (!v) return;
    v.totalStake = Math.max(0, v.totalStake - amount);
    v.delegatedStake = Math.max(0, v.delegatedStake - amount);
  }

  jail(validator: string, until: number): void {
    const v = this.validators.get(validator);
    if (v) {
      v.status = 'jailed';
      v.jailedUntil = until;
    }
  }

  unjail(validator: string): void {
    const v = this.validators.get(validator);
    if (v && v.jailedUntil && Date.now() >= v.jailedUntil) {
      v.status = 'active';
      v.jailedUntil = undefined;
    }
  }

  getValidator(address: string): ValidatorStake | undefined {
    return this.validators.get(address);
  }

  getValidators(): ValidatorStake[] {
    return Array.from(this.validators.values()).sort((a, b) => b.totalStake - a.totalStake);
  }

  getDelegation(delegator: string, validator: string): Delegation | undefined {
    return this.delegations.get(`${delegator}:${validator}`);
  }

  getTotalStaked(): number {
    return Array.from(this.validators.values()).reduce((s, v) => s + v.totalStake, 0);
  }
}

declare global {
  var __stakingEngine: StakingEngine | undefined;
}

export function getStakingEngine(): StakingEngine {
  if (!globalThis.__stakingEngine) globalThis.__stakingEngine = new StakingEngine();
  return globalThis.__stakingEngine;
}
