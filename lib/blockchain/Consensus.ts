// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — BFT Consensus Engine
// RANDAO randomness, committees, slashing, finality
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { sha256, keccak256 } from './Crypto';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ValidatorInfo {
  address: string;
  pubKey: string;
  stake: bigint;
  status: 'active' | 'jailed' | 'slashed' | 'exiting';
  joinedEpoch: number;
  lastProposedBlock: number;
  attestationsCount: number;
  missedAttestations: number;
  slashingCount: number;
  effectiveBalance: bigint;
}

export interface Attestation {
  epoch: number;
  slot: number;
  blockHash: string;
  validatorIndex: number;
  validatorAddress: string;
  signature: string;
  sourceEpoch: number;
  targetEpoch: number;
  targetHash: string;
}

export interface SlashingReason {
  type: 'double_proposal' | 'double_vote' | 'surround_vote';
  validator: string;
  epoch: number;
  evidence: string;
  penalty: bigint;
}

export interface Checkpoint {
  epoch: number;
  blockHash: string;
  blockNumber: number;
  validatorSetHash: string;
  justified: boolean;
  finalized: boolean;
}

export interface CommitteeAssignment {
  epoch: number;
  slot: number;
  validators: number[];
  validatorAddresses: string[];
}

export interface RANDAOReveal {
  epoch: number;
  validatorIndex: number;
  value: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

export const EPOCH_LENGTH = 32;
export const SLOTS_PER_EPOCH = 32;
export const SLOW_LENGTH = 4;
export const MIN_ATTESTATION_INCLUSION_DELAY = 1;
export const PROPOSER_REWARD_QUOTIENT = 8;
export const WHISTLEBLOWER_REWARD_QUOTIENT = 512;
export const MIN_SLASHING_PENALTY_QUOTIENT = 32;
export const EJECTION_BALANCE = BigInt(16) * BigInt(10) ** BigInt(9);

// ─────────────────────────────────────────────────────────────
// RANDAO - Commit-Reveal Randomness
// ─────────────────────────────────────────────────────────────

export class RANDAO {
  private commits: Map<number, Map<number, string>> = new Map();
  private reveals: Map<number, Map<number, string>> = new Map();
  private mixed: Map<number, string> = new Map();

  commit(epoch: number, validatorIndex: number, commitment: string): void {
    if (!this.commits.has(epoch)) this.commits.set(epoch, new Map());
    this.commits.get(epoch)!.set(validatorIndex, commitment);
  }

  reveal(epoch: number, validatorIndex: number, value: string): boolean {
    const prev = this.commits.get(epoch)?.get(validatorIndex);
    if (!prev) return false;
    const hash = keccak256(value).toString('hex');
    if (hash !== prev) return false;
    if (!this.reveals.has(epoch)) this.reveals.set(epoch, new Map());
    this.reveals.get(epoch)!.set(validatorIndex, value);
    return true;
  }

  mix(epoch: number, validatorCount: number): string {
    if (this.mixed.has(epoch)) return this.mixed.get(epoch)!;
    const rev = this.reveals.get(epoch);
    if (!rev || rev.size < validatorCount / 2) {
      const fallback = sha256(Buffer.from(`${epoch}:${Date.now()}`)).toString('hex');
      this.mixed.set(epoch, fallback);
      return fallback;
    }
    const values = Array.from(rev.entries()).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
    let mixed = keccak256(Buffer.concat(values.map(v => Buffer.from(v, 'hex')))).toString('hex');
    for (let i = 0; i < values.length; i++) {
      mixed = keccak256(Buffer.from(mixed + values[i], 'hex')).toString('hex');
    }
    this.mixed.set(epoch, mixed);
    return mixed;
  }

  getSeed(epoch: number): string {
    return this.mix(epoch, 100);
  }
}

// ─────────────────────────────────────────────────────────────
// Committee Selection (Shuffling)
// ─────────────────────────────────────────────────────────────

export function shuffleValidators(validators: string[], seed: string): string[] {
  const indices = validators.map((_, i) => i);
  let h = seed;
  for (let i = indices.length - 1; i > 0; i--) {
    h = keccak256(Buffer.from(h, 'hex')).toString('hex');
    const j = parseInt(h.slice(0, 8), 16) % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.map(i => validators[i]);
}

export function getCommitteeAssignment(
  validators: string[],
  epoch: number,
  slot: number,
  committeesPerSlot: number,
  seed: string
): CommitteeAssignment {
  const shuffled = shuffleValidators(validators, seed);
  const committeeSize = Math.ceil(validators.length / (SLOTS_PER_EPOCH * committeesPerSlot));
  const committeeStart = (slot * committeesPerSlot) * committeeSize;
  const committeeIndices = shuffled
    .slice(committeeStart, committeeStart + committeeSize)
    .map((_, i) => committeeStart + i);
  return {
    epoch,
    slot,
    validators: committeeIndices,
    validatorAddresses: shuffled.slice(committeeStart, committeeStart + committeeSize)
  };
}

// ─────────────────────────────────────────────────────────────
// Proposer Selection
// ─────────────────────────────────────────────────────────────

export function selectProposer(
  validators: string[],
  stakeMap: Map<string, bigint>,
  epoch: number,
  slot: number,
  seed: string
): { proposer: string; index: number } {
  const committee = getCommitteeAssignment(validators, epoch, slot, 1, seed);
  if (committee.validatorAddresses.length === 0) return { proposer: validators[0], index: 0 };
  const slotSeed = keccak256(Buffer.from(`${seed}:${epoch}:${slot}`, 'utf8')).toString('hex');
  const idx = parseInt(slotSeed.slice(0, 8), 16) % committee.validatorAddresses.length;
  return { proposer: committee.validatorAddresses[idx], index: committee.validators[idx] };
}

// ─────────────────────────────────────────────────────────────
// Slashing Detection
// ─────────────────────────────────────────────────────────────

export interface SlashingCondition {
  type: 'double_proposal' | 'double_vote' | 'surround_vote';
  validator: string;
  epoch: number;
  blockNumbers?: [number, number];
  attestations?: [Attestation, Attestation];
}

export function detectDoubleProposal(
  proposals: Map<string, { blockNumber: number; blockHash: string }[]>
): SlashingCondition[] {
  const slashings: SlashingCondition[] = [];
  for (const [validator, props] of proposals) {
    if (props.length < 2) continue;
    const byEpoch = new Map<number, typeof props>();
    for (const p of props) {
      const e = Math.floor(p.blockNumber / EPOCH_LENGTH);
      if (!byEpoch.has(e)) byEpoch.set(e, []);
      byEpoch.get(e)!.push(p);
    }
    for (const [epoch, arr] of byEpoch) {
      if (arr.length >= 2) {
        slashings.push({
          type: 'double_proposal',
          validator,
          epoch,
          blockNumbers: [arr[0].blockNumber, arr[1].blockNumber]
        });
      }
    }
  }
  return slashings;
}

export function detectDoubleVote(attestations: Attestation[]): SlashingCondition[] {
  const byValidator = new Map<string, Attestation[]>();
  for (const a of attestations) {
    if (!byValidator.has(a.validatorAddress)) byValidator.set(a.validatorAddress, []);
    byValidator.get(a.validatorAddress)!.push(a);
  }
  const slashings: SlashingCondition[] = [];
  for (const [validator, atts] of byValidator) {
    const byBlock = new Map<string, Attestation[]>();
    for (const a of atts) {
      const key = `${a.epoch}:${a.blockHash}`;
      if (!byBlock.has(key)) byBlock.set(key, []);
      byBlock.get(key)!.push(a);
    }
    for (const [, arr] of byBlock) {
      if (arr.length >= 2) {
        slashings.push({
          type: 'double_vote',
          validator,
          epoch: arr[0].epoch,
          attestations: [arr[0], arr[1]]
        });
      }
    }
  }
  return slashings;
}

// ─────────────────────────────────────────────────────────────
// Fork Choice Rule (LMD-GHOST style)
// ─────────────────────────────────────────────────────────────

export interface BlockNode {
  hash: string;
  parent: string | null;
  slot: number;
  attestations: Attestation[];
  weight: bigint;
}

export function forkChoice(
  nodes: Map<string, BlockNode>,
  head: string,
  attestations: Attestation[]
): string {
  const weights = new Map<string, bigint>();
  for (const a of attestations) {
    const key = a.targetHash;
    weights.set(key, (weights.get(key) ?? BigInt(0)) + BigInt(1));
  }
  let current = head;
  while (true) {
    const node = nodes.get(current);
    if (!node) return current;
    const children = Array.from(nodes.values()).filter(n => n.parent === current);
    if (children.length === 0) return current;
    let bestChild = children[0];
    let bestWeight = weights.get(bestChild.hash) ?? BigInt(0);
    for (const c of children.slice(1)) {
      const w = weights.get(c.hash) ?? BigInt(0);
      if (w > bestWeight) {
        bestChild = c;
        bestWeight = w;
      }
    }
    current = bestChild.hash;
  }
}

// ─────────────────────────────────────────────────────────────
// Casper FFG - Finality Gadget
// ─────────────────────────────────────────────────────────────

export function computeFinality(
  checkpoints: Checkpoint[],
  attestations: Attestation[],
  twoThirds: number
): Checkpoint | null {
  const byEpoch = new Map<number, Map<string, number>>();
  for (const a of attestations) {
    const e = a.targetEpoch;
    if (!byEpoch.has(e)) byEpoch.set(e, new Map());
    const m = byEpoch.get(e)!;
    m.set(a.targetHash, (m.get(a.targetHash) ?? 0) + 1);
  }
  const sorted = [...byEpoch.entries()].sort((a, b) => b[0] - a[0]);
  for (const [epoch, hashCounts] of sorted) {
    for (const [hash, count] of hashCounts) {
      if (count >= twoThirds) {
        const cp = checkpoints.find(c => c.epoch === epoch && c.blockHash === hash);
        if (cp) return cp;
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Consensus Engine
// ─────────────────────────────────────────────────────────────

export class ConsensusEngine {
  private validators: ValidatorInfo[] = [];
  private randao: RANDAO = new RANDAO();
  private epoch = 0;
  private slot = 0;
  private attestations: Attestation[] = [];
  private proposals: Map<string, { blockNumber: number; blockHash: string }[]> = new Map();
  private slashings: SlashingReason[] = [];
  private checkpoints: Checkpoint[] = [];

  addValidator(v: ValidatorInfo): void {
    if (!this.validators.find(x => x.address === v.address)) {
      this.validators.push(v);
    }
  }

  removeValidator(address: string): void {
    this.validators = this.validators.filter(v => v.address !== address);
  }

  getActiveValidators(): ValidatorInfo[] {
    return this.validators.filter(v => v.status === 'active');
  }

  advanceSlot(): void {
    this.slot++;
    if (this.slot >= SLOTS_PER_EPOCH) {
      this.slot = 0;
      this.epoch++;
    }
  }

  getEpoch(): number { return this.epoch; }
  getSlot(): number { return this.slot; }

  commitRandao(validatorIndex: number, commitment: string): void {
    this.randao.commit(this.epoch, validatorIndex, commitment);
  }

  revealRandao(validatorIndex: number, value: string): boolean {
    return this.randao.reveal(this.epoch, validatorIndex, value);
  }

  getRandaoSeed(): string {
    return this.randao.getSeed(this.epoch);
  }

  getProposer(): { proposer: string; index: number } {
    const active = this.getActiveValidators().map(v => v.address);
    const stakeMap = new Map<string, bigint>();
    for (const v of this.validators) stakeMap.set(v.address, v.stake);
    return selectProposer(active, stakeMap, this.epoch, this.slot, this.getRandaoSeed());
  }

  addAttestation(a: Attestation): void {
    this.attestations.push(a);
  }

  recordProposal(validator: string, blockNumber: number, blockHash: string): void {
    if (!this.proposals.has(validator)) this.proposals.set(validator, []);
    this.proposals.get(validator)!.push({ blockNumber, blockHash });
  }

  processSlashings(): SlashingReason[] {
    const doubleProp = detectDoubleProposal(this.proposals);
    const doubleVote = detectDoubleVote(this.attestations);
    const all: SlashingReason[] = [];
    for (const s of doubleProp) {
      const v = this.validators.find(x => x.address === s.validator);
      const penalty = v ? v.stake / BigInt(MIN_SLASHING_PENALTY_QUOTIENT) : BigInt(0);
      all.push({
        type: s.type,
        validator: s.validator,
        epoch: s.epoch,
        evidence: JSON.stringify(s.blockNumbers),
        penalty
      });
    }
    for (const s of doubleVote) {
      const v = this.validators.find(x => x.address === s.validator);
      const penalty = v ? v.stake / BigInt(MIN_SLASHING_PENALTY_QUOTIENT) : BigInt(0);
      all.push({
        type: s.type,
        validator: s.validator,
        epoch: s.epoch,
        evidence: JSON.stringify(s.attestations?.map(a => a.blockHash)),
        penalty
      });
    }
    this.slashings.push(...all);
    for (const s of all) {
      const v = this.validators.find(x => x.address === s.validator);
      if (v) {
        v.status = 'slashed';
        v.stake -= s.penalty;
      }
    }
    return all;
  }

  addCheckpoint(cp: Checkpoint): void {
    this.checkpoints.push(cp);
  }

  getFinalizedCheckpoint(): Checkpoint | null {
    const twoThirds = Math.floor(this.getActiveValidators().length * 2 / 3);
    return computeFinality(this.checkpoints, this.attestations, twoThirds);
  }

  getSlashings(): SlashingReason[] {
    return [...this.slashings];
  }

  resetEpoch(): void {
    this.attestations = [];
    this.proposals = new Map();
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────

declare global {
  var __consensusEngine: ConsensusEngine | undefined;
}

export function getConsensusEngine(): ConsensusEngine {
  if (!globalThis.__consensusEngine) {
    globalThis.__consensusEngine = new ConsensusEngine();
  }
  return globalThis.__consensusEngine;
}
