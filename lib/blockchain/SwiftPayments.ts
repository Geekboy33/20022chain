/* ═══════════════════════════════════════════════════════════════════════════
   20022Chain — ISO 20022 SWIFT/IBAN Payment Network Engine
   ═══════════════════════════════════════════════════════════════════════════
   Only verified BANKS, FINTECHS, CENTRAL_BANKS & PAYMENT_PROCESSORS can
   access this payment rail.  Each fiat currency is tokenized as a smart-
   contract (e.g. USD20022, EUR20022, GBP20022 …) deployed on-chain.
   Entities connect via API keys → send/receive ISO 20022 messages (pacs.008,
   pacs.009, camt.053 …) routed through the 20022Chain settlement layer.
   ═══════════════════════════════════════════════════════════════════════════ */

import { createHash, randomBytes } from 'crypto';

// ────────────────────────────────────────────────────────
// 1. TYPES
// ────────────────────────────────────────────────────────

export type BankingEntityType = 'BANK' | 'FINTECH' | 'CENTRAL_BANK' | 'PAYMENT_PROCESSOR' | 'NEOBANK' | 'EXCHANGE';

export type EntityVerificationLevel = 'PENDING' | 'KYB_SUBMITTED' | 'KYB_VERIFIED' | 'FULLY_CERTIFIED' | 'SUSPENDED' | 'REVOKED';

export type PaymentMessageType =
  | 'pacs.008'   // FI-to-FI Customer Credit Transfer
  | 'pacs.009'   // FI-to-FI Institution Credit Transfer
  | 'pacs.002'   // Payment Status Report
  | 'pacs.004'   // Payment Return
  | 'pacs.010'   // FI-to-FI Direct Debit
  | 'camt.053'   // Bank-to-Customer Statement
  | 'camt.052'   // Intraday Statement
  | 'camt.054'   // Credit/Debit Notification
  | 'pain.001'   // Customer Credit Transfer Initiation
  | 'pain.002'   // Customer Payment Status Report
  | 'pain.008'   // Customer Direct Debit Initiation
  | 'sepa.sct'   // SEPA Credit Transfer
  | 'sepa.sdd'   // SEPA Direct Debit
  | 'swift.mt103' // SWIFT MT103 (Customer Transfer)
  | 'swift.mt202' // SWIFT MT202 (Bank Transfer)
  | 'swift.gpi';  // SWIFT GPI Tracker

export type PaymentStatus =
  | 'INITIATED'
  | 'PROCESSING'
  | 'COMPLIANCE_CHECK'
  | 'AML_SCREENING'
  | 'SANCTIONED'       // Blocked by sanctions
  | 'SETTLED'
  | 'COMPLETED'
  | 'RETURNED'
  | 'FAILED'
  | 'PENDING_APPROVAL';

export type CurrencyCategory = 'FIAT_MAJOR' | 'FIAT_MINOR' | 'FIAT_EXOTIC' | 'STABLECOIN' | 'CBDC' | 'COMMODITY_BACKED';

// ────────────────────────────────────────────────────────
// 2. INTERFACES
// ────────────────────────────────────────────────────────

export interface TokenizedCurrency {
  iso4217: string;           // USD, EUR, GBP, JPY ...
  name: string;
  symbol: string;            // $, €, £, ¥ ...
  contractName: string;      // USD20022, EUR20022 ...
  contractAddress: string;   // archt:bank:usd20022:xxxx
  category: CurrencyCategory;
  country: string;           // Country / Region
  decimals: number;
  totalSupply: number;       // Total minted on-chain
  circulatingSupply: number;
  reserveBacked: boolean;    // Backed by reserves (Chainlink PoR)
  porFeedId?: string;        // Link to PoR feed
  swiftCode?: string;        // SWIFT network code
  ibanPrefix?: string;       // e.g. "DE" for Germany
  isActive: boolean;
  exchangeRateUSD: number;
  lastRateUpdate: number;
  dailyVolume: number;
  totalTransactions: number;
  logo: string;              // Flag or symbol
}

export interface BankingEntity {
  id: string;
  name: string;
  legalName: string;
  type: BankingEntityType;
  swiftBIC: string;          // SWIFT BIC code (8 or 11 chars)
  lei: string;               // Legal Entity Identifier (20 chars)
  country: string;           // ISO 3166-1 alpha-2
  jurisdiction: string;
  regulatoryBody: string;    // e.g. "Federal Reserve", "ECB", "FCA"
  licenseNumber: string;
  verificationLevel: EntityVerificationLevel;
  verifiedAt?: number;
  apiKeys: APIKey[];
  allowedCurrencies: string[];  // ISO 4217 codes they can transact
  dailyLimit: number;           // USD equivalent daily limit
  monthlyVolume: number;
  totalTransactions: number;
  complianceScore: number;      // 0-100
  amlRating: 'LOW' | 'MEDIUM' | 'HIGH';
  kybDocuments: string[];       // Document hashes
  walletAddress: string;        // archt:bank:...
  webhookUrl?: string;          // For real-time notifications
  ipWhitelist: string[];        // Allowed IPs for API access
  createdAt: number;
  lastActivity: number;
  contactEmail: string;
  logo?: string;
  correspondentBanks: string[]; // BIC codes of correspondent banks
  supportedRails: PaymentMessageType[];
  settlementAccount: string;    // On-chain settlement address
}

export interface APIKey {
  id: string;
  key: string;              // api_20022_xxxx
  secret: string;           // hashed
  label: string;
  permissions: ('READ' | 'TRANSFER' | 'STATEMENT' | 'ADMIN')[];
  rateLimit: number;        // requests per minute
  ipRestriction: string[];
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
  expiresAt?: number;
}

export interface SwiftPayment {
  id: string;                   // Unique End-to-End ID (UETR)
  messageType: PaymentMessageType;
  status: PaymentStatus;
  
  // Originator
  senderEntity: string;         // Banking entity ID
  senderBIC: string;
  senderIBAN?: string;
  senderName: string;
  senderAccount: string;        // On-chain address
  
  // Beneficiary
  receiverEntity: string;
  receiverBIC: string;
  receiverIBAN?: string;
  receiverName: string;
  receiverAccount: string;
  
  // Payment details
  currency: string;             // ISO 4217
  amount: number;
  fee: number;
  exchangeRate?: number;        // If cross-currency
  targetCurrency?: string;      // If cross-currency conversion
  targetAmount?: number;
  
  // Reference
  remittanceInfo: string;       // Payment reference/description
  instructionId: string;        // Instruction identification
  txHash?: string;              // On-chain transaction hash
  blockNumber?: number;
  
  // Compliance
  amlStatus: 'CLEAR' | 'REVIEW' | 'BLOCKED' | 'PENDING';
  sanctionsCheck: boolean;
  complianceNotes: string[];
  
  // Timestamps
  createdAt: number;
  processedAt?: number;
  settledAt?: number;
  completedAt?: number;
  
  // Routing
  intermediaryBanks: string[];  // BIC codes of intermediary banks
  chargeType: 'SHA' | 'OUR' | 'BEN';  // Charge allocation
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  valueDate: string;            // YYYY-MM-DD
  
  // ISO 20022 XML reference
  iso20022Ref?: string;
}

export interface PaymentNetworkStats {
  totalEntities: number;
  certifiedBanks: number;
  certifiedFintechs: number;
  totalCurrencies: number;
  activeCurrencies: number;
  totalTransactions: number;
  last24hTransactions: number;
  last24hVolume: number;
  totalVolumeUSD: number;
  avgSettlementTime: number;    // seconds
  successRate: number;          // percentage
  activeAPIKeys: number;
  pendingPayments: number;
  topCurrencyPairs: { from: string; to: string; volume: number }[];
}

// ────────────────────────────────────────────────────────
// 3. TOKENIZED CURRENCIES — All major & exotic fiat
// ────────────────────────────────────────────────────────

const CURRENCIES: TokenizedCurrency[] = [
  // ── MAJOR ──
  { iso4217: 'USD', name: 'US Dollar', symbol: '$', contractName: 'USD20022', contractAddress: 'archt:bank:usd20022:a1b2c3d4e5f60001', category: 'FIAT_MAJOR', country: 'US', decimals: 6, totalSupply: 5_000_000_000, circulatingSupply: 3_200_000_000, reserveBacked: true, porFeedId: 'por-usdc', swiftCode: 'USD', ibanPrefix: 'US', isActive: true, exchangeRateUSD: 1, lastRateUpdate: Date.now(), dailyVolume: 850_000_000, totalTransactions: 1_250_000, logo: '🇺🇸' },
  { iso4217: 'EUR', name: 'Euro', symbol: '€', contractName: 'EUR20022', contractAddress: 'archt:bank:eur20022:a1b2c3d4e5f60002', category: 'FIAT_MAJOR', country: 'EU', decimals: 6, totalSupply: 4_200_000_000, circulatingSupply: 2_800_000_000, reserveBacked: true, swiftCode: 'EUR', ibanPrefix: 'DE', isActive: true, exchangeRateUSD: 1.085, lastRateUpdate: Date.now(), dailyVolume: 720_000_000, totalTransactions: 980_000, logo: '🇪🇺' },
  { iso4217: 'GBP', name: 'British Pound', symbol: '£', contractName: 'GBP20022', contractAddress: 'archt:bank:gbp20022:a1b2c3d4e5f60003', category: 'FIAT_MAJOR', country: 'GB', decimals: 6, totalSupply: 2_100_000_000, circulatingSupply: 1_400_000_000, reserveBacked: true, swiftCode: 'GBP', ibanPrefix: 'GB', isActive: true, exchangeRateUSD: 1.267, lastRateUpdate: Date.now(), dailyVolume: 450_000_000, totalTransactions: 620_000, logo: '🇬🇧' },
  { iso4217: 'JPY', name: 'Japanese Yen', symbol: '¥', contractName: 'JPY20022', contractAddress: 'archt:bank:jpy20022:a1b2c3d4e5f60004', category: 'FIAT_MAJOR', country: 'JP', decimals: 0, totalSupply: 680_000_000_000, circulatingSupply: 420_000_000_000, reserveBacked: true, swiftCode: 'JPY', ibanPrefix: 'JP', isActive: true, exchangeRateUSD: 0.0067, lastRateUpdate: Date.now(), dailyVolume: 320_000_000, totalTransactions: 410_000, logo: '🇯🇵' },
  { iso4217: 'CHF', name: 'Swiss Franc', symbol: 'Fr', contractName: 'CHF20022', contractAddress: 'archt:bank:chf20022:a1b2c3d4e5f60005', category: 'FIAT_MAJOR', country: 'CH', decimals: 6, totalSupply: 1_800_000_000, circulatingSupply: 1_100_000_000, reserveBacked: true, swiftCode: 'CHF', ibanPrefix: 'CH', isActive: true, exchangeRateUSD: 1.128, lastRateUpdate: Date.now(), dailyVolume: 280_000_000, totalTransactions: 350_000, logo: '🇨🇭' },
  { iso4217: 'CNY', name: 'Chinese Yuan', symbol: '¥', contractName: 'CNY20022', contractAddress: 'archt:bank:cny20022:a1b2c3d4e5f60006', category: 'FIAT_MAJOR', country: 'CN', decimals: 6, totalSupply: 32_000_000_000, circulatingSupply: 21_000_000_000, reserveBacked: true, swiftCode: 'CNY', ibanPrefix: 'CN', isActive: true, exchangeRateUSD: 0.138, lastRateUpdate: Date.now(), dailyVolume: 410_000_000, totalTransactions: 520_000, logo: '🇨🇳' },
  { iso4217: 'CAD', name: 'Canadian Dollar', symbol: 'C$', contractName: 'CAD20022', contractAddress: 'archt:bank:cad20022:a1b2c3d4e5f60007', category: 'FIAT_MAJOR', country: 'CA', decimals: 6, totalSupply: 1_600_000_000, circulatingSupply: 980_000_000, reserveBacked: true, swiftCode: 'CAD', ibanPrefix: 'CA', isActive: true, exchangeRateUSD: 0.741, lastRateUpdate: Date.now(), dailyVolume: 180_000_000, totalTransactions: 240_000, logo: '🇨🇦' },
  { iso4217: 'AUD', name: 'Australian Dollar', symbol: 'A$', contractName: 'AUD20022', contractAddress: 'archt:bank:aud20022:a1b2c3d4e5f60008', category: 'FIAT_MAJOR', country: 'AU', decimals: 6, totalSupply: 1_400_000_000, circulatingSupply: 860_000_000, reserveBacked: true, swiftCode: 'AUD', ibanPrefix: 'AU', isActive: true, exchangeRateUSD: 0.655, lastRateUpdate: Date.now(), dailyVolume: 160_000_000, totalTransactions: 210_000, logo: '🇦🇺' },
  
  // ── LATAM ──
  { iso4217: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', contractName: 'MXN20022', contractAddress: 'archt:bank:mxn20022:a1b2c3d4e5f60009', category: 'FIAT_MINOR', country: 'MX', decimals: 6, totalSupply: 85_000_000_000, circulatingSupply: 52_000_000_000, reserveBacked: true, porFeedId: 'por-mxn', swiftCode: 'MXN', ibanPrefix: 'MX', isActive: true, exchangeRateUSD: 0.058, lastRateUpdate: Date.now(), dailyVolume: 95_000_000, totalTransactions: 180_000, logo: '🇲🇽' },
  { iso4217: 'BRL', name: 'Brazilian Real', symbol: 'R$', contractName: 'BRL20022', contractAddress: 'archt:bank:brl20022:a1b2c3d4e5f60010', category: 'FIAT_MINOR', country: 'BR', decimals: 6, totalSupply: 28_000_000_000, circulatingSupply: 17_000_000_000, reserveBacked: true, swiftCode: 'BRL', ibanPrefix: 'BR', isActive: true, exchangeRateUSD: 0.175, lastRateUpdate: Date.now(), dailyVolume: 78_000_000, totalTransactions: 145_000, logo: '🇧🇷' },
  { iso4217: 'COP', name: 'Colombian Peso', symbol: 'Col$', contractName: 'COP20022', contractAddress: 'archt:bank:cop20022:a1b2c3d4e5f60011', category: 'FIAT_MINOR', country: 'CO', decimals: 0, totalSupply: 2_100_000_000_000, circulatingSupply: 1_300_000_000_000, reserveBacked: false, swiftCode: 'COP', ibanPrefix: 'CO', isActive: true, exchangeRateUSD: 0.00024, lastRateUpdate: Date.now(), dailyVolume: 32_000_000, totalTransactions: 68_000, logo: '🇨🇴' },
  { iso4217: 'ARS', name: 'Argentine Peso', symbol: 'AR$', contractName: 'ARS20022', contractAddress: 'archt:bank:ars20022:a1b2c3d4e5f60012', category: 'FIAT_EXOTIC', country: 'AR', decimals: 6, totalSupply: 5_800_000_000_000, circulatingSupply: 3_500_000_000_000, reserveBacked: false, swiftCode: 'ARS', isActive: true, exchangeRateUSD: 0.00094, lastRateUpdate: Date.now(), dailyVolume: 18_000_000, totalTransactions: 42_000, logo: '🇦🇷' },
  { iso4217: 'CLP', name: 'Chilean Peso', symbol: 'CL$', contractName: 'CLP20022', contractAddress: 'archt:bank:clp20022:a1b2c3d4e5f60013', category: 'FIAT_MINOR', country: 'CL', decimals: 0, totalSupply: 480_000_000_000, circulatingSupply: 290_000_000_000, reserveBacked: false, swiftCode: 'CLP', isActive: true, exchangeRateUSD: 0.00107, lastRateUpdate: Date.now(), dailyVolume: 15_000_000, totalTransactions: 35_000, logo: '🇨🇱' },
  { iso4217: 'PEN', name: 'Peruvian Sol', symbol: 'S/.', contractName: 'PEN20022', contractAddress: 'archt:bank:pen20022:a1b2c3d4e5f60014', category: 'FIAT_MINOR', country: 'PE', decimals: 6, totalSupply: 18_000_000_000, circulatingSupply: 11_000_000_000, reserveBacked: false, swiftCode: 'PEN', isActive: true, exchangeRateUSD: 0.267, lastRateUpdate: Date.now(), dailyVolume: 8_000_000, totalTransactions: 22_000, logo: '🇵🇪' },

  // ── ASIA / PACIFIC ──
  { iso4217: 'SGD', name: 'Singapore Dollar', symbol: 'S$', contractName: 'SGD20022', contractAddress: 'archt:bank:sgd20022:a1b2c3d4e5f60015', category: 'FIAT_MAJOR', country: 'SG', decimals: 6, totalSupply: 3_200_000_000, circulatingSupply: 2_000_000_000, reserveBacked: true, swiftCode: 'SGD', ibanPrefix: 'SG', isActive: true, exchangeRateUSD: 0.748, lastRateUpdate: Date.now(), dailyVolume: 120_000_000, totalTransactions: 185_000, logo: '🇸🇬' },
  { iso4217: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', contractName: 'HKD20022', contractAddress: 'archt:bank:hkd20022:a1b2c3d4e5f60016', category: 'FIAT_MAJOR', country: 'HK', decimals: 6, totalSupply: 4_500_000_000, circulatingSupply: 2_800_000_000, reserveBacked: true, swiftCode: 'HKD', ibanPrefix: 'HK', isActive: true, exchangeRateUSD: 0.128, lastRateUpdate: Date.now(), dailyVolume: 95_000_000, totalTransactions: 140_000, logo: '🇭🇰' },
  { iso4217: 'KRW', name: 'South Korean Won', symbol: '₩', contractName: 'KRW20022', contractAddress: 'archt:bank:krw20022:a1b2c3d4e5f60017', category: 'FIAT_MAJOR', country: 'KR', decimals: 0, totalSupply: 6_800_000_000_000, circulatingSupply: 4_200_000_000_000, reserveBacked: true, swiftCode: 'KRW', isActive: true, exchangeRateUSD: 0.00074, lastRateUpdate: Date.now(), dailyVolume: 180_000_000, totalTransactions: 250_000, logo: '🇰🇷' },
  { iso4217: 'INR', name: 'Indian Rupee', symbol: '₹', contractName: 'INR20022', contractAddress: 'archt:bank:inr20022:a1b2c3d4e5f60018', category: 'FIAT_MAJOR', country: 'IN', decimals: 6, totalSupply: 420_000_000_000, circulatingSupply: 260_000_000_000, reserveBacked: true, swiftCode: 'INR', isActive: true, exchangeRateUSD: 0.012, lastRateUpdate: Date.now(), dailyVolume: 145_000_000, totalTransactions: 210_000, logo: '🇮🇳' },
  { iso4217: 'THB', name: 'Thai Baht', symbol: '฿', contractName: 'THB20022', contractAddress: 'archt:bank:thb20022:a1b2c3d4e5f60019', category: 'FIAT_MINOR', country: 'TH', decimals: 6, totalSupply: 180_000_000_000, circulatingSupply: 110_000_000_000, reserveBacked: false, swiftCode: 'THB', isActive: true, exchangeRateUSD: 0.028, lastRateUpdate: Date.now(), dailyVolume: 42_000_000, totalTransactions: 78_000, logo: '🇹🇭' },
  
  // ── MIDDLE EAST / AFRICA ──
  { iso4217: 'AED', name: 'UAE Dirham', symbol: 'د.إ', contractName: 'AED20022', contractAddress: 'archt:bank:aed20022:a1b2c3d4e5f60020', category: 'FIAT_MAJOR', country: 'AE', decimals: 6, totalSupply: 18_000_000_000, circulatingSupply: 11_000_000_000, reserveBacked: true, swiftCode: 'AED', ibanPrefix: 'AE', isActive: true, exchangeRateUSD: 0.2723, lastRateUpdate: Date.now(), dailyVolume: 85_000_000, totalTransactions: 120_000, logo: '🇦🇪' },
  { iso4217: 'SAR', name: 'Saudi Riyal', symbol: '﷼', contractName: 'SAR20022', contractAddress: 'archt:bank:sar20022:a1b2c3d4e5f60021', category: 'FIAT_MAJOR', country: 'SA', decimals: 6, totalSupply: 15_000_000_000, circulatingSupply: 9_200_000_000, reserveBacked: true, swiftCode: 'SAR', ibanPrefix: 'SA', isActive: true, exchangeRateUSD: 0.2667, lastRateUpdate: Date.now(), dailyVolume: 65_000_000, totalTransactions: 95_000, logo: '🇸🇦' },
  { iso4217: 'ZAR', name: 'South African Rand', symbol: 'R', contractName: 'ZAR20022', contractAddress: 'archt:bank:zar20022:a1b2c3d4e5f60022', category: 'FIAT_MINOR', country: 'ZA', decimals: 6, totalSupply: 92_000_000_000, circulatingSupply: 56_000_000_000, reserveBacked: false, swiftCode: 'ZAR', isActive: true, exchangeRateUSD: 0.055, lastRateUpdate: Date.now(), dailyVolume: 28_000_000, totalTransactions: 52_000, logo: '🇿🇦' },
  { iso4217: 'NGN', name: 'Nigerian Naira', symbol: '₦', contractName: 'NGN20022', contractAddress: 'archt:bank:ngn20022:a1b2c3d4e5f60023', category: 'FIAT_EXOTIC', country: 'NG', decimals: 6, totalSupply: 8_500_000_000_000, circulatingSupply: 5_100_000_000_000, reserveBacked: false, swiftCode: 'NGN', isActive: true, exchangeRateUSD: 0.00063, lastRateUpdate: Date.now(), dailyVolume: 12_000_000, totalTransactions: 34_000, logo: '🇳🇬' },

  // ── EUROPE ──
  { iso4217: 'SEK', name: 'Swedish Krona', symbol: 'kr', contractName: 'SEK20022', contractAddress: 'archt:bank:sek20022:a1b2c3d4e5f60024', category: 'FIAT_MINOR', country: 'SE', decimals: 6, totalSupply: 52_000_000_000, circulatingSupply: 32_000_000_000, reserveBacked: true, swiftCode: 'SEK', ibanPrefix: 'SE', isActive: true, exchangeRateUSD: 0.095, lastRateUpdate: Date.now(), dailyVolume: 38_000_000, totalTransactions: 62_000, logo: '🇸🇪' },
  { iso4217: 'NOK', name: 'Norwegian Krone', symbol: 'kr', contractName: 'NOK20022', contractAddress: 'archt:bank:nok20022:a1b2c3d4e5f60025', category: 'FIAT_MINOR', country: 'NO', decimals: 6, totalSupply: 48_000_000_000, circulatingSupply: 29_000_000_000, reserveBacked: true, swiftCode: 'NOK', ibanPrefix: 'NO', isActive: true, exchangeRateUSD: 0.092, lastRateUpdate: Date.now(), dailyVolume: 32_000_000, totalTransactions: 55_000, logo: '🇳🇴' },
  { iso4217: 'DKK', name: 'Danish Krone', symbol: 'kr', contractName: 'DKK20022', contractAddress: 'archt:bank:dkk20022:a1b2c3d4e5f60026', category: 'FIAT_MINOR', country: 'DK', decimals: 6, totalSupply: 38_000_000_000, circulatingSupply: 23_000_000_000, reserveBacked: true, swiftCode: 'DKK', ibanPrefix: 'DK', isActive: true, exchangeRateUSD: 0.146, lastRateUpdate: Date.now(), dailyVolume: 28_000_000, totalTransactions: 48_000, logo: '🇩🇰' },
  { iso4217: 'PLN', name: 'Polish Zloty', symbol: 'zł', contractName: 'PLN20022', contractAddress: 'archt:bank:pln20022:a1b2c3d4e5f60027', category: 'FIAT_MINOR', country: 'PL', decimals: 6, totalSupply: 22_000_000_000, circulatingSupply: 14_000_000_000, reserveBacked: false, swiftCode: 'PLN', ibanPrefix: 'PL', isActive: true, exchangeRateUSD: 0.248, lastRateUpdate: Date.now(), dailyVolume: 24_000_000, totalTransactions: 42_000, logo: '🇵🇱' },
  { iso4217: 'TRY', name: 'Turkish Lira', symbol: '₺', contractName: 'TRY20022', contractAddress: 'archt:bank:try20022:a1b2c3d4e5f60028', category: 'FIAT_EXOTIC', country: 'TR', decimals: 6, totalSupply: 180_000_000_000, circulatingSupply: 110_000_000_000, reserveBacked: false, swiftCode: 'TRY', ibanPrefix: 'TR', isActive: true, exchangeRateUSD: 0.031, lastRateUpdate: Date.now(), dailyVolume: 18_000_000, totalTransactions: 38_000, logo: '🇹🇷' },

  // ── CBDC / STABLECOINS ──
  { iso4217: 'USDC', name: 'USD Coin', symbol: 'USDC', contractName: 'USDC20022', contractAddress: 'archt:bank:usdc20022:a1b2c3d4e5f60030', category: 'STABLECOIN', country: 'US', decimals: 6, totalSupply: 32_000_000_000, circulatingSupply: 32_000_000_000, reserveBacked: true, porFeedId: 'por-usdc', isActive: true, exchangeRateUSD: 1, lastRateUpdate: Date.now(), dailyVolume: 420_000_000, totalTransactions: 680_000, logo: '💵' },
  { iso4217: 'USDT', name: 'Tether USD', symbol: 'USDT', contractName: 'USDT20022', contractAddress: 'archt:bank:usdt20022:a1b2c3d4e5f60031', category: 'STABLECOIN', country: 'US', decimals: 6, totalSupply: 83_000_000_000, circulatingSupply: 83_000_000_000, reserveBacked: true, isActive: true, exchangeRateUSD: 1, lastRateUpdate: Date.now(), dailyVolume: 520_000_000, totalTransactions: 920_000, logo: '💵' },
  { iso4217: 'eCNY', name: 'Digital Yuan (CBDC)', symbol: 'e¥', contractName: 'eCNY20022', contractAddress: 'archt:bank:ecny20022:a1b2c3d4e5f60032', category: 'CBDC', country: 'CN', decimals: 6, totalSupply: 14_000_000_000, circulatingSupply: 4_200_000_000, reserveBacked: true, isActive: true, exchangeRateUSD: 0.138, lastRateUpdate: Date.now(), dailyVolume: 65_000_000, totalTransactions: 120_000, logo: '🇨🇳' },
  { iso4217: 'eNGN', name: 'eNaira (CBDC)', symbol: 'e₦', contractName: 'eNGN20022', contractAddress: 'archt:bank:engn20022:a1b2c3d4e5f60033', category: 'CBDC', country: 'NG', decimals: 6, totalSupply: 1_200_000_000_000, circulatingSupply: 400_000_000_000, reserveBacked: true, isActive: true, exchangeRateUSD: 0.00063, lastRateUpdate: Date.now(), dailyVolume: 5_000_000, totalTransactions: 15_000, logo: '🇳🇬' },

  // ── COMMODITY BACKED ──
  { iso4217: 'XAU', name: 'Gold Token', symbol: 'XAU', contractName: 'XAU20022', contractAddress: 'archt:bank:xau20022:a1b2c3d4e5f60034', category: 'COMMODITY_BACKED', country: 'GLOBAL', decimals: 8, totalSupply: 500_000, circulatingSupply: 320_000, reserveBacked: true, porFeedId: 'por-gold', isActive: true, exchangeRateUSD: 2341, lastRateUpdate: Date.now(), dailyVolume: 45_000_000, totalTransactions: 28_000, logo: '🥇' },
];

// ────────────────────────────────────────────────────────
// 4. SEEDED BANKING ENTITIES
// ────────────────────────────────────────────────────────

function genId(): string { return randomBytes(16).toString('hex'); }
function genAPIKey(): string { return `api_20022_${randomBytes(16).toString('hex')}`; }
function genSecret(): string { return createHash('sha256').update(randomBytes(32)).digest('hex'); }
function genBankAddr(name: string): string {
  const h = createHash('sha256').update(name + 'bank').digest('hex').slice(0, 16);
  return `archt:bank:${name.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}:${h}`;
}

const SEED_ENTITIES: BankingEntity[] = [
  {
    id: genId(), name: 'JPMorgan Chase', legalName: 'JPMorgan Chase & Co.', type: 'BANK',
    swiftBIC: 'CHASUS33', lei: '8I5DZWZKVSZI1NUHU748', country: 'US', jurisdiction: 'Federal Reserve / OCC',
    regulatoryBody: 'Federal Reserve', licenseNumber: 'FRB-001-NYC',
    verificationLevel: 'FULLY_CERTIFIED', verifiedAt: Date.now() - 86400000 * 120,
    apiKeys: [{ id: genId(), key: genAPIKey(), secret: genSecret(), label: 'Production', permissions: ['READ', 'TRANSFER', 'STATEMENT', 'ADMIN'], rateLimit: 10000, ipRestriction: [], createdAt: Date.now() - 86400000 * 90, lastUsed: Date.now() - 3600000, isActive: true }],
    allowedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SGD', 'HKD', 'USDC', 'USDT', 'XAU'],
    dailyLimit: 500_000_000, monthlyVolume: 12_500_000_000, totalTransactions: 285_000, complianceScore: 98, amlRating: 'LOW',
    kybDocuments: ['hash-kyb-jpm-001', 'hash-kyb-jpm-002'], walletAddress: genBankAddr('jpmorgan'),
    webhookUrl: 'https://api.jpmorgan.com/20022/webhook', ipWhitelist: ['10.0.0.0/8'],
    createdAt: Date.now() - 86400000 * 180, lastActivity: Date.now() - 600000, contactEmail: 'blockchain@jpmorgan.com',
    logo: '🏦', correspondentBanks: ['DEUTDEFF', 'BARCGB22', 'BNPAFRPP'],
    supportedRails: ['swift.mt103', 'swift.mt202', 'swift.gpi', 'pacs.008', 'pacs.009', 'camt.053'],
    settlementAccount: genBankAddr('jpmorgan-settlement'),
  },
  {
    id: genId(), name: 'Deutsche Bank', legalName: 'Deutsche Bank AG', type: 'BANK',
    swiftBIC: 'DEUTDEFF', lei: '7LTWFZYICNSX8D621K86', country: 'DE', jurisdiction: 'BaFin / ECB',
    regulatoryBody: 'European Central Bank', licenseNumber: 'ECB-DE-4012',
    verificationLevel: 'FULLY_CERTIFIED', verifiedAt: Date.now() - 86400000 * 100,
    apiKeys: [{ id: genId(), key: genAPIKey(), secret: genSecret(), label: 'Production EU', permissions: ['READ', 'TRANSFER', 'STATEMENT'], rateLimit: 8000, ipRestriction: [], createdAt: Date.now() - 86400000 * 80, lastUsed: Date.now() - 7200000, isActive: true }],
    allowedCurrencies: ['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'TRY'],
    dailyLimit: 400_000_000, monthlyVolume: 9_800_000_000, totalTransactions: 210_000, complianceScore: 96, amlRating: 'LOW',
    kybDocuments: ['hash-kyb-db-001'], walletAddress: genBankAddr('deutschebank'),
    createdAt: Date.now() - 86400000 * 150, lastActivity: Date.now() - 1800000, contactEmail: 'digital@db.com',
    logo: '🏦', correspondentBanks: ['CHASUS33', 'BARCGB22', 'BNPAFRPP', 'COBADEFF'],
    supportedRails: ['swift.mt103', 'swift.mt202', 'pacs.008', 'pacs.009', 'sepa.sct', 'sepa.sdd', 'camt.053'],
    settlementAccount: genBankAddr('deutschebank-settlement'), ipWhitelist: [],
  },
  {
    id: genId(), name: 'HSBC Holdings', legalName: 'HSBC Holdings plc', type: 'BANK',
    swiftBIC: 'HSBCHKHH', lei: 'MLU0ZO3ML4LN2LL2TL39', country: 'HK', jurisdiction: 'HKMA / PRA',
    regulatoryBody: 'Hong Kong Monetary Authority', licenseNumber: 'HKMA-HSBC-001',
    verificationLevel: 'FULLY_CERTIFIED', verifiedAt: Date.now() - 86400000 * 90,
    apiKeys: [{ id: genId(), key: genAPIKey(), secret: genSecret(), label: 'APAC Hub', permissions: ['READ', 'TRANSFER', 'STATEMENT', 'ADMIN'], rateLimit: 10000, ipRestriction: [], createdAt: Date.now() - 86400000 * 60, lastUsed: Date.now() - 900000, isActive: true }],
    allowedCurrencies: ['USD', 'EUR', 'GBP', 'HKD', 'SGD', 'JPY', 'CNY', 'AUD', 'INR', 'THB', 'AED', 'SAR'],
    dailyLimit: 450_000_000, monthlyVolume: 11_200_000_000, totalTransactions: 245_000, complianceScore: 97, amlRating: 'LOW',
    kybDocuments: ['hash-kyb-hsbc-001'], walletAddress: genBankAddr('hsbc'),
    createdAt: Date.now() - 86400000 * 160, lastActivity: Date.now() - 1200000, contactEmail: 'api@hsbc.com',
    logo: '🏦', correspondentBanks: ['CHASUS33', 'DEUTDEFF', 'SCBLSGSG'],
    supportedRails: ['swift.mt103', 'swift.mt202', 'swift.gpi', 'pacs.008', 'pacs.009', 'camt.053', 'camt.054'],
    settlementAccount: genBankAddr('hsbc-settlement'), ipWhitelist: [],
  },
  {
    id: genId(), name: 'Stripe Financial', legalName: 'Stripe, Inc.', type: 'FINTECH',
    swiftBIC: 'STRPUS3N', lei: '549300VE3N0KKZLY5A24', country: 'US', jurisdiction: 'FinCEN / State',
    regulatoryBody: 'FinCEN', licenseNumber: 'MSB-31000234567890',
    verificationLevel: 'FULLY_CERTIFIED', verifiedAt: Date.now() - 86400000 * 60,
    apiKeys: [{ id: genId(), key: genAPIKey(), secret: genSecret(), label: 'Main API', permissions: ['READ', 'TRANSFER'], rateLimit: 50000, ipRestriction: [], createdAt: Date.now() - 86400000 * 45, lastUsed: Date.now() - 300000, isActive: true }],
    allowedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD', 'MXN', 'BRL', 'USDC'],
    dailyLimit: 200_000_000, monthlyVolume: 4_800_000_000, totalTransactions: 890_000, complianceScore: 95, amlRating: 'LOW',
    kybDocuments: ['hash-kyb-stripe-001'], walletAddress: genBankAddr('stripe'),
    webhookUrl: 'https://api.stripe.com/20022/events',
    createdAt: Date.now() - 86400000 * 90, lastActivity: Date.now() - 120000, contactEmail: 'enterprise@stripe.com',
    logo: '💳', correspondentBanks: ['CHASUS33'],
    supportedRails: ['pacs.008', 'pain.001', 'pacs.002', 'camt.054'],
    settlementAccount: genBankAddr('stripe-settlement'), ipWhitelist: [],
  },
  {
    id: genId(), name: 'Wise (TransferWise)', legalName: 'Wise plc', type: 'FINTECH',
    swiftBIC: 'TRWIGB2L', lei: '213800AQKX4CXDMJKT77', country: 'GB', jurisdiction: 'FCA',
    regulatoryBody: 'Financial Conduct Authority', licenseNumber: 'FCA-900507',
    verificationLevel: 'FULLY_CERTIFIED', verifiedAt: Date.now() - 86400000 * 75,
    apiKeys: [{ id: genId(), key: genAPIKey(), secret: genSecret(), label: 'Transfer API', permissions: ['READ', 'TRANSFER', 'STATEMENT'], rateLimit: 30000, ipRestriction: [], createdAt: Date.now() - 86400000 * 50, lastUsed: Date.now() - 600000, isActive: true }],
    allowedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD', 'INR', 'MXN', 'BRL', 'PLN', 'SEK', 'NOK', 'THB', 'ZAR'],
    dailyLimit: 150_000_000, monthlyVolume: 3_200_000_000, totalTransactions: 1_450_000, complianceScore: 94, amlRating: 'LOW',
    kybDocuments: ['hash-kyb-wise-001'], walletAddress: genBankAddr('wise'),
    createdAt: Date.now() - 86400000 * 120, lastActivity: Date.now() - 180000, contactEmail: 'api@wise.com',
    logo: '💳', correspondentBanks: ['BARCGB22', 'CHASUS33'],
    supportedRails: ['pacs.008', 'pacs.002', 'pain.001', 'sepa.sct', 'camt.054'],
    settlementAccount: genBankAddr('wise-settlement'), ipWhitelist: [],
  },
  {
    id: genId(), name: 'Banco Santander', legalName: 'Banco Santander S.A.', type: 'BANK',
    swiftBIC: 'BSCHESMM', lei: '5493006QMFDDMYWIAM13', country: 'ES', jurisdiction: 'Banco de España / ECB',
    regulatoryBody: 'Banco de España', licenseNumber: 'BDE-0049',
    verificationLevel: 'FULLY_CERTIFIED', verifiedAt: Date.now() - 86400000 * 85,
    apiKeys: [{ id: genId(), key: genAPIKey(), secret: genSecret(), label: 'LatAm Gateway', permissions: ['READ', 'TRANSFER', 'STATEMENT'], rateLimit: 8000, ipRestriction: [], createdAt: Date.now() - 86400000 * 70, lastUsed: Date.now() - 2400000, isActive: true }],
    allowedCurrencies: ['EUR', 'USD', 'GBP', 'MXN', 'BRL', 'CLP', 'ARS', 'PEN', 'COP', 'PLN'],
    dailyLimit: 350_000_000, monthlyVolume: 8_500_000_000, totalTransactions: 195_000, complianceScore: 95, amlRating: 'LOW',
    kybDocuments: ['hash-kyb-sant-001'], walletAddress: genBankAddr('santander'),
    createdAt: Date.now() - 86400000 * 140, lastActivity: Date.now() - 3600000, contactEmail: 'digital@santander.com',
    logo: '🏦', correspondentBanks: ['DEUTDEFF', 'CHASUS33', 'BARCGB22'],
    supportedRails: ['swift.mt103', 'swift.mt202', 'pacs.008', 'sepa.sct', 'sepa.sdd', 'camt.053'],
    settlementAccount: genBankAddr('santander-settlement'), ipWhitelist: [],
  },
  {
    id: genId(), name: 'Nubank', legalName: 'Nu Holdings Ltd.', type: 'NEOBANK',
    swiftBIC: 'NABORBRX', lei: '549300P7UXCOQ9J5AQ68', country: 'BR', jurisdiction: 'Banco Central do Brasil',
    regulatoryBody: 'BCB', licenseNumber: 'BCB-NU-2021',
    verificationLevel: 'FULLY_CERTIFIED', verifiedAt: Date.now() - 86400000 * 45,
    apiKeys: [{ id: genId(), key: genAPIKey(), secret: genSecret(), label: 'Pix Gateway', permissions: ['READ', 'TRANSFER'], rateLimit: 20000, ipRestriction: [], createdAt: Date.now() - 86400000 * 30, lastUsed: Date.now() - 480000, isActive: true }],
    allowedCurrencies: ['BRL', 'USD', 'MXN', 'COP', 'USDC'],
    dailyLimit: 80_000_000, monthlyVolume: 1_800_000_000, totalTransactions: 3_200_000, complianceScore: 92, amlRating: 'LOW',
    kybDocuments: ['hash-kyb-nu-001'], walletAddress: genBankAddr('nubank'),
    createdAt: Date.now() - 86400000 * 80, lastActivity: Date.now() - 60000, contactEmail: 'api@nubank.com.br',
    logo: '💜', correspondentBanks: ['CHASUS33'],
    supportedRails: ['pacs.008', 'pain.001', 'camt.054'],
    settlementAccount: genBankAddr('nubank-settlement'), ipWhitelist: [],
  },
  {
    id: genId(), name: 'Revolut', legalName: 'Revolut Ltd', type: 'NEOBANK',
    swiftBIC: 'REVOGB21', lei: '213800CXNXC73BNVNR10', country: 'GB', jurisdiction: 'Bank of Lithuania / FCA',
    regulatoryBody: 'FCA', licenseNumber: 'FCA-900562',
    verificationLevel: 'FULLY_CERTIFIED', verifiedAt: Date.now() - 86400000 * 50,
    apiKeys: [{ id: genId(), key: genAPIKey(), secret: genSecret(), label: 'Global API', permissions: ['READ', 'TRANSFER', 'STATEMENT'], rateLimit: 40000, ipRestriction: [], createdAt: Date.now() - 86400000 * 35, lastUsed: Date.now() - 240000, isActive: true }],
    allowedCurrencies: ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SGD', 'PLN', 'SEK', 'NOK', 'DKK', 'TRY', 'USDC'],
    dailyLimit: 120_000_000, monthlyVolume: 2_800_000_000, totalTransactions: 2_100_000, complianceScore: 93, amlRating: 'LOW',
    kybDocuments: ['hash-kyb-rev-001'], walletAddress: genBankAddr('revolut'),
    createdAt: Date.now() - 86400000 * 95, lastActivity: Date.now() - 90000, contactEmail: 'business-api@revolut.com',
    logo: '🔵', correspondentBanks: ['BARCGB22', 'DEUTDEFF'],
    supportedRails: ['pacs.008', 'pain.001', 'sepa.sct', 'camt.054', 'swift.gpi'],
    settlementAccount: genBankAddr('revolut-settlement'), ipWhitelist: [],
  },
];

// ────────────────────────────────────────────────────────
// 5. SEEDED PAYMENTS
// ────────────────────────────────────────────────────────

function genUETR(): string {
  const p = () => randomBytes(4).toString('hex');
  return `${p()}-${p().slice(0,4)}-4${p().slice(1,4)}-${p().slice(0,4)}-${p()}${p().slice(0,4)}`;
}

function seedPayments(entities: BankingEntity[]): SwiftPayment[] {
  const payments: SwiftPayment[] = [];
  const pairs: [number, number, string, number, PaymentMessageType, PaymentStatus][] = [
    [0, 1, 'USD', 2_500_000, 'swift.mt103', 'COMPLETED'],
    [1, 2, 'EUR', 8_200_000, 'pacs.008', 'COMPLETED'],
    [2, 0, 'GBP', 1_800_000, 'swift.gpi', 'COMPLETED'],
    [3, 4, 'USD', 450_000, 'pacs.008', 'COMPLETED'],
    [4, 5, 'EUR', 320_000, 'sepa.sct', 'COMPLETED'],
    [5, 6, 'MXN', 15_000_000, 'swift.mt103', 'COMPLETED'],
    [6, 7, 'BRL', 2_800_000, 'pacs.008', 'COMPLETED'],
    [7, 3, 'GBP', 1_200_000, 'swift.mt103', 'COMPLETED'],
    [0, 5, 'USD', 45_000_000, 'swift.mt202', 'COMPLETED'],
    [1, 0, 'EUR', 12_500_000, 'pacs.009', 'COMPLETED'],
    [0, 2, 'USD', 5_800_000, 'swift.gpi', 'PROCESSING'],
    [3, 0, 'USD', 890_000, 'pacs.008', 'COMPLIANCE_CHECK'],
    [2, 5, 'HKD', 42_000_000, 'swift.mt103', 'PROCESSING'],
    [4, 6, 'USD', 1_200_000, 'pain.001', 'AML_SCREENING'],
    [7, 1, 'EUR', 650_000, 'sepa.sct', 'SETTLED'],
    [5, 0, 'EUR', 18_000_000, 'pacs.008', 'COMPLETED'],
    [0, 7, 'USD', 3_400_000, 'swift.mt103', 'COMPLETED'],
    [6, 3, 'BRL', 5_600_000, 'pacs.008', 'COMPLETED'],
    [1, 4, 'EUR', 780_000, 'sepa.sct', 'COMPLETED'],
    [2, 7, 'SGD', 4_200_000, 'swift.gpi', 'PENDING_APPROVAL'],
  ];

  pairs.forEach(([si, ri, cur, amt, msg, status], idx) => {
    const s = entities[si], r = entities[ri];
    const ts = Date.now() - (idx * 3600000 * 2);
    payments.push({
      id: genUETR(),
      messageType: msg,
      status,
      senderEntity: s.id, senderBIC: s.swiftBIC, senderName: s.name, senderAccount: s.walletAddress,
      senderIBAN: `${s.country}89${s.swiftBIC}00000${(idx * 1234567).toString().slice(0,8)}`,
      receiverEntity: r.id, receiverBIC: r.swiftBIC, receiverName: r.name, receiverAccount: r.walletAddress,
      receiverIBAN: `${r.country}12${r.swiftBIC}00000${(idx * 7654321).toString().slice(0,8)}`,
      currency: cur, amount: amt, fee: amt * 0.0005,
      remittanceInfo: ['Interbank settlement', 'Cross-border payment', 'Trade finance', 'FX settlement', 'Liquidity transfer', 'Client payment'][idx % 6],
      instructionId: `INSTR-${Date.now().toString(36)}-${idx}`,
      txHash: status === 'COMPLETED' || status === 'SETTLED' ? `0x${randomBytes(32).toString('hex')}` : undefined,
      blockNumber: status === 'COMPLETED' || status === 'SETTLED' ? 25000 + idx * 3 : undefined,
      amlStatus: status === 'AML_SCREENING' ? 'REVIEW' : status === 'SANCTIONED' ? 'BLOCKED' : 'CLEAR',
      sanctionsCheck: true,
      complianceNotes: status === 'COMPLIANCE_CHECK' ? ['Enhanced due diligence required'] : [],
      createdAt: ts,
      processedAt: ['COMPLETED', 'SETTLED'].includes(status) ? ts + 15000 : undefined,
      settledAt: ['COMPLETED', 'SETTLED'].includes(status) ? ts + 45000 : undefined,
      completedAt: status === 'COMPLETED' ? ts + 60000 : undefined,
      intermediaryBanks: idx % 3 === 0 ? ['CHASUS33'] : [],
      chargeType: 'SHA',
      priority: amt > 10_000_000 ? 'URGENT' : amt > 1_000_000 ? 'HIGH' : 'NORMAL',
      valueDate: new Date(ts + 86400000).toISOString().split('T')[0],
    });
  });
  return payments;
}

// ────────────────────────────────────────────────────────
// 6. ENGINE SINGLETON
// ────────────────────────────────────────────────────────

export class SwiftPaymentEngine {
  currencies: TokenizedCurrency[];
  entities: BankingEntity[];
  payments: SwiftPayment[];

  constructor() {
    this.currencies = [...CURRENCIES];
    this.entities = [...SEED_ENTITIES];
    this.payments = seedPayments(this.entities);

    // Simulate rate updates every 30s
    setInterval(() => this.updateRates(), 30_000);
    // Simulate payment progression every 10s
    setInterval(() => this.progressPayments(), 10_000);
  }

  // ── Currencies ──
  getCurrencies(): TokenizedCurrency[] { return this.currencies; }
  getCurrency(iso: string): TokenizedCurrency | undefined { return this.currencies.find(c => c.iso4217 === iso); }
  getActiveCurrencies(): TokenizedCurrency[] { return this.currencies.filter(c => c.isActive); }

  // ── Entities ──
  getEntities(): BankingEntity[] { return this.entities; }
  getEntity(id: string): BankingEntity | undefined { return this.entities.find(e => e.id === id); }
  getEntityByBIC(bic: string): BankingEntity | undefined { return this.entities.find(e => e.swiftBIC === bic); }
  getCertifiedEntities(): BankingEntity[] { return this.entities.filter(e => e.verificationLevel === 'FULLY_CERTIFIED'); }

  // ── API Key Validation ──
  validateAPIKey(apiKey: string): { valid: boolean; entity?: BankingEntity; permissions?: string[] } {
    for (const entity of this.entities) {
      const key = entity.apiKeys.find(k => k.key === apiKey && k.isActive);
      if (key) {
        key.lastUsed = Date.now();
        return { valid: true, entity, permissions: key.permissions };
      }
    }
    return { valid: false };
  }

  // ── Payments ──
  getPayments(limit = 50): SwiftPayment[] { return this.payments.slice(0, limit); }
  getPayment(id: string): SwiftPayment | undefined { return this.payments.find(p => p.id === id); }
  getPaymentsByEntity(entityId: string): SwiftPayment[] {
    return this.payments.filter(p => p.senderEntity === entityId || p.receiverEntity === entityId);
  }

  initiatePayment(params: {
    senderEntityId: string;
    receiverBIC: string;
    receiverIBAN?: string;
    receiverName: string;
    currency: string;
    amount: number;
    messageType: PaymentMessageType;
    remittanceInfo: string;
    priority?: 'NORMAL' | 'HIGH' | 'URGENT';
    chargeType?: 'SHA' | 'OUR' | 'BEN';
  }): SwiftPayment | { error: string } {
    const sender = this.getEntity(params.senderEntityId);
    if (!sender) return { error: 'Sender entity not found' };
    if (sender.verificationLevel !== 'FULLY_CERTIFIED') return { error: 'Entity not certified — KYB verification required' };
    if (!sender.allowedCurrencies.includes(params.currency)) return { error: `Currency ${params.currency} not authorized for this entity` };
    
    const cur = this.getCurrency(params.currency);
    if (!cur || !cur.isActive) return { error: `Currency ${params.currency} is not active on the network` };
    
    const amtUSD = params.amount * cur.exchangeRateUSD;
    if (amtUSD > sender.dailyLimit) return { error: `Amount exceeds daily limit of $${sender.dailyLimit.toLocaleString()}` };

    const receiver = this.getEntityByBIC(params.receiverBIC);

    const payment: SwiftPayment = {
      id: genUETR(),
      messageType: params.messageType,
      status: 'INITIATED',
      senderEntity: sender.id, senderBIC: sender.swiftBIC, senderName: sender.name, senderAccount: sender.walletAddress,
      receiverEntity: receiver?.id || '', receiverBIC: params.receiverBIC, receiverName: params.receiverName,
      receiverAccount: receiver?.walletAddress || `ext:${params.receiverBIC}`,
      receiverIBAN: params.receiverIBAN,
      currency: params.currency, amount: params.amount,
      fee: params.amount * 0.0005 + (params.priority === 'URGENT' ? 25 : params.priority === 'HIGH' ? 10 : 0),
      remittanceInfo: params.remittanceInfo,
      instructionId: `INSTR-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`,
      amlStatus: 'PENDING', sanctionsCheck: false, complianceNotes: [],
      createdAt: Date.now(),
      intermediaryBanks: [],
      chargeType: params.chargeType || 'SHA',
      priority: params.priority || 'NORMAL',
      valueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    };

    this.payments.unshift(payment);
    sender.totalTransactions++;
    sender.monthlyVolume += amtUSD;
    sender.lastActivity = Date.now();
    cur.totalTransactions++;
    cur.dailyVolume += amtUSD;

    return payment;
  }

  // ── Stats ──
  getStats(): PaymentNetworkStats {
    const now = Date.now();
    const h24 = now - 86400000;
    const recent = this.payments.filter(p => p.createdAt > h24);
    
    // Top currency pairs
    const pairMap = new Map<string, number>();
    this.payments.forEach(p => {
      const key = `${p.currency}→${p.targetCurrency || p.currency}`;
      pairMap.set(key, (pairMap.get(key) || 0) + p.amount * (this.getCurrency(p.currency)?.exchangeRateUSD || 1));
    });
    const topPairs = [...pairMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => { const [f, t] = k.split('→'); return { from: f, to: t, volume: v }; });

    return {
      totalEntities: this.entities.length,
      certifiedBanks: this.entities.filter(e => e.type === 'BANK' && e.verificationLevel === 'FULLY_CERTIFIED').length,
      certifiedFintechs: this.entities.filter(e => ['FINTECH', 'NEOBANK'].includes(e.type) && e.verificationLevel === 'FULLY_CERTIFIED').length,
      totalCurrencies: this.currencies.length,
      activeCurrencies: this.currencies.filter(c => c.isActive).length,
      totalTransactions: this.payments.length,
      last24hTransactions: recent.length,
      last24hVolume: recent.reduce((s, p) => s + p.amount * (this.getCurrency(p.currency)?.exchangeRateUSD || 1), 0),
      totalVolumeUSD: this.payments.reduce((s, p) => s + p.amount * (this.getCurrency(p.currency)?.exchangeRateUSD || 1), 0),
      avgSettlementTime: 42, // seconds average
      successRate: 99.7,
      activeAPIKeys: this.entities.reduce((s, e) => s + e.apiKeys.filter(k => k.isActive).length, 0),
      pendingPayments: this.payments.filter(p => !['COMPLETED', 'FAILED', 'RETURNED', 'SANCTIONED'].includes(p.status)).length,
      topCurrencyPairs: topPairs,
    };
  }

  // ── Internal: rate fluctuation ──
  private updateRates() {
    this.currencies.forEach(c => {
      if (c.category === 'STABLECOIN' || c.category === 'CBDC') return; // Stable
      const drift = 1 + (Math.random() - 0.5) * 0.002; // ±0.1%
      c.exchangeRateUSD *= drift;
      c.lastRateUpdate = Date.now();
    });
  }

  // ── Internal: progress pending payments ──
  private progressPayments() {
    const flow: Record<string, PaymentStatus> = {
      'INITIATED': 'COMPLIANCE_CHECK',
      'COMPLIANCE_CHECK': 'AML_SCREENING',
      'AML_SCREENING': 'PROCESSING',
      'PROCESSING': 'SETTLED',
      'SETTLED': 'COMPLETED',
      'PENDING_APPROVAL': 'PROCESSING',
    };
    this.payments.forEach(p => {
      if (p.status in flow && Math.random() > 0.6) {
        p.status = flow[p.status];
        if (p.status === 'PROCESSING') { p.processedAt = Date.now(); p.amlStatus = 'CLEAR'; p.sanctionsCheck = true; }
        if (p.status === 'SETTLED') { p.settledAt = Date.now(); p.txHash = `0x${randomBytes(32).toString('hex')}`; p.blockNumber = 25100 + Math.floor(Math.random() * 100); }
        if (p.status === 'COMPLETED') p.completedAt = Date.now();
      }
    });
  }
}

// ── Singleton ──
const G = globalThis as any;
export function getSwiftEngine(): SwiftPaymentEngine {
  if (!G.__swiftPaymentEngine) G.__swiftPaymentEngine = new SwiftPaymentEngine();
  return G.__swiftPaymentEngine;
}
