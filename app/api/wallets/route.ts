import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

// ═══════════════════════════════════════════════════════════════
// WALLET SYSTEM — Verified wallets with privacy controls
// ═══════════════════════════════════════════════════════════════

export type WalletType =
  | 'PERSONAL' | 'BUSINESS' | 'INSTITUTIONAL' | 'GOVERNMENT'
  | 'DEVELOPER' | 'MUSICIAN' | 'INFLUENCER' | 'FILMMAKER'
  | 'ATTORNEY' | 'AUDITOR' | 'MINER' | 'REALTOR'
  | 'DOCTOR' | 'ENGINEER' | 'AI_RESEARCHER' | 'ATHLETE'
  | 'TRADER' | 'JOURNALIST' | 'PROFESSOR' | 'CHEF'
  | 'PILOT' | 'MILITARY' | 'NGO' | 'PHARMA'
  | 'ENERGY' | 'TELECOM' | 'ESPORTS' | 'DESIGNER'
  | 'BANK' | 'FINTECH' | 'CENTRAL_BANK' | 'NEOBANK' | 'EXCHANGE';
export type WalletVisibility = 'PUBLIC' | 'PRIVATE' | 'ANONYMOUS';
export type WalletVerificationLevel = 'UNVERIFIED' | 'BASIC' | 'STANDARD' | 'FULL' | 'INSTITUTIONAL';

interface Wallet {
  address: string;
  displayName: string;
  walletType: WalletType;
  visibility: WalletVisibility;
  verificationLevel: WalletVerificationLevel;
  verified: boolean;
  // KYC/KYB
  kycCompleted: boolean;
  kybCompleted: boolean;
  professionalLicense?: string;
  // Nationality
  nationality?: string;           // ISO 3166-1 alpha-2 (e.g. 'MX', 'US', 'CO')
  nationalityVerified: boolean;    // verified via government ID / passport
  countryName?: string;            // full country name
  // Privacy (granular)
  privacyShield: boolean;
  hiddenFields: string[];
  balancePublic: boolean;          // user chooses if balance is visible
  // Entity
  entityCategory?: string;
  // Balances
  nativeBalance: number;
  tokenBalances: { symbol: string; amount: number }[];
  // Contracts
  ownedContracts: string[];
  // Timestamps
  createdAt: number;
  verifiedAt?: number;
  verifiedBy?: string;
  // Seal
  seal?: string;
  badges: string[];
}

// ISO country code → flag emoji + name
const COUNTRIES: Record<string, string> = {
  MX: 'Mexico', US: 'United States', CO: 'Colombia', BR: 'Brazil', AR: 'Argentina',
  CL: 'Chile', PE: 'Peru', VE: 'Venezuela', EC: 'Ecuador', UY: 'Uruguay',
  PY: 'Paraguay', BO: 'Bolivia', PA: 'Panama', CR: 'Costa Rica', GT: 'Guatemala',
  HN: 'Honduras', SV: 'El Salvador', NI: 'Nicaragua', DO: 'Dominican Republic', CU: 'Cuba',
  GB: 'United Kingdom', DE: 'Germany', FR: 'France', ES: 'Spain', IT: 'Italy',
  PT: 'Portugal', NL: 'Netherlands', BE: 'Belgium', CH: 'Switzerland', AT: 'Austria',
  SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', IE: 'Ireland',
  PL: 'Poland', CZ: 'Czech Republic', RO: 'Romania', GR: 'Greece', HU: 'Hungary',
  CN: 'China', JP: 'Japan', KR: 'South Korea', IN: 'India', SG: 'Singapore',
  HK: 'Hong Kong', TW: 'Taiwan', TH: 'Thailand', MY: 'Malaysia', ID: 'Indonesia',
  PH: 'Philippines', VN: 'Vietnam', AE: 'UAE', SA: 'Saudi Arabia', IL: 'Israel',
  TR: 'Turkey', RU: 'Russia', UA: 'Ukraine', AU: 'Australia', NZ: 'New Zealand',
  CA: 'Canada', ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya', EG: 'Egypt',
  GH: 'Ghana', ET: 'Ethiopia', PR: 'Puerto Rico', JM: 'Jamaica', TT: 'Trinidad',
};

// Seed wallets stored in memory (in production → DB)
const wallets = new Map<string, Wallet>();

function genAddr(prefix: string, name: string): string {
  const hash = createHash('sha256').update(name + Date.now().toString()).digest('hex').slice(0, 16);
  return `archt:${prefix}:${name.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}:${hash}`;
}

function seedWallets() {
  if (wallets.size > 0) return;

  const w = (name: string, type: WalletType, vis: WalletVisibility, level: WalletVerificationLevel, country?: string, opts: Partial<Wallet> = {}): Wallet => ({
    address: genAddr(
      ({ GOVERNMENT: 'gov', INSTITUTIONAL: 'inst', MUSICIAN: 'mus', INFLUENCER: 'inf', FILMMAKER: 'film', DEVELOPER: 'dev', ATTORNEY: 'law', DOCTOR: 'med', ENGINEER: 'eng', AI_RESEARCHER: 'ai', ATHLETE: 'sport', TRADER: 'trade', JOURNALIST: 'press', PROFESSOR: 'edu', CHEF: 'chef', PILOT: 'avi', MILITARY: 'mil', NGO: 'ngo', PHARMA: 'pharma', ENERGY: 'energy', TELECOM: 'telco', ESPORTS: 'esport', DESIGNER: 'design', MINER: 'mine', AUDITOR: 'audit', REALTOR: 'estate', BUSINESS: 'biz' } as Record<string, string>)[type] || 'account', name),
    displayName: name,
    walletType: type,
    visibility: vis,
    verificationLevel: level,
    verified: level !== 'UNVERIFIED',
    kycCompleted: level !== 'UNVERIFIED',
    kybCompleted: ['STANDARD', 'FULL', 'INSTITUTIONAL'].includes(level),
    nationality: country || undefined,
    nationalityVerified: !!country && level !== 'UNVERIFIED',
    countryName: country ? COUNTRIES[country] || country : undefined,
    privacyShield: vis === 'PRIVATE' || vis === 'ANONYMOUS',
    hiddenFields: vis === 'ANONYMOUS' ? ['name', 'balance', 'location', 'contracts', 'nationality'] : [],
    balancePublic: vis === 'PUBLIC',
    nativeBalance: Math.floor(Math.random() * 5000000),
    tokenBalances: [
      { symbol: 'ARCHT', amount: Math.floor(Math.random() * 100000) },
      { symbol: 'USDT', amount: Math.floor(Math.random() * 500000) },
    ],
    ownedContracts: [],
    createdAt: Date.now() - Math.floor(Math.random() * 90) * 86400000,
    verifiedAt: level !== 'UNVERIFIED' ? Date.now() - Math.floor(Math.random() * 30) * 86400000 : undefined,
    verifiedBy: level !== 'UNVERIFIED' ? '20022Chain Authority' : undefined,
    seal: (() => {
      if (type === 'GOVERNMENT' || type === 'MILITARY') return 'GOV_VERIFIED';
      if (type === 'INSTITUTIONAL' || type === 'PHARMA' || type === 'ENERGY' || type === 'TELECOM' || type === 'NGO') return 'INST_VERIFIED';
      if (type === 'MUSICIAN' || type === 'FILMMAKER' || type === 'DESIGNER' || type === 'ESPORTS') return 'VR_VERIFIED';
      if (['DEVELOPER','ATTORNEY','INFLUENCER','DOCTOR','ENGINEER','AI_RESEARCHER','ATHLETE','TRADER','JOURNALIST','PROFESSOR','CHEF','PILOT','AUDITOR','MINER','REALTOR'].includes(type)) return 'PRO_VERIFIED';
      if (vis === 'PRIVATE' || vis === 'ANONYMOUS') return 'PRIVACY_SHIELD';
      return 'VERIFIED';
    })(),
    badges: [],
    ...opts,
  });

  const seeds = [
    w('Banco de México', 'GOVERNMENT', 'PUBLIC', 'INSTITUTIONAL', 'MX', { entityCategory: 'Central Bank', badges: ['GOV', 'KYC', 'KYB', 'LEI', 'ISO'], nativeBalance: 999999999, professionalLicense: 'BANXICO-001' }),
    w('US Treasury Dept', 'GOVERNMENT', 'PUBLIC', 'INSTITUTIONAL', 'US', { entityCategory: 'Federal Government', badges: ['GOV', 'KYC', 'KYB', 'LEI', 'ISO'], nativeBalance: 999999999 }),
    w('Ava Solaris', 'MUSICIAN', 'PUBLIC', 'FULL', 'CA', { entityCategory: 'Electronic / Hip-Hop Artist', badges: ['KYC', 'VR', 'ASCAP'], professionalLicense: 'ASCAP-AVS-2025', balancePublic: false }),
    w('NovaCast', 'INFLUENCER', 'PUBLIC', 'FULL', 'US', { entityCategory: 'Content Creator', badges: ['KYC', 'KYB', 'PRO'], professionalLicense: 'YT-PARTNER-PREMIUM' }),
    w('Sarah Chen', 'FILMMAKER', 'PUBLIC', 'STANDARD', 'CN', { entityCategory: 'Film Director', badges: ['KYC', 'VR', 'SAG'], balancePublic: false }),
    w('Baker McKenzie LLP', 'ATTORNEY', 'PUBLIC', 'FULL', 'US', { entityCategory: 'International Law', badges: ['KYC', 'KYB', 'LEI', 'BAR'], professionalLicense: 'ABA-2025-4578' }),
    w('Alpine Capital AG', 'INSTITUTIONAL', 'PRIVATE', 'INSTITUTIONAL', 'CH', { entityCategory: 'Private Equity', badges: ['KYC', 'KYB', 'LEI', 'ISO', 'PRIVACY'], nativeBalance: 50000000, balancePublic: false }),
    w('Satoshi Nakamoto', 'PERSONAL', 'ANONYMOUS', 'BASIC', 'JP', { entityCategory: 'Pseudonymous', badges: ['KYC'], hiddenFields: ['name', 'balance', 'location', 'contracts', 'nationality'], balancePublic: false }),
    w('NeuralForge Foundation', 'DEVELOPER', 'PUBLIC', 'FULL', 'US', { entityCategory: 'AI Research', badges: ['KYC', 'KYB', 'LEI', 'AUDIT'], professionalLicense: 'OSS-AUDIT-2025-001' }),
    w('Minera Cerro Verde', 'MINER', 'PUBLIC', 'FULL', 'PE', { entityCategory: 'Copper Mining', badges: ['KYC', 'KYB', 'LEI', 'ISO', 'ISIN'] }),
    w('Blockchain Dev #4471', 'DEVELOPER', 'PRIVATE', 'STANDARD', 'DE', { entityCategory: 'Smart Contract Dev', badges: ['KYC', 'AUDIT', 'PRIVACY'] }),
    w('JPMorgan Chase', 'INSTITUTIONAL', 'PUBLIC', 'INSTITUTIONAL', 'US', { entityCategory: 'Investment Banking', badges: ['KYC', 'KYB', 'LEI', 'ISO', 'INST'], nativeBalance: 250000000 }),
    w('Carlos Slim', 'PERSONAL', 'PUBLIC', 'FULL', 'MX', { entityCategory: 'Investor', badges: ['KYC', 'KYB', 'LEI'], balancePublic: false }),
    w('Luisa Fernanda', 'INFLUENCER', 'PUBLIC', 'STANDARD', 'CO', { entityCategory: 'Content Creator', badges: ['KYC', 'PRO'] }),
    w('Nayib Bukele', 'GOVERNMENT', 'PUBLIC', 'INSTITUTIONAL', 'SV', { entityCategory: 'Head of State', badges: ['GOV', 'KYC', 'KYB'], nativeBalance: 500000000 }),
    w('Vitalik Buterin', 'DEVELOPER', 'PUBLIC', 'FULL', 'RU', { entityCategory: 'Blockchain', badges: ['KYC', 'KYB', 'AUDIT'] }),
    w('BTS Entertainment', 'MUSICIAN', 'PUBLIC', 'FULL', 'KR', { entityCategory: 'K-Pop', badges: ['KYC', 'KYB', 'VR'] }),
    w('Ecopetrol S.A.', 'BUSINESS', 'PUBLIC', 'FULL', 'CO', { entityCategory: 'Energy', badges: ['KYC', 'KYB', 'LEI', 'ISO', 'ISIN'] }),
    // NEW PROFESSIONS
    w('Dr. María González', 'DOCTOR', 'PUBLIC', 'FULL', 'MX', { entityCategory: 'Cardiology', badges: ['KYC', 'PRO', 'LICENSE'], professionalLicense: 'COFEPRIS-MED-2025' }),
    w('Dr. Anthony Fauci', 'DOCTOR', 'PUBLIC', 'FULL', 'US', { entityCategory: 'Immunology', badges: ['KYC', 'KYB', 'PRO'], professionalLicense: 'NIH-NIAID-001' }),
    w('Elon Musk', 'ENGINEER', 'PUBLIC', 'FULL', 'US', { entityCategory: 'Aerospace & EV', badges: ['KYC', 'KYB', 'LEI'], balancePublic: false }),
    w('Sam Altman', 'AI_RESEARCHER', 'PUBLIC', 'FULL', 'US', { entityCategory: 'AGI Research', badges: ['KYC', 'KYB', 'AUDIT'], professionalLicense: 'AI-SAFETY-2025' }),
    w('Demis Hassabis', 'AI_RESEARCHER', 'PUBLIC', 'FULL', 'GB', { entityCategory: 'DeepMind', badges: ['KYC', 'KYB', 'PRO'] }),
    w('Lionel Messi', 'ATHLETE', 'PUBLIC', 'FULL', 'AR', { entityCategory: 'Football', badges: ['KYC', 'PRO'], balancePublic: false }),
    w('Cristiano Ronaldo', 'ATHLETE', 'PUBLIC', 'FULL', 'PT', { entityCategory: 'Football', badges: ['KYC', 'PRO'], balancePublic: false }),
    w('Naomi Osaka', 'ATHLETE', 'PUBLIC', 'STANDARD', 'JP', { entityCategory: 'Tennis', badges: ['KYC', 'PRO'] }),
    w('Faker (Lee Sang-hyeok)', 'ESPORTS', 'PUBLIC', 'FULL', 'KR', { entityCategory: 'League of Legends', badges: ['KYC', 'PRO', 'VR'] }),
    w('Ray Dalio', 'TRADER', 'PRIVATE', 'INSTITUTIONAL', 'US', { entityCategory: 'Hedge Fund', badges: ['KYC', 'KYB', 'LEI', 'INST'], nativeBalance: 80000000, balancePublic: false }),
    w('CZ (Changpeng Zhao)', 'TRADER', 'PUBLIC', 'FULL', 'CN', { entityCategory: 'Crypto Exchange', badges: ['KYC', 'KYB', 'AUDIT'] }),
    w('Anderson Cooper', 'JOURNALIST', 'PUBLIC', 'STANDARD', 'US', { entityCategory: 'Broadcast News', badges: ['KYC', 'PRO'] }),
    w('Prof. Silvio Micali', 'PROFESSOR', 'PUBLIC', 'FULL', 'IT', { entityCategory: 'Cryptography', badges: ['KYC', 'PRO', 'AUDIT'], professionalLicense: 'MIT-CSAIL-2025' }),
    w('Gordon Ramsay', 'CHEF', 'PUBLIC', 'FULL', 'GB', { entityCategory: 'Culinary', badges: ['KYC', 'KYB', 'PRO'] }),
    w('Capt. Sully Sullenberger', 'PILOT', 'PUBLIC', 'FULL', 'US', { entityCategory: 'Aviation', badges: ['KYC', 'PRO', 'LICENSE'], professionalLicense: 'FAA-ATP-2025' }),
    w('Red Cross International', 'NGO', 'PUBLIC', 'INSTITUTIONAL', 'CH', { entityCategory: 'Humanitarian', badges: ['KYC', 'KYB', 'LEI', 'ISO'], nativeBalance: 15000000 }),
    w('Pfizer Inc.', 'PHARMA', 'PUBLIC', 'INSTITUTIONAL', 'US', { entityCategory: 'Pharmaceuticals', badges: ['KYC', 'KYB', 'LEI', 'ISO', 'ISIN'], nativeBalance: 120000000 }),
    w('Shell Energy', 'ENERGY', 'PUBLIC', 'INSTITUTIONAL', 'NL', { entityCategory: 'Oil & Gas', badges: ['KYC', 'KYB', 'LEI', 'ISO'], nativeBalance: 200000000 }),
    w('Virgil Abloh Studio', 'DESIGNER', 'PUBLIC', 'FULL', 'US', { entityCategory: 'Fashion & Product', badges: ['KYC', 'VR', 'PRO'] }),
    w('Vodafone Group', 'TELECOM', 'PUBLIC', 'INSTITUTIONAL', 'GB', { entityCategory: 'Telecommunications', badges: ['KYC', 'KYB', 'LEI', 'ISO'], nativeBalance: 90000000 }),
  ];

  for (const s of seeds) wallets.set(s.address, s);
}

// ─── GET /api/wallets ────────────────────────────────────────
export async function GET(req: NextRequest) {
  seedWallets();

  const url = new URL(req.url);
  const address = url.searchParams.get('address');
  const type = url.searchParams.get('type');
  const visibility = url.searchParams.get('visibility');
  const country = url.searchParams.get('country');

  // Privacy masker — respects both privacyShield and balancePublic
  const mask = (w: Wallet): Wallet => {
    const m = { ...w };
    // Balance privacy: hide if user chose private OR if hidden by shield
    if (!w.balancePublic || w.hiddenFields.includes('balance')) {
      m.nativeBalance = -1; m.tokenBalances = [];
    }
    // Shield-level masking
    if (w.privacyShield) {
      if (w.hiddenFields.includes('name')) m.displayName = '████████ (Privacy Shield)';
      if (w.hiddenFields.includes('contracts')) m.ownedContracts = [];
      if (w.hiddenFields.includes('nationality')) { m.nationality = undefined; m.countryName = undefined; m.nationalityVerified = false; }
    }
    return m;
  };

  if (address) {
    const w = wallets.get(address);
    if (!w) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    return NextResponse.json(mask(w));
  }

  let list = Array.from(wallets.values());
  if (type) list = list.filter(w => w.walletType === type);
  if (visibility) list = list.filter(w => w.visibility === visibility);
  if (country) list = list.filter(w => w.nationality === country);

  const masked = list.map(mask);

  // Country stats
  const countryStats: Record<string, number> = {};
  for (const w of Array.from(wallets.values())) {
    if (w.nationality) countryStats[w.nationality] = (countryStats[w.nationality] || 0) + 1;
  }

  return NextResponse.json({
    wallets: masked,
    total: masked.length,
    types: Object.fromEntries(list.reduce((acc, w) => { acc.set(w.walletType, (acc.get(w.walletType) || 0) + 1); return acc; }, new Map<string, number>())),
    countries: countryStats,
  });
}

// ─── POST /api/wallets — Create or verify a wallet ───────────
export async function POST(req: NextRequest) {
  seedWallets();
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      const { name, walletType, visibility, entityCategory, professionalLicense, nationality, balancePublic: balPub } = body;
      const type = (walletType || 'PERSONAL') as WalletType;
      const vis = (visibility || 'PUBLIC') as WalletVisibility;
      const cc = nationality ? nationality.toUpperCase().slice(0, 2) : undefined;
      const prefix = type === 'GOVERNMENT' ? 'gov' : type === 'INSTITUTIONAL' ? 'inst' : type === 'MUSICIAN' ? 'mus' : type === 'INFLUENCER' ? 'inf' : type === 'DEVELOPER' ? 'dev' : 'account';
      const addr = genAddr(prefix, name || 'user');
      const wallet: Wallet = {
        address: addr,
        displayName: name || 'New Wallet',
        walletType: type, visibility: vis,
        verificationLevel: 'UNVERIFIED', verified: false,
        kycCompleted: false, kybCompleted: false,
        professionalLicense,
        nationality: cc,
        nationalityVerified: false,
        countryName: cc ? COUNTRIES[cc] || cc : undefined,
        privacyShield: vis === 'PRIVATE' || vis === 'ANONYMOUS',
        hiddenFields: vis === 'ANONYMOUS' ? ['name', 'balance', 'contracts', 'nationality'] : [],
        balancePublic: balPub !== undefined ? balPub : vis === 'PUBLIC',
        entityCategory,
        nativeBalance: 0, tokenBalances: [],
        ownedContracts: [],
        createdAt: Date.now(),
        badges: [],
      };
      wallets.set(addr, wallet);
      return NextResponse.json({ success: true, wallet });
    }

    if (action === 'verify') {
      const { address, level, kycCompleted, kybCompleted, verifiedBy, seal } = body;
      const w = wallets.get(address);
      if (!w) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      if (level) w.verificationLevel = level;
      if (kycCompleted !== undefined) w.kycCompleted = kycCompleted;
      if (kybCompleted !== undefined) w.kybCompleted = kybCompleted;
      if (verifiedBy) w.verifiedBy = verifiedBy;
      if (seal) w.seal = seal;
      w.verified = w.verificationLevel !== 'UNVERIFIED';
      w.verifiedAt = Date.now();
      wallets.set(address, w);
      return NextResponse.json({ success: true, wallet: w });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
