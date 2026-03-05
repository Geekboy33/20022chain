"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Shield, Zap, Globe, Lock, Layers, Cpu, Eye,
  ChevronDown, Link2, Menu, X, Download, Mail, CheckCircle2,
  Loader2, Rocket, Clock, FileText, Star, Users, BarChart3,
  Wallet, Code, Database, Box, Hash, Activity, Server,
  GitBranch, Terminal, Gauge, Network, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LangSwitcher } from "@/components/LangSwitcher";

interface ChainLandingProps {
  onLogin: () => void;
}

const SPECS = [
  { label: "Chain ID", value: "20022", color: "#d4a855" },
  { label: "TPS", value: "50K+", color: "#10B981" },
  { label: "Block Time", value: "400ms", color: "#3B82F6" },
  { label: "Finality", value: "Instant", color: "#8B5CF6" },
  { label: "Validators", value: "128", color: "#F59E0B" },
  { label: "Core", value: "Rust", color: "#EF4444" },
];

const SUBSYSTEMS = [
  { icon: Zap, name: "Parallel Execution", desc: "Multi-threaded transaction processing with conflict detection and optimistic concurrency. Processes 50,000+ TPS by executing independent transactions simultaneously across multiple cores." },
  { icon: Layers, name: "DAG Mempool", desc: "Directed Acyclic Graph-based transaction ordering. Eliminates sequential bottlenecks by allowing parallel transaction paths that merge at consensus checkpoints." },
  { icon: Cpu, name: "ArchPoS Consensus", desc: "Proof of Stake consensus with 128 validators, 400ms block time, and instant single-slot finality. Validators stake tokens to secure the network and earn rewards." },
  { icon: Shield, name: "ISO 20022 Messages", desc: "Native support for ISO 20022 financial messaging standard. Every transaction is formatted as a valid ISO 20022 message, enabling direct integration with SWIFT and banking systems." },
  { icon: Eye, name: "Verkle Trees", desc: "State-efficient storage that reduces node requirements by 90%. Enables light clients to verify state without downloading the full blockchain." },
  { icon: Lock, name: "ZK Proofs", desc: "Zero-knowledge proof system (ZK-SNARKs) for privacy-preserving compliance. Prove transaction validity without revealing sensitive details." },
  { icon: Link2, name: "Cross-Chain Bridge", desc: "Native bridges to Ethereum, BNB Chain, Polygon, Cosmos, and Polkadot. Trustless asset transfers with cryptographic verification." },
  { icon: Users, name: "On-Chain Governance", desc: "Token holders vote on protocol upgrades, fee adjustments, treasury allocation, and validator selection through transparent on-chain proposals." },
  { icon: Hash, name: "ISIN Registry", desc: "Native International Securities Identification Number registry. Every tokenized asset receives a globally recognized ISIN for institutional compatibility." },
  { icon: Box, name: "Account Abstraction", desc: "Flexible account model supporting multi-sig, social recovery, session keys, and gas sponsorship. Makes Web3 accessible to institutional users." },
  { icon: Database, name: "State Expiry", desc: "Automatic state pruning for inactive accounts. Keeps the blockchain lightweight while preserving data availability through archival nodes." },
  { icon: GitBranch, name: "Danksharding", desc: "EIP-4844 blob transactions for scalable data availability. Reduces L2 costs by 100x while maintaining security guarantees." },
];

const WALLET_TYPES = [
  {
    title: "Standard Wallet",
    icon: Wallet,
    color: "#0A0A0A",
    desc: "The default wallet for individual users. HD-compliant (BIP-39/BIP-44) with a single private key, mnemonic seed phrase backup, and support for all major hardware wallets (Ledger, Trezor). Ideal for retail investors and personal asset management.",
    features: ["Single private key", "24-word mnemonic backup", "Hardware wallet support", "All token types supported"],
    code: `POST /api/wallets
Response: {
  address: "0x7a3f8c21...b4e9",
  publicKey: "0x04ab93...f721",
  mnemonic: "abandon ability able about above absent absorb abstract absurd abuse access accident",
  type: "standard"
}`,
  },
  {
    title: "Multi-Signature Wallet",
    icon: Users,
    color: "#1D4ED8",
    desc: "Requires M-of-N signatures to execute transactions. Designed for corporate treasuries, DAOs, investment funds, and any scenario where shared control is needed. Example: 3-of-5 board members must approve transfers above $100,000.",
    features: ["Configurable M-of-N threshold", "Role-based permissions", "Time-locked approvals", "Audit trail for all actions"],
    code: `POST /api/wallets/multisig
Body: {
  owners: ["0x7a3f...", "0x3b21...", "0x9c44...", "0xf182...", "0x6d07..."],
  threshold: 3,  // 3 of 5 required
  dailyLimit: "1000000000000000000000"  // 1,000 tokens without multisig
}
Response: { address: "0xMS3f...", type: "multisig", threshold: 3 }`,
  },
  {
    title: "Social Recovery Wallet",
    icon: Shield,
    color: "#059669",
    desc: "Lost your key? No problem. Designate 5 trusted guardians (friends, family, institutions) who can collectively restore your wallet access. No single guardian can access funds alone — a configurable threshold (e.g., 3 of 5) is required for recovery. Zero risk of permanent loss.",
    features: ["Guardian-based recovery", "Configurable threshold", "Time-locked recovery (48h delay)", "Guardian rotation supported"],
    code: `POST /api/wallets/social-recovery
Body: {
  owner: "0x7a3f...",
  guardians: ["0xG1...", "0xG2...", "0xG3...", "0xG4...", "0xG5..."],
  recoveryThreshold: 3,  // 3 of 5 guardians to recover
  recoveryDelay: 172800  // 48 hours delay for security
}
// Recovery process:
POST /api/wallets/recover → 3 guardians sign → 48h wait → New key active`,
  },
  {
    title: "Session Key Wallet",
    icon: Clock,
    color: "#7C3AED",
    desc: "Grant temporary, limited permissions to dApps without exposing your main private key. A trading platform can execute trades up to $10,000 for 24 hours. A gaming dApp can mint NFTs for 1 hour. When the session expires, permissions are automatically revoked.",
    features: ["Time-limited permissions", "Spending limits per session", "Scope-restricted (per contract)", "Auto-revoke on expiry"],
    code: `POST /api/wallets/session
Body: {
  owner: "0x7a3f...",
  dapp: "archt-exchange.world",
  permissions: ["transfer"],
  maxAmount: "10000000000000000000000",  // Max 10,000 tokens
  expiresIn: 86400,  // 24 hours
  allowedContracts: ["0xExchange..."]
}
Response: { sessionKey: "0xSK...", expiresAt: "2026-03-01T12:00:00Z" }`,
  },
  {
    title: "Institutional Custody Wallet",
    icon: Building2,
    color: "#D4A017",
    desc: "Enterprise-grade wallet for funds, family offices, and institutional investors. Features role-based access control (RBAC), full audit logging, compliance monitoring, HSM (Hardware Security Module) integration for key management, and automated regulatory reporting. Designed for managing $100M+ in tokenized assets.",
    features: ["Role-based access (Admin, Trader, Viewer)", "HSM key management", "Full audit trail", "Compliance API integration", "Cold/hot wallet segregation"],
    code: `POST /api/wallets/institutional
Body: {
  organization: "ARCHT Capital Partners",
  roles: {
    admin: ["0xCEO...", "0xCFO..."],       // Full control
    trader: ["0xT1...", "0xT2...", "0xT3..."],  // Trade only
    viewer: ["0xAudit...", "0xCompliance..."]    // Read-only
  },
  limits: {
    traderDailyMax: "100000000000000000000000",  // 100K tokens
    requireAdminAbove: "1000000000000000000000000" // 1M tokens
  },
  hsm: { provider: "AWS CloudHSM", region: "eu-west-1" }
}`,
  },
  {
    title: "Smart Contract Wallet",
    icon: Code,
    color: "#EF4444",
    desc: "A wallet that is itself a smart contract on 20022Chain. Supports programmable logic: automatic yield reinvestment, dollar-cost averaging, conditional transfers (send if price > X), and gas abstraction (someone else pays gas). The most flexible wallet type for advanced DeFi strategies.",
    features: ["Programmable transfer logic", "Gas sponsorship (meta-transactions)", "Automatic DCA / rebalancing", "Conditional execution rules"],
    code: `POST /api/wallets/smart
Body: {
  owner: "0x7a3f...",
  rules: [
    { type: "auto-stake", trigger: "balance > 10000", action: "stake 50%" },
    { type: "dca", asset: "MINE-AU-001", amount: "100", frequency: "weekly" },
    { type: "limit-sell", asset: "ARCHT", price: "2.50", amount: "all" }
  ],
  gasSponsor: "0xARCHT_RELAYER..."  // ARCHT pays gas for this wallet
}`,
  },
];

export function ChainLanding({ onLogin }: ChainLandingProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [demoEmail, setDemoEmail] = useState("");
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    const visited = sessionStorage.getItem('chain_visited');
    if (visited) { setShowSplash(false); return; }
    const t = setTimeout(() => { setShowSplash(false); sessionStorage.setItem('chain_visited', '1'); }, 1600);
    return () => clearTimeout(t);
  }, []);

  const handleDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEmail) return;
    setDemoLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setDemoLoading(false);
    setDemoSubmitted(true);
  };

  const { t } = useI18n();

  const NAV = [
    { label: t("nav.tech"), href: "#tech" },
    { label: t("nav.subsystems"), href: "#subsystems" },
    { label: t("nav.wallets"), href: "#wallets" },
    { label: t("nav.explorer"), href: "#explorer" },
    { label: t("nav.whitepaper"), href: "/whitepaper" },
    { label: t("nav.access"), href: "#access" },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0A0A0A] overflow-x-hidden" style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
      {/* SPLASH */}
      <AnimatePresence>
        {showSplash && (
          <motion.div className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
              <span className="font-black text-[#0A0A0A] text-2xl tracking-tighter">20022</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <p className="mt-6 text-white font-bold text-lg tracking-wider">20022Chain</p>
              <p className="text-white/40 text-[10px] tracking-[0.4em] uppercase mt-1 text-center">ISO 20022 Native Blockchain</p>
            </motion.div>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6, duration: 1 }} className="mt-8 w-32 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent origin-center" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAV */}
      <nav className="sticky top-0 z-50 h-14 border-b border-[#e8e8ec] bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] flex items-center justify-center">
              <span className="font-black text-white text-[10px] tracking-tighter">20022</span>
            </div>
            <span className="font-bold text-sm tracking-tight">20022Chain</span>
          </div>
          <div className="hidden lg:flex items-center gap-1">
            {NAV.map(n => (
              <a key={n.label} href={n.href} className="px-3 py-1.5 text-[13px] text-[#6b6b74] hover:text-[#0A0A0A] rounded-lg hover:bg-black/5 transition-all">{n.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <LangSwitcher />
            <button onClick={onLogin} className="hidden sm:flex h-8 px-4 bg-[#0A0A0A] text-white text-[11px] font-bold tracking-wider rounded-lg hover:bg-[#1a1a2e] transition-all items-center gap-2">
              <Lock size={11} /> {t("nav.enter")}
            </button>
            <button className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={() => setMobileMenu(true)} aria-label="Menu"><Menu size={20} /></button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div className="fixed inset-0 z-[100] bg-white lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between h-14 px-4 border-b border-[#e8e8ec]">
              <span className="font-bold tracking-tight">20022Chain</span>
              <button onClick={() => setMobileMenu(false)} className="p-2" aria-label="Close"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-3">
              {NAV.map(n => (<a key={n.label} href={n.href} className="block text-lg py-2.5 border-b border-[#f0f0f2]" onClick={() => setMobileMenu(false)}>{n.label}</a>))}
              <button onClick={() => { setMobileMenu(false); onLogin(); }} className="w-full mt-4 h-12 bg-[#0A0A0A] text-white font-bold rounded-xl">{t("nav.enter")}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section className="relative py-24 sm:py-32 lg:py-40 px-4 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f5f7] to-[#fafafa]" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0A0A0A]/5 border border-[#0A0A0A]/10 rounded-full mb-8">
              <Rocket size={12} className="text-[#0A0A0A]" />
              <span className="text-[11px] font-semibold tracking-wider">{t("hero.badge")}</span>
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
            <span className="block">{t("hero.title1")}</span>
            <span className="block text-[#6b6b74]">{t("hero.title2")}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base sm:text-lg text-[#6b6b74] max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("hero.subtitle")}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <button onClick={onLogin} className="h-12 px-8 bg-[#0A0A0A] text-white text-sm font-bold tracking-wider rounded-xl hover:bg-[#1a1a2e] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 shadow-lg">
              {t("hero.launch")} <ArrowRight size={16} />
            </button>
            <a href="/whitepaper" className="h-12 px-8 border border-[#d4d4d8] text-[#6b6b74] text-sm font-medium rounded-xl hover:border-[#0A0A0A]/30 hover:text-[#0A0A0A] transition-all flex items-center gap-3">
              <FileText size={14} /> {t("hero.wp")}
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-wrap justify-center gap-2 mb-16">
            {["ISO 20022", "Rust Core", "50K+ TPS", "Instant Finality", "ZK Privacy", "Cross-Chain"].map(b => (
              <span key={b} className="px-3 py-1 rounded-full border border-[#e8e8ec] text-[10px] sm:text-[11px] text-[#8b8b94] font-medium tracking-wider">{b}</span>
            ))}
          </motion.div>

          {/* Specs Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-4xl mx-auto">
            {SPECS.map(s => (
              <div key={s.label} className="p-4 bg-white border border-[#e8e8ec] rounded-xl text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="text-2xl sm:text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-[#8b8b94] uppercase tracking-wider mt-1 font-semibold">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="tech" className="py-20 sm:py-28 px-4 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold text-[#8b8b94] uppercase tracking-[0.3em]">{t("tech.badge")}</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">{t("tech.title")}</h2>
            <p className="text-sm text-[#6b6b74] mt-3 max-w-xl mx-auto">{t("tech.subtitle")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", title: t("tech.s1"), desc: t("tech.s1d"), icon: Terminal },
              { step: "02", title: t("tech.s2"), desc: t("tech.s2d"), icon: Shield },
              { step: "03", title: t("tech.s3"), desc: t("tech.s3d"), icon: Zap },
              { step: "04", title: t("tech.s4"), desc: t("tech.s4d"), icon: CheckCircle2 },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="p-6 bg-[#fafafa] border border-[#e8e8ec] rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <span className="text-xs font-mono font-bold text-[#d4a855]">{item.step}</span>
                  <Icon size={20} className="mt-3 mb-2 text-[#0A0A0A]" />
                  <h3 className="text-base font-bold mb-2">{item.title}</h3>
                  <p className="text-xs text-[#6b6b74] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 12 SUBSYSTEMS */}
      <section id="subsystems" className="py-20 sm:py-28 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold text-[#8b8b94] uppercase tracking-[0.3em]">{t("sub.badge")}</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">{t("sub.title")}</h2>
            <p className="text-sm text-[#6b6b74] mt-3 max-w-xl mx-auto">{t("sub.subtitle")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUBSYSTEMS.map((sub, i) => {
              const Icon = sub.icon;
              return (
                <motion.div key={sub.name} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="p-5 bg-white border border-[#e8e8ec] rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                  <div className="w-9 h-9 rounded-lg bg-[#0A0A0A]/5 flex items-center justify-center mb-3 group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                    <Icon size={16} />
                  </div>
                  <h3 className="text-sm font-bold mb-1.5">{sub.name}</h3>
                  <p className="text-[11px] text-[#6b6b74] leading-relaxed">{sub.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WALLET TYPES */}
      <section id="wallets" className="py-20 sm:py-28 px-4 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold text-[#8b8b94] uppercase tracking-[0.3em]">{t("wallet.badge")}</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">{t("wallet.title")}</h2>
            <p className="text-sm text-[#6b6b74] mt-3 max-w-2xl mx-auto">{t("wallet.subtitle")}</p>
          </div>

          <div className="space-y-5">
            {WALLET_TYPES.map((w, i) => {
              const Icon = w.icon;
              return (
                <motion.div key={w.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="bg-[#fafafa] border border-[#e8e8ec] rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${w.color}10`, border: `1px solid ${w.color}20` }}>
                        <Icon size={20} style={{ color: w.color }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black tracking-tight">{w.title}</h3>
                        <p className="text-xs text-[#6b6b74] leading-relaxed mt-1">{w.desc}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {w.features.map(f => (
                        <span key={f} className="px-2.5 py-1 text-[10px] font-medium rounded-full border border-[#e8e8ec] text-[#6b6b74] bg-white">{f}</span>
                      ))}
                    </div>

                    <div className="bg-[#0A0A0A] rounded-xl p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                        <div className="w-2 h-2 rounded-full bg-[#EF4444]/80" />
                        <div className="w-2 h-2 rounded-full bg-[#F59E0B]/80" />
                        <div className="w-2 h-2 rounded-full bg-[#10B981]/80" />
                        <span className="ml-2 text-[9px] text-white/30 font-mono">20022chain-api</span>
                      </div>
                      <pre className="font-mono text-[10px] sm:text-[11px] text-[#10B981] leading-relaxed whitespace-pre-wrap overflow-x-auto">{w.code}</pre>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* API Reference */}
          <div className="mt-10 p-6 sm:p-8 bg-[#0A0A0A] rounded-2xl text-white">
            <h3 className="text-lg font-bold mb-2">{t("wallet.api")}</h3>
            <p className="text-xs text-white/40 mb-5">30+ REST endpoints for full blockchain interaction</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {["/api/blocks", "/api/transactions", "/api/validators", "/api/chain", "/api/stats", "/api/balance", "/api/wallets", "/api/wallets/multisig", "/api/wallets/recover", "/api/contracts", "/api/isin", "/api/governance", "/api/bridge", "/api/staking", "/api/defi", "/api/nft", "/api/oracle", "/api/faucet", "/api/nonce", "/api/swift"].map(ep => (
                <div key={ep} className="px-3 py-2 bg-white/5 rounded-lg text-[10px] font-mono text-white/70 hover:bg-white/10 transition-colors">{ep}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EXPLORER PREVIEW */}
      <section id="explorer" className="py-20 sm:py-28 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold text-[#8b8b94] uppercase tracking-[0.3em]">{t("explorer.badge")}</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">{t("explorer.title")}</h2>
            <p className="text-sm text-[#6b6b74] mt-3 max-w-xl mx-auto">{t("explorer.subtitle")}</p>
          </div>
          <div className="bg-white border border-[#e8e8ec] rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Blocks", value: "158,574", icon: Box },
                { label: "Transactions", value: "158,573", icon: ArrowRight },
                { label: "ISIN Instruments", value: "8,247", icon: Hash },
                { label: "Validators", value: "128", icon: Users },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="p-4 bg-[#fafafa] rounded-xl">
                    <Icon size={14} className="text-[#8b8b94] mb-2" />
                    <div className="text-2xl font-black">{s.value}</div>
                    <div className="text-[10px] text-[#8b8b94] uppercase tracking-wider">{s.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <button onClick={onLogin} className="h-11 px-8 bg-[#0A0A0A] text-white text-sm font-bold rounded-xl hover:bg-[#1a1a2e] hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2">
                <Lock size={14} /> {t("explorer.cta")} <ArrowRight size={14} />
              </button>
              <p className="text-[10px] text-[#8b8b94] mt-3">{t("explorer.ctaSub")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHT INTEGRATION */}
      <section className="py-20 sm:py-28 px-4 lg:px-8 bg-[#0A0A0A] text-white">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">{t("archt.badge")}</span>
          <h2 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">{t("archt.title")}</h2>
          <p className="text-sm text-white/50 mt-3 max-w-xl mx-auto mb-12">{t("archt.subtitle")}</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { val: "$5T+", label: "Mineral Reserves", desc: "1,000+ mining operations tokenized on ARCHT, settled on 20022Chain" },
              { val: "6", label: "Asset Modules", desc: "Mining, Earths, Gemstones, Real Estate, Bonds, Private Credit" },
              { val: "47+", label: "Countries", desc: "Global reach with multi-jurisdictional compliance" },
            ].map(s => (
              <div key={s.label} className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
                <div className="text-3xl font-black text-[#d4a855]">{s.val}</div>
                <div className="text-xs font-bold text-white mt-1">{s.label}</div>
                <p className="text-[10px] text-white/40 mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO ACCESS */}
      <section id="access" className="py-20 sm:py-28 px-4 lg:px-8">
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white border border-[#e8e8ec] rounded-2xl p-8 sm:p-10 text-center shadow-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0A0A0A]/5 rounded-full text-[10px] font-bold tracking-[0.2em] mb-6">
              <Star size={10} /> {t("access.badge")}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">{t("access.title")}</h2>
            <p className="text-sm text-[#6b6b74] mb-8">{t("access.subtitle")}</p>

            {demoSubmitted ? (
              <div className="p-5 bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl">
                <CheckCircle2 size={28} className="mx-auto text-[#10B981] mb-2" />
                <p className="text-sm font-bold mb-1">{t("access.granted")}</p>
                <p className="text-xs text-[#6b6b74] mb-3">{t("access.sentTo")} <span className="font-semibold text-[#0A0A0A]">{demoEmail}</span></p>
                <div className="p-3 bg-[#0A0A0A] rounded-lg text-left font-mono text-[10px] text-white mb-3">
                  <div className="text-[#d4a855]">{demoEmail}</div>
                  <div className="text-white mt-1">Password: chain2026</div>
                </div>
                <button onClick={onLogin} className="h-10 px-6 bg-[#0A0A0A] text-white text-xs font-bold rounded-lg hover:bg-[#1a1a2e] transition-all inline-flex items-center gap-2">
                  <Lock size={12} /> {t("access.enterNow")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleDemo}>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c4c4c4]" />
                    <input type="email" value={demoEmail} onChange={e => setDemoEmail(e.target.value)} placeholder={t("access.placeholder")} required className="w-full h-11 pl-9 pr-4 bg-[#fafafa] border border-[#e8e8ec] rounded-xl text-sm focus:outline-none focus:border-[#0A0A0A]/30 transition-colors" />
                  </div>
                  <button type="submit" disabled={demoLoading} className="h-11 px-6 bg-[#0A0A0A] text-white text-sm font-bold rounded-xl hover:bg-[#1a1a2e] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-70">
                    {demoLoading ? <Loader2 size={14} className="animate-spin" /> : <><ArrowRight size={14} /> {t("access.request")}</>}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#e8e8ec] py-12 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#0A0A0A] flex items-center justify-center"><span className="font-black text-white text-[7px]">20022</span></div>
            <span className="text-xs font-bold">20022Chain</span>
            <span className="text-[10px] text-[#8b8b94]">· {t("footer.part")}</span>
          </div>
          <span className="text-[10px] text-[#8b8b94]">&copy; 2026 20022Chain. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
