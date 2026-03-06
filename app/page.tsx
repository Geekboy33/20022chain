"use client";

import { useChainAuth } from "@/lib/auth-context";
import { ChainLanding } from "@/components/ChainLanding";
import { LoginModal } from "@/components/LoginModal";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Box, Hash, ArrowUpRight, Activity, Shield, Search, ChevronRight,
  ChevronDown, Copy, Check, Link2, ExternalLink, Circle, ArrowRight,
  Layers, Lock, Zap, TrendingUp, Clock, FileText, Globe, RefreshCw,
  X, BarChart3, Users, Wallet, Database, ArrowDownRight, Cpu, Eye, Code,
  Fingerprint, Scale, Music, Palette, Mountain, Building2, Banknote, Gem,
  BadgeCheck, Award, Film, Camera, PenTool, BookOpen, ShieldCheck,
  ArrowLeftRight, FlaskConical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const ISO_NAMES: Record<string, string> = {
  'setr.012': 'Asset Tokenization', 'pacs.008': 'Token Transfer', 'semt.002': 'Holdings Report',
  'sese.023': 'Settlement', 'seev.031': 'Corporate Action', 'camt.053': 'Account Statement',
  'colr.003': 'Collateral Mgmt', 'reda.041': 'Reference Data',
};
const RWA_L: Record<string, string> = { 'MINE': 'Mining', 'REAL': 'Real Estate', 'BOND': 'Fixed Income', 'COMM': 'Commodity', 'GEM': 'Gemstone' };
const RWA_C: Record<string, string> = { 'MINE': '#92700a', 'REAL': '#1D4ED8', 'BOND': '#7C3AED', 'COMM': '#059669', 'GEM': '#DB2777' };

// ═══════════════════════════════════════════════════════════════
// SEAL SYSTEM
// ═══════════════════════════════════════════════════════════════
const SEAL_CFG: Record<string, { label: string; color: string; icon: any; gradient: string }> = {
  VERIFIED:       { label: 'Verified',       color: '#00C853', icon: BadgeCheck,  gradient: 'from-[#00C853] to-[#00E676]' },
  VR_VERIFIED:    { label: 'ViewsRight',     color: '#7C3AED', icon: Fingerprint, gradient: 'from-[#7C3AED] to-[#A855F7]' },
  IS_VERIFIED:    { label: 'ISIN',           color: '#1D4ED8', icon: Hash,        gradient: 'from-[#1D4ED8] to-[#3B82F6]' },
  GOV_VERIFIED:   { label: 'Government',     color: '#D4A017', icon: Shield,      gradient: 'from-[#D4A017] to-[#F59E0B]' },
  INST_VERIFIED:  { label: 'Institutional',  color: '#6B7280', icon: Building2,   gradient: 'from-[#6B7280] to-[#9CA3AF]' },
  PRO_VERIFIED:   { label: 'Professional',   color: '#059669', icon: Award,       gradient: 'from-[#059669] to-[#10B981]' },
  PRIVACY_SHIELD: { label: 'Private',        color: '#0A0A0A', icon: Lock,        gradient: 'from-[#0A0A0A] to-[#333]' },
};

function MiniSeal({ seal, size = 14 }: { seal?: string; size?: number }) {
  const cfg = seal ? SEAL_CFG[seal] : null;
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <div className={`rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-md`} title={cfg.label}
      style={{ width: size, height: size, boxShadow: `0 1px 4px ${cfg.color}40` }}>
      <Icon size={size * 0.55} className="text-white" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MICRO COMPONENTS
// ═══════════════════════════════════════════════════════════════

function Cp({ t }: { t: string }) {
  const [ok, setOk] = useState(false);
  return <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t); setOk(true); setTimeout(() => setOk(false), 1200); }} className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-black/5 transition-colors" aria-label="Copy">{ok ? <Check size={11} className="text-[#00C853]" /> : <Copy size={11} className="text-[#ccc]" />}</button>;
}
function Dot({ s }: { s: string }) { return <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s === 'confirmed' ? '#00C853' : s === 'pending' ? '#F59E0B' : '#EF4444' }} />; }
function Tag({ children, c }: { children: React.ReactNode; c?: string }) {
  return <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded" style={c ? { color: c, backgroundColor: `${c}0a`, border: `1px solid ${c}18` } : { color: '#555', backgroundColor: '#f3f3f3', border: '1px solid #e8e8e8' }}>{children}</span>;
}
function tAgo(ts: number) { const s = Math.floor((Date.now() - ts) / 1000); if (s < 5) return 'now'; if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s / 60)}m`; return `${Math.floor(s / 3600)}h`; }
function fNum(n: number) { if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`; if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`; if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`; return n.toLocaleString(); }

/** Native Address Renderer — parses archt:type:name:hash format */
function Addr({ a, full = false, mono = true }: { a: string; full?: boolean; mono?: boolean }) {
  if (!a) return <span className="text-[#ccc]">—</span>;
  // Legacy 0x addresses (shouldn't appear anymore)
  if (a.startsWith('0x')) {
    return <span className={cn("text-[11px]", mono && "font-mono")}>{full ? a : `${a.slice(0, 14)}...${a.slice(-6)}`}</span>;
  }
  // Native archt: addresses
  const parts = a.split(':');
  if (parts[0] === 'archt' && parts.length >= 3) {
    const prefix = parts[0]; // archt
    const addrType = parts[1]; // contract, val, account, wallet, user, owner, system, genesis, or context name
    const context = parts.length === 4 ? parts[2] : null; // name if 4 parts
    const hash = parts[parts.length - 1]; // always last

    // Color mapping
    const typeColors: Record<string, string> = {
      'contract': '#00C853', 'val': '#1D4ED8', 'account': '#555', 'wallet': '#555',
      'user': '#555', 'owner': '#7C3AED', 'system': '#F59E0B', 'genesis': '#F59E0B',
    };
    const typeColor = typeColors[addrType] || '#059669';

    return (
      <span className={cn("inline-flex items-center gap-0.5 text-[11px]", mono && "font-mono")}>
        <span className="text-[#bbb]">{prefix}:</span>
        <span className="font-semibold" style={{ color: typeColor }}>{addrType}</span>
        {context && <><span className="text-[#ccc]">:</span><span className="text-[#0a0a0a] font-semibold">{full ? context : context.slice(0, 16)}</span></>}
        <span className="text-[#ccc]">:</span>
        <span className="text-[#999]">{full ? hash : hash.slice(0, 8)}...</span>
      </span>
    );
  }
  // Tx hashes
  if (a.startsWith('tx:')) {
    const hash = a.slice(3);
    return <span className={cn("text-[11px]", mono && "font-mono")}><span className="text-[#F59E0B] font-semibold">tx</span><span className="text-[#ccc]">:</span><span className="text-[#888]">{full ? hash : `${hash.slice(0, 12)}...${hash.slice(-6)}`}</span></span>;
  }
  // Fallback
  return <span className={cn("text-[11px] text-[#888]", mono && "font-mono")}>{full ? a : a.length > 30 ? `${a.slice(0, 20)}...${a.slice(-6)}` : a}</span>;
}

/** Mini bar chart from array of numbers */
function MiniChart({ data, h = 32, color = '#00C853' }: { data: number[]; h?: number; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px]" style={{ height: h }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm bar-grow" style={{ height: `${Math.max((v / max) * 100, 4)}%`, backgroundColor: color, opacity: 0.15 + (i / data.length) * 0.85, animationDelay: `${i * 30}ms` }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

type Tab = 'home' | 'blocks' | 'transactions' | 'registry' | 'validators' | 'stats';

export default function Page() {
  const { isAuthenticated } = useChainAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <ChainLanding onLogin={() => setShowLogin(true)} />
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </>
    );
  }

  return <Explorer />;
}

function Explorer() {
  const [tab, setTab] = useState<Tab>('home');
  const [stats, setStats] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);
  const [vals, setVals] = useState<any[]>([]);
  const [isins, setIsins] = useState<any[]>([]);
  const [allContracts, setAllContracts] = useState<any[]>([]);
  const [netStats, setNetStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [isinQ, setIsinQ] = useState('');
  const [regFilter, setRegFilter] = useState('ALL');
  const [selBlock, setSelBlock] = useState<any>(null);
  const [selTx, setSelTx] = useState<any>(null);
  const [selIsin, setSelIsin] = useState<string | null>(null);
  const [selRegContract, setSelRegContract] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [liveBlk, setLiveBlk] = useState<any>(null);
  const blocksRef = React.useRef<any[]>([]);

  const fetchAll = useCallback(async (isInitial?: boolean) => {
    if (isInitial) {
      setLoading(true);
      setLoadError(null);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const opts = { signal: controller.signal };
      const [c, b, t, v, n, s, ct] = await Promise.all([
        fetch('/api/chain', opts).then(r => r.ok ? r.json() : {}),
        fetch('/api/blocks?count=30', opts).then(r => r.ok ? r.json() : { blocks: [] }),
        fetch('/api/transactions?count=50', opts).then(r => r.ok ? r.json() : { transactions: [] }),
        fetch('/api/validators', opts).then(r => r.ok ? r.json() : { validators: [] }),
        fetch('/api/isin', opts).then(r => r.ok ? r.json() : { registry: [] }),
        fetch('/api/stats', opts).then(r => r.ok ? r.json() : {}),
        fetch('/api/contracts', opts).then(r => r.ok ? r.json() : { contracts: [] }),
      ]);
      clearTimeout(timeoutId);
      const newBlocks = b?.blocks || [];
      if (blocksRef.current.length && newBlocks[0]?.index > blocksRef.current[0]?.index) {
        setLiveBlk(newBlocks[0]);
        setTimeout(() => setLiveBlk(null), 3000);
      }
      blocksRef.current = newBlocks;
      setStats(c || null);
      setBlocks(newBlocks);
      setTxs(t?.transactions || []);
      setVals(v?.validators || []);
      setIsins(n?.registry || []);
      setNetStats(s || null);
      setAllContracts(ct?.contracts || []);
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('[20022Chain] fetch error:', e);
      setLoadError(e instanceof Error ? e.message : 'No se pudo conectar al nodo');
      setStats(null);
      setBlocks([]);
      setTxs([]);
      setVals([]);
      setIsins([]);
      setNetStats(null);
      setAllContracts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(true); }, []); // eslint-disable-line
  useEffect(() => {
    const i = setInterval(() => fetchAll(false), 10000);
    return () => clearInterval(i);
  }, [fetchAll]);

  const txVolChart = useMemo(() => netStats?.txVolume?.map((x: any) => x.txCount).reverse() || [], [netStats]);
  const filtIsins = useMemo(() => { if (!isinQ) return isins; const q = isinQ.toLowerCase(); return isins.filter((e: any) => [e.isin, e.name, e.tokenSymbol, e.issuer, e.lei].some((f: string) => f?.toLowerCase().includes(q))); }, [isins, isinQ]);

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Activity },
    { id: 'blocks', label: 'Blocks', icon: Box },
    { id: 'transactions', label: 'Transactions', icon: ArrowUpRight },
    { id: 'registry', label: 'Registry', icon: Layers },
    { id: 'validators', label: 'Validators', icon: Shield },
    { id: 'stats', label: 'Data', icon: BarChart3 },
  ];

  // ── LOADING ───────────────────────────────────────
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white relative">
      <div className="absolute inset-0 grid-bg" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-[#0a0a0a] shadow-[0_10px_28px_rgba(10,10,10,0.35)] flex items-center justify-center mb-8 relative overflow-visible">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,transparent_45%)] rounded-2xl" />
          <div className="absolute inset-0 border-2 border-[#00C853]/35 rounded-2xl" />
          <Link2 size={30} className="text-white relative z-10" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00C853] live-dot border-[3px] border-[#0a0a0a] shadow-[0_0_0_3px_rgba(0,200,83,0.25)]" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-[.12em] uppercase mb-2 text-[#0a0a0a]">20022Chain</h1>
        <p className="text-xs text-[#999] font-mono tracking-[.15em] mb-10">CONNECTING TO NODE</p>
        <div className="w-48 h-1 bg-[#eee] rounded-full overflow-hidden"><div className="h-full w-3/4 bg-[#00C853] rounded-full scan-line" /></div>
      </div>
    </div>
  );

  const S = stats?.stats || {};

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">

      {/* ══════ HEADER ════════════════════════════════════════════ */}
      <header className="border-b border-[#e8e8e8] bg-white shrink-0 z-50 relative">
        <div className="h-16 px-8 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0a0a0a] shadow-[0_4px_12px_rgba(10,10,10,0.28)] flex items-center justify-center relative overflow-visible">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,transparent_45%)] rounded-xl" />
                <div className="absolute inset-0 border border-[#00C853]/40 rounded-xl" />
                <Link2 size={16} className="text-white relative z-10" />
                <div className="absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full bg-[#00C853] border-2 border-[#0a0a0a] live-dot shadow-[0_0_0_2px_rgba(0,200,83,0.2)]" />
              </div>
              <div>
                <h1 className="text-[16px] font-extrabold text-[#0a0a0a] tracking-[.08em] uppercase leading-none">20022Chain</h1>
                <p className="text-[10px] text-[#8d8d8d] font-mono mt-0.5 tracking-[.16em]">RWA BLOCKCHAIN</p>
              </div>
            </div>
            <div className="w-px h-7 bg-[#e8e8e8]" />
            {/* Nav tabs inline */}
            <nav className="flex items-center gap-1">
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all", tab === t.id ? "bg-[#0a0a0a] text-white" : "text-[#888] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]")}>
                    {/* dynamic icon */}
                    <Icon size={13} />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>
          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#999] mr-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00C853] live-dot" />
              <span className="text-[#00C853] font-bold">LIVE</span>
              <span>BLK #{S.totalBlocks?.toLocaleString()}</span>
              <span>·</span>
              <span className="text-[#0a0a0a] font-bold">{S.tps?.toLocaleString()} TPS</span>
            </div>
            <a href="/wallets" className="h-8 px-3 rounded-lg border border-[#e8e8e8] text-[10px] font-bold hover:bg-[#f3f3f3] transition-all tracking-wider uppercase flex items-center gap-1.5 text-[#555]">
              <Wallet size={11} /> Wallets
            </a>
            <a href="/bridge" className="h-8 px-3 rounded-lg border border-[#e8e8e8] text-[10px] font-bold hover:bg-[#f3f3f3] transition-all tracking-wider uppercase flex items-center gap-1.5 text-[#555]">
              <ArrowLeftRight size={11} /> Bridge
            </a>
            <a href="/payments" className="h-8 px-3 rounded-lg border border-[#e8e8e8] text-[10px] font-bold hover:bg-[#f3f3f3] transition-all tracking-wider uppercase flex items-center gap-1.5 text-[#555]">
              <Banknote size={11} /> Gpay3
            </a>
            <a href="/reserves" className="h-8 px-3 rounded-lg border border-[#e8e8e8] text-[10px] font-bold hover:bg-[#f3f3f3] transition-all tracking-wider uppercase flex items-center gap-1.5 text-[#555]">
              <Shield size={11} /> PoR
            </a>
            <a href="/contracts" className="h-8 px-3 rounded-lg bg-[#0a0a0a] text-white text-[10px] font-bold hover:bg-[#222] transition-all tracking-wider uppercase flex items-center gap-1.5">
              <Code size={11} /> Contracts
            </a>
            <a href="/sandbox" className="h-8 px-3 rounded-lg border-2 border-[#F59E0B] text-[#F59E0B] text-[10px] font-bold hover:bg-[#F59E0B]/10 transition-all tracking-wider uppercase flex items-center gap-1.5">
              <FlaskConical size={11} /> Sandbox
            </a>
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="h-8 px-3 rounded-lg border border-[#e8e8e8] text-[10px] font-bold text-[#888] hover:text-[#0a0a0a] hover:border-[#ccc] transition-all tracking-wider uppercase flex items-center gap-1.5">
              ARCHT <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </header>

      {/* ══════ CONTENT ══════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto bg-[#FAFAFA]">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>

{/* ────────── HOME ────────────────────────────────────── */}
{tab === 'home' && (
<div className="max-w-[1440px] mx-auto">
  {/* HERO SECTION */}
  <div className="px-8 pt-8 pb-6 bg-white border-b border-[#e8e8e8] relative overflow-hidden">
    <div className="absolute inset-0 grid-bg opacity-50" />
    <div className="relative z-10">
      {/* Search */}
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight mb-2">20022Chain Explorer</h2>
        <p className="text-sm text-[#888] mb-5">The ISO 20022 native blockchain for tokenized Real World Assets</p>
        <div className="relative">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input type="text" placeholder="Search by Block / Tx Hash / ISIN / Address"
            className="w-full bg-white border-2 border-[#e8e8e8] rounded-2xl pl-12 pr-5 py-4 text-base text-[#0a0a0a] placeholder:text-[#ccc] focus:border-[#0a0a0a] outline-none transition-colors font-mono shadow-sm"
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && search.trim()) { window.location.href = `/tx/${encodeURIComponent(search.trim())}`; } }}
          />
        </div>
      </div>

      {/* Network Pulse — 6 big metrics */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Blocks', value: fNum(S.totalBlocks || 0), icon: Box, sub: '~6s finality' },
          { label: 'Transactions', value: fNum(S.totalTransactions || 0), icon: Activity, sub: 'ISO 20022' },
          { label: 'TPS', value: String(S.tps || 0), icon: Zap, accent: true, sub: 'Throughput' },
          { label: 'Validators', value: `${S.activeValidators || 0}/8`, icon: Shield, sub: 'PoS Consensus' },
          { label: 'Registry', value: String(allContracts.length || 0), icon: Layers, sub: `${allContracts.filter(c => c.registryType === 'CONTRACT').length} Contracts · ${allContracts.filter(c => c.registryType === 'ISIN').length} ISIN · ${allContracts.filter(c => c.registryType === 'VIEWSRIGHT').length} VR` },
          { label: 'Market Cap', value: `$${fNum(S.marketCap || 0)}`, icon: TrendingUp, sub: 'RWA Value' },
        ].map((m, i) => (
          <div key={m.label} className="bg-[#FAFAFA] border border-[#e8e8e8] rounded-2xl p-5 fade-up group hover:border-[#ccc] transition-all" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-center justify-between mb-3">
              {/* dynamic icon */}
              <m.icon size={16} className="text-[#bbb] group-hover:text-[#0a0a0a] transition-colors" />
              <span className="text-[8px] font-bold text-[#bbb] uppercase tracking-widest">{m.label}</span>
            </div>
            <div className={cn("text-2xl font-extrabold font-mono tracking-tight num-pop", m.accent ? "text-[#00C853]" : "text-[#0a0a0a]")} style={{ animationDelay: `${i * 40 + 100}ms` }}>{m.value}</div>
            <div className="text-[10px] text-[#aaa] mt-1">{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* CHAIN INFO BAR */}
  <div className="px-8 py-3 bg-white border-b border-[#e8e8e8] flex items-center justify-between">
    <div className="flex items-center gap-6 text-sm">
      {[
        { l: 'Consensus', v: 'Proof-of-Stake', icon: Lock },
        { l: 'Block Time', v: '6s', icon: Clock },
        { l: 'Staked', v: `${fNum(S.totalStaked || 0)} ARCHT`, icon: Layers },
        { l: 'Accounts', v: fNum(netStats?.uniqueAccounts || 0), icon: Users },
        { l: 'Pending', v: String(netStats?.pendingTxCount || 0), icon: Clock },
      ].map((x, i) => (
        <React.Fragment key={x.l}>
          {i > 0 && <div className="w-px h-4 bg-[#e8e8e8]" />}
          <div className="flex items-center gap-2">
            {/* dynamic icon */}
            <x.icon size={12} className="text-[#ccc]" />
            <span className="text-[#999]">{x.l}</span>
            <span className="font-bold text-[#0a0a0a]">{x.v}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
    <div className="flex items-center gap-2 text-[10px]">
      <div className="w-2 h-2 rounded-full bg-[#00C853]" />
      <span className="font-bold text-[#00C853]">Chain Valid</span>
    </div>
  </div>

  {/* NEW BLOCK TOAST */}
  <AnimatePresence>
    {liveBlk && (
      <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} className="mx-8 mt-4 bg-[#00C853] text-white rounded-xl px-5 py-3 flex items-center gap-3 shadow-lg shadow-[#00C853]/20">
        <Box size={16} className="block-pulse" />
        <span className="text-sm font-bold">New Block #{liveBlk.index?.toLocaleString()}</span>
        <span className="text-sm opacity-80">·</span>
        <span className="text-sm opacity-80">{liveBlk.transactionCount} transactions</span>
        <span className="text-sm opacity-80">·</span>
        <span className="text-sm opacity-80">Validator: {liveBlk.validatorName}</span>
      </motion.div>
    )}
  </AnimatePresence>

  {/* TX VOLUME CHART + LATEST */}
  <div className="px-8 py-6 space-y-5">
    {/* Transaction Volume mini chart */}
    <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-bold text-[#0a0a0a]">Transaction Volume</div>
          <div className="text-xs text-[#999] mt-0.5">Transactions per block (last 20 blocks)</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold font-mono text-[#0a0a0a]">{fNum(S.totalTransactions || 0)}</div>
          <div className="text-[10px] text-[#00C853] font-bold">+{txVolChart[txVolChart.length - 1] || 0} latest block</div>
        </div>
      </div>
      <MiniChart data={txVolChart} h={56} />
    </div>

    {/* Two columns */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* BLOCKS */}
      <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
        <div className="h-12 px-5 border-b border-[#e8e8e8] flex items-center justify-between">
          <div className="flex items-center gap-2"><Box size={14} className="text-[#00C853]" /><span className="text-sm font-bold">Latest Blocks</span></div>
          <button onClick={() => setTab('blocks')} className="text-[11px] text-[#999] hover:text-[#0a0a0a] font-semibold flex items-center gap-1">View All <ArrowRight size={11} /></button>
        </div>
        <div className="divide-y divide-[#f3f3f3]">
          {blocks.slice(0, 10).map((b: any) => (
            <div key={b.index} onClick={() => setSelBlock(b)} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAFAFA] cursor-pointer transition-colors">
              <div className="w-10 h-10 bg-[#f3f3f3] rounded-xl flex items-center justify-center shrink-0"><Box size={15} className="text-[#555]" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-[13px] font-bold font-mono">#{b.index}</span><span className="text-[10px] text-[#bbb]">{tAgo(b.timestamp)}</span></div>
                <div className="text-[11px] text-[#999]">{b.validatorName}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-bold font-mono">{b.transactionCount} <span className="text-[10px] font-normal text-[#999]">txns</span></div>
                <div className="text-[10px] text-[#00C853] font-mono">+{Number(b.reward || 0).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
        <div className="h-12 px-5 border-b border-[#e8e8e8] flex items-center justify-between">
          <div className="flex items-center gap-2"><ArrowUpRight size={14} className="text-[#00C853]" /><span className="text-sm font-bold">Latest Transactions</span></div>
          <button onClick={() => setTab('transactions')} className="text-[11px] text-[#999] hover:text-[#0a0a0a] font-semibold flex items-center gap-1">View All <ArrowRight size={11} /></button>
        </div>
        <div className="divide-y divide-[#f3f3f3]">
          {txs.slice(0, 10).map((tx: any, i: number) => (
            <div key={`${tx.hash}-${i}`} onClick={() => setSelTx(tx)} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAFAFA] cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-xl border border-[#e8e8e8] flex items-center justify-center shrink-0"><ArrowUpRight size={14} className="text-[#555]" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-[11px] font-bold font-mono truncate max-w-[120px]">{tx.hash?.slice(0, 16)}...</span><Tag>{tx.iso20022?.messageType}</Tag></div>
                <div className="text-[10px] text-[#999]">{ISO_NAMES[tx.iso20022?.messageType]}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-bold font-mono">{Number(tx.amount) < 1 ? Number(tx.amount).toFixed(4) : fNum(Number(tx.amount))}</div>
                <div className="flex items-center gap-1 justify-end"><Dot s={tx.status} /><span className="text-[10px] text-[#999]">{tx.status}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* REGISTRY OVERVIEW — Contracts + ISIN + ViewsRight */}
    <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
      <div className="h-12 px-5 border-b border-[#e8e8e8] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers size={14} className="text-[#00C853]" />
          <span className="text-sm font-bold">20022Chain Registry</span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#00C853]/10 text-[#00C853]">{allContracts.filter(c => c.registryType === 'CONTRACT').length} Contracts</span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#1D4ED8]/10 text-[#1D4ED8]">{allContracts.filter(c => c.registryType === 'ISIN').length} ISIN</span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#7C3AED]/10 text-[#7C3AED]">{allContracts.filter(c => c.registryType === 'VIEWSRIGHT').length} ViewsRight</span>
        </div>
        <button onClick={() => setTab('registry')} className="text-[11px] text-[#999] hover:text-[#0a0a0a] font-semibold flex items-center gap-1">Full Registry <ArrowRight size={11} /></button>
      </div>
      <div className="divide-y divide-[#f3f3f3]">
        {allContracts.slice(0, 6).map((c: any) => {
          const regColor = c.registryType === 'ISIN' ? '#1D4ED8' : c.registryType === 'VIEWSRIGHT' ? '#7C3AED' : '#00C853';
          const regLabel = c.registryType === 'ISIN' ? 'ISIN' : c.registryType === 'VIEWSRIGHT' ? 'ViewsRight' : 'Contract';
          return (
            <a key={c.id} href={`/contracts/view/${encodeURIComponent(c.address)}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors group">
              {/* Logo */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-extrabold" style={{ backgroundColor: `${regColor}10`, border: `1.5px solid ${regColor}20`, color: regColor }}>
                  {c.registryType === 'VIEWSRIGHT' ? 'VR' : c.registryType === 'ISIN' ? 'IS' : c.name.charAt(0)}
                </div>
                {c.verification?.verified && (
                  <div className="absolute -bottom-1 -right-1 border-[1.5px] border-white rounded-full">
                    <MiniSeal seal={c.verification?.seal} size={16} />
                  </div>
                )}
              </div>
              <span className="text-[8px] font-extrabold uppercase w-[68px] text-center px-2 py-1 rounded-lg shrink-0" style={{ color: regColor, backgroundColor: `${regColor}10`, border: `1px solid ${regColor}18` }}>{regLabel}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold truncate group-hover:text-[#00C853] transition-colors">{c.name}</span>
                  {c.verification?.verified && <MiniSeal seal={c.verification?.seal} />}
                </div>
                <div className="text-[10px] text-[#999] truncate">{c.description?.slice(0, 60)}...</div>
              </div>
              <div className="shrink-0 text-right">
                <div className={cn("text-[12px] font-bold font-mono", c.auditScore >= 90 ? "text-[#00C853]" : "text-[#F59E0B]")}>{c.auditScore}/100</div>
                <div className="text-[9px] text-[#bbb]">{c.interactions?.toLocaleString()} txns</div>
              </div>
              <ArrowRight size={12} className="text-[#ccc] group-hover:text-[#00C853] transition-colors shrink-0" />
            </a>
          );
        })}
      </div>
    </div>

    {/* VALIDATORS OVERVIEW */}
    <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
      <div className="h-12 px-5 border-b border-[#e8e8e8] flex items-center justify-between">
        <div className="flex items-center gap-2"><Shield size={14} className="text-[#00C853]" /><span className="text-sm font-bold">Network Validators</span></div>
        <button onClick={() => setTab('validators')} className="text-[11px] text-[#999] hover:text-[#0a0a0a] font-semibold flex items-center gap-1">All Validators <ArrowRight size={11} /></button>
      </div>
      <div className="grid grid-cols-4 lg:grid-cols-8 divide-x divide-[#f3f3f3]">
        {vals.map((v: any, i: number) => (
          <div key={i} className="p-4 text-center hover:bg-[#FAFAFA] transition-colors">
            <div className={cn("w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center text-xs font-bold font-mono", i < 3 ? "bg-[#0a0a0a] text-white" : "bg-[#f3f3f3] text-[#555]")}>{i + 1}</div>
            <div className="text-[11px] font-bold text-[#0a0a0a] truncate">{v.name}</div>
            <div className="text-[9px] text-[#999] mt-0.5">{v.region}</div>
            <div className="text-xs font-bold font-mono text-[#0a0a0a] mt-1">{fNum(v.stake)}</div>
            <div className="text-[9px] text-[#00C853] font-mono">{Number(v.uptime || 0).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
)}

{/* ────────── BLOCKS ─────────────────────────────────── */}
{tab === 'blocks' && (
<div className="p-8 max-w-[1440px] mx-auto">
  <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
    <div className="h-14 px-6 border-b border-[#e8e8e8] flex items-center justify-between">
      <div className="flex items-center gap-3"><Box size={16} className="text-[#00C853]" /><span className="text-sm font-bold">Blocks</span><span className="text-xs text-[#999] font-mono">{blocks.length} loaded</span></div>
      <button onClick={() => fetchAll()} className="flex items-center gap-1.5 text-xs text-[#999] hover:text-[#0a0a0a]"><RefreshCw size={12} /> Refresh</button>
    </div>
    <div className="grid grid-cols-[80px_1fr_220px_80px_90px_80px_60px] gap-3 px-6 py-2.5 bg-[#f7f7f7] text-[9px] font-bold text-[#aaa] uppercase tracking-widest border-b border-[#e8e8e8]">
      <span>Block</span><span>Validator</span><span>Block Hash</span><span>Txns</span><span>Gas</span><span>Reward</span><span>Age</span>
    </div>
    <div className="divide-y divide-[#f5f5f5]">
      {blocks.map((b: any) => (
        <div key={b.index} onClick={() => setSelBlock(b)} className="grid grid-cols-[80px_1fr_220px_80px_90px_80px_60px] gap-3 px-6 py-3 hover:bg-[#FAFAFA] cursor-pointer transition-colors items-center">
          <span className="text-[13px] font-bold font-mono text-[#0a0a0a]">#{b.index}</span>
          <div><div className="text-[13px] font-medium">{b.validatorName}</div><div className="text-[10px] text-[#bbb]"><Addr a={b.validator} /></div></div>
          <div className="flex items-center gap-1"><span className="text-[11px] text-[#888] font-mono truncate">{b.hash?.slice(0, 28)}...</span><Cp t={b.hash || ''} /></div>
          <span className="text-[13px] font-bold font-mono">{b.transactionCount}</span>
          <span className="text-[11px] text-[#888] font-mono">{(Number(b.gasUsed || 0) / 1e6).toFixed(1)}M</span>
          <span className="text-[13px] text-[#00C853] font-mono font-semibold">{Number(b.reward || 0).toFixed(2)}</span>
          <span className="text-[11px] text-[#999] font-mono">{tAgo(b.timestamp)}</span>
        </div>
      ))}
    </div>
  </div>
</div>
)}

{/* ────────── TRANSACTIONS ───────────────────────────── */}
{tab === 'transactions' && (
<div className="p-8 max-w-[1440px] mx-auto">
  <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
    <div className="h-14 px-6 border-b border-[#e8e8e8] flex items-center justify-between">
      <div className="flex items-center gap-3"><ArrowUpRight size={16} className="text-[#00C853]" /><span className="text-sm font-bold">Transactions</span><span className="text-xs text-[#999] font-mono">{txs.length} loaded</span></div>
    </div>
    <div className="grid grid-cols-[220px_100px_80px_1fr_110px_80px] gap-3 px-6 py-2.5 bg-[#f7f7f7] text-[9px] font-bold text-[#aaa] uppercase tracking-widest border-b border-[#e8e8e8]">
      <span>Hash</span><span>ISO Message</span><span>RWA</span><span>Instrument</span><span>Amount</span><span>Status</span>
    </div>
    <div className="divide-y divide-[#f5f5f5]">
      {txs.map((tx: any, i: number) => (
        <div key={`${tx.hash}-${i}`} onClick={() => setSelTx(tx)} className="grid grid-cols-[220px_100px_80px_1fr_110px_80px] gap-3 px-6 py-3 hover:bg-[#FAFAFA] cursor-pointer transition-colors items-center">
          <div className="flex items-center gap-1"><span className="text-[11px] font-mono text-[#555] truncate">{tx.hash?.slice(0, 20)}...</span><Cp t={tx.hash || ''} /></div>
          <Tag>{tx.iso20022?.messageType}</Tag>
          <Tag c={RWA_C[tx.iso20022?.rwaType]}>{tx.iso20022?.rwaType}</Tag>
          <span className="text-[11px] text-[#888] truncate">{tx.iso20022?.instrumentName || '—'}</span>
          <span className="text-[13px] font-bold font-mono">{Number(tx.amount) < 1 ? Number(tx.amount).toFixed(4) : fNum(Number(tx.amount))}</span>
          <div className="flex items-center gap-1.5"><Dot s={tx.status} /><span className="text-[11px] text-[#888]">{tx.status}</span></div>
        </div>
      ))}
    </div>
  </div>
</div>
)}

{/* ────────── REGISTRY (Contracts + ISIN + ViewsRight) ─── */}
{tab === 'registry' && (() => {
  const REG_FILTERS = [
    { id: 'ALL', label: 'All', color: '#0a0a0a', icon: Layers },
    { id: 'CONTRACT', label: 'Contracts', color: '#00C853', icon: Code },
    { id: 'ISIN', label: 'ISIN', color: '#1D4ED8', icon: Hash },
    { id: 'VIEWSRIGHT', label: 'ViewsRight', color: '#7C3AED', icon: Fingerprint },
  ];
  const filtered = regFilter === 'ALL' ? allContracts : allContracts.filter((c: any) => c.registryType === regFilter);
  const searchFiltered = isinQ ? filtered.filter((c: any) => {
    const q = isinQ.toLowerCase();
    return [c.name, c.address, c.description, c.isinContract?.isin, c.isinContract?.tokenSymbol, c.viewsRight?.title, c.viewsRight?.registrationNumber, c.viewsRight?.creatorName].some(f => f?.toLowerCase().includes(q));
  }) : filtered;

  return (
  <div className="p-8 max-w-[1440px] mx-auto space-y-5">
    {/* HEADER */}
    <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6">
      <div className="flex items-start gap-5">
        <div className="w-14 h-14 rounded-2xl border-2 border-[#0a0a0a] flex items-center justify-center shrink-0"><Layers size={22} /></div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">20022Chain Registry</h2>
          <p className="text-sm text-[#888] mt-0.5">Contracts, ISIN Instruments & ViewsRight IP on 20022Chain</p>
          <div className="relative mt-3"><Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bbb]" /><input type="text" placeholder="Search by name, address, ISIN, creator, VR number..." className="w-full max-w-xl bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl pl-10 pr-4 py-3 text-sm text-[#0a0a0a] placeholder:text-[#bbb] focus:border-[#0a0a0a] outline-none transition-colors font-mono" value={isinQ} onChange={e => setIsinQ(e.target.value)} /></div>
        </div>
        <div className="flex gap-6 pt-1 shrink-0">
          <div><div className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest">Total</div><div className="text-3xl font-extrabold font-mono">{allContracts.length}</div></div>
          <div><div className="text-[9px] font-bold text-[#00C853] uppercase tracking-widest">Contracts</div><div className="text-3xl font-extrabold font-mono text-[#00C853]">{allContracts.filter(c => c.registryType === 'CONTRACT').length}</div></div>
          <div><div className="text-[9px] font-bold text-[#1D4ED8] uppercase tracking-widest">ISIN</div><div className="text-3xl font-extrabold font-mono text-[#1D4ED8]">{allContracts.filter(c => c.registryType === 'ISIN').length}</div></div>
          <div><div className="text-[9px] font-bold text-[#7C3AED] uppercase tracking-widest">ViewsRight</div><div className="text-3xl font-extrabold font-mono text-[#7C3AED]">{allContracts.filter(c => c.registryType === 'VIEWSRIGHT').length}</div></div>
        </div>
      </div>
    </div>

    {/* FILTER BUTTONS */}
    <div className="flex items-center gap-2">
      {REG_FILTERS.map(f => {
        const FIcon = f.icon;
        return (
          <button key={f.id} onClick={() => setRegFilter(f.id)} className={cn("flex items-center gap-2 h-10 px-5 rounded-xl text-[12px] font-bold transition-all border", regFilter === f.id ? "text-white shadow-lg" : "text-[#888] border-[#e8e8e8] bg-white hover:bg-[#f5f5f5]")} style={regFilter === f.id ? { backgroundColor: f.color, borderColor: f.color } : undefined}>
            <FIcon size={14} />
            {f.label}
            <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-extrabold", regFilter === f.id ? "bg-white/20" : "bg-[#f3f3f3] text-[#aaa]")}>
              {f.id === 'ALL' ? allContracts.length : allContracts.filter(c => c.registryType === f.id).length}
            </span>
          </button>
        );
      })}
    </div>

    {/* LIST */}
    {searchFiltered.map((c: any) => {
      const open = selRegContract === c.id;
      const regColor = c.registryType === 'ISIN' ? '#1D4ED8' : c.registryType === 'VIEWSRIGHT' ? '#7C3AED' : '#00C853';
      const regLabel = c.registryType === 'ISIN' ? 'ISIN' : c.registryType === 'VIEWSRIGHT' ? 'ViewsRight' : 'Contract';
      return (
        <div key={c.id}>
          <div onClick={() => setSelRegContract(open ? null : c.id)} className={cn("bg-white border rounded-2xl p-5 cursor-pointer transition-all", open ? "shadow-md" : "border-[#e8e8e8] hover:border-[#ccc]")} style={open ? { borderColor: `${regColor}60`, boxShadow: `0 4px 20px ${regColor}10` } : undefined}>
            <div className="flex items-center gap-5">
              {/* LOGO */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[14px] font-extrabold" style={{ backgroundColor: `${regColor}10`, border: `2px solid ${regColor}25`, color: regColor }}>
                  {c.registryType === 'VIEWSRIGHT' ? 'VR' : c.registryType === 'ISIN' ? 'IS' : c.name.charAt(0)}
                </div>
                {c.verification?.verified && (
                  <div className="absolute -bottom-1.5 -right-1.5 border-2 border-white rounded-full">
                    <MiniSeal seal={c.verification?.seal} size={20} />
                  </div>
                )}
              </div>
              <div className="shrink-0 rounded-xl px-4 py-3 text-center min-w-[100px]" style={{ backgroundColor: `${regColor}08`, border: `1.5px solid ${regColor}20` }}>
                <div className="text-[8px] uppercase tracking-widest font-extrabold" style={{ color: regColor }}>{regLabel}</div>
                <div className="text-[13px] font-extrabold font-mono mt-1 text-[#0a0a0a]">
                  {c.isinContract?.isin || c.viewsRight?.registrationNumber || c.type?.toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-bold">{c.name}</span>
                  {c.verification?.verified && <MiniSeal seal={c.verification?.seal} size={16} />}
                  {c.verification?.entityType && (() => {
                    const entConf: Record<string, { icon: any; color: string }> = {
                      MUSICIAN: { icon: Music, color: '#DB2777' }, FILMMAKER: { icon: Film, color: '#EF4444' },
                      GOVERNMENT: { icon: Shield, color: '#D4A017' }, INSTITUTION: { icon: Building2, color: '#6B7280' },
                      MINER: { icon: Mountain, color: '#92700a' }, DEVELOPER: { icon: Cpu, color: '#059669' },
                      INFLUENCER: { icon: Zap, color: '#F59E0B' }, SCIENTIST: { icon: Layers, color: '#1D4ED8' },
                    };
                    const ec = entConf[c.verification.entityType];
                    if (!ec) return null;
                    const EIcon = ec.icon;
                    return <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ color: ec.color, backgroundColor: `${ec.color}10` }}><EIcon size={8} /> {c.verification.entityCategory || c.verification.entityType}</span>;
                  })()}
                  {c.rwaDetail && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded text-[#888] bg-[#f3f3f3]">{c.rwaDetail.rwaSubType}</span>}
                  {c.viewsRight && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded text-[#7C3AED] bg-[#7C3AED]/10">{c.viewsRight.workType}</span>}
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[#00C853]/10 text-[#00C853]">{c.status}</span>
                </div>
                <div className="text-[12px] text-[#888] truncate">{c.description?.slice(0, 80)}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className={cn("text-[14px] font-extrabold font-mono", c.auditScore >= 90 ? "text-[#00C853]" : "text-[#F59E0B]")}>{c.auditScore}/100</div>
                <div className="text-[10px] text-[#999]">{c.interactions?.toLocaleString()} interactions</div>
              </div>
              <ChevronDown size={16} className={cn("shrink-0 text-[#ccc] transition-transform", open && "rotate-180")} style={open ? { color: regColor } : undefined} />
            </div>
          </div>
          <AnimatePresence>{open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="border border-t-0 border-[#e8e8e8] rounded-b-2xl px-6 py-5 bg-[#f7f7f7] space-y-4">
                <p className="text-sm text-[#555] leading-relaxed">{c.description}</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { l: 'Block', v: `#${c.deployBlock}` },
                    { l: 'Gas Used', v: c.gasUsed?.toLocaleString() },
                    { l: 'Balance', v: `${fNum(c.balance)} ARCHT` },
                    { l: 'Audit', v: `${c.auditScore}/100` },
                  ].map(x => (
                    <div key={x.l} className="bg-white border border-[#e8e8e8] rounded-xl p-4"><div className="text-[8px] text-[#aaa] uppercase tracking-widest font-bold">{x.l}</div><div className="text-lg font-extrabold font-mono mt-1">{x.v}</div></div>
                  ))}
                </div>
                {c.isinContract && (
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { l: 'ISIN', v: c.isinContract.isin },
                      { l: 'Token', v: `${c.isinContract.tokenSymbol}` },
                      { l: 'Holders', v: fNum(c.isinContract.holders) },
                      { l: 'Market Cap', v: `$${fNum(c.isinContract.marketCap)}` },
                    ].map(x => (
                      <div key={x.l} className="bg-[#1D4ED8]/5 border border-[#1D4ED8]/15 rounded-xl p-4"><div className="text-[8px] text-[#1D4ED8] uppercase tracking-widest font-bold">{x.l}</div><div className="text-lg font-extrabold font-mono mt-1">{x.v}</div></div>
                    ))}
                  </div>
                )}
                {c.viewsRight && (
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { l: 'Creator', v: c.viewsRight.creatorName },
                      { l: 'Work Type', v: c.viewsRight.workType },
                      { l: 'Royalty Rate', v: `${c.viewsRight.royaltyRate}%` },
                      { l: 'Estimated Value', v: `$${fNum(c.viewsRight.estimatedValue)}` },
                    ].map(x => (
                      <div key={x.l} className="bg-[#7C3AED]/5 border border-[#7C3AED]/15 rounded-xl p-4"><div className="text-[8px] text-[#7C3AED] uppercase tracking-widest font-bold">{x.l}</div><div className="text-lg font-extrabold font-mono mt-1">{x.v}</div></div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-[12px]">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-[#eee]"><span className="text-[#999]">Address</span><div className="flex items-center gap-1"><Addr a={c.address} /><Cp t={c.address} /></div></div>
                    <div className="flex justify-between items-center py-2 border-b border-[#eee]"><span className="text-[#999]">Owner</span><div className="flex items-center gap-1"><Addr a={c.owner} /></div></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-[#eee]"><span className="text-[#999]">Tx Hash</span><div className="flex items-center gap-1"><Addr a={c.deployTxHash} /></div></div>
                    <div className="flex justify-between items-center py-2 border-b border-[#eee]"><span className="text-[#999]">Deployed</span><span className="text-[#333] font-semibold">{new Date(c.deployedAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
                <a href={`/contracts/view/${encodeURIComponent(c.address)}`} className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-white text-[12px] font-bold hover:opacity-90 transition-all" style={{ backgroundColor: regColor }}>
                  <Eye size={14} /> View Full Contract Page <ArrowRight size={12} />
                </a>
              </div>
            </motion.div>
          )}</AnimatePresence>
        </div>
      );
    })}
  </div>
  );
})()}

{/* ────────── VALIDATORS ─────────────────────────────── */}
{tab === 'validators' && (
<div className="p-8 max-w-[1440px] mx-auto space-y-5">
  <div className="grid grid-cols-3 gap-5">
    {[
      { l: 'Active Validators', v: `${vals.filter((v: any) => v.isActive).length} / 8`, accent: true },
      { l: 'Total Staked', v: `${fNum(vals.reduce((s: number, v: any) => s + v.stake, 0))} ARCHT` },
      { l: 'Average Uptime', v: `${(vals.reduce((s: number, v: any) => s + v.uptime, 0) / Math.max(vals.length, 1)).toFixed(2)}%` },
    ].map(s => (
      <div key={s.l} className="bg-white border border-[#e8e8e8] rounded-2xl p-6"><div className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest mb-2">{s.l}</div><div className={cn("text-3xl font-extrabold font-mono", s.accent ? "text-[#00C853]" : "text-[#0a0a0a]")}>{s.v}</div></div>
    ))}
  </div>
  <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
    <div className="grid grid-cols-[50px_1fr_200px_130px_110px_160px] gap-3 px-6 py-3 bg-[#f7f7f7] text-[9px] font-bold text-[#aaa] uppercase tracking-widest border-b border-[#e8e8e8]">
      <span>#</span><span>Validator</span><span>Address</span><span>Stake</span><span>Blocks</span><span>Uptime</span>
    </div>
    <div className="divide-y divide-[#f5f5f5]">
      {vals.map((v: any, i: number) => (
        <div key={i} className="grid grid-cols-[50px_1fr_200px_130px_110px_160px] gap-3 px-6 py-4 hover:bg-[#FAFAFA] transition-colors items-center">
          <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold font-mono", i < 3 ? "bg-[#0a0a0a] text-white" : "bg-[#f3f3f3] text-[#555]")}>{i + 1}</span>
          <div>
            <div className="text-[13px] font-bold">{v.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.isActive ? '#00C853' : '#ccc' }} /><span className="text-[10px] text-[#999]">{v.region}</span></div>
          </div>
          <div className="flex items-center gap-1"><Addr a={v.address} /><Cp t={v.address || ''} /></div>
          <div><span className="text-[13px] font-bold font-mono">{fNum(v.stake)}</span><span className="text-[10px] text-[#999] ml-1">ARCHT</span></div>
          <span className="text-[13px] font-mono text-[#555]">{v.blocksProduced?.toLocaleString()}</span>
          <div className="flex items-center gap-2"><div className="flex-1 h-2 bg-[#f0f0f0] rounded-full overflow-hidden"><div className="h-full bg-[#00C853] rounded-full bar-grow" style={{ width: `${v.uptime}%` }} /></div><span className="text-[12px] font-mono text-[#00C853] font-bold w-14 text-right">{Number(v.uptime || 0).toFixed(1)}%</span></div>
        </div>
      ))}
    </div>
  </div>
</div>
)}

{/* ────────── DATA / STATS ───────────────────────────── */}
{tab === 'stats' && (
<div className="p-8 max-w-[1440px] mx-auto space-y-5">
  <h2 className="text-lg font-bold">Network Data & Analytics</h2>

  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[
      { l: 'Total Supply', v: '100,000,000 ARCHT', icon: Database },
      { l: 'Unique Accounts', v: fNum(netStats?.uniqueAccounts || 0), icon: Users },
      { l: 'Pending Transactions', v: String(netStats?.pendingTxCount || 0), icon: Clock },
      { l: 'Block Reward', v: '2.50 ARCHT', icon: Zap },
    ].map(s => (
      <div key={s.l} className="bg-white border border-[#e8e8e8] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          {/* dynamic icon */}
          <s.icon size={14} className="text-[#bbb]" />
          <span className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest">{s.l}</span>
        </div>
        <div className="text-xl font-extrabold font-mono">{s.v}</div>
      </div>
    ))}
  </div>

  {/* TX Volume Chart */}
  <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6">
    <div className="text-sm font-bold mb-1">Transaction Volume Per Block</div>
    <div className="text-xs text-[#999] mb-4">Last 20 blocks · Real-time data from 20022Chain node</div>
    <MiniChart data={txVolChart} h={80} />
    <div className="flex justify-between mt-2 text-[9px] text-[#bbb] font-mono">
      <span>Block #{netStats?.txVolume?.[netStats.txVolume.length - 1]?.block}</span>
      <span>Block #{netStats?.txVolume?.[0]?.block}</span>
    </div>
  </div>

  <div className="grid grid-cols-2 gap-5">
    {/* ISO Distribution */}
    <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6">
      <div className="text-sm font-bold mb-4">ISO 20022 Message Distribution</div>
      <div className="space-y-2.5">
        {Object.entries(netStats?.isoDistribution || {}).sort((a: any, b: any) => b[1] - a[1]).map(([type, count]: any) => {
          const max = Math.max(...Object.values(netStats?.isoDistribution || {}).map(Number));
          return (
            <div key={type} className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#555] w-20 shrink-0">{type}</span>
              <div className="flex-1 h-5 bg-[#f3f3f3] rounded overflow-hidden"><div className="h-full bg-[#0a0a0a] rounded bar-grow" style={{ width: `${(count / max) * 100}%` }} /></div>
              <span className="text-[11px] font-bold font-mono w-10 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
    {/* RWA Distribution */}
    <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6">
      <div className="text-sm font-bold mb-4">RWA Type Distribution</div>
      <div className="space-y-2.5">
        {Object.entries(netStats?.rwaDistribution || {}).sort((a: any, b: any) => b[1] - a[1]).map(([type, count]: any) => {
          const max = Math.max(...Object.values(netStats?.rwaDistribution || {}).map(Number));
          const color = RWA_C[type] || '#555';
          return (
            <div key={type} className="flex items-center gap-3">
              <span className="text-[11px] font-semibold w-24 shrink-0" style={{ color }}>{RWA_L[type] || type}</span>
              <div className="flex-1 h-5 bg-[#f3f3f3] rounded overflow-hidden"><div className="h-full rounded bar-grow" style={{ width: `${(count / max) * 100}%`, backgroundColor: color }} /></div>
              <span className="text-[11px] font-bold font-mono w-10 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>

  {/* Top Accounts */}
  <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
    <div className="h-12 px-5 border-b border-[#e8e8e8] flex items-center gap-2"><Wallet size={14} className="text-[#00C853]" /><span className="text-sm font-bold">Top Accounts by Balance</span></div>
    <div className="divide-y divide-[#f5f5f5]">
      {(netStats?.topAccounts || []).map((a: any, i: number) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-[#FAFAFA] transition-colors">
          <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono", i < 3 ? "bg-[#0a0a0a] text-white" : "bg-[#f3f3f3] text-[#555]")}>{i + 1}</span>
          <div className="flex-1 flex items-center gap-1"><Addr a={a.address} /><Cp t={a.address} /></div>
          <span className="text-[14px] font-bold font-mono">{fNum(a.balance)} <span className="text-[11px] font-normal text-[#999]">ARCHT</span></span>
        </div>
      ))}
    </div>
  </div>
</div>
)}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* ══════ MODALS ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {selBlock && (
          <motion.div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/10 backdrop-blur-sm p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelBlock(null)}>
            <motion.div className="w-full max-w-2xl bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden shadow-2xl" initial={{ scale: .96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .96, y: 8 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="h-14 px-6 border-b border-[#e8e8e8] flex items-center justify-between bg-[#f7f7f7]">
                <div className="flex items-center gap-3"><Box size={16} className="text-[#00C853]" /><span className="text-sm font-bold">Block #{selBlock.index?.toLocaleString()}</span><span className="text-[10px] text-[#999] font-mono">{tAgo(selBlock.timestamp)}</span></div>
                <button onClick={() => setSelBlock(null)} className="w-8 h-8 rounded-lg hover:bg-[#eee] flex items-center justify-center" aria-label="Close"><X size={16} className="text-[#999]" /></button>
              </div>
              <div className="p-6 space-y-0">
                {/* Block hashes */}
                {[
                  { l: 'Block Hash', v: selBlock.hash },
                  { l: 'Previous Hash', v: selBlock.previousHash },
                  { l: 'Merkle Root', v: selBlock.merkleRoot },
                ].map(r => (
                  <div key={r.l} className="flex justify-between items-center py-3 border-b border-[#f0f0f0]">
                    <span className="text-xs text-[#999] font-semibold uppercase tracking-wider w-36 shrink-0">{r.l}</span>
                    <span className="text-[11px] text-[#0a0a0a] font-mono flex items-center gap-1"><span className="truncate max-w-[340px]">{r.v}</span><Cp t={String(r.v)} /></span>
                  </div>
                ))}
                {/* Validator — native address */}
                <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0]">
                  <span className="text-xs text-[#999] font-semibold uppercase tracking-wider w-36 shrink-0">Validator</span>
                  <span className="text-[13px] text-[#0a0a0a]">{selBlock.validatorName}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0]">
                  <span className="text-xs text-[#999] font-semibold uppercase tracking-wider w-36 shrink-0">Validator Addr</span>
                  <div className="flex items-center gap-1"><Addr a={selBlock.validator} full /><Cp t={selBlock.validator || ''} /></div>
                </div>
                {/* Other fields */}
                {[
                  { l: 'Transactions', v: String(selBlock.transactionCount) },
                  { l: 'Gas Used', v: `${(Number(selBlock.gasUsed || 0) / 1e6).toFixed(2)}M / ${(Number(selBlock.gasLimit || 0) / 1e6)}M` },
                  { l: 'Reward', v: `${Number(selBlock.reward || 0).toFixed(4)} ARCHT` },
                  { l: 'Stake', v: `${fNum(selBlock.stakeAmount || 0)} ARCHT` },
                  { l: 'Timestamp', v: new Date(selBlock.timestamp).toUTCString() },
                ].map(r => (
                  <div key={r.l} className="flex justify-between items-center py-3 border-b border-[#f0f0f0] last:border-0">
                    <span className="text-xs text-[#999] font-semibold uppercase tracking-wider w-36 shrink-0">{r.l}</span>
                    <span className="text-[13px] text-[#0a0a0a] font-mono text-[11px]">{r.v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selTx && (
          <motion.div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/10 backdrop-blur-sm p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelTx(null)}>
            <motion.div className="w-full max-w-2xl bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden shadow-2xl" initial={{ scale: .96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .96, y: 8 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="h-14 px-6 border-b border-[#e8e8e8] flex items-center justify-between bg-[#f7f7f7]">
                <div className="flex items-center gap-3"><ArrowUpRight size={16} className="text-[#00C853]" /><span className="text-sm font-bold">Transaction</span><Dot s={selTx.status} /><span className="text-xs text-[#555] capitalize">{selTx.status}</span></div>
                <button onClick={() => setSelTx(null)} className="w-8 h-8 rounded-lg hover:bg-[#eee] flex items-center justify-center" aria-label="Close"><X size={16} className="text-[#999]" /></button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5 p-4 bg-[#f7f7f7] rounded-xl border border-[#e8e8e8]">
                  <div className="w-10 h-10 rounded-xl border-2 border-[#0a0a0a] flex items-center justify-center"><FileText size={16} /></div>
                  <div><div className="flex items-center gap-2"><Tag>{selTx.iso20022?.messageType}</Tag><Tag c={RWA_C[selTx.iso20022?.rwaType]}>{selTx.iso20022?.rwaType}</Tag></div><div className="text-sm text-[#888] mt-1">{ISO_NAMES[selTx.iso20022?.messageType]} · {selTx.iso20022?.instrumentName || 'N/A'}</div></div>
                  <div className="ml-auto text-right"><div className="text-2xl font-extrabold font-mono">{Number(selTx.amount) < 1 ? Number(selTx.amount).toFixed(4) : fNum(Number(selTx.amount))}</div><div className="text-xs text-[#999]">ARCHT</div></div>
                </div>
                {/* Tx Hash */}
                <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0]">
                  <span className="text-xs text-[#999] font-semibold uppercase tracking-wider w-32 shrink-0">Tx Hash</span>
                  <span className="font-mono text-[11px] text-[#0a0a0a] flex items-center gap-1"><span className="truncate max-w-[360px]">{selTx.hash}</span><Cp t={selTx.hash || ''} /></span>
                </div>
                {/* From — native address */}
                <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0]">
                  <span className="text-xs text-[#999] font-semibold uppercase tracking-wider w-32 shrink-0">From</span>
                  <div className="flex items-center gap-1"><Addr a={selTx.from} full /><Cp t={selTx.from || ''} /></div>
                </div>
                {/* To — native address */}
                <div className="flex justify-between items-center py-3 border-b border-[#f0f0f0]">
                  <span className="text-xs text-[#999] font-semibold uppercase tracking-wider w-32 shrink-0">To</span>
                  <div className="flex items-center gap-1"><Addr a={selTx.to} full /><Cp t={selTx.to || ''} /></div>
                </div>
                {/* Other fields */}
                {[
                  { l: 'Fee', v: `${Number(selTx.fee || 0).toFixed(6)} ARCHT` },
                  { l: 'ISIN', v: selTx.iso20022?.isin || '—' },
                  { l: 'LEI', v: selTx.iso20022?.lei || '—' },
                  { l: 'Jurisdiction', v: selTx.iso20022?.jurisdiction || '—' },
                  { l: 'Nonce', v: String(selTx.nonce) },
                  { l: 'Timestamp', v: new Date(selTx.timestamp).toUTCString() },
                ].map(r => (
                  <div key={r.l} className="flex justify-between items-center py-3 border-b border-[#f0f0f0] last:border-0">
                    <span className="text-xs text-[#999] font-semibold uppercase tracking-wider w-32 shrink-0">{r.l}</span>
                    <span className="font-mono text-[11px] text-[#0a0a0a] flex items-center gap-1"><span className="truncate max-w-[360px]">{r.v}</span>{String(r.v).length > 15 && r.v !== '—' && <Cp t={String(r.v)} />}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ FOOTER ═══════════════════════════════════════════ */}
      <footer className="h-9 border-t border-[#e8e8e8] bg-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3 text-[10px] text-[#aaa] font-mono">
          <span className="font-bold text-[#0a0a0a] tracking-wider">20022CHAIN</span>
          <span>v1.0</span><div className="w-px h-3 bg-[#e8e8e8]" />
          <span>ISO 20022</span><div className="w-px h-3 bg-[#e8e8e8]" />
          <span>PoS</span><div className="w-px h-3 bg-[#e8e8e8]" />
          <span>6s Finality</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-[#00C853] live-dot" /><span className="text-[#00C853] font-bold font-mono">VALID</span><span className="text-[#bbb] font-mono">· {S.totalBlocks?.toLocaleString()} blocks</span></div>
      </footer>
    </div>
  );
}
