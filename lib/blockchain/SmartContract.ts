// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Smart Contract Engine
// ISO 20022 native contracts with built-in compliance
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';

export type ContractType = 'token' | 'nft' | 'defi' | 'rwa' | 'governance' | 'oracle' | 'custom' | 'erc20' | 'escrow' | 'royalty' | 'social' | 'fund' | 'protocol' | 'media' | 'payment' | 'currency';
export type ContractStatus = 'draft' | 'compiled' | 'deployed' | 'paused' | 'terminated';
export type RegistryType = 'CONTRACT' | 'ISIN' | 'VIEWSRIGHT';

export interface ContractABI {
  name: string;
  type: 'function' | 'event' | 'constructor';
  inputs: { name: string; type: string }[];
  outputs?: { name: string; type: string }[];
  stateMutability?: 'view' | 'pure' | 'nonpayable' | 'payable';
}

// ═══════════════════════════════════════════════════════════════
// RWA DETAIL MODELS — Specific data per asset class
// ═══════════════════════════════════════════════════════════════

export type RWASubType = 'MINE' | 'REAL' | 'BOND' | 'COMM' | 'GEM';

export interface MineRWA {
  rwaSubType: 'MINE';
  mineName: string;
  mineralType: string;          // GOLD, SILVER, LITHIUM, COPPER, COBALT
  location: { country: string; region: string; lat: number; lng: number };
  operator: string;
  mineType: string;             // OPEN_PIT, UNDERGROUND, PLACER
  // NI 43-101 Data
  measuredReserve: number;      // Metric tons
  indicatedReserve: number;
  inferredReserve: number;
  gradeGramsPerTon: number;
  cutoffGrade: number;
  recoveryRate: number;         // Percentage
  mineLifeYears: number;
  annualProduction: number;     // Metric tons per year
  // Financials
  allInSustainingCost: number;  // USD per oz/ton
  netPresentValue: number;
  internalRateOfReturn: number; // Percentage
  // Compliance
  ni43101Certified: boolean;
  ni43101Author: string;
  ni43101Date: string;
  environmentalPermit: string;
  socialLicense: boolean;
  images: string[];
}

export interface RealEstateRWA {
  rwaSubType: 'REAL';
  propertyName: string;
  propertyType: string;         // COMMERCIAL, RESIDENTIAL, INDUSTRIAL, MIXED, LAND
  location: { country: string; city: string; address: string; lat: number; lng: number };
  developer: string;
  // Property Data
  totalArea: number;            // sq meters
  usableArea: number;
  floors: number;
  units: number;
  yearBuilt: number;
  occupancyRate: number;        // Percentage
  // Financials
  appraisedValue: number;       // USD
  lastAppraisalDate: string;
  appraiser: string;
  annualRentalIncome: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  capRate: number;              // Percentage
  rentalYield: number;
  // Compliance
  secRegD: boolean;
  accreditedOnly: boolean;
  zoning: string;
  insuranceValue: number;
  images: string[];
}

export interface BondRWA {
  rwaSubType: 'BOND';
  bondName: string;
  bondType: string;             // GOVERNMENT, CORPORATE, GREEN, MUNICIPAL
  issuerEntity: string;
  // Bond Terms
  faceValue: number;
  couponRate: number;           // Annual percentage
  couponFrequency: string;      // SEMI_ANNUAL, QUARTERLY, ANNUAL
  maturityDate: string;
  issueDate: string;
  // Ratings
  creditRating: string;         // AAA, AA, A, BBB, BB
  ratingAgency: string;
  esgRating: string;
  // Financials
  yieldToMaturity: number;
  currentYield: number;
  duration: number;             // Years
  convexity: number;
  // Compliance
  prospectusUrl: string;
  regulatoryFramework: string;
  greenCertification: string;
  carbonOffset: number;         // Tons CO2
}

export interface GemRWA {
  rwaSubType: 'GEM';
  gemName: string;
  gemType: string;              // EMERALD, RUBY, SAPPHIRE, DIAMOND
  origin: { country: string; mine: string; region: string };
  // Gem Data
  totalCarats: number;
  averageCaratWeight: number;
  color: string;
  clarity: string;
  cut: string;
  treatment: string;            // NONE, HEAT, OIL, FILLED
  // Certification
  giaCertified: boolean;
  certificationBody: string;
  certificationNumber: string;
  // Financials
  appraisedValuePerCarat: number;
  totalAppraisedValue: number;
  lastAppraisalDate: string;
  historicalAppreciation: number; // Annual percentage
  // Custody
  custodian: string;
  vaultLocation: string;
  insured: boolean;
  insuranceValue: number;
  images: string[];
}

export interface CommodityRWA {
  rwaSubType: 'COMM';
  commodityName: string;
  commodityType: string;        // COPPER, IRON, TIN, ZINC, NICKEL
  source: { country: string; region: string };
  // Supply Data
  totalReserve: number;         // Metric tons
  provenReserve: number;
  annualExtraction: number;
  purity: number;               // Percentage
  gradeClassification: string;
  // Market Data
  spotPrice: number;
  benchmarkIndex: string;       // LME, COMEX
  contractSize: number;
  deliveryTerms: string;
  // Storage
  warehouseLocation: string;
  warehouseOperator: string;
  qualityCertification: string;
  // Compliance
  conflictFree: boolean;
  sustainabilityCertified: boolean;
}

export type RWADetail = MineRWA | RealEstateRWA | BondRWA | GemRWA | CommodityRWA;

// ═══════════════════════════════════════════════════════════════
// VIEWSRIGHT — Intellectual Property & Copyright Registry
// ═══════════════════════════════════════════════════════════════

export interface ViewsRightDetail {
  // Asset Identity
  title: string;
  workType: string;               // MUSIC, FILM, SOFTWARE, PATENT, TRADEMARK, ART, LITERATURE, PHOTOGRAPHY, DESIGN, ARCHITECTURE
  category: string;               // ORIGINAL, DERIVATIVE, COMPILATION, JOINT
  creatorName: string;
  creatorAddress: string;         // archt:creator:...
  coCreators: { name: string; share: number; address: string }[];
  // Copyright Data
  registrationNumber: string;     // VR-2025-XXXX
  registrationDate: string;
  expirationDate: string;
  jurisdiction: string;
  copyrightOffice: string;        // US Copyright Office, WIPO, etc
  // Rights Management
  rightsType: string;             // EXCLUSIVE, NON_EXCLUSIVE, SUBLICENSABLE
  licensingTerms: string;
  territorialScope: string;       // WORLDWIDE, REGIONAL, NATIONAL
  allowedUses: string[];          // COMMERCIAL, EDUCATIONAL, PERSONAL, STREAMING, BROADCAST
  restrictedUses: string[];
  // Royalties
  royaltyRate: number;            // Percentage
  royaltyFrequency: string;      // PER_USE, MONTHLY, QUARTERLY, ANNUAL
  totalRoyaltiesEarned: number;
  totalDistributions: number;
  royaltyRecipients: { name: string; share: number; address: string }[];
  // Verification
  fingerprint: string;            // Digital fingerprint / hash of the work
  ipfsHash: string;              // Decentralized storage
  timestampProof: string;        // On-chain timestamp
  wipo: boolean;                  // WIPO registered
  dmcaProtected: boolean;
  // Valuation
  estimatedValue: number;
  lastValuationDate: string;
  licensingRevenue: number;       // Annual
  activeContracts: number;        // Number of active licensing contracts
  // Metadata
  description: string;
  tags: string[];
  externalUrls: string[];
  thumbnailUrl: string;
}

export interface ISINContract {
  isin: string;
  tokenSymbol: string;
  tokenName: string;
  totalSupply: number;
  circulatingSupply: number;
  holders: number;
  price: number;
  marketCap: number;
  lei: string;
  jurisdiction: string;
  complianceScore: number;
  createdBlock: number;
  parentContractAddress: string;
  isinContractAddress: string;
}

// ═══════════════════════════════════════════════════════════════
// ENTITY & VERIFICATION TYPES
// ═══════════════════════════════════════════════════════════════

export type EntityType =
  | 'PERSON'          // Individual
  | 'COMPANY'         // Private company
  | 'INSTITUTION'     // Bank, exchange, fund
  | 'GOVERNMENT'      // Government / sovereign entity
  | 'DAO'             // Decentralized autonomous organization
  | 'MUSICIAN'        // Artist / musician
  | 'FILMMAKER'       // Film / media producer
  | 'DEVELOPER'       // Software developer
  | 'INFLUENCER'      // Public figure / influencer
  | 'ARCHITECT'       // Architect / designer
  | 'SCIENTIST'       // Researcher / scientist
  | 'ATTORNEY'        // Legal professional
  | 'AUDITOR'         // Financial auditor
  | 'MINER'           // Mining operator
  | 'REALTOR'         // Real estate professional
  | 'DOCTOR'          // Medical professional
  | 'ENGINEER'        // Engineer (civil, mechanical, etc.)
  | 'AI_RESEARCHER'   // AI / ML specialist
  | 'ATHLETE'         // Professional athlete / sports
  | 'TRADER'          // Financial trader
  | 'JOURNALIST'      // Media / journalist
  | 'PROFESSOR'       // Academic / professor
  | 'CHEF'            // Culinary professional
  | 'PILOT'           // Aviation professional
  | 'MILITARY'        // Military / defense
  | 'NGO'             // Non-profit organization
  | 'PHARMA'          // Pharmaceutical
  | 'ENERGY'          // Energy sector
  | 'TELECOM'         // Telecommunications
  | 'ESPORTS'         // Esports / gaming pro
  | 'DESIGNER'        // Fashion / product designer
  | 'BANK'            // Certified banking institution
  | 'FINTECH'         // Certified fintech company
  | 'CENTRAL_BANK'    // Central bank / monetary authority
  | 'PAYMENT_PROCESSOR' // Payment processor (Visa, Mastercard, etc.)
  | 'NEOBANK'         // Digital-only bank
  | 'EXCHANGE';       // Crypto / asset exchange

export type VerificationSeal =
  | 'VERIFIED'        // General verification (blue check)
  | 'VR_VERIFIED'     // ViewsRight verified (purple seal)
  | 'IS_VERIFIED'     // ISIN verified (blue seal)
  | 'GOV_VERIFIED'    // Government verified (gold seal)
  | 'INST_VERIFIED'   // Institution verified (silver seal)
  | 'PRO_VERIFIED'    // Professional verified (green seal)
  | 'PRIVACY_SHIELD'; // Verified but identity hidden

export type WalletVisibility = 'PUBLIC' | 'PRIVATE' | 'ANONYMOUS';

export interface VerificationData {
  verified: boolean;
  seal: VerificationSeal;                          // Primary seal type
  level: 'NONE' | 'BASIC' | 'STANDARD' | 'FULL';
  // Entity
  entityType: EntityType;
  entityName?: string;                              // Display name (hidden if private)
  entityCategory?: string;                          // Sub-category (e.g., "Gold Mining", "Hip-Hop")
  // Core checks
  kycCompleted: boolean;
  kybCompleted: boolean;
  isinRegistered: boolean;
  auditPassed: boolean;
  legalEntity: boolean;
  complianceApproved: boolean;
  // Extended checks
  governmentBacked?: boolean;                      // Issued/backed by government
  institutionalGrade?: boolean;                    // Meets institutional standards
  professionalLicense?: string;                    // License number
  // Privacy
  walletVisibility: WalletVisibility;
  privacyShield: boolean;                          // Identity verified but hidden from public
  // Metadata
  verifiedAt?: number;
  verifiedBy?: string;
  expiresAt?: number;                              // Verification expiry
  badges: string[];                                // Visual badges
  seals: VerificationSeal[];                       // All seals earned
}

export interface SmartContract {
  id: string;
  address: string;
  name: string;
  description: string;
  type: ContractType;
  status: ContractStatus;
  sourceCode: string;
  bytecode: string;
  abi: ContractABI[];
  owner: string;
  createdAt: number;
  deployedAt?: number;
  deployBlock?: number;
  deployTxHash?: string;
  gasUsed: number;
  storage: Record<string, any>;
  isoCompliant: boolean;
  auditScore: number;
  version: string;
  interactions: number;
  balance: number;
  // Registry classification
  registryType: RegistryType;    // CONTRACT, ISIN, VIEWSRIGHT
  isinAddr?: string;             // Associated ISIN address
  // Branding
  logoUrl?: string;              // Contract logo/image URL
  // Verification (expanded)
  verification?: VerificationData;
  // RWA Specifics
  rwaDetail?: RWADetail;
  isinContract?: ISINContract;
  viewsRight?: ViewsRightDetail;
}

export interface CompileResult {
  success: boolean;
  bytecode?: string;
  abi?: ContractABI[];
  errors?: string[];
  warnings?: string[];
  gasEstimate?: number;
  auditScore?: number;
  auditNotes?: string[];
}

// ═══════════════════════════════════════════════════════════════
// AI SECURITY AUDIT ENGINE
// ═══════════════════════════════════════════════════════════════

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AuditFinding {
  id: string;
  title: string;
  description: string;
  risk: RiskLevel;
  category: string;
  line?: string;         // The code line that triggered the finding
  recommendation: string;
  impact: string;
}

export interface AuditResult {
  score: number;           // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  deployable: boolean;     // false if score < 60
  requiresReview: boolean; // true if score < 85
  findings: AuditFinding[];
  summary: string;
  gasOptimization: string[];
  isoCompliance: { compliant: boolean; notes: string[] };
  stats: {
    totalLines: number;
    functions: number;
    events: number;
    modifiers: number;
    stateVariables: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
  };
}

export function auditContract(sourceCode: string): AuditResult {
  const lines = sourceCode.split('\n');
  const findings: AuditFinding[] = [];
  let score = 100;

  // ── STATS ─────────────────────────────────────────────
  const funcCount = (sourceCode.match(/function\s+\w+/g) || []).length;
  const eventCount = (sourceCode.match(/event\s+\w+/g) || []).length;
  const modifierCount = (sourceCode.match(/modifier\s+\w+/g) || []).length;
  const stateVarCount = (sourceCode.match(/(string|uint256|address|bool|mapping)\s+(public|private|internal)?\s+\w+/g) || []).length;

  // ═══ CRITICAL VULNERABILITIES ═════════════════════════
  
  // 1. Reentrancy
  if (sourceCode.includes('.call{value:') || sourceCode.includes('.call.value(')) {
    findings.push({
      id: 'VULN-001', title: 'Reentrancy Vulnerability Detected',
      description: 'External calls with value transfer detected. An attacker could recursively call back into the contract before the first execution completes, draining funds.',
      risk: 'critical', category: 'Security',
      line: lines.find(l => l.includes('.call{value:') || l.includes('.call.value('))?.trim(),
      recommendation: 'Use the Checks-Effects-Interactions pattern. Update state variables BEFORE making external calls. Consider using ReentrancyGuard.',
      impact: 'Complete loss of contract funds. Attackers can drain the entire balance.',
    });
    score -= 30;
  }

  // 2. Selfdestruct
  if (sourceCode.includes('selfdestruct') || sourceCode.includes('suicide(')) {
    findings.push({
      id: 'VULN-002', title: 'Self-Destruct Function Present',
      description: 'The contract contains a selfdestruct call which can permanently destroy the contract and send all remaining funds to an arbitrary address.',
      risk: 'critical', category: 'Security',
      line: lines.find(l => l.includes('selfdestruct') || l.includes('suicide('))?.trim(),
      recommendation: 'Remove selfdestruct entirely. Use a pause mechanism instead if you need to disable the contract.',
      impact: 'Permanent loss of contract and all associated data, tokens, and assets.',
    });
    score -= 35;
  }

  // 3. Delegatecall
  if (sourceCode.includes('delegatecall')) {
    findings.push({
      id: 'VULN-003', title: 'Delegatecall Usage Detected',
      description: 'Delegatecall executes code in the context of the calling contract. If the target is user-controlled, it can modify your contract\'s storage arbitrarily.',
      risk: 'critical', category: 'Security',
      line: lines.find(l => l.includes('delegatecall'))?.trim(),
      recommendation: 'Only delegatecall to trusted, verified contracts. Never allow user input to determine the target.',
      impact: 'Complete contract takeover. Attacker can modify all storage, steal funds, and change ownership.',
    });
    score -= 25;
  }

  // 4. tx.origin authentication
  if (sourceCode.includes('tx.origin')) {
    findings.push({
      id: 'VULN-004', title: 'tx.origin Used for Authentication',
      description: 'Using tx.origin for authorization is vulnerable to phishing attacks. A malicious contract can trick users into calling it, then forward the call to your contract.',
      risk: 'critical', category: 'Authentication',
      line: lines.find(l => l.includes('tx.origin'))?.trim(),
      recommendation: 'Replace tx.origin with msg.sender for all authentication checks.',
      impact: 'Unauthorized access. Attackers can impersonate users through intermediary contracts.',
    });
    score -= 20;
  }

  // ═══ HIGH RISK ════════════════════════════════════════

  // 5. No access control
  const hasAccessControl = sourceCode.includes('onlyOwner') || sourceCode.includes('modifier') || sourceCode.includes('require(msg.sender');
  if (!hasAccessControl && funcCount > 0) {
    findings.push({
      id: 'SEC-001', title: 'No Access Control',
      description: 'No ownership or role-based access control found. Any address can call all public functions, including administrative ones.',
      risk: 'high', category: 'Access Control',
      recommendation: 'Add onlyOwner modifier or role-based access control (RBAC) to sensitive functions like mint, burn, pause, withdraw, and configuration changes.',
      impact: 'Unauthorized users can execute admin functions, modify critical parameters, or steal funds.',
    });
    score -= 15;
  }

  // 6. No input validation
  if (!sourceCode.includes('require(') && !sourceCode.includes('revert(') && funcCount > 0) {
    findings.push({
      id: 'SEC-002', title: 'No Input Validation',
      description: 'No require() or revert() statements found. Functions accept any input without validation, making them vulnerable to unexpected values.',
      risk: 'high', category: 'Validation',
      recommendation: 'Add require() checks for: zero addresses, sufficient balances, valid amounts, overflow protection, and parameter bounds.',
      impact: 'Invalid state transitions, underflow/overflow, transfers to zero address, division by zero.',
    });
    score -= 15;
  }

  // 7. Unchecked math (no SafeMath / unchecked)
  if ((sourceCode.includes('+=') || sourceCode.includes('-=') || sourceCode.includes('*')) && !sourceCode.includes('SafeMath') && !sourceCode.includes('unchecked')) {
    findings.push({
      id: 'SEC-003', title: 'Arithmetic Without Overflow Protection',
      description: 'Mathematical operations found without explicit overflow/underflow protection.',
      risk: 'high', category: 'Arithmetic',
      line: lines.find(l => l.includes('+=') || l.includes('-='))?.trim(),
      recommendation: 'Use Solidity 0.8+ built-in overflow checks, or use SafeMath library for critical calculations.',
      impact: 'Integer overflow/underflow can lead to incorrect balances, allowing attackers to mint or steal tokens.',
    });
    score -= 10;
  }

  // 8. Hardcoded addresses
  const hardcodedAddr = sourceCode.match(/0x[a-fA-F0-9]{40}/g);
  if (hardcodedAddr && hardcodedAddr.length > 0) {
    findings.push({
      id: 'SEC-004', title: 'Hardcoded Addresses Found',
      description: `${hardcodedAddr.length} hardcoded address(es) detected. These cannot be changed after deployment.`,
      risk: 'medium', category: 'Configuration',
      line: lines.find(l => /0x[a-fA-F0-9]{40}/.test(l))?.trim(),
      recommendation: 'Use constructor parameters or admin-settable addresses instead of hardcoded values. This allows for upgrades and emergency changes.',
      impact: 'If a hardcoded address is compromised or needs to change, the entire contract must be redeployed.',
    });
    score -= 5;
  }

  // ═══ MEDIUM RISK ══════════════════════════════════════

  // 9. No events
  if (eventCount === 0 && funcCount > 0) {
    findings.push({
      id: 'QUAL-001', title: 'No Events Emitted',
      description: 'No event declarations or emissions found. State changes are not logged on-chain, making the contract non-auditable.',
      risk: 'medium', category: 'Transparency',
      recommendation: 'Emit events for every critical state change: transfers, approvals, configuration updates, and admin actions. This is required for ISO 20022 compliance.',
      impact: 'Off-chain systems and explorers cannot track contract activity. Violates ISO 20022 audit trail requirements.',
    });
    score -= 10;
  }

  // 10. No constructor
  if (!sourceCode.includes('constructor(') && !sourceCode.includes('constructor (')) {
    findings.push({
      id: 'QUAL-002', title: 'No Constructor',
      description: 'No constructor found. State variables may remain uninitialized after deployment.',
      risk: 'medium', category: 'Initialization',
      recommendation: 'Add a constructor to initialize critical state: owner address, token supply, and configuration parameters.',
      impact: 'Default zero values for owner and balances can lead to a locked or unusable contract.',
    });
    score -= 5;
  }

  // 11. Block timestamp dependency
  if (sourceCode.includes('block.timestamp') || sourceCode.includes('now')) {
    findings.push({
      id: 'SEC-005', title: 'Timestamp Dependency',
      description: 'Contract logic depends on block.timestamp. Miners/validators can manipulate this value by a few seconds.',
      risk: 'medium', category: 'Timing',
      line: lines.find(l => l.includes('block.timestamp') || l.includes('now'))?.trim(),
      recommendation: 'Do not use block.timestamp for critical logic like random number generation or time-sensitive locks with tight windows.',
      impact: 'Validators can manipulate timestamps to gain advantages in time-dependent operations.',
    });
    score -= 5;
  }

  // 12. Missing zero-address check
  if (sourceCode.includes('transfer') && !sourceCode.includes('address(0)') && !sourceCode.includes('!= 0x0')) {
    findings.push({
      id: 'SEC-006', title: 'Missing Zero-Address Validation',
      description: 'Transfer functions found without zero-address checks. Tokens sent to 0x0 are permanently lost.',
      risk: 'medium', category: 'Validation',
      recommendation: 'Add require(_to != address(0), "Cannot transfer to zero address") to all transfer functions.',
      impact: 'Users can accidentally burn tokens by sending to the zero address.',
    });
    score -= 5;
  }

  // ═══ LOW / INFO ═══════════════════════════════════════

  // 13. No license
  if (!sourceCode.includes('SPDX') && !sourceCode.includes('license') && !sourceCode.includes('License')) {
    findings.push({
      id: 'INFO-001', title: 'No License Identifier',
      description: 'No SPDX license identifier found. This may cause issues with source verification.',
      risk: 'info', category: 'Metadata',
      recommendation: 'Add // SPDX-License-Identifier: MIT (or appropriate) at the top of your contract.',
      impact: 'Minor. May prevent source code verification on block explorers.',
    });
  }

  // 14. Large contract
  if (lines.length > 500) {
    findings.push({
      id: 'INFO-002', title: 'Large Contract Size',
      description: `Contract has ${lines.length} lines. Large contracts increase deployment cost and audit complexity.`,
      risk: 'low', category: 'Gas Optimization',
      recommendation: 'Consider splitting into multiple contracts using inheritance or libraries to reduce gas costs.',
      impact: 'Higher deployment gas costs and increased attack surface.',
    });
    score -= 3;
  }

  // 15. Public state that should be private
  const publicVars = (sourceCode.match(/\bpublic\b/g) || []).length;
  const privateVars = (sourceCode.match(/\bprivate\b/g) || []).length;
  if (publicVars > 5 && privateVars === 0) {
    findings.push({
      id: 'QUAL-003', title: 'Excessive Public State Variables',
      description: `${publicVars} public variables and 0 private. Consider if all state needs to be publicly exposed.`,
      risk: 'low', category: 'Privacy',
      recommendation: 'Use private or internal for variables that don\'t need external read access. Expose through getter functions if needed.',
      impact: 'Minor. Unnecessary gas for auto-generated getters and potential information exposure.',
    });
    score -= 3;
  }

  // 16. Floating pragma
  if (sourceCode.includes('pragma solidity ^') || sourceCode.includes('pragma solidity >=')) {
    findings.push({
      id: 'QUAL-004', title: 'Floating Pragma Version',
      description: 'Using a floating pragma (^/>=) means the contract can compile with different compiler versions, leading to inconsistent behavior.',
      risk: 'low', category: 'Configuration',
      line: lines.find(l => l.includes('pragma solidity'))?.trim(),
      recommendation: 'Lock the pragma to a specific version (e.g., pragma solidity 0.8.20) for deterministic compilation.',
      impact: 'Minor. Different compiler versions may produce different bytecode or have different optimizations.',
    });
    score -= 2;
  }

  // ═══ POSITIVE FINDINGS (ISO 20022 COMPLIANCE) ════════

  const isoNotes: string[] = [];
  let isoCompliant = false;

  if (sourceCode.toLowerCase().includes('isin') || sourceCode.toLowerCase().includes('iso')) {
    isoNotes.push('ISIN/ISO references found — contract appears designed for regulated instruments');
    isoCompliant = true;
    score = Math.min(score + 3, 100);
  }
  if (sourceCode.toLowerCase().includes('lei')) {
    isoNotes.push('LEI (Legal Entity Identifier) integration detected');
    isoCompliant = true;
    score = Math.min(score + 2, 100);
  }
  if (sourceCode.toLowerCase().includes('compliance') || sourceCode.toLowerCase().includes('kyc') || sourceCode.toLowerCase().includes('aml')) {
    isoNotes.push('Compliance/KYC/AML logic detected — regulatory readiness');
    isoCompliant = true;
    score = Math.min(score + 2, 100);
  }
  if (sourceCode.toLowerCase().includes('jurisdiction')) {
    isoNotes.push('Jurisdiction-aware contract — multi-regulatory support');
    isoCompliant = true;
  }
  if (eventCount >= 3) {
    isoNotes.push(`${eventCount} events provide adequate on-chain audit trail`);
  }
  if (hasAccessControl) {
    isoNotes.push('Access control present — meets institutional requirements');
  }

  // ═══ GAS OPTIMIZATION TIPS ════════════════════════════

  const gasOpt: string[] = [];
  if (sourceCode.includes('string ') && (sourceCode.match(/string\s+public/g) || []).length > 3) {
    gasOpt.push('Consider using bytes32 instead of string for short identifiers — saves ~20,000 gas per variable');
  }
  if (sourceCode.includes('mapping') && sourceCode.includes('[]')) {
    gasOpt.push('Prefer mappings over arrays for lookups — O(1) vs O(n) gas complexity');
  }
  if (lines.length > 200 && !sourceCode.includes('library') && !sourceCode.includes('internal')) {
    gasOpt.push('Extract reusable logic into libraries or internal functions to reduce bytecode size');
  }
  if ((sourceCode.match(/storage/g) || []).length > 10) {
    gasOpt.push('Minimize storage writes — each SSTORE costs 20,000 gas. Use memory variables for intermediate calculations');
  }

  // ═══ CALCULATE FINAL ══════════════════════════════════

  score = Math.max(score, 0);

  const critCount = findings.filter(f => f.risk === 'critical').length;
  const highCount = findings.filter(f => f.risk === 'high').length;
  const medCount = findings.filter(f => f.risk === 'medium').length;
  const lowCount = findings.filter(f => f.risk === 'low').length;
  const infoCount = findings.filter(f => f.risk === 'info').length;

  let grade: AuditResult['grade'];
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  const deployable = score >= 60 && critCount === 0;
  const requiresReview = score < 85 || critCount > 0 || highCount > 0;

  let summary: string;
  if (score >= 90 && critCount === 0) {
    summary = 'This contract meets 20022Chain security standards. No critical vulnerabilities detected. Ready for deployment.';
  } else if (score >= 70 && critCount === 0) {
    summary = 'This contract has some issues that should be addressed. Review the findings and fix high-priority items before deploying to production.';
  } else if (critCount > 0) {
    summary = `CRITICAL: ${critCount} critical vulnerability(ies) detected. This contract MUST NOT be deployed until all critical issues are resolved. Funds and assets are at risk.`;
  } else {
    summary = 'This contract has significant security concerns. A thorough review and rewrite of vulnerable sections is strongly recommended before any deployment.';
  }

  return {
    score, grade, deployable, requiresReview,
    findings: findings.sort((a, b) => {
      const order: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return order[a.risk] - order[b.risk];
    }),
    summary,
    gasOptimization: gasOpt,
    isoCompliance: { compliant: isoCompliant, notes: isoNotes },
    stats: {
      totalLines: lines.length,
      functions: funcCount,
      events: eventCount,
      modifiers: modifierCount,
      stateVariables: stateVarCount,
      criticalCount: critCount,
      highCount: highCount,
      mediumCount: medCount,
      lowCount: lowCount,
      infoCount: infoCount,
    },
  };
}

export interface DeployResult {
  success: boolean;
  address?: string;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONTRACT TEMPLATES
// ═══════════════════════════════════════════════════════════════

export const CONTRACT_TEMPLATES: Record<string, { name: string; description: string; type: ContractType; code: string; icon: string }> = {
  rwa_token: {
    name: 'RWA Token (ISO 20022)',
    description: 'Tokenize any Real World Asset with built-in ISO 20022 compliance, ISIN registry, and automated reporting.',
    type: 'rwa',
    icon: '🏛️',
    code: `// 20022Chain Smart Contract — RWA Token
// ISO 20022 Compliant · ISIN Registered · Auditable

contract RWAToken {
    // Token metadata
    string  public name;
    string  public symbol;
    string  public isin;          // ISO 6166 identifier
    string  public lei;           // Legal Entity Identifier
    uint256 public totalSupply;
    uint8   public decimals = 18;
    
    // ISO 20022 compliance
    string  public rwaType;       // MINE, REAL, BOND, COMM, GEM
    string  public jurisdiction;
    uint256 public complianceScore;
    bool    public isVerified;
    
    // Balances & allowances
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    // Events (ISO 20022 message types)
    event Transfer(address from, address to, uint256 amount);      // pacs.008
    event Approval(address owner, address spender, uint256 amount);
    event ISINRegistered(string isin, string name, string rwaType); // setr.012
    event ComplianceUpdate(uint256 newScore);                       // semt.002
    event DividendDistributed(uint256 amount, uint256 holders);     // seev.031
    
    constructor(
        string _name,
        string _symbol,
        string _isin,
        string _lei,
        string _rwaType,
        string _jurisdiction,
        uint256 _initialSupply
    ) {
        name = _name;
        symbol = _symbol;
        isin = _isin;
        lei = _lei;
        rwaType = _rwaType;
        jurisdiction = _jurisdiction;
        totalSupply = _initialSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
        complianceScore = 100;
        isVerified = false;
        
        emit ISINRegistered(_isin, _name, _rwaType);
    }
    
    function transfer(address _to, uint256 _amount) public returns (bool) {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
        require(_to != address(0), "Invalid recipient");
        
        balanceOf[msg.sender] -= _amount;
        balanceOf[_to] += _amount;
        
        emit Transfer(msg.sender, _to, _amount);
        return true;
    }
    
    function approve(address _spender, uint256 _amount) public returns (bool) {
        allowance[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }
    
    function distributeDividend(uint256 _amount) public onlyOwner {
        // Distribute proportionally to all holders
        emit DividendDistributed(_amount, 0);
    }
    
    function updateCompliance(uint256 _score) public onlyAuditor {
        complianceScore = _score;
        emit ComplianceUpdate(_score);
    }
}`,
  },
  mining_reserve: {
    name: 'Mining Reserve Token',
    description: 'Tokenize verified mining reserves with NI 43-101 data integration, resource estimates, and yield distribution.',
    type: 'rwa',
    icon: '⛏️',
    code: `// 20022Chain Smart Contract — Mining Reserve
// NI 43-101 Verified · ISO 20022 · Yield Bearing

contract MiningReserve {
    string  public name;
    string  public symbol;
    string  public isin;
    string  public mineLocation;
    string  public mineralType;       // GOLD, SILVER, LITHIUM, COPPER, etc.
    
    // Reserve data (NI 43-101)
    uint256 public measuredReserve;   // In metric tons
    uint256 public indicatedReserve;
    uint256 public inferredReserve;
    uint256 public gradeGramsPerTon;
    
    // Token economics
    uint256 public totalSupply;
    uint256 public pricePerToken;
    uint256 public annualYield;       // Basis points (250 = 2.5%)
    
    mapping(address => uint256) public balanceOf;
    
    event ReserveUpdated(uint256 measured, uint256 indicated, uint256 inferred);
    event YieldDistributed(uint256 totalAmount, uint256 timestamp);
    event AuditCompleted(string auditor, uint256 score, uint256 timestamp);
    
    constructor(
        string _name, string _symbol, string _isin,
        string _location, string _mineral,
        uint256 _measured, uint256 _indicated, uint256 _inferred,
        uint256 _supply
    ) {
        name = _name; symbol = _symbol; isin = _isin;
        mineLocation = _location; mineralType = _mineral;
        measuredReserve = _measured;
        indicatedReserve = _indicated;
        inferredReserve = _inferred;
        totalSupply = _supply;
        balanceOf[msg.sender] = _supply;
        annualYield = 350; // 3.5% default
    }
    
    function transfer(address _to, uint256 _amount) public returns (bool) {
        require(balanceOf[msg.sender] >= _amount);
        balanceOf[msg.sender] -= _amount;
        balanceOf[_to] += _amount;
        return true;
    }
    
    function updateReserves(uint256 _m, uint256 _i, uint256 _inf) public onlyOwner {
        measuredReserve = _m;
        indicatedReserve = _i;
        inferredReserve = _inf;
        emit ReserveUpdated(_m, _i, _inf);
    }
    
    function distributeYield() public onlyOwner {
        uint256 yieldAmount = (totalSupply * annualYield) / 10000 / 12;
        emit YieldDistributed(yieldAmount, block.timestamp);
    }
}`,
  },
  real_estate: {
    name: 'Real Estate Token (REIT)',
    description: 'Fractional real estate ownership with rental income distribution, property valuation oracle, and regulatory compliance.',
    type: 'rwa',
    icon: '🏢',
    code: `// 20022Chain Smart Contract — Real Estate Token
// SEC Reg D Compliant · Rental Yield · Property Backed

contract RealEstateToken {
    string  public name;
    string  public symbol;
    string  public isin;
    string  public propertyAddress;
    string  public propertyType;     // COMMERCIAL, RESIDENTIAL, INDUSTRIAL
    uint256 public propertyValue;    // In USD cents
    uint256 public totalSupply;
    uint256 public rentalYield;      // Annual basis points
    
    mapping(address => uint256) public balanceOf;
    mapping(address => bool) public isAccreditedInvestor;
    
    event RentalDistributed(uint256 amount, uint256 period);
    event PropertyValuationUpdated(uint256 newValue, string appraiser);
    event InvestorAccredited(address investor);
    
    constructor(
        string _name, string _symbol, string _isin,
        string _address, string _type,
        uint256 _value, uint256 _supply, uint256 _yield
    ) {
        name = _name; symbol = _symbol; isin = _isin;
        propertyAddress = _address; propertyType = _type;
        propertyValue = _value; totalSupply = _supply;
        rentalYield = _yield;
        balanceOf[msg.sender] = _supply;
    }
    
    function transfer(address _to, uint256 _amount) public returns (bool) {
        require(isAccreditedInvestor[_to], "Recipient must be accredited");
        require(balanceOf[msg.sender] >= _amount);
        balanceOf[msg.sender] -= _amount;
        balanceOf[_to] += _amount;
        return true;
    }
    
    function distributeRental(uint256 _amount) public onlyOwner {
        emit RentalDistributed(_amount, block.timestamp);
    }
    
    function updateValuation(uint256 _value, string _appraiser) public onlyOracle {
        propertyValue = _value;
        emit PropertyValuationUpdated(_value, _appraiser);
    }
}`,
  },
  green_bond: {
    name: 'Green Bond Token',
    description: 'Tokenized green bond with fixed income, maturity date, coupon payments, and ESG compliance tracking.',
    type: 'rwa',
    icon: '🌱',
    code: `// 20022Chain Smart Contract — Green Bond
// ESG Compliant · Fixed Income · ISO 20022

contract GreenBond {
    string  public name;
    string  public symbol;
    string  public isin;
    uint256 public faceValue;         // Per bond unit
    uint256 public couponRate;        // Annual basis points
    uint256 public maturityDate;      // Unix timestamp
    uint256 public totalSupply;
    string  public esgRating;         // AAA, AA, A, BBB
    uint256 public carbonOffset;      // Tons CO2 offset
    
    mapping(address => uint256) public balanceOf;
    
    event CouponPaid(uint256 amount, uint256 period);
    event MaturityReached(uint256 totalRedeemed);
    event ESGUpdated(string newRating, uint256 carbonOffset);
    
    constructor(
        string _name, string _symbol, string _isin,
        uint256 _faceValue, uint256 _couponRate, uint256 _maturity,
        uint256 _supply, string _esgRating
    ) {
        name = _name; symbol = _symbol; isin = _isin;
        faceValue = _faceValue; couponRate = _couponRate;
        maturityDate = _maturity; totalSupply = _supply;
        esgRating = _esgRating;
        balanceOf[msg.sender] = _supply;
    }
    
    function transfer(address _to, uint256 _amount) public returns (bool) {
        require(balanceOf[msg.sender] >= _amount);
        balanceOf[msg.sender] -= _amount;
        balanceOf[_to] += _amount;
        return true;
    }
    
    function payCoupon() public onlyIssuer {
        uint256 payment = (totalSupply * faceValue * couponRate) / 10000 / 2;
        emit CouponPaid(payment, block.timestamp);
    }
    
    function redeem() public {
        require(block.timestamp >= maturityDate, "Bond not matured");
        uint256 amount = balanceOf[msg.sender];
        balanceOf[msg.sender] = 0;
        emit MaturityReached(amount);
    }
}`,
  },
  governance: {
    name: 'DAO Governance',
    description: 'Decentralized governance for asset management with proposal creation, weighted voting, and timelock execution.',
    type: 'governance',
    icon: '🗳️',
    code: `// 20022Chain Smart Contract — DAO Governance
// Weighted Voting · Timelock · Multi-sig

contract Governance {
    string public name;
    uint256 public proposalCount;
    uint256 public quorumPercentage = 51;
    uint256 public votingPeriod = 7 days;
    
    struct Proposal {
        uint256 id;
        string  title;
        string  description;
        address proposer;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool    executed;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public votingPower;
    
    event ProposalCreated(uint256 id, string title, address proposer);
    event VoteCast(uint256 proposalId, address voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 id);
    
    function createProposal(string _title, string _desc) public returns (uint256) {
        require(votingPower[msg.sender] > 0, "No voting power");
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount, title: _title, description: _desc,
            proposer: msg.sender, forVotes: 0, againstVotes: 0,
            startTime: block.timestamp, endTime: block.timestamp + votingPeriod,
            executed: false
        });
        emit ProposalCreated(proposalCount, _title, msg.sender);
        return proposalCount;
    }
    
    function vote(uint256 _proposalId, bool _support) public {
        Proposal storage p = proposals[_proposalId];
        require(block.timestamp <= p.endTime, "Voting ended");
        uint256 weight = votingPower[msg.sender];
        if (_support) p.forVotes += weight;
        else p.againstVotes += weight;
        emit VoteCast(_proposalId, msg.sender, _support, weight);
    }
}`,
  },
};

// ═══════════════════════════════════════════════════════════════
// AI PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════════

export const AI_PROMPTS: { id: string; label: string; prompt: string }[] = [
  { id: 'rwa', label: 'Tokenize an Asset', prompt: 'Create a smart contract to tokenize a [ASSET_TYPE] with ISIN registration, transfer restrictions, and yield distribution.' },
  { id: 'defi', label: 'DeFi Protocol', prompt: 'Create a lending/borrowing smart contract with collateralization ratios, liquidation, and interest accrual.' },
  { id: 'nft', label: 'NFT Collection', prompt: 'Create an NFT contract for [COLLECTION_NAME] with minting, royalties, and metadata URI.' },
  { id: 'dao', label: 'DAO Governance', prompt: 'Create a governance contract with proposal creation, token-weighted voting, and timelock execution.' },
  { id: 'oracle', label: 'Price Oracle', prompt: 'Create an oracle contract that feeds real-world asset prices on-chain with multi-source validation.' },
  { id: 'vest', label: 'Token Vesting', prompt: 'Create a vesting contract with cliff period, linear release schedule, and revocation capability.' },
];

// ═══════════════════════════════════════════════════════════════
// CONTRACT MANAGER (Singleton)
// ═══════════════════════════════════════════════════════════════

class ContractManager {
  public contracts: Map<string, SmartContract> = new Map();
  private deployCount = 0;

  constructor() {
    // Deploy some initial contracts
    this.seedContracts();
  }

  private generateNativeAddress(context: string): string {
    const hash = crypto.randomBytes(12).toString('hex');
    const clean = context.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
    return `archt:contract:${clean}:${hash}`;
  }

  private generateOwnerAddress(ownerName?: string): string {
    const hash = crypto.randomBytes(12).toString('hex');
    if (ownerName) {
      const clean = ownerName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20);
      return `archt:owner:${clean}:${hash}`;
    }
    return `archt:account:${hash}`;
  }

  private generateNativeTxHash(): string {
    return `tx:${crypto.randomBytes(32).toString('hex')}`;
  }

  private seedContracts() {
    const base = (name: string, desc: string, type: ContractType, template: string, owner: string, i: number, regType: RegistryType = 'CONTRACT', logo?: string): SmartContract => {
      const id = crypto.randomBytes(8).toString('hex');
      const addr = this.generateNativeAddress(name);
      const tmpl = CONTRACT_TEMPLATES[template];
      const isinAddr = this.generateNativeAddress(`isin-${name}`);
      const auditScore = 92 + Math.floor(Math.random() * 8);
      return {
        id, address: addr, name, description: desc || tmpl?.description || '',
        type, status: 'deployed' as ContractStatus, sourceCode: tmpl?.code || '',
        bytecode: crypto.randomBytes(256).toString('hex'),
        abi: this.generateABI(template), owner: this.generateOwnerAddress(owner),
        createdAt: Date.now() - (i + 1) * 86400000, deployedAt: Date.now() - i * 86400000,
        deployBlock: 100 + i * 50, deployTxHash: this.generateNativeTxHash(),
        gasUsed: 2100000 + Math.floor(Math.random() * 900000), storage: {},
        isoCompliant: true, auditScore,
        version: '1.0.0', interactions: Math.floor(Math.random() * 5000),
        balance: Math.floor(Math.random() * 1000000), isinAddr, registryType: regType,
        logoUrl: logo || '',
      } as SmartContract;
    };

    // Helper to build verification object (expanded)
    const verify = (opts: {
      kyc: boolean; kyb: boolean; isin: boolean; audit: boolean; lei: boolean; iso: boolean;
      by?: string; entity?: EntityType; category?: string;
      seal?: VerificationSeal; gov?: boolean; inst?: boolean; license?: string;
      visibility?: WalletVisibility; privacy?: boolean;
    }): VerificationData => {
      const { kyc, kyb, isin, audit, lei, iso, by, entity, category, seal, gov, inst, license, visibility, privacy } = opts;
      const badges: string[] = [];
      const seals: VerificationSeal[] = [];
      if (kyc) badges.push('KYC');
      if (kyb) badges.push('KYB');
      if (isin) { badges.push('ISIN'); seals.push('IS_VERIFIED'); }
      if (audit) badges.push('AUDIT');
      if (lei) badges.push('LEI');
      if (iso) badges.push('ISO');
      if (gov) { badges.push('GOV'); seals.push('GOV_VERIFIED'); }
      if (inst) { badges.push('INST'); seals.push('INST_VERIFIED'); }
      if (privacy) seals.push('PRIVACY_SHIELD');
      const all = kyc && kyb && isin && audit && lei && iso;
      const standard = kyc && kyb && audit;
      const level = all ? 'FULL' as const : standard ? 'STANDARD' as const : (kyc || kyb) ? 'BASIC' as const : 'NONE' as const;
      const primarySeal: VerificationSeal = seal || (gov ? 'GOV_VERIFIED' : inst ? 'INST_VERIFIED' : isin ? 'IS_VERIFIED' : badges.length >= 4 ? 'VERIFIED' : privacy ? 'PRIVACY_SHIELD' : 'VERIFIED');
      if (!seals.includes(primarySeal)) seals.unshift(primarySeal);
      return {
        verified: badges.length >= 4,
        seal: primarySeal,
        level,
        entityType: entity || 'COMPANY',
        entityCategory: category,
        kycCompleted: kyc, kybCompleted: kyb, isinRegistered: isin,
        auditPassed: audit, legalEntity: lei, complianceApproved: iso,
        governmentBacked: gov, institutionalGrade: inst,
        professionalLicense: license,
        walletVisibility: visibility || 'PUBLIC',
        privacyShield: privacy || false,
        verifiedAt: all ? Date.now() - Math.floor(Math.random() * 30) * 86400000 : undefined,
        verifiedBy: by || (all ? '20022Chain Verification Authority' : undefined),
        expiresAt: Date.now() + 365 * 86400000,
        badges, seals,
      };
    };

    // ═══════════════════════════════════════════════════════
    // REGISTRY TYPE: CONTRACT (RWA Smart Contracts)
    // ═══════════════════════════════════════════════════════

    // ─── 1. GOLD MINE ────────────────────────────────────────
    const c1 = base('Oro Verde Gold Token', 'Tokenized gold mining reserves in Antioquia, Colombia. NI 43-101 verified, 2.3M oz measured + indicated.', 'rwa', 'rwa_token', 'Oro Verde S.A.', 0, 'CONTRACT', '/logos/oro-verde.svg');
    const mine1: SmartContract = { ...c1,
      verification: verify({ kyc: true, kyb: true, isin: true, audit: true, lei: true, iso: true, by: 'SRK Consulting / Deloitte', entity: 'MINER', category: 'Gold Mining', seal: 'VERIFIED' }),
      rwaDetail: {
        rwaSubType: 'MINE', mineName: 'Yanacocha Mine', mineralType: 'GOLD',
        location: { country: 'Peru', region: 'Cajamarca, Yanacocha', lat: -6.9744, lng: -78.5086 },
        operator: 'Oro Verde S.A.', mineType: 'UNDERGROUND',
        measuredReserve: 850000, indicatedReserve: 1450000, inferredReserve: 620000,
        gradeGramsPerTon: 8.5, cutoffGrade: 2.0, recoveryRate: 92.5, mineLifeYears: 18,
        annualProduction: 45000,
        allInSustainingCost: 980, netPresentValue: 245000000, internalRateOfReturn: 28.5,
        ni43101Certified: true, ni43101Author: 'SRK Consulting', ni43101Date: '2025-03-15',
        environmentalPermit: 'ANLA-2024-0892', socialLicense: true, images: [],
      },
      isinContract: {
        isin: 'ARCHT00001', tokenSymbol: 'OVG', tokenName: 'Oro Verde Gold Token',
        totalSupply: 10000000, circulatingSupply: 7500000, holders: 2847, price: 4.52,
        marketCap: 33900000, lei: 'LEI549300MLUDYVRNT823', jurisdiction: 'CO',
        complianceScore: 98, createdBlock: 100,
        parentContractAddress: c1.address, isinContractAddress: c1.isinAddr!,
      },
    };
    this.contracts.set(mine1.id, mine1);

    // ─── 2. REAL ESTATE ──────────────────────────────────────
    const c2 = base('Manhattan Tower REIT', 'Class A commercial real estate in Midtown Manhattan. SEC Reg D compliant, 98.2% occupancy.', 'rwa', 'real_estate', 'ARCHT Real Estate LLC', 1, 'CONTRACT', '/logos/manhattan-reit.svg');
    const real1: SmartContract = { ...c2,
      verification: verify({ kyc: true, kyb: true, isin: true, audit: true, lei: true, iso: true, by: 'Cushman & Wakefield / PwC', entity: 'REALTOR', category: 'Commercial Real Estate', seal: 'INST_VERIFIED', inst: true }),
      rwaDetail: {
        rwaSubType: 'REAL', propertyName: 'Manhattan Tower One', propertyType: 'COMMERCIAL',
        location: { country: 'USA', city: 'New York', address: '405 Lexington Ave, Midtown Manhattan', lat: 40.7527, lng: -73.9772 },
        developer: 'ARCHT Real Estate LLC',
        totalArea: 65000, usableArea: 58500, floors: 42, units: 180, yearBuilt: 2019, occupancyRate: 98.2,
        appraisedValue: 420000000, lastAppraisalDate: '2025-09-01', appraiser: 'Cushman & Wakefield',
        annualRentalIncome: 38000000, operatingExpenses: 12000000, netOperatingIncome: 26000000,
        capRate: 6.19, rentalYield: 7.8,
        secRegD: true, accreditedOnly: true, zoning: 'C6-6', insuranceValue: 450000000, images: [],
      },
      isinContract: {
        isin: 'ARCHT00003', tokenSymbol: 'MHTN', tokenName: 'Manhattan Tower REIT',
        totalSupply: 20000000, circulatingSupply: 15000000, holders: 5210, price: 6.00,
        marketCap: 90000000, lei: 'LEI549300NXBRT92M4510', jurisdiction: 'US',
        complianceScore: 99, createdBlock: 80,
        parentContractAddress: c2.address, isinContractAddress: c2.isinAddr!,
      },
    };
    this.contracts.set(real1.id, real1);

    // ─── 3. GREEN BOND ───────────────────────────────────────
    const c3 = base('Green Energy Bond 2030', 'Green bond funding solar and wind infrastructure across EU. 4.2% APY, AAA ESG rated.', 'rwa', 'green_bond', 'CleanPower Finance', 2, 'CONTRACT', '/logos/cleanpower.svg');
    const bond1: SmartContract = { ...c3,
      verification: verify({ kyc: true, kyb: true, isin: true, audit: true, lei: true, iso: true, by: "Moody's / KPMG", entity: 'INSTITUTION', category: 'Green Finance', seal: 'INST_VERIFIED', inst: true }),
      rwaDetail: {
        rwaSubType: 'BOND', bondName: 'CleanPower Green Bond Series A', bondType: 'GREEN',
        issuerEntity: 'CleanPower Finance AG',
        faceValue: 1000, couponRate: 4.2, couponFrequency: 'SEMI_ANNUAL',
        maturityDate: '2030-12-31', issueDate: '2024-01-15',
        creditRating: 'AA+', ratingAgency: 'Moody\'s', esgRating: 'AAA',
        yieldToMaturity: 4.35, currentYield: 4.2, duration: 5.8, convexity: 38.2,
        prospectusUrl: 'https://archt.world/docs/geb30-prospectus', regulatoryFramework: 'EU Green Bond Standard',
        greenCertification: 'Climate Bonds Initiative', carbonOffset: 850000,
      },
      isinContract: {
        isin: 'ARCHT00005', tokenSymbol: 'GEB30', tokenName: 'Green Energy Bond 2030',
        totalSupply: 50000000, circulatingSupply: 48000000, holders: 3100, price: 1.025,
        marketCap: 49200000, lei: 'LEI549300ABCDE678901', jurisdiction: 'EU',
        complianceScore: 100, createdBlock: 50,
        parentContractAddress: c3.address, isinContractAddress: c3.isinAddr!,
      },
    };
    this.contracts.set(bond1.id, bond1);

    // ─── 4. EMERALD ──────────────────────────────────────────
    const c4 = base('Colombian Emerald Trust', 'Investment-grade emeralds from legendary Muzo mine. GIA certified, vaulted in Zurich.', 'rwa', 'rwa_token', 'Muzo Gems International', 3, 'CONTRACT', '/logos/muzo-gems.svg');
    const gem1: SmartContract = { ...c4,
      verification: verify({ kyc: true, kyb: true, isin: true, audit: true, lei: false, iso: true, by: 'GIA / Swiss Vault AG', entity: 'COMPANY', category: 'Gemstones', seal: 'VERIFIED' }),
      rwaDetail: {
        rwaSubType: 'GEM', gemName: 'Muzo Royal Collection', gemType: 'EMERALD',
        origin: { country: 'Colombia', mine: 'Muzo Mine', region: 'Boyacá' },
        totalCarats: 4850, averageCaratWeight: 3.2, color: 'Vivid Green (Muzo Green)',
        clarity: 'Eye Clean - Minor Inclusions', cut: 'Emerald Cut / Cabochon',
        treatment: 'MINOR_OIL',
        giaCertified: true, certificationBody: 'GIA (Gemological Institute of America)',
        certificationNumber: 'GIA-2024-EMR-47892',
        appraisedValuePerCarat: 12450, totalAppraisedValue: 60382500,
        lastAppraisalDate: '2025-06-20', historicalAppreciation: 8.5,
        custodian: 'Swiss Vault AG', vaultLocation: 'Zurich, Switzerland',
        insured: true, insuranceValue: 65000000, images: [],
      },
      isinContract: {
        isin: 'ARCHT00004', tokenSymbol: 'EMERALD', tokenName: 'Colombian Emerald Trust',
        totalSupply: 847000, circulatingSupply: 620000, holders: 892, price: 12.45,
        marketCap: 7719000, lei: 'LEI549300PQWXYZ123456', jurisdiction: 'CO',
        complianceScore: 95, createdBlock: 200,
        parentContractAddress: c4.address, isinContractAddress: c4.isinAddr!,
      },
    };
    this.contracts.set(gem1.id, gem1);

    // ═══════════════════════════════════════════════════════
    // REGISTRY TYPE: ISIN (Financial Instruments)
    // ═══════════════════════════════════════════════════════

    const c6 = base('Lithium Battery Fund ISIN', 'ISO 6166 registered digital financial instrument tracking lithium battery supply chain derivatives.', 'rwa', 'rwa_token', 'ARCHT Capital Markets', 5, 'ISIN', '/logos/lithium-fund.svg');
    const isin1: SmartContract = { ...c6,
      verification: verify({ kyc: true, kyb: true, isin: true, audit: true, lei: true, iso: true, by: 'SIX Swiss Exchange / EY', entity: 'INSTITUTION', category: 'Capital Markets', seal: 'IS_VERIFIED', inst: true }),
      isinContract: {
        isin: 'ARCHT00010', tokenSymbol: 'LBAT', tokenName: 'Lithium Battery Fund',
        totalSupply: 100000000, circulatingSupply: 82000000, holders: 12400, price: 2.18,
        marketCap: 178760000, lei: 'LEI549300LITHBAT00001', jurisdiction: 'CH',
        complianceScore: 100, createdBlock: 45,
        parentContractAddress: c6.address, isinContractAddress: c6.isinAddr!,
      },
    };
    this.contracts.set(isin1.id, isin1);

    const c7 = base('Carbon Credit Token ISIN', 'Verified carbon credits tokenized as ISO 20022 digital financial instruments. EU ETS compliant.', 'rwa', 'rwa_token', 'GreenTrade AG', 6, 'ISIN', '/logos/carbon-credit.svg');
    const isin2: SmartContract = { ...c7,
      verification: verify({ kyc: true, kyb: true, isin: true, audit: true, lei: true, iso: true, by: 'EU ETS Authority / BDO', entity: 'INSTITUTION', category: 'Carbon Markets', seal: 'IS_VERIFIED', gov: true }),
      isinContract: {
        isin: 'ARCHT00011', tokenSymbol: 'CCT', tokenName: 'Carbon Credit Token',
        totalSupply: 25000000, circulatingSupply: 18500000, holders: 4200, price: 8.90,
        marketCap: 164650000, lei: 'LEI549300CARBON00002', jurisdiction: 'EU',
        complianceScore: 100, createdBlock: 60,
        parentContractAddress: c7.address, isinContractAddress: c7.isinAddr!,
      },
    };
    this.contracts.set(isin2.id, isin2);

    // ═══════════════════════════════════════════════════════
    // REGISTRY TYPE: VIEWSRIGHT (Copyright & IP)
    // ═══════════════════════════════════════════════════════

    const c8 = base('Genesis Soundtrack Collection', 'Master recordings and publishing rights for award-winning film soundtrack. WIPO registered.', 'nft', 'rwa_token', 'Resonance Studios', 7, 'VIEWSRIGHT', '/logos/genesis-ost.svg');
    const vr1: SmartContract = { ...c8,
      verification: verify({ kyc: true, kyb: false, isin: false, audit: true, lei: false, iso: false, by: 'WIPO', entity: 'MUSICIAN', category: 'Film Soundtrack', seal: 'VR_VERIFIED' }),
      viewsRight: {
        title: 'Genesis — Original Motion Picture Soundtrack',
        workType: 'MUSIC', category: 'ORIGINAL',
        creatorName: 'Mateo Villalobos', creatorAddress: this.generateOwnerAddress('Mateo Villalobos'),
        coCreators: [
          { name: 'Sofia Mendez', share: 25, address: this.generateOwnerAddress('Sofia Mendez') },
          { name: 'Carlos Rivera', share: 15, address: this.generateOwnerAddress('Carlos Rivera') },
        ],
        registrationNumber: 'VR-2025-0001', registrationDate: '2025-01-10', expirationDate: '2095-01-10',
        jurisdiction: 'US', copyrightOffice: 'US Copyright Office / WIPO',
        rightsType: 'EXCLUSIVE', licensingTerms: 'Master recording + publishing. Sync licensing available.',
        territorialScope: 'WORLDWIDE',
        allowedUses: ['COMMERCIAL', 'STREAMING', 'BROADCAST', 'SYNC_LICENSING'],
        restrictedUses: ['DERIVATIVE_WITHOUT_CONSENT', 'SUBLICENSE_WITHOUT_APPROVAL'],
        royaltyRate: 12.5, royaltyFrequency: 'QUARTERLY',
        totalRoyaltiesEarned: 2450000, totalDistributions: 18,
        royaltyRecipients: [
          { name: 'Mateo Villalobos', share: 60, address: this.generateOwnerAddress('Mateo Villalobos') },
          { name: 'Sofia Mendez', share: 25, address: this.generateOwnerAddress('Sofia Mendez') },
          { name: 'Carlos Rivera', share: 15, address: this.generateOwnerAddress('Carlos Rivera') },
        ],
        fingerprint: 'sha256:a1b2c3d4e5f6789012345678abcdef0123456789abcdef01234567890abcdef1',
        ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
        timestampProof: 'block:145:tx:0x9a8b7c6d5e4f3210',
        wipo: true, dmcaProtected: true,
        estimatedValue: 8500000, lastValuationDate: '2025-11-01',
        licensingRevenue: 1200000, activeContracts: 34,
        description: '24-track orchestral + electronic soundtrack. Premiered at Sundance 2025. Grammy-nominated.',
        tags: ['soundtrack', 'orchestral', 'electronic', 'film', 'grammy'],
        externalUrls: ['https://archt.world/music/genesis-ost'],
        thumbnailUrl: '',
      },
    };
    this.contracts.set(vr1.id, vr1);

    const c9 = base('NexGen AI Architecture Patent', 'Patented neural architecture for real-time geological analysis. International PCT filed.', 'nft', 'rwa_token', 'ARCHT Labs', 8, 'VIEWSRIGHT', '/logos/nexgen-ai.svg');
    const vr2: SmartContract = { ...c9,
      verification: verify({ kyc: true, kyb: true, isin: false, audit: true, lei: false, iso: false, by: 'USPTO / WIPO PCT', entity: 'SCIENTIST', category: 'AI Technology', seal: 'VR_VERIFIED', license: 'PCT/US2025/001234' }),
      viewsRight: {
        title: 'NexGen AI — Geological Neural Architecture v3',
        workType: 'PATENT', category: 'ORIGINAL',
        creatorName: 'Dr. Elena Rodriguez', creatorAddress: this.generateOwnerAddress('Dr Elena Rodriguez'),
        coCreators: [
          { name: 'Dr. James Chen', share: 30, address: this.generateOwnerAddress('Dr James Chen') },
        ],
        registrationNumber: 'VR-2025-0002', registrationDate: '2024-08-15', expirationDate: '2044-08-15',
        jurisdiction: 'PCT', copyrightOffice: 'USPTO / WIPO PCT',
        rightsType: 'EXCLUSIVE', licensingTerms: 'Patent license for commercial use. Research use permitted.',
        territorialScope: 'WORLDWIDE',
        allowedUses: ['COMMERCIAL', 'EDUCATIONAL', 'RESEARCH'],
        restrictedUses: ['MILITARY_APPLICATION', 'REVERSE_ENGINEERING'],
        royaltyRate: 5.0, royaltyFrequency: 'ANNUAL',
        totalRoyaltiesEarned: 890000, totalDistributions: 4,
        royaltyRecipients: [
          { name: 'Dr. Elena Rodriguez', share: 50, address: this.generateOwnerAddress('Dr Elena Rodriguez') },
          { name: 'Dr. James Chen', share: 30, address: this.generateOwnerAddress('Dr James Chen') },
          { name: 'ARCHT Labs', share: 20, address: this.generateOwnerAddress('ARCHT Labs') },
        ],
        fingerprint: 'sha256:f0e1d2c3b4a596879012345678abcdef0123456789abcdef0123456789abcde0',
        ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
        timestampProof: 'block:220:tx:0xab12cd34ef56',
        wipo: true, dmcaProtected: false,
        estimatedValue: 15000000, lastValuationDate: '2025-12-01',
        licensingRevenue: 3200000, activeContracts: 12,
        description: 'Novel neural architecture for sub-surface mineral deposit prediction using satellite imagery and seismic data fusion. 94.7% accuracy on validation set.',
        tags: ['patent', 'AI', 'geology', 'neural-network', 'mining'],
        externalUrls: ['https://archt.world/patents/nexgen-ai-v3'],
        thumbnailUrl: '',
      },
    };
    this.contracts.set(vr2.id, vr2);

    const c10 = base('Digital Art: Fractal Earth Series', 'Limited edition generative art collection. 50 unique pieces from geological fractal algorithms.', 'nft', 'rwa_token', 'ARCHT Creative', 9, 'VIEWSRIGHT', '/logos/fractal-earth.svg');
    const vr3: SmartContract = { ...c10,
      verification: verify({ kyc: true, kyb: false, isin: false, audit: true, lei: false, iso: false, entity: 'ARCHITECT', category: 'Digital Art', seal: 'VR_VERIFIED' }),
      viewsRight: {
        title: 'Fractal Earth — Generative Art Series #001-050',
        workType: 'ART', category: 'ORIGINAL',
        creatorName: 'Yuki Tanaka', creatorAddress: this.generateOwnerAddress('Yuki Tanaka'),
        coCreators: [],
        registrationNumber: 'VR-2025-0003', registrationDate: '2025-03-20', expirationDate: '2095-03-20',
        jurisdiction: 'JP', copyrightOffice: 'Japan Copyright Office',
        rightsType: 'NON_EXCLUSIVE', licensingTerms: 'Display and exhibition rights. Print-on-demand available.',
        territorialScope: 'WORLDWIDE',
        allowedUses: ['PERSONAL', 'EDUCATIONAL', 'EXHIBITION', 'PRINT'],
        restrictedUses: ['COMMERCIAL_WITHOUT_LICENSE', 'MODIFICATION'],
        royaltyRate: 10.0, royaltyFrequency: 'PER_USE',
        totalRoyaltiesEarned: 380000, totalDistributions: 142,
        royaltyRecipients: [
          { name: 'Yuki Tanaka', share: 85, address: this.generateOwnerAddress('Yuki Tanaka') },
          { name: 'ARCHT Creative', share: 15, address: this.generateOwnerAddress('ARCHT Creative') },
        ],
        fingerprint: 'sha256:11223344556677889900aabbccddeeff00112233445566778899aabbccddeeff',
        ipfsHash: 'QmZkJK4WHrS2YjVKLGf5JTqD3o62XYAR5tCMUP2kRxGfE2',
        timestampProof: 'block:310:tx:0xfedcba9876',
        wipo: false, dmcaProtected: true,
        estimatedValue: 2200000, lastValuationDate: '2025-09-15',
        licensingRevenue: 450000, activeContracts: 28,
        description: 'Algorithmically generated from real geological survey data. Each piece maps a unique mineral deposit pattern.',
        tags: ['generative-art', 'fractal', 'geology', 'digital-art', 'NFT'],
        externalUrls: ['https://archt.world/art/fractal-earth'],
        thumbnailUrl: '',
      },
    };
    this.contracts.set(vr3.id, vr3);

    // ─── GOVERNANCE ──────────────────────────────────────────
    const c5 = base('ARCHT Governance', 'Decentralized governance for the ARCHT ecosystem with weighted voting and timelock execution.', 'governance', 'governance', 'ARCHT DAO', 10, 'CONTRACT', '/logos/archt-gov.svg');
    const gov: SmartContract = { ...c5, verification: verify({ kyc: true, kyb: true, isin: false, audit: true, lei: true, iso: true, by: 'ARCHT Foundation', entity: 'DAO', category: 'Governance', seal: 'GOV_VERIFIED', gov: true }) };
    this.contracts.set(gov.id, gov);

    // ═══════════════════════════════════════════════════════
    // NEW: GOVERNMENT DIGITAL CURRENCY
    // ═══════════════════════════════════════════════════════
    const govCurrency = base('Digital Peso MX', 'Central Bank Digital Currency issued by Banco de México. Fiat-backed 1:1 parity with MXN.', 'token', 'rwa_token', 'Banco de México', 0, 'CONTRACT', '/logos/gov-peso.svg');
    govCurrency.verification = verify({ kyc: true, kyb: true, isin: true, audit: true, lei: true, iso: true, by: 'Banco de México / IMF', entity: 'GOVERNMENT', category: 'CBDC', seal: 'GOV_VERIFIED', gov: true, inst: true });
    this.contracts.set(govCurrency.id, govCurrency);

    const govBond = base('US Treasury Token', 'Tokenized US Treasury Bond T-Bill 2025. Government-backed, institutional grade.', 'token', 'green_bond', 'US Department of Treasury', 0, 'ISIN', '/logos/gov-treasury.svg');
    govBond.verification = verify({ kyc: true, kyb: true, isin: true, audit: true, lei: true, iso: true, by: 'US SEC / Deloitte', entity: 'GOVERNMENT', category: 'Treasury Bond', seal: 'GOV_VERIFIED', gov: true, inst: true });
    govBond.isinContract = { isin: 'US912810TA43', tokenSymbol: 'USTB', tokenName: 'US Treasury Bond Token', totalSupply: 10000000, circulatingSupply: 8000000, holders: 12500, price: 99.92, marketCap: 999200000, lei: 'LEI254900HROIFHUR8393', jurisdiction: 'US', complianceScore: 99, createdBlock: 50, parentContractAddress: govBond.address, isinContractAddress: govBond.isinAddr! };
    govBond.registryType = 'ISIN';
    this.contracts.set(govBond.id, govBond);

    // ═══════════════════════════════════════════════════════
    // NEW: MUSICIAN / ARTIST
    // ═══════════════════════════════════════════════════════
    const musicContract = base('Ava Solaris Royalty Token', 'Tokenized music royalties for the album "Neon Horizons". Automated quarterly distribution.', 'token', 'rwa_token', 'Ava Solaris / Solaris Records', 0, 'VIEWSRIGHT', '/logos/music-solaris.svg');
    musicContract.verification = verify({ kyc: true, kyb: true, isin: false, audit: true, lei: false, iso: false, by: 'ASCAP / BMI', entity: 'MUSICIAN', category: 'Electronic / Hip-Hop', seal: 'VR_VERIFIED' });
    musicContract.registryType = 'VIEWSRIGHT';
    musicContract.viewsRight = {
      title: 'Neon Horizons — Royalty Token',
      workType: 'MUSIC', category: 'ORIGINAL',
      creatorName: 'Ava Solaris', creatorAddress: this.generateOwnerAddress('Ava Solaris'),
      coCreators: [{ name: 'Kai Rhythm (Producer)', share: 15, address: this.generateOwnerAddress('Kai Rhythm') }],
      registrationNumber: 'VR-2025-MUS-0001', registrationDate: '2025-01-15', expirationDate: '2095-01-15',
      jurisdiction: 'US', copyrightOffice: 'US Copyright Office',
      rightsType: 'EXCLUSIVE', licensingTerms: 'Revenue share from streaming, sync licensing, and merchandise.',
      territorialScope: 'WORLDWIDE',
      allowedUses: ['STREAMING', 'BROADCAST', 'SYNC_LICENSE', 'LIVE_PERFORMANCE'],
      restrictedUses: ['UNAUTHORIZED_SAMPLING', 'UNLICENSED_DISTRIBUTION'],
      royaltyRate: 8.5, royaltyFrequency: 'QUARTERLY',
      totalRoyaltiesEarned: 12500000, totalDistributions: 8,
      royaltyRecipients: [
        { name: 'Ava Solaris', share: 60, address: this.generateOwnerAddress('Ava Solaris') },
        { name: 'Solaris Records', share: 25, address: this.generateOwnerAddress('Solaris Records') },
        { name: 'Token Holders', share: 15, address: this.generateOwnerAddress('Pool') },
      ],
      fingerprint: 'sha256:musicsolaris2025aabbccdd00112233445566778899aabb',
      ipfsHash: 'QmSolarisAlbum2025NeonHorizons',
      timestampProof: 'block:412:tx:0xsolaris2025',
      wipo: true, dmcaProtected: true,
      estimatedValue: 45000000, lastValuationDate: '2025-06-01',
      licensingRevenue: 18000000, activeContracts: 312,
      description: 'Fractional ownership of royalty streams from one of the highest-grossing albums of 2025.',
      tags: ['music', 'electronic', 'royalties', 'streaming', 'solaris'],
      externalUrls: ['https://solarisrecords.io'],
      thumbnailUrl: '',
    };
    this.contracts.set(musicContract.id, musicContract);

    // ═══════════════════════════════════════════════════════
    // NEW: INFLUENCER
    // ═══════════════════════════════════════════════════════
    const influencerContract = base('NovaCast Social Token', 'Social engagement token backed by content revenue and brand deals. Holders get exclusive access.', 'token', 'rwa_token', 'NovaCast / Nova Industries', 0, 'CONTRACT', '/logos/influencer-nova.svg');
    influencerContract.verification = verify({ kyc: true, kyb: true, isin: false, audit: true, lei: true, iso: false, by: 'Platform Verified / Nova Media', entity: 'INFLUENCER', category: 'Content Creator', seal: 'PRO_VERIFIED', license: 'YT-PARTNER-PREMIUM' });
    this.contracts.set(influencerContract.id, influencerContract);

    // ═══════════════════════════════════════════════════════
    // NEW: PRIVATE ENTITY (Privacy Shield)
    // ═══════════════════════════════════════════════════════
    const privateContract = base('Alpine Fund VII', 'Private equity fund tokenization. Verified entity with privacy shield. Accredited investors only.', 'token', 'rwa_token', 'Confidential', 0, 'ISIN', '/logos/private-fund.svg');
    privateContract.verification = verify({ kyc: true, kyb: true, isin: true, audit: true, lei: true, iso: true, by: 'FINMA / KPMG', entity: 'INSTITUTION', category: 'Private Equity', seal: 'PRIVACY_SHIELD', inst: true, privacy: true, visibility: 'PRIVATE' as const });
    privateContract.isinContract = { isin: 'CH0012345678', tokenSymbol: 'ALPF', tokenName: 'Alpine Fund VII Token', totalSupply: 1000, circulatingSupply: 450, holders: 120, price: 262500, marketCap: 262500000, lei: 'LEI529900PRIVALP7890', jurisdiction: 'CH', complianceScore: 99, createdBlock: 60, parentContractAddress: privateContract.address, isinContractAddress: privateContract.isinAddr! };
    privateContract.registryType = 'ISIN';
    this.contracts.set(privateContract.id, privateContract);

    // ═══════════════════════════════════════════════════════
    // NEW: FILMMAKER
    // ═══════════════════════════════════════════════════════
    const filmContract = base('Indie Film DAO', 'Decentralized film production fund for "The Last Algorithm". Community-funded cinema.', 'custom', 'governance', 'Indie Film DAO', 0, 'VIEWSRIGHT', '/logos/film-dao.svg');
    filmContract.verification = verify({ kyc: true, kyb: false, isin: false, audit: true, lei: false, iso: false, by: 'SAG-AFTRA / WGA', entity: 'FILMMAKER', category: 'Sci-Fi Feature', seal: 'VR_VERIFIED' });
    filmContract.registryType = 'VIEWSRIGHT';
    filmContract.viewsRight = {
      title: 'The Last Algorithm — Film Production',
      workType: 'FILM', category: 'ORIGINAL',
      creatorName: 'Indie Film DAO Collective', creatorAddress: this.generateOwnerAddress('IndieFilmDAO'),
      coCreators: [{ name: 'Sarah Chen (Director)', share: 30, address: this.generateOwnerAddress('Sarah Chen') }, { name: 'Marco Ruiz (Writer)', share: 20, address: this.generateOwnerAddress('Marco Ruiz') }],
      registrationNumber: 'VR-2025-FILM-0001', registrationDate: '2025-04-10', expirationDate: '2095-04-10',
      jurisdiction: 'US', copyrightOffice: 'US Copyright Office',
      rightsType: 'EXCLUSIVE', licensingTerms: 'Revenue share from theatrical, streaming, and merchandising.',
      territorialScope: 'WORLDWIDE',
      allowedUses: ['THEATRICAL', 'STREAMING', 'BROADCAST', 'HOME_VIDEO'],
      restrictedUses: ['UNAUTHORIZED_DISTRIBUTION', 'DERIVATIVE_WORKS'],
      royaltyRate: 12.0, royaltyFrequency: 'MONTHLY',
      totalRoyaltiesEarned: 890000, totalDistributions: 6,
      royaltyRecipients: [
        { name: 'Production Fund', share: 50, address: this.generateOwnerAddress('ProdFund') },
        { name: 'Creative Team', share: 30, address: this.generateOwnerAddress('CreativeTeam') },
        { name: 'Token Holders', share: 20, address: this.generateOwnerAddress('HolderPool') },
      ],
      fingerprint: 'sha256:filmindiedao2025lastalgorithm',
      ipfsHash: 'QmIndieFilmDAO2025LastAlgorithm',
      timestampProof: 'block:520:tx:0xfilmdao2025',
      wipo: false, dmcaProtected: true,
      estimatedValue: 5500000, lastValuationDate: '2025-08-20',
      licensingRevenue: 1200000, activeContracts: 45,
      description: 'Community-funded sci-fi feature film exploring AI consciousness. Token holders vote on creative decisions.',
      tags: ['film', 'sci-fi', 'dao', 'community-funded', 'cinema'],
      externalUrls: ['https://indiefilmdao.xyz'],
      thumbnailUrl: '',
    };
    this.contracts.set(filmContract.id, filmContract);

    // ═══════════════════════════════════════════════════════
    // NEW: DEVELOPER
    // ═══════════════════════════════════════════════════════
    const devContract = base('NeuralForge Protocol Token', 'Open-source AI training protocol. Verified developer entity with professional license.', 'token', 'governance', 'NeuralForge Foundation', 0, 'CONTRACT', '/logos/dev-neuralforge.svg');
    devContract.verification = verify({ kyc: true, kyb: true, isin: false, audit: true, lei: true, iso: true, by: 'Linux Foundation / Trail of Bits', entity: 'DEVELOPER', category: 'AI Infrastructure', seal: 'PRO_VERIFIED', license: 'OSS-AUDIT-2025-001' });
    this.contracts.set(devContract.id, devContract);

    // ═══════════════════════════════════════════════════════
    // NEW: ATTORNEY / LEGAL
    // ═══════════════════════════════════════════════════════
    const legalContract = base('LegalChain Escrow', 'Automated legal escrow for cross-border transactions. Bar-certified smart contract.', 'custom', 'rwa_token', 'Baker McKenzie LLP', 0, 'CONTRACT', '/logos/legal-escrow.svg');
    legalContract.verification = verify({ kyc: true, kyb: true, isin: false, audit: true, lei: true, iso: true, by: 'American Bar Association', entity: 'ATTORNEY', category: 'Cross-Border Escrow', seal: 'PRO_VERIFIED', inst: true, license: 'ABA-SC-2025-4578' });
    this.contracts.set(legalContract.id, legalContract);
  }

  private generateABI(template: string): ContractABI[] {
    return [
      { name: 'transfer', type: 'function', inputs: [{ name: '_to', type: 'address' }, { name: '_amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
      { name: 'balanceOf', type: 'function', inputs: [{ name: '_owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
      { name: 'approve', type: 'function', inputs: [{ name: '_spender', type: 'address' }, { name: '_amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
      { name: 'totalSupply', type: 'function', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
      { name: 'Transfer', type: 'event', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }] },
    ];
  }

  compile(sourceCode: string): CompileResult {
    // Simulate compilation with validation
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!sourceCode.includes('contract ')) errors.push('Error: No contract definition found');
    if (sourceCode.length < 50) errors.push('Error: Contract source too short');
    if (!sourceCode.includes('function ')) warnings.push('Warning: No functions defined');

    if (errors.length > 0) return { success: false, errors, warnings };

    // Audit checks
    const auditNotes: string[] = [];
    let auditScore = 100;
    if (!sourceCode.includes('require(')) { auditNotes.push('No input validation (require statements)'); auditScore -= 15; }
    if (!sourceCode.includes('event ')) { auditNotes.push('No events emitted for state changes'); auditScore -= 10; }
    if (sourceCode.includes('selfdestruct')) { auditNotes.push('CRITICAL: selfdestruct detected'); auditScore -= 30; }
    if (!sourceCode.includes('onlyOwner') && !sourceCode.includes('modifier')) { auditNotes.push('No access control modifiers'); auditScore -= 10; }
    if (sourceCode.includes('ISO') || sourceCode.includes('isin') || sourceCode.includes('ISIN')) { auditNotes.push('ISO 20022 compliance detected'); auditScore = Math.min(auditScore + 5, 100); }

    const bytecode = crypto.randomBytes(Math.floor(sourceCode.length / 2)).toString('hex');
    const abi = this.extractABI(sourceCode);

    return {
      success: true,
      bytecode,
      abi,
      warnings,
      gasEstimate: 2100000 + sourceCode.length * 100,
      auditScore,
      auditNotes,
    };
  }

  private extractABI(source: string): ContractABI[] {
    const abi: ContractABI[] = [];
    const funcRegex = /function\s+(\w+)\s*\(([^)]*)\)/g;
    let match;
    while ((match = funcRegex.exec(source)) !== null) {
      const inputs = match[2].split(',').filter(Boolean).map(p => {
        const parts = p.trim().split(/\s+/);
        return { name: parts[parts.length - 1] || 'arg', type: parts[0] || 'uint256' };
      });
      abi.push({ name: match[1], type: 'function', inputs, outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' });
    }
    const eventRegex = /event\s+(\w+)\s*\(([^)]*)\)/g;
    while ((match = eventRegex.exec(source)) !== null) {
      const inputs = match[2].split(',').filter(Boolean).map(p => {
        const parts = p.trim().split(/\s+/);
        return { name: parts[parts.length - 1] || 'arg', type: parts[0] || 'uint256' };
      });
      abi.push({ name: match[1], type: 'event', inputs });
    }
    return abi;
  }

  deploy(sourceCode: string, name: string, description: string, type: ContractType, ownerAddress?: string): DeployResult {
    const compiled = this.compile(sourceCode);
    if (!compiled.success) return { success: false, error: compiled.errors?.join('; ') };

    const id = crypto.randomBytes(8).toString('hex');
    const address = this.generateNativeAddress(name);
    const txHash = this.generateNativeTxHash();
    const owner = ownerAddress && ownerAddress.trim() ? ownerAddress.trim() : this.generateOwnerAddress();

    this.deployCount++;
    const contract: SmartContract = {
      id, address, name, description, type,
      status: 'deployed',
      sourceCode,
      bytecode: compiled.bytecode!,
      abi: compiled.abi!,
      owner,
      createdAt: Date.now(),
      deployedAt: Date.now(),
      deployBlock: 1000 + this.deployCount,
      deployTxHash: txHash,
      gasUsed: compiled.gasEstimate!,
      storage: {},
      isoCompliant: sourceCode.toLowerCase().includes('iso') || sourceCode.toLowerCase().includes('isin'),
      auditScore: compiled.auditScore!,
      version: '1.0.0',
      interactions: 0,
      balance: 0,
      registryType: 'CONTRACT',
      logoUrl: '',
      verification: {
        verified: false, seal: 'VERIFIED' as VerificationSeal, level: 'NONE',
        entityType: 'PERSON' as EntityType,
        kycCompleted: false, kybCompleted: false, isinRegistered: false,
        auditPassed: (compiled.auditScore || 0) >= 85, legalEntity: false, complianceApproved: false,
        walletVisibility: 'PUBLIC' as WalletVisibility, privacyShield: false,
        badges: (compiled.auditScore || 0) >= 85 ? ['AUDIT'] : [],
        seals: [],
      },
    };

    this.contracts.set(id, contract);
    return { success: true, address, txHash, blockNumber: contract.deployBlock, gasUsed: contract.gasUsed };
  }

  generateWithAI(prompt: string): string {
    // Simulated AI generation — returns contextual smart contract code
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('token') || lowerPrompt.includes('rwa') || lowerPrompt.includes('asset')) {
      return CONTRACT_TEMPLATES.rwa_token.code;
    }
    if (lowerPrompt.includes('mining') || lowerPrompt.includes('mine') || lowerPrompt.includes('gold')) {
      return CONTRACT_TEMPLATES.mining_reserve.code;
    }
    if (lowerPrompt.includes('real estate') || lowerPrompt.includes('property') || lowerPrompt.includes('reit')) {
      return CONTRACT_TEMPLATES.real_estate.code;
    }
    if (lowerPrompt.includes('bond') || lowerPrompt.includes('green') || lowerPrompt.includes('fixed income')) {
      return CONTRACT_TEMPLATES.green_bond.code;
    }
    if (lowerPrompt.includes('governance') || lowerPrompt.includes('dao') || lowerPrompt.includes('voting')) {
      return CONTRACT_TEMPLATES.governance.code;
    }

    // Generic fallback
    return `// 20022Chain Smart Contract
// Generated by AI from: "${prompt.slice(0, 60)}..."
// ISO 20022 Compliant

contract GeneratedContract {
    string  public name = "AI Generated";
    string  public isin;
    address public owner;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    
    event Transfer(address from, address to, uint256 amount);
    event ContractAction(string action, uint256 timestamp);
    
    constructor(string _name, string _isin, uint256 _supply) {
        name = _name;
        isin = _isin;
        owner = msg.sender;
        totalSupply = _supply;
        balanceOf[msg.sender] = _supply;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function transfer(address _to, uint256 _amount) public returns (bool) {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
        require(_to != address(0), "Invalid address");
        balanceOf[msg.sender] -= _amount;
        balanceOf[_to] += _amount;
        emit Transfer(msg.sender, _to, _amount);
        return true;
    }
    
    function execute(string _action) public onlyOwner {
        emit ContractAction(_action, block.timestamp);
    }
}`;
  }

  getAll(): SmartContract[] {
    return Array.from(this.contracts.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  get(id: string): SmartContract | undefined {
    return this.contracts.get(id);
  }

  getByAddress(address: string): SmartContract | undefined {
    return Array.from(this.contracts.values()).find(c => c.address === address);
  }
}

// Use globalThis to persist singleton across hot reloads in dev
const globalForContracts = globalThis as unknown as { __contractManager?: ContractManager };
export function getContractManager(): ContractManager {
  if (!globalForContracts.__contractManager) {
    globalForContracts.__contractManager = new ContractManager();
  }
  return globalForContracts.__contractManager;
}
