// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Governance Engine
// Proposals, voting, treasury, timelock
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ProposalType = 'parameter' | 'treasury' | 'emergency' | 'upgrade' | 'general';

export type ProposalStatus = 'draft' | 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';

export type VotingType = 'single' | 'quadratic' | 'conviction';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  type: ProposalType;
  status: ProposalStatus;
  creator: string;
  createdAt: number;
  startBlock: number;
  endBlock: number;
  votingType: VotingType;
  quorum: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  totalVotes: number;
  treasuryAmount?: number;
  targetContract?: string;
  calldata?: string;
  timelockUntil?: number;
  executedAt?: number;
}

export interface Vote {
  proposalId: string;
  voter: string;
  support: boolean;
  weight: number;
  blockNumber: number;
  txHash: string;
}

export interface TreasuryTransaction {
  id: string;
  proposalId: string;
  recipient: string;
  amount: number;
  token: string;
  executedAt: number;
  txHash: string;
}

// ─────────────────────────────────────────────────────────────
// Governance Engine
// ─────────────────────────────────────────────────────────────

export class GovernanceEngine {
  private proposals: Map<string, Proposal> = new Map();
  private votes: Map<string, Vote[]> = new Map();
  private treasury: Map<string, number> = new Map();
  private treasuryTx: TreasuryTransaction[] = [];
  private timelockDelay = 86400 * 2;

  createProposal(
    creator: string,
    title: string,
    description: string,
    type: ProposalType,
    votingType: VotingType = 'single',
    startBlock: number,
    endBlock: number,
    quorum = 0.25,
    treasuryAmount?: number,
    targetContract?: string,
    calldata?: string
  ): Proposal {
    const id = crypto.createHash('sha256').update(`${creator}:${title}:${Date.now()}`).digest('hex').slice(0, 16);
    const proposal: Proposal = {
      id,
      title,
      description,
      type,
      status: 'active',
      creator,
      createdAt: Date.now(),
      startBlock,
      endBlock,
      votingType,
      quorum,
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      totalVotes: 0,
      treasuryAmount,
      targetContract,
      calldata
    };
    this.proposals.set(id, proposal);
    this.votes.set(id, []);
    return proposal;
  }

  castVote(proposalId: string, voter: string, support: boolean, weight: number, blockNumber: number, txHash: string): boolean {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'active') return false;
    if (blockNumber < proposal.startBlock || blockNumber > proposal.endBlock) return false;
    const existing = this.votes.get(proposalId) ?? [];
    if (existing.some(v => v.voter === voter)) return false;
    const effectiveWeight = proposal.votingType === 'quadratic' ? Math.sqrt(weight) : weight;
    const vote: Vote = { proposalId, voter, support, weight: effectiveWeight, blockNumber, txHash };
    existing.push(vote);
    this.votes.set(proposalId, existing);
    proposal.forVotes += support ? effectiveWeight : 0;
    proposal.againstVotes += !support ? effectiveWeight : 0;
    proposal.totalVotes += effectiveWeight;
    return true;
  }

  finalizeProposal(proposalId: string, currentBlock: number): boolean {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'active') return false;
    if (currentBlock <= proposal.endBlock) return false;
    const totalSupply = 1e9;
    const participation = proposal.totalVotes / totalSupply;
    if (participation < proposal.quorum) {
      proposal.status = 'rejected';
      return true;
    }
    if (proposal.forVotes > proposal.againstVotes) {
      proposal.status = 'passed';
      proposal.timelockUntil = Date.now() + this.timelockDelay * 1000;
    } else {
      proposal.status = 'rejected';
    }
    return true;
  }

  executeProposal(proposalId: string): boolean {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'passed') return false;
    if (proposal.timelockUntil && Date.now() < proposal.timelockUntil) return false;
    if (proposal.treasuryAmount && proposal.creator) {
      const balance = this.treasury.get('ARCHT') ?? 0;
      if (balance < proposal.treasuryAmount) return false;
      this.treasury.set('ARCHT', balance - proposal.treasuryAmount);
      this.treasuryTx.push({
        id: crypto.randomUUID(),
        proposalId,
        recipient: proposal.creator,
        amount: proposal.treasuryAmount,
        token: 'ARCHT',
        executedAt: Date.now(),
        txHash: ''
      });
    }
    proposal.status = 'executed';
    proposal.executedAt = Date.now();
    return true;
  }

  depositTreasury(token: string, amount: number): void {
    this.treasury.set(token, (this.treasury.get(token) ?? 0) + amount);
  }

  getTreasuryBalance(token: string): number {
    return this.treasury.get(token) ?? 0;
  }

  getProposal(id: string): Proposal | undefined {
    return this.proposals.get(id);
  }

  getProposals(status?: ProposalStatus): Proposal[] {
    const all = Array.from(this.proposals.values());
    return status ? all.filter(p => p.status === status) : all;
  }

  getVotes(proposalId: string): Vote[] {
    return this.votes.get(proposalId) ?? [];
  }
}

declare global {
  var __governanceEngine: GovernanceEngine | undefined;
}

export function getGovernanceEngine(): GovernanceEngine {
  if (!globalThis.__governanceEngine) globalThis.__governanceEngine = new GovernanceEngine();
  return globalThis.__governanceEngine;
}
