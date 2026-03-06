"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Shield, Zap, Globe, Lock, Layers, Cpu, Eye,
  Link2, Menu, X, Mail, CheckCircle2,
  Loader2, Clock, FileText, Star, Users,
  Wallet, Code, Database, Box, Hash,
  GitBranch, Terminal, Building2,
  Scale, Film, Music, Palette, FlaskConical, Fingerprint,
  ChevronRight, Sparkles, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LangSwitcher } from "@/components/LangSwitcher";

interface ChainLandingProps { onLogin: () => void }

/* ━━━ Reusable primitives ━━━ */

const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease }} className={className}>
      {children}
    </motion.div>
  );
}

function SH({ badge, title, sub, light }: { badge: string; title: string; sub?: string; light?: boolean }) {
  return (
    <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-20 lg:mb-24 px-2">
      <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-[10px] font-bold uppercase tracking-[0.35em]", light ? "bg-white/[0.06] border border-white/[0.08] text-white/90" : "bg-[#0A0A0A]/[0.03] text-[#8b8b94]")}>{badge}</div>
      <h2 className={cn("text-[clamp(1.75rem,5vw,3.25rem)] font-black tracking-tight leading-[1.08]", light ? "text-white" : "")}>{title}</h2>
      {sub && <p className={cn("text-[15px] mt-5 leading-relaxed max-w-xl mx-auto", light ? "text-white/90" : "text-[#6b6b74]")}>{sub}</p>}
    </div>
  );
}

function Addr({ a, tc, full, big }: { a: string; tc: string; full?: boolean; big?: boolean }) {
  const p = a.split(':');
  const hash = p[3] || '';
  return (
    <span className={cn("font-mono inline-flex items-center flex-wrap break-all", big ? "text-[11px] sm:text-[14px] gap-0.5" : "text-[10px] sm:text-[12px]")}>
      <span className="text-white/50">archt</span><span className="text-white/30">:</span>
      <span className="font-bold" style={{ color: tc }}>{p[1]}</span><span className="text-white/30">:</span>
      <span className="text-white font-bold break-all">{p[2]}</span><span className="text-white/30">:</span>
      <span className="text-white/60 break-all">{full ? hash : hash.length > 12 ? hash.slice(0, 12) + '…' : hash}</span>
    </span>
  );
}

function GlowOrb({ className }: { className?: string }) {
  return <div className={cn("absolute rounded-full pointer-events-none blur-[120px] opacity-30", className)} />;
}

/* ━━━ Data ━━━ */

const SPECS = [
  { l: "Chain ID", v: "20022", c: "#d4a855" }, { l: "TPS", v: "50K+", c: "#10B981" },
  { l: "Block Time", v: "0.4 s", c: "#3B82F6" }, { l: "Finality", v: "Instant", c: "#8B5CF6" },
  { l: "Validators", v: "128", c: "#F59E0B" }, { l: "Core", v: "Rust", c: "#EF4444" },
];

const SUB = [
  { icon: Zap, name: "Parallel Execution", m: "50K+ TPS", d: "Multi-threaded tx processing across 64 cores with conflict detection.", big: true },
  { icon: Cpu, name: "ArchPoS Consensus", m: "0.4 s", d: "128 validators, VRF selection, instant single-slot finality.", big: true },
  { icon: Shield, name: "ISO 20022 Messages", m: "8 types", d: "Native financial messaging — direct SWIFT/bank integration." },
  { icon: Layers, name: "DAG Mempool", m: "100K queue", d: "Graph-based ordering. Parallel transaction paths." },
  { icon: Eye, name: "Verkle Trees", m: "90% lighter", d: "~150 bytes proofs. Mobile light clients verify state." },
  { icon: Lock, name: "ZK-SNARKs", m: "Privacy", d: "Balance proofs, KYC, investor status — zero data exposure." },
  { icon: Link2, name: "Cross-Chain Bridge", m: "5 chains", d: "ETH, BNB, Polygon, Cosmos, Polkadot with lock verification." },
  { icon: Users, name: "On-Chain Governance", m: "DAO", d: "Token-weighted voting, 48h timelock, treasury control." },
  { icon: Hash, name: "ISIN Registry", m: "8,247+", d: "ISO 6166 securities IDs — NYSE/EURONEXT compatible." },
  { icon: Box, name: "Account Abstraction", m: "ERC-4337", d: "Multi-sig, social recovery, session keys, gas sponsorship." },
  { icon: Database, name: "State Expiry", m: "365-day", d: "Auto pruning. Archival nodes preserve full history." },
  { icon: GitBranch, name: "Danksharding", m: "EIP-4844", d: "Blob data availability. L2 costs reduced 100x." },
];

const W = [
  { t: "Standard Wallet", icon: Wallet, c: "#0A0A0A", d: "HD (BIP-39/44), mnemonic backup, hardware wallet support.", f: ["Private key","Mnemonic","Ledger/Trezor","All tokens"] },
  { t: "Multi-Signature", icon: Users, c: "#1D4ED8", d: "M-of-N threshold for institutional treasuries and DAOs.", f: ["Threshold","Role-based","Timelock","Audit trail"] },
  { t: "Social Recovery", icon: Shield, c: "#059669", d: "Guardian-based key recovery. No single point of failure.", f: ["5 guardians","3-of-5","48h delay","Rotation"] },
  { t: "Session Key", icon: Clock, c: "#7C3AED", d: "Time-limited, scope-limited dApp permissions.", f: ["Time cap","Spend cap","Per-contract","Auto-revoke"] },
  { t: "Institutional", icon: Building2, c: "#D4A017", d: "Enterprise RBAC, HSM, compliance monitoring.", f: ["Admin/Trader","HSM keys","Compliance","Cold/Hot"] },
  { t: "Smart Contract", icon: Code, c: "#EF4444", d: "Programmable: auto-stake, DCA, conditional transfers.", f: ["Auto rules","Gas sponsor","DCA","Conditional"] },
];

const ADDRS = [
  { type: 'contract', c: '#00C853', p: 'Smart contracts, tokens, escrow', ex: 'archt:contract:oro-verde-gold-token:a2693d35' },
  { type: 'val', c: '#1D4ED8', p: 'Block producer validators', ex: 'archt:val:zurich-prime:8f2a1b3c' },
  { type: 'bank', c: '#059669', p: 'Banking, SWIFT, CBDC', ex: 'archt:bank:usd20022:a1b2c3d4' },
  { type: 'owner', c: '#7C3AED', p: 'Asset originators', ex: 'archt:owner:oro-verde-sa:5a7b9c3d' },
  { type: 'wallet', c: '#6B7280', p: 'HD wallet addresses', ex: 'archt:wallet:sandbox-lq2x8:7b3e' },
  { type: 'system', c: '#F59E0B', p: 'Protocol operations', ex: 'archt:system:fee-collector:0000' },
];

const CONTRACTS = [
  { n: 'Oro Verde Gold Token', a: 'archt:contract:oro-verde-gold-token:a2693d3520695a7af3bd6931', t: 'MINE', c: '#92700a', s: 92, d: 'NI 43-101 verified gold reserves, Antioquia, Colombia' },
  { n: 'Manhattan Tower REIT', a: 'archt:contract:manhattan-tower-reit:7f3b2c1d4e5a6890', t: 'REAL', c: '#1D4ED8', s: 92, d: 'Class A commercial, Midtown NYC. SEC Reg D' },
  { n: 'Green Energy Bond 2030', a: 'archt:contract:green-energy-bond-203:9c8d7e6f5a4b3210', t: 'BOND', c: '#7C3AED', s: 94, d: '4.2% APY green bond, solar/wind EU' },
  { n: 'Colombian Emerald Trust', a: 'archt:contract:colombian-emerald-tru:4a5b6c7d8e9f0123', t: 'GEM', c: '#DB2777', s: 98, d: 'GIA certified Muzo mine, vaulted Zurich' },
  { n: 'NeuralForge Protocol', a: 'archt:contract:neuralforge-protocol-t:b3c4d5e6f7a89012', t: 'TOKEN', c: '#0A0A0A', s: 98, d: 'Open-source AI training protocol' },
  { n: 'Digital Peso MX', a: 'archt:contract:digital-peso-mx:d5e6f7a8b9c01234', t: 'CBDC', c: '#059669', s: 93, d: 'Banco de México CBDC, 1:1 fiat parity' },
  { n: 'LegalChain Escrow', a: 'archt:contract:legalchain-escrow:e6f7a8b9c0d12345', t: 'CUSTOM', c: '#6B7280', s: 94, d: 'Bar-certified cross-border escrow' },
  { n: 'ARCHT Governance', a: 'archt:contract:archt-governance:f7a8b9c0d1e23456', t: 'GOV', c: '#D4A017', s: 97, d: 'Weighted voting, timelock, treasury' },
];

const VALS = [
  { n: 'Zurich Prime', a: 'archt:val:zurich-prime:8f2a1b3c4d5e6f70', r: 'Europe' },
  { n: 'Singapore Nexus', a: 'archt:val:singapore-nexus:1a2b3c4d5e6f7890', r: 'Asia-Pacific' },
  { n: 'New York Sentinel', a: 'archt:val:new-york-sentinel:2b3c4d5e6f789012', r: 'North America' },
  { n: 'Dubai Gateway', a: 'archt:val:dubai-gateway:3c4d5e6f78901234', r: 'Middle East' },
  { n: 'São Paulo Anchor', a: 'archt:val:sao-paulo-anchor:4d5e6f7890123456', r: 'South America' },
  { n: 'Tokyo Relay', a: 'archt:val:tokyo-relay:5e6f789012345678', r: 'Asia-Pacific' },
  { n: 'London Bridge', a: 'archt:val:london-bridge:6f78901234567890', r: 'Europe' },
  { n: 'Sydney Core', a: 'archt:val:sydney-core:7890123456789abc', r: 'Oceania' },
];

const BANKS = [
  { c: 'USD', a: 'archt:bank:usd20022:a1b2c3d4e5f60001', k: 'MAJOR' }, { c: 'EUR', a: 'archt:bank:eur20022:a1b2c3d4e5f60002', k: 'MAJOR' },
  { c: 'GBP', a: 'archt:bank:gbp20022:a1b2c3d4e5f60003', k: 'MAJOR' }, { c: 'JPY', a: 'archt:bank:jpy20022:a1b2c3d4e5f60004', k: 'MAJOR' },
  { c: 'CHF', a: 'archt:bank:chf20022:a1b2c3d4e5f60005', k: 'MAJOR' }, { c: 'AED', a: 'archt:bank:aed20022:a1b2c3d4e5f60020', k: 'MAJOR' },
  { c: 'MXN', a: 'archt:bank:mxn20022:a1b2c3d4e5f60009', k: 'MINOR' }, { c: 'BRL', a: 'archt:bank:brl20022:a1b2c3d4e5f60010', k: 'MINOR' },
  { c: 'COP', a: 'archt:bank:cop20022:a1b2c3d4e5f60011', k: 'MINOR' },
  { c: 'USDC', a: 'archt:bank:usdc20022:a1b2c3d4e5f60030', k: 'STABLE' }, { c: 'USDT', a: 'archt:bank:usdt20022:a1b2c3d4e5f60031', k: 'STABLE' },
];

const ISINS = [
  { id: 'CH0012345678', n: 'Alpine Fund VII', cat: 'Private Equity', s: 97 },
  { id: 'US912810TA43', n: 'US Treasury Token', cat: 'Treasury Bond', s: 95 },
  { id: 'ARCHT00010', n: 'Lithium Battery Fund', cat: 'Capital Markets', s: 99 },
  { id: 'ARCHT00011', n: 'Carbon Credit Token', cat: 'Carbon Markets', s: 99 },
];

const VRS = [
  { id: 'VR-2025-FILM-0001', n: 'Indie Film DAO', cat: 'FILM', icon: Film, d: 'Community-funded cinema. Token holders govern creative decisions and earn box office revenue.' },
  { id: 'VR-2025-MUS-0001', n: 'Ava Solaris Royalty Token', cat: 'MUSIC', icon: Music, d: 'Quarterly streaming royalties from "Neon Horizons". WIPO registered.' },
  { id: 'VR-2025-0002', n: 'NexGen AI Patent', cat: 'PATENT', icon: FlaskConical, d: 'PCT international filing across 148 jurisdictions. Licensing distribution.' },
  { id: 'VR-2025-0003', n: 'Fractal Earth Series', cat: 'ART', icon: Palette, d: 'Generative art from geological data. 50 pieces. 7.5% creator royalty.' },
];

const BRIDGES = [
  { ch: 'Ethereum', pr: 'Lock & Mint (ERC-20)', st: true, c: '#627EEA' },
  { ch: 'BNB Chain', pr: 'Lock & Mint (BEP-20)', st: true, c: '#F3BA2F' },
  { ch: 'Polygon', pr: 'Lock & Mint (ERC-20)', st: true, c: '#8247E5' },
  { ch: 'Cosmos', pr: 'IBC Protocol', st: false, c: '#2E3148' },
  { ch: 'Polkadot', pr: 'XCMP Protocol', st: false, c: '#E6007A' },
];

const RM = [
  { q: 'Q1 2026', t: 'Foundation', items: ['Testnet launch','Validator onboarding','Developer SDK'], on: true },
  { q: 'Q2 2026', t: 'Audit', items: ['3 security audits','Bridge stress tests','ISIN population'], on: true },
  { q: 'Q3 2026', t: 'Mainnet', items: ['PUBLIC LAUNCH','ARCHT integration','200 assets live'], on: false },
  { q: 'Q4 2026', t: 'Multi-Chain', items: ['Cosmos IBC','Polkadot XCMP','150+ Rare Earths'], on: false },
  { q: '2027', t: 'Scale', items: ['Danksharding','200+ validators','AMM DEX on-chain'], on: false },
  { q: '2028', t: 'Global', items: ['100K+ TPS','Banking API','Sovereign partners'], on: false },
];

const APIS = [
  { g: 'Blockchain', e: ['/api/chain','/api/blocks','/api/transactions','/api/stats','/api/validators'] },
  { g: 'Wallets', e: ['/api/wallets','/api/balance','/api/nonce','/api/faucet'] },
  { g: 'Assets', e: ['/api/isin','/api/contracts','/api/tokenize','/api/por'] },
  { g: 'DeFi', e: ['/api/defi','/api/staking','/api/oracle','/api/nft'] },
  { g: 'Network', e: ['/api/bridge','/api/swift','/api/governance','/api/network'] },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* COMPONENT                                           */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function ChainLanding({ onLogin }: ChainLandingProps) {
  const [splash, setSplash] = useState(true);
  const [mob, setMob] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOp = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    if (sessionStorage.getItem('cv')) { setSplash(false); return; }
    const t = setTimeout(() => { setSplash(false); sessionStorage.setItem('cv', '1'); }, 1500);
    return () => clearTimeout(t);
  }, []);

  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!email) return; setLoading(true); await new Promise(r => setTimeout(r, 1000)); setLoading(false); setSent(true); };
  const { t } = useI18n();

  const NAV = [
    { l: "Technology", h: "#tech" }, { l: "Addresses", h: "#addr" }, { l: "Assets", h: "#assets" },
    { l: "Wallets", h: "#wallets" }, { l: "Roadmap", h: "#roadmap" }, { l: "Whitepaper", h: "/whitepaper" },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden selection:bg-[#d4a855]/20" style={{ fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>

      {/* ── Splash ── */}
      <AnimatePresence>
        {splash && (
          <motion.div className="fixed inset-0 z-[9999] bg-[#09090b] flex flex-col items-center justify-center" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease }}>
              <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-2xl shadow-white/10">
                <span className="font-black text-[#09090b] text-2xl tracking-tighter">20022</span>
              </div>
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 text-white/90 text-[10px] tracking-[0.5em] uppercase font-bold">ISO 20022 Native Blockchain</motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 h-16 bg-[#09090b]/70 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between px-5 lg:px-10">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm shadow-white/10">
              <span className="font-black text-[#09090b] text-[10px] tracking-tighter">20022</span>
            </div>
            <span className="font-bold text-[13px] tracking-tight text-white/90 hidden sm:block">20022Chain</span>
          </a>
          <div className="hidden lg:flex items-center gap-1">
            {NAV.map(n => <a key={n.l} href={n.h} className="px-4 py-2 text-[13px] font-medium text-white/90 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all duration-200">{n.l}</a>)}
          </div>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <button onClick={onLogin} className="hidden sm:flex h-9 px-5 bg-white text-[#09090b] text-[12px] font-bold tracking-wide rounded-lg hover:bg-white/90 transition-all items-center gap-2">
              {t("nav.enter")} <ArrowRight size={12} />
            </button>
            <button className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-white/90" onClick={() => setMob(true)} aria-label="Menu"><Menu size={20} /></button>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mob && (
          <motion.div className="fixed inset-0 z-[100] bg-[#09090b] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.06]">
              <span className="font-bold text-sm">20022Chain</span>
              <button onClick={() => setMob(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-1">
              {NAV.map(n => <a key={n.l} href={n.h} className="flex items-center justify-between text-lg font-medium py-4 border-b border-white/[0.06] text-white/90 hover:text-white" onClick={() => setMob(false)}>{n.l}<ChevronRight size={16} /></a>)}
              <button onClick={() => { setMob(false); onLogin(); }} className="w-full mt-6 h-12 bg-white text-[#09090b] font-bold rounded-xl text-sm">{t("nav.enter")}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════ */}
      {/* HERO                                    */}
      {/* ═══════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[80vh] sm:min-h-[92vh] flex items-center justify-center overflow-hidden">
        <GlowOrb className="w-[600px] h-[600px] bg-[#d4a855] -top-40 left-1/4" />
        <GlowOrb className="w-[500px] h-[500px] bg-[#3B82F6] -bottom-20 right-1/4 opacity-20" />
        <GlowOrb className="w-[300px] h-[300px] bg-[#7C3AED] top-1/3 right-[10%] opacity-15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#09090b_70%)]" />

        <motion.div style={{ y: heroY, opacity: heroOp }} className="relative z-10 max-w-5xl mx-auto text-center px-5">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
            <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-white/[0.04] border border-white/[0.06] rounded-full mb-12 backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[11px] font-semibold tracking-wider text-white/90">{t("hero.badge")}</span>
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1, ease }}
            className="text-[clamp(2.5rem,8vw,6rem)] font-black tracking-[-0.03em] leading-[0.92] mb-8">
            <span className="block text-white">{t("hero.title1")}</span>
            <span className="block bg-gradient-to-r from-[#d4a855] via-white/50 to-[#3B82F6] bg-clip-text text-transparent">{t("hero.title2")}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
            className="text-[clamp(0.9rem,2vw,1.125rem)] text-white/35 max-w-2xl mx-auto mb-14 leading-relaxed">{t("hero.subtitle")}</motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onLogin} className="h-12 sm:h-14 px-8 sm:px-10 bg-white text-[#09090b] text-sm font-bold rounded-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 flex items-center gap-3 w-full sm:w-auto justify-center">
              {t("hero.launch")} <ArrowRight size={16} />
            </button>
            <a href="/whitepaper" className="h-12 sm:h-14 px-8 sm:px-10 border border-white/10 text-white/90 text-sm font-medium rounded-2xl hover:border-white/20 hover:text-white/80 transition-all flex items-center gap-3 w-full sm:w-auto justify-center">
              <FileText size={14} /> {t("hero.wp")}
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Trust Bar ── */}
      <div className="relative z-10 -mt-12 sm:-mt-16 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }}
            className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-white/[0.06] rounded-xl sm:rounded-2xl overflow-hidden border border-white/[0.06] backdrop-blur-xl">
            {SPECS.map(s => (
              <div key={s.l} className="bg-[#09090b]/80 py-3 sm:py-5 px-2 sm:px-4 text-center hover:bg-white/[0.03] transition-colors">
                <div className="text-lg sm:text-2xl font-black" style={{ color: s.c }}>{s.v}</div>
                <div className="text-[8px] sm:text-[9px] text-white/80 uppercase tracking-wider mt-1 font-bold">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* 12 SUBSYSTEMS — Bento Grid              */}
      {/* ═══════════════════════════════════════ */}
      <section id="tech" className="py-16 sm:py-28 lg:py-36 px-4 sm:px-5 lg:px-10">
        <div className="max-w-[1400px] mx-auto">
          <Reveal><SH badge="Architecture" title="12 Subsystems" sub="Modular, independently upgradeable. Each designed, tested, and governed separately." light /></Reveal>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SUB.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.name} variants={fadeUp} transition={{ duration: 0.5, ease }}
                  className={cn("group relative p-5 sm:p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-500 overflow-hidden", s.big && "sm:col-span-2")}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.1] transition-colors"><Icon size={17} className="text-white/90 group-hover:text-white transition-colors" /></div>
                      <span className="text-[10px] font-bold text-[#d4a855]/70 tracking-wider">{s.m}</span>
                    </div>
                    <h3 className="text-[14px] font-bold text-white/90 mb-1.5">{s.name}</h3>
                    <p className="text-[11px] text-white/80 leading-[1.7]">{s.d}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ADDRESSES                               */}
      {/* ═══════════════════════════════════════ */}
      <section id="addr" className="py-16 sm:py-28 lg:py-36 px-4 sm:px-5 lg:px-10 bg-[#0f0f12]">
        <div className="max-w-[1400px] mx-auto">
          <Reveal><SH badge="Human-Readable Identifiers" title="Native Address System" sub="Every address encodes its type, name, and hash. No hex confusion — instantly readable and color-coded." light /></Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl bg-black/40 border border-white/[0.06] p-8 sm:p-10 mb-16 backdrop-blur-sm overflow-x-auto">
              <pre className="font-mono text-[clamp(0.65rem,1.5vw,0.875rem)] text-[#10B981]/80 leading-relaxed text-center select-all">{`archt : type : name : hash
─────   ────   ────   ────
  │       │      │      └── 24-char hex unique identifier
  │       │      └── Human-readable name (up to 24 chars)
  │       └── Category (contract, val, bank, owner...)
  └── Network prefix (always "archt")`}</pre>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-20">
              {ADDRS.map(a => (
                <div key={a.type} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
                  <div className="flex items-center gap-2.5 mb-3"><div className="w-3 h-3 rounded-full" style={{ background: a.c }} /><span className="font-mono text-sm font-bold" style={{ color: a.c }}>{a.type}</span></div>
                  <p className="text-[12px] text-white/80 leading-relaxed mb-3">{a.p}</p>
                  <div className="font-mono text-[11px] text-white/50 break-all leading-relaxed">{a.ex}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Contracts */}
          <Reveal delay={0.1}><h3 className="text-2xl sm:text-3xl font-black mb-8 tracking-tight">Deployed Contracts</h3></Reveal>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 gap-3 mb-20">
            {CONTRACTS.map(c => (
              <motion.div key={c.n} variants={fadeUp} transition={{ duration: 0.5, ease }}
                className="group relative p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ background: `linear-gradient(to bottom, ${c.c}, transparent)` }} />
                <div className="flex items-start justify-between mb-2.5">
                  <div><p className="text-[13px] font-bold text-white/90">{c.n}</p><p className="text-[10px] text-white/80 mt-0.5">{c.d}</p></div>
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded-md shrink-0 ml-3" style={{ color: c.c, background: `${c.c}12`, border: `1px solid ${c.c}20` }}>{c.t}</span>
                </div>
                <div className="mt-3 p-3 sm:p-4 bg-black/30 rounded-xl border border-white/[0.04] overflow-x-auto"><Addr a={c.a} tc="#00C853" big full /></div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${c.s}%`, background: `linear-gradient(to right, ${c.c}80, ${c.c})` }} /></div>
                  <span className="text-[10px] font-bold text-white/90">{c.s}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Validators + Banks */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Reveal><div>
              <h3 className="text-lg font-black mb-4 text-white/80">Validator Network</h3>
              <div className="space-y-1.5">{VALS.map(v => (
                <div key={v.n} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#1D4ED8]/10 flex items-center justify-center shrink-0"><Globe size={12} className="text-[#3B82F6]" /></div>
                    <div className="flex-1 min-w-0"><p className="text-[12px] font-bold text-white/80">{v.n}</p><p className="text-[10px] text-white/80">{v.r}</p></div>
                  </div>
                  <div className="mt-2 pl-10 overflow-x-auto"><Addr a={v.a} tc="#3B82F6" full /></div>
                </div>
              ))}</div>
            </div></Reveal>
            <Reveal delay={0.1}><div>
              <h3 className="text-lg font-black mb-4 text-white/80">Banking & SWIFT</h3>
              <div className="space-y-1.5">{BANKS.map(b => (
                <div key={b.c} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#059669]/10 flex items-center justify-center shrink-0"><span className="text-[10px] font-black text-[#10B981]">{b.c.slice(0,2)}</span></div>
                    <div className="flex-1 min-w-0"><p className="text-[12px] font-bold text-white/80">{b.c}</p></div>
                    <span className={cn("text-[8px] font-bold px-2 py-0.5 rounded", b.k==='STABLE'?'text-[#10B981] bg-[#10B981]/10':b.k==='MAJOR'?'text-[#3B82F6] bg-[#3B82F6]/10':'text-white/80 bg-white/[0.04]')}>{b.k}</span>
                  </div>
                  <div className="mt-2 pl-10 overflow-x-auto"><Addr a={b.a} tc="#10B981" full /></div>
                </div>
              ))}</div>
            </div></Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ISIN + VR + BRIDGE                      */}
      {/* ═══════════════════════════════════════ */}
      <section id="assets" className="py-16 sm:py-28 lg:py-36 px-4 sm:px-5 lg:px-10">
        <div className="max-w-[1400px] mx-auto">
          <Reveal><SH badge="Financial Instruments" title="ISIN & ViewsRight" sub="Institutional securities and intellectual property — tokenized with ISO 20022 compliance." light /></Reveal>

          <Reveal delay={0.1}><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-20">
            {ISINS.map(ins => (
              <div key={ins.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-[#3B82F6]/30 hover:bg-white/[0.04] transition-all duration-300">
                <div className="font-mono text-[11px] font-bold text-[#3B82F6] mb-3">{ins.id}</div>
                <p className="text-sm font-bold text-white/90 mb-1">{ins.n}</p>
                <p className="text-[10px] text-white/80 mb-4">{ins.cat}</p>
                <div className="flex items-center gap-2"><div className="h-1 flex-1 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6]" style={{ width: `${ins.s}%` }} /></div><span className="text-[10px] font-bold text-[#3B82F6]/60">{ins.s}</span></div>
              </div>
            ))}
          </div></Reveal>

          <Reveal delay={0.1}><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-20">
            {VRS.map(vr => { const Icon = vr.icon; return (
              <div key={vr.id} className="group p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-[#7C3AED]/30 hover:bg-white/[0.04] transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5 border border-[#7C3AED]/10 flex items-center justify-center shrink-0"><Icon size={18} className="text-[#A855F7]" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><span className="text-[13px] sm:text-[14px] font-bold text-white/90">{vr.n}</span><span className="text-[9px] font-bold px-2 py-0.5 rounded-md text-[#A855F7] bg-[#7C3AED]/10">{vr.cat}</span></div>
                    <div className="font-mono text-[10px] text-white/70 mt-0.5">{vr.id}</div>
                  </div>
                </div>
                <p className="text-[11px] text-white/80 leading-[1.7]">{vr.d}</p>
              </div>
            ); })}
          </div></Reveal>

          <Reveal delay={0.1}><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="text-lg font-black mb-5 text-white/80">Cross-Chain Bridge</h3>
              <div className="space-y-2">{BRIDGES.map(b => (
                <div key={b.ch} className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-black/20 border border-white/[0.04]">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: b.c }} />
                    <span className="text-[11px] sm:text-[12px] font-bold text-white/80">{b.ch}</span>
                    <span className="text-[9px] sm:text-[10px] text-white/80 hidden xs:inline">{b.pr}</span>
                  </div>
                  <span className={cn("text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 rounded-lg shrink-0", b.st ? 'text-[#10B981] bg-[#10B981]/10' : 'text-[#F59E0B] bg-[#F59E0B]/10')}>{b.st ? 'Active' : 'Q4 2026'}</span>
                </div>
              ))}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]"><Lock size={16} className="text-white/90 mb-3" /><h4 className="text-sm font-black text-white/80 mb-1">ZK-SNARKs</h4><p className="text-[10px] text-white/80 leading-[1.7]">Balance proofs, KYC, accredited investor — zero data exposure.</p></div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]"><Scale size={16} className="text-[#d4a855]/60 mb-3" /><h4 className="text-sm font-black text-white/80 mb-1">Governance</h4><p className="text-[10px] text-white/80 leading-[1.7]">7-day proposals, 10% quorum, 48h timelock. Community treasury.</p></div>
            </div>
          </div></Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* WALLETS + API                           */}
      {/* ═══════════════════════════════════════ */}
      <section id="wallets" className="py-16 sm:py-28 lg:py-36 px-4 sm:px-5 lg:px-10 bg-[#0f0f12]">
        <div className="max-w-[1400px] mx-auto">
          <Reveal><SH badge="Account Infrastructure" title="Wallet System & API" sub="Six wallet types from personal to institutional. 30+ REST endpoints." light /></Reveal>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-16">
            {W.map(w => { const Icon = w.icon; return (
              <motion.div key={w.t} variants={fadeUp} transition={{ duration: 0.5, ease }}
                className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-500">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${w.c}10`, border: `1px solid ${w.c}18` }}>
                  <Icon size={20} style={{ color: w.c }} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-[15px] font-black text-white/90 mb-1">{w.t}</h3>
                <p className="text-[11px] text-white/80 leading-[1.7] mb-4">{w.d}</p>
                <div className="flex flex-wrap gap-1.5">{w.f.map(f => <span key={f} className="px-2 py-0.5 text-[9px] font-semibold rounded-md bg-white/[0.04] border border-white/[0.06] text-white/80">{f}</span>)}</div>
              </motion.div>
            ); })}
          </motion.div>

          <Reveal delay={0.1}>
            <div className="rounded-2xl bg-black/40 border border-white/[0.06] p-8 sm:p-10 backdrop-blur-sm">
              <div className="text-center mb-10"><h3 className="text-xl font-black text-white/90">Developer API</h3><p className="text-[11px] text-white/80 mt-1">30+ REST endpoints · JSON-RPC · WebSocket</p></div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
                {APIS.map(g => (
                  <div key={g.g}><div className="text-[10px] font-bold text-[#d4a855]/60 uppercase tracking-[0.2em] mb-3">{g.g}</div><div className="space-y-1.5">{g.e.map(ep => <div key={ep} className="px-3 py-2 bg-white/[0.03] rounded-lg font-mono text-[10px] text-white/80 hover:text-white/90 hover:bg-white/[0.06] transition-all cursor-default">{ep}</div>)}</div></div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ARCHT INTEGRATION                       */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative py-16 sm:py-28 lg:py-36 px-4 sm:px-5 lg:px-10 overflow-hidden">
        <GlowOrb className="w-[500px] h-[500px] bg-[#d4a855] top-0 left-1/3 opacity-15" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <Reveal><SH badge="Settlement Layer" title="ARCHT Ecosystem" sub="20022Chain settles $5T+ in tokenized mineral reserves across 1,000+ mining operations." light /></Reveal>
          <Reveal delay={0.1}><div className="grid sm:grid-cols-3 gap-4">
            {[{ v: "$5T+", l: "Mineral Reserves", d: "1,000+ mining operations tokenized on ARCHT" }, { v: "6", l: "Asset Modules", d: "Mining, Earths, Gemstones, Real Estate, Bonds, Credit" }, { v: "47+", l: "Countries", d: "Global multi-jurisdictional compliance" }].map(s => (
              <div key={s.l} className="p-8 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-center hover:bg-white/[0.05] transition-colors">
                <div className="text-4xl sm:text-5xl font-black bg-gradient-to-b from-[#d4a855] to-[#d4a855]/50 bg-clip-text text-transparent">{s.v}</div>
                <div className="text-xs font-bold text-white/80 mt-3">{s.l}</div>
                <p className="text-[10px] text-white/80 mt-2">{s.d}</p>
              </div>
            ))}
          </div></Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ROADMAP                                 */}
      {/* ═══════════════════════════════════════ */}
      <section id="roadmap" className="py-16 sm:py-28 lg:py-36 px-4 sm:px-5 lg:px-10 bg-[#0f0f12]">
        <div className="max-w-5xl mx-auto">
          <Reveal><SH badge="Timeline" title="Roadmap 2026–2028" light /></Reveal>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RM.map(r => (
              <motion.div key={r.q} variants={fadeUp} transition={{ duration: 0.5, ease }}
                className={cn("relative p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02]", r.on ? "bg-white/[0.06] border-white/[0.1]" : "bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]")}>
                {r.on && <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]" />}
                <span className="font-mono text-sm font-black text-[#d4a855]">{r.q}</span>
                <h4 className="text-[15px] font-black text-white/90 mt-1 mb-3">{r.t}</h4>
                <div className="space-y-2">{r.items.map(item => <div key={item} className="flex items-start gap-2"><ChevronRight size={10} className={cn("mt-0.5 shrink-0", r.on ? "text-[#10B981]" : "text-white/10")} /><span className="text-[11px] text-white/80 leading-relaxed">{item}</span></div>)}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Community links ── */}
      <div className="py-12 sm:py-16 px-4 sm:px-5 lg:px-10">
        <Reveal>
          <div className="max-w-md mx-auto flex items-center justify-center gap-4">
            <a href="https://github.com/20022chain-jpg" target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white/80 group-hover:text-white transition-colors" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm font-bold text-white/90">GitHub</span>
            </a>
            <a href="https://x.com/20022chain" target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white/80 group-hover:text-white transition-colors" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-sm font-bold text-white/90">X</span>
            </a>
          </div>
        </Reveal>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* CTA                                     */}
      {/* ═══════════════════════════════════════ */}
      <section id="access" className="py-16 sm:py-28 lg:py-36 px-4 sm:px-5 lg:px-10 relative overflow-hidden">
        <GlowOrb className="w-[400px] h-[400px] bg-[#3B82F6] -bottom-32 left-1/3 opacity-10" />
        <div className="relative z-10 max-w-lg mx-auto">
          <Reveal>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center backdrop-blur-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] rounded-full text-[10px] font-bold tracking-[0.2em] text-white/80 mb-6"><Sparkles size={10} /> {t("access.badge")}</div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">{t("access.title")}</h2>
              <p className="text-sm text-white/80 mb-8">{t("access.subtitle")}</p>
              {sent ? (
                <div className="p-6 bg-[#10B981]/[0.05] border border-[#10B981]/15 rounded-2xl">
                  <CheckCircle2 size={32} className="mx-auto text-[#10B981] mb-3" />
                  <p className="text-sm font-bold mb-1">{t("access.granted")}</p>
                  <p className="text-xs text-white/80 mb-4">{t("access.sentTo")} <span className="font-semibold text-white/80">{email}</span></p>
                  <div className="p-4 bg-black/40 rounded-xl text-left font-mono text-[11px] mb-4"><div className="text-[#d4a855]">{email}</div><div className="text-white/90 mt-1">Access credentials sent to your email</div></div>
                  <button onClick={onLogin} className="h-11 px-8 bg-white text-[#09090b] text-xs font-bold rounded-xl hover:bg-white/90 transition-all inline-flex items-center gap-2"><Lock size={12} /> {t("access.enterNow")}</button>
                </div>
              ) : (
                <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="flex-1 relative"><Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("access.placeholder")} required className="w-full h-12 pl-10 pr-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/80 focus:outline-none focus:border-white/20 transition-all" /></div>
                  <button type="submit" disabled={loading} className="h-12 px-7 bg-white text-[#09090b] text-sm font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <><ArrowRight size={14} /> {t("access.request")}</>}
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-10 sm:py-16 px-4 sm:px-5 lg:px-10">
        <div className="max-w-[1400px] mx-auto flex flex-col items-center gap-5 sm:flex-row sm:justify-between sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center"><span className="font-black text-[#09090b] text-[7px]">20022</span></div>
            <span className="text-xs font-bold text-white/90">20022Chain</span>
            <span className="text-[10px] text-white/70">· {t("footer.part")}</span>
          </div>
          <div className="flex items-center gap-6 sm:gap-8">
            <a href="/whitepaper" className="text-[11px] text-white/80 hover:text-white/90 transition-colors font-medium">Whitepaper</a>
            <a href="https://github.com/20022chain-jpg" target="_blank" rel="noopener noreferrer" className="text-[11px] text-white/80 hover:text-white/90 transition-colors font-medium">GitHub</a>
            <a href="https://x.com/20022chain" target="_blank" rel="noopener noreferrer" className="text-[11px] text-white/80 hover:text-white/90 transition-colors font-medium">X</a>
          </div>
          <span className="text-[10px] text-white/70">&copy; 2026 20022Chain</span>
        </div>
      </footer>
    </div>
  );
}
