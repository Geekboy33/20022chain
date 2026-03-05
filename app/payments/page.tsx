'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, ArrowLeft, ArrowRight, ArrowLeftRight, Wallet, Shield, Code,
  Globe, Activity, Clock, Hash, Layers, DollarSign, Building2, Landmark,
  CreditCard, Send, Search, RefreshCw, Copy, Check, CheckCircle2,
  AlertTriangle, Lock, Loader2, ExternalLink, BadgeCheck, FileText,
  ChevronRight, ArrowUpRight, ArrowDownLeft, Eye, EyeOff, Zap,
  Server, Key, Terminal, Banknote, CircleDollarSign, TrendingUp,
  ShieldCheck, Radio, Plus, X, BookOpen,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════ */
interface Currency {
  iso4217: string; name: string; symbol: string; contractName: string;
  contractAddress: string; category: string; country: string; decimals: number;
  totalSupply: number; circulatingSupply: number; reserveBacked: boolean;
  isActive: boolean; exchangeRateUSD: number; lastRateUpdate: number;
  dailyVolume: number; totalTransactions: number; logo: string;
  swiftCode?: string; ibanPrefix?: string;
}
interface Entity {
  id: string; name: string; legalName: string; type: string;
  swiftBIC: string; lei: string; country: string; jurisdiction: string;
  regulatoryBody: string; verificationLevel: string;
  allowedCurrencies: string[]; dailyLimit: number; monthlyVolume: number;
  totalTransactions: number; complianceScore: number; amlRating: string;
  walletAddress: string; createdAt: number; lastActivity: number;
  logo?: string; correspondentBanks: string[]; supportedRails: string[];
  apiKeys: { id: string; label: string; permissions: string[]; isActive: boolean }[];
}
interface Payment {
  id: string; messageType: string; status: string;
  senderBIC: string; senderName: string; receiverBIC: string; receiverName: string;
  currency: string; amount: number; fee: number;
  remittanceInfo: string; txHash?: string; blockNumber?: number;
  amlStatus: string; priority: string; chargeType: string;
  createdAt: number; completedAt?: number; settledAt?: number;
}
interface Stats {
  totalEntities: number; certifiedBanks: number; certifiedFintechs: number;
  totalCurrencies: number; activeCurrencies: number; totalTransactions: number;
  last24hTransactions: number; last24hVolume: number; totalVolumeUSD: number;
  avgSettlementTime: number; successRate: number; activeAPIKeys: number;
  pendingPayments: number; topCurrencyPairs: { from: string; to: string; volume: number }[];
}

type Tab = 'dashboard' | 'currencies' | 'entities' | 'payments' | 'api';

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */
const fmt = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(2)}`;
};
const shortAddr = (s: string) => s.length > 20 ? s.slice(0, 10) + '...' + s.slice(-8) : s;

const STATUS_CFG: Record<string, { color: string; bg: string; icon: any }> = {
  COMPLETED:       { color: '#00C853', bg: '#00C85308', icon: CheckCircle2 },
  SETTLED:         { color: '#1D4ED8', bg: '#1D4ED808', icon: BadgeCheck },
  PROCESSING:      { color: '#D97706', bg: '#D9770608', icon: Loader2 },
  COMPLIANCE_CHECK:{ color: '#7C3AED', bg: '#7C3AED08', icon: ShieldCheck },
  AML_SCREENING:   { color: '#DC2626', bg: '#DC262608', icon: Shield },
  INITIATED:       { color: '#555',    bg: '#55555508', icon: Zap },
  PENDING_APPROVAL:{ color: '#0891B2', bg: '#0891B208', icon: Clock },
  FAILED:          { color: '#EF4444', bg: '#EF444408', icon: AlertTriangle },
  RETURNED:        { color: '#EF4444', bg: '#EF444408', icon: ArrowDownLeft },
  SANCTIONED:      { color: '#DC2626', bg: '#DC262608', icon: Lock },
};

const ENTITY_ICONS: Record<string, any> = {
  BANK: Landmark, FINTECH: CreditCard, CENTRAL_BANK: Building2,
  PAYMENT_PROCESSOR: Server, NEOBANK: Wallet, EXCHANGE: ArrowLeftRight,
};

const CAT_COLORS: Record<string, string> = {
  FIAT_MAJOR: '#00C853', FIAT_MINOR: '#1D4ED8', FIAT_EXOTIC: '#D97706',
  STABLECOIN: '#0891B2', CBDC: '#7C3AED', COMMODITY_BACKED: '#B45309',
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [copied, setCopied] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [catFilter, setCatFilter] = useState<string>('');
  const [searchQ, setSearchQ] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [sR, cR, eR, pR] = await Promise.all([
        fetch('/api/swift?action=overview'),
        fetch('/api/swift?action=currencies'),
        fetch('/api/swift?action=entities'),
        fetch('/api/swift?action=payments&limit=50'),
      ]);
      const [sD, cD, eD, pD] = await Promise.all([sR.json(), cR.json(), eR.json(), pR.json()]);
      if (sD.success) setStats(sD.stats);
      if (cD.success) setCurrencies(cD.currencies);
      if (eD.success) setEntities(eD.entities);
      if (pD.success) setPayments(pD.payments);
    } catch (e) { console.error('Fetch error:', e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 15000); return () => clearInterval(iv); }, [fetchData]);

  const cpy = (s: string) => { navigator.clipboard.writeText(s); setCopied(s); setTimeout(() => setCopied(''), 2000); };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center"><Loader2 size={28} className="animate-spin text-[#00C853] mx-auto mb-3" /><p className="text-[11px] text-[#aaa] font-mono">Loading Payment Network...</p></div>
    </div>
  );

  const filteredCurrencies = currencies.filter(c => {
    if (catFilter && c.category !== catFilter) return false;
    if (searchQ && !c.name.toLowerCase().includes(searchQ.toLowerCase()) && !c.iso4217.toLowerCase().includes(searchQ.toLowerCase()) && !c.contractName.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-screen flex flex-col bg-white text-[#0a0a0a] overflow-hidden">
      <style>{`
        .live-dot { animation: pulse-dot 2s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        .fade-up { animation: fadeUp .4s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .bar-grow { animation: barGrow .6s ease both; }
        @keyframes barGrow { from { height: 0; } }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header className="border-b border-[#e8e8e8] bg-white shrink-0 z-50">
        <div className="h-14 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-xl border-[1.5px] border-[#0a0a0a] flex items-center justify-center relative">
                <Banknote size={14} className="text-[#0a0a0a]" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00C853] border-[1.5px] border-white live-dot" />
              </div>
              <div>
                <h1 className="text-[13px] font-extrabold text-[#0a0a0a] tracking-[.15em] uppercase leading-none">20022Chain</h1>
                <p className="text-[8px] text-[#aaa] font-mono mt-0.5 tracking-widest">Gpay3 PAYMENT NETWORK</p>
              </div>
            </Link>
            <div className="w-px h-6 bg-[#e8e8e8]" />
            <nav className="flex items-center gap-1">
              {([
                { id: 'dashboard' as Tab, label: 'Dashboard', icon: Activity },
                { id: 'currencies' as Tab, label: 'Currencies', icon: CircleDollarSign },
                { id: 'entities' as Tab, label: 'Entities', icon: Building2 },
                { id: 'payments' as Tab, label: 'Payments', icon: Send },
                { id: 'api' as Tab, label: 'API', icon: Terminal },
              ]).map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setSelectedEntity(null); setSelectedCurrency(null); }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${tab === t.id ? 'bg-[#0a0a0a] text-white' : 'text-[#888] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]'}`}>
                  <t.icon size={12} /> {t.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="btn-outline"><ArrowLeft size={12} /> Explorer</a>
            <a href="/wallets" className="btn-outline"><Wallet size={12} /> Wallets</a>
            <a href="/bridge" className="btn-outline"><ArrowLeftRight size={12} /> Bridge</a>
            <a href="/reserves" className="btn-outline"><Shield size={12} /> PoR</a>
            <a href="/contracts" className="btn-outline"><Code size={12} /> Contracts</a>
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 overflow-y-auto bg-[#FAFAFA]">
        <div className="max-w-[1440px] mx-auto px-8 py-6">

          <AnimatePresence mode="wait">

            {/* ═══════════════════════════════ DASHBOARD ═══════════════════════════════ */}
            {tab === 'dashboard' && stats && (
              <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {[
                    { label: 'Total Volume', value: fmt(stats.totalVolumeUSD), icon: DollarSign, accent: true },
                    { label: '24h Volume', value: fmt(stats.last24hVolume), icon: TrendingUp },
                    { label: 'Certified Banks', value: stats.certifiedBanks.toString(), icon: Landmark },
                    { label: 'Certified Fintechs', value: stats.certifiedFintechs.toString(), icon: CreditCard },
                    { label: 'Active Currencies', value: `${stats.activeCurrencies}/${stats.totalCurrencies}`, icon: CircleDollarSign },
                    { label: 'Avg Settlement', value: `${stats.avgSettlementTime}s`, icon: Zap, accent: true },
                    { label: 'Total Payments', value: stats.totalTransactions.toLocaleString(), icon: Send },
                    { label: '24h Payments', value: stats.last24hTransactions.toLocaleString(), icon: Activity },
                    { label: 'Success Rate', value: `${stats.successRate}%`, icon: CheckCircle2 },
                    { label: 'Active API Keys', value: stats.activeAPIKeys.toString(), icon: Key },
                    { label: 'Pending', value: stats.pendingPayments.toString(), icon: Clock },
                    { label: 'Total Entities', value: stats.totalEntities.toString(), icon: Building2 },
                  ].map((s, i) => (
                    <div key={s.label} className="card p-4 fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                      <div className="flex items-center justify-between mb-2">
                        <s.icon size={14} className="text-[#bbb]" />
                        <span className="text-[8px] font-bold text-[#bbb] uppercase tracking-widest">{s.label}</span>
                      </div>
                      <div className={`text-lg font-extrabold font-mono tracking-tight ${s.accent ? 'text-[#00C853]' : 'text-[#0a0a0a]'}`}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Two Columns: Top Pairs + Recent Payments */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
                  {/* Top Currency Pairs */}
                  <div className="card p-6">
                    <h2 className="text-sm font-bold text-[#0a0a0a] mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-[#00C853]" /> Top Currency Pairs</h2>
                    <div className="space-y-3">
                      {stats.topCurrencyPairs.map((p, i) => {
                        const maxVol = stats.topCurrencyPairs[0]?.volume || 1;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-[11px] font-mono font-bold text-[#0a0a0a] w-24">{p.from} → {p.to}</span>
                            <div className="flex-1 bg-[#f3f3f3] rounded-full h-6 relative overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#00C85320] to-[#00C85340] bar-grow" style={{ width: `${(p.volume / maxVol) * 100}%`, animationDelay: `${i * 100}ms` }} />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-[#555]">{fmt(p.volume)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Payments */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold text-[#0a0a0a] flex items-center gap-2"><Send size={15} className="text-[#00C853]" /> Recent Payments</h2>
                      <button onClick={() => setTab('payments')} className="text-[10px] text-[#00C853] font-bold flex items-center gap-1 hover:underline">View All <ChevronRight size={12} /></button>
                    </div>
                    <div className="space-y-2">
                      {payments.slice(0, 6).map(p => {
                        const sc = STATUS_CFG[p.status] || STATUS_CFG.INITIATED;
                        return (
                          <div key={p.id} className="flex items-center gap-3 p-3 bg-[#FAFAFA] rounded-xl border border-[#e8e8e8] hover:border-[#ccc] transition">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${sc.color}10`, border: `1px solid ${sc.color}18` }}>
                              <sc.icon size={14} style={{ color: sc.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="font-bold text-[#0a0a0a]">{p.senderBIC}</span>
                                <ArrowRight size={10} className="text-[#ccc]" />
                                <span className="font-bold text-[#0a0a0a]">{p.receiverBIC}</span>
                                <span className="text-[9px] text-[#aaa] font-mono ml-1">{p.messageType}</span>
                              </div>
                              <p className="text-[10px] text-[#888] truncate">{p.remittanceInfo}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[12px] font-bold font-mono text-[#0a0a0a]">{p.amount.toLocaleString()} <span className="text-[10px] text-[#999]">{p.currency}</span></p>
                              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: sc.color, background: sc.bg }}>{p.status.replace('_', ' ')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ISO 20022 Message Types */}
                <div className="card p-6">
                  <h2 className="text-sm font-bold text-[#0a0a0a] mb-4 flex items-center gap-2"><FileText size={15} className="text-[#00C853]" /> Supported ISO 20022 Message Types</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { code: 'pacs.008', name: 'FI-to-FI Customer Credit Transfer', cat: 'Payment' },
                      { code: 'pacs.009', name: 'FI-to-FI Institution Credit Transfer', cat: 'Payment' },
                      { code: 'pacs.002', name: 'Payment Status Report', cat: 'Status' },
                      { code: 'pacs.004', name: 'Payment Return', cat: 'Payment' },
                      { code: 'pain.001', name: 'Customer Credit Transfer Initiation', cat: 'Initiation' },
                      { code: 'camt.053', name: 'Bank-to-Customer Statement', cat: 'Reporting' },
                      { code: 'camt.054', name: 'Credit/Debit Notification', cat: 'Reporting' },
                      { code: 'sepa.sct', name: 'SEPA Credit Transfer', cat: 'SEPA' },
                      { code: 'sepa.sdd', name: 'SEPA Direct Debit', cat: 'SEPA' },
                      { code: 'swift.mt103', name: 'SWIFT Customer Transfer', cat: 'SWIFT' },
                      { code: 'swift.mt202', name: 'SWIFT Bank Transfer', cat: 'SWIFT' },
                      { code: 'swift.gpi', name: 'SWIFT GPI Tracker', cat: 'SWIFT' },
                    ].map(m => (
                      <div key={m.code} className="border border-[#e8e8e8] rounded-xl p-3 bg-white hover:border-[#ccc] transition">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-bold font-mono text-[#00C853]">{m.code}</span>
                          <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#f3f3f3] text-[#888]">{m.cat}</span>
                        </div>
                        <p className="text-[10px] text-[#888] leading-relaxed">{m.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════ CURRENCIES ═══════════════════════════════ */}
            {tab === 'currencies' && (
              <motion.div key="cur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {selectedCurrency ? (
                  /* ── Currency Detail ── */
                  <div>
                    <button onClick={() => setSelectedCurrency(null)} className="flex items-center gap-1.5 text-[11px] text-[#888] hover:text-[#00C853] font-semibold mb-4 transition"><ArrowLeft size={12} /> Back to currencies</button>
                    <div className="card p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA] border-2 border-[#e8e8e8] flex items-center justify-center text-2xl">{selectedCurrency.logo}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[#0a0a0a]">{selectedCurrency.contractName}</h2>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: CAT_COLORS[selectedCurrency.category] || '#888', background: `${CAT_COLORS[selectedCurrency.category] || '#888'}08`, border: `1px solid ${CAT_COLORS[selectedCurrency.category] || '#888'}18` }}>{selectedCurrency.category.replace('_', ' ')}</span>
                            {selectedCurrency.reserveBacked && <span className="text-[9px] text-[#00C853] font-bold flex items-center gap-1"><ShieldCheck size={11} /> PoR Backed</span>}
                          </div>
                          <p className="text-[11px] text-[#999] font-mono mt-1">{selectedCurrency.name} ({selectedCurrency.iso4217}) · {selectedCurrency.country}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-extrabold font-mono text-[#0a0a0a]">{selectedCurrency.symbol}{selectedCurrency.exchangeRateUSD < 1 ? (1 / selectedCurrency.exchangeRateUSD).toFixed(2) : selectedCurrency.exchangeRateUSD.toFixed(4)}</p>
                          <p className="text-[10px] text-[#999]">{selectedCurrency.exchangeRateUSD >= 1 ? `1 ${selectedCurrency.iso4217} = $${selectedCurrency.exchangeRateUSD.toFixed(4)} USD` : `$1 USD = ${(1 / selectedCurrency.exchangeRateUSD).toFixed(2)} ${selectedCurrency.iso4217}`}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                          { label: 'Total Supply', value: selectedCurrency.totalSupply.toLocaleString(), color: '#0a0a0a' },
                          { label: 'Circulating', value: selectedCurrency.circulatingSupply.toLocaleString(), color: '#1D4ED8' },
                          { label: '24h Volume', value: fmt(selectedCurrency.dailyVolume), color: '#00C853' },
                          { label: 'Transactions', value: selectedCurrency.totalTransactions.toLocaleString(), color: '#D97706' },
                        ].map(m => (
                          <div key={m.label} className="bg-[#FAFAFA] border border-[#e8e8e8] rounded-xl p-4">
                            <span className="text-[9px] text-[#aaa] uppercase tracking-widest font-bold">{m.label}</span>
                            <p className="text-lg font-extrabold font-mono mt-1" style={{ color: m.color }}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        {[
                          { l: 'Contract Address', v: shortAddr(selectedCurrency.contractAddress) },
                          { l: 'Decimals', v: selectedCurrency.decimals.toString() },
                          { l: 'SWIFT Code', v: selectedCurrency.swiftCode || '—' },
                          { l: 'IBAN Prefix', v: selectedCurrency.ibanPrefix || '—' },
                        ].map(x => (
                          <div key={x.l} className="flex justify-between p-3 bg-[#FAFAFA] rounded-lg border border-[#e8e8e8]">
                            <span className="text-[#999]">{x.l}</span>
                            <span className="font-mono font-semibold text-[#0a0a0a]">{x.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Currency List ── */
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-[#0a0a0a] flex items-center gap-2"><CircleDollarSign size={15} className="text-[#00C853]" /> Tokenized Currencies <span className="text-[10px] text-[#999] font-mono ml-2">{filteredCurrencies.length} currencies</span></h2>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#ccc]" />
                          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search..." className="input-field h-8 pl-7 pr-3 text-[10px] w-48" />
                        </div>
                        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} aria-label="Category filter" className="input-field h-8 text-[10px] w-40">
                          <option value="">All Categories</option>
                          {Object.keys(CAT_COLORS).map(k => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="card overflow-hidden">
                      <div className="grid grid-cols-[40px_1fr_120px_100px_90px_120px_100px_100px] gap-3 px-6 py-2.5 text-[9px] font-bold text-[#aaa] uppercase tracking-widest border-b border-[#e8e8e8] bg-[#FAFAFA]">
                        <span></span><span>Currency</span><span>Contract</span><span className="text-right">Rate</span><span className="text-center">Category</span><span className="text-right">Supply</span><span className="text-right">24h Vol</span><span className="text-center">Status</span>
                      </div>
                      {filteredCurrencies.map((c, i) => (
                        <button key={c.iso4217} onClick={() => setSelectedCurrency(c)}
                          className="grid grid-cols-[40px_1fr_120px_100px_90px_120px_100px_100px] gap-3 px-6 py-3.5 items-center border-b border-[#f3f3f3] hover:bg-[#FAFAFA] transition w-full text-left fade-up" style={{ animationDelay: `${i * 20}ms` }}>
                          <span className="text-lg">{c.logo}</span>
                          <div>
                            <p className="text-[12px] font-bold text-[#0a0a0a]">{c.name} <span className="text-[#999]">({c.iso4217})</span></p>
                            <p className="text-[9px] text-[#bbb] font-mono">{c.symbol}</p>
                          </div>
                          <span className="text-[10px] font-mono text-[#00C853] font-semibold">{c.contractName}</span>
                          <span className="text-[11px] font-mono font-bold text-[#0a0a0a] text-right">${c.exchangeRateUSD < 0.01 ? c.exchangeRateUSD.toFixed(6) : c.exchangeRateUSD.toFixed(4)}</span>
                          <div className="flex justify-center">
                            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: CAT_COLORS[c.category] || '#888', background: `${CAT_COLORS[c.category] || '#888'}08` }}>{c.category.replace('_', ' ')}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#555] text-right">{c.circulatingSupply >= 1e9 ? `${(c.circulatingSupply / 1e9).toFixed(1)}B` : c.circulatingSupply >= 1e6 ? `${(c.circulatingSupply / 1e6).toFixed(0)}M` : c.circulatingSupply.toLocaleString()}</span>
                          <span className="text-[10px] font-mono text-[#555] text-right">{fmt(c.dailyVolume)}</span>
                          <div className="flex justify-center">
                            {c.reserveBacked
                              ? <span className="text-[8px] text-[#00C853] font-bold flex items-center gap-0.5"><ShieldCheck size={10} /> PoR</span>
                              : <span className="text-[8px] text-[#ccc]">—</span>
                            }
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════ ENTITIES ═══════════════════════════════ */}
            {tab === 'entities' && (
              <motion.div key="ent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {selectedEntity ? (
                  /* ── Entity Detail ── */
                  <div>
                    <button onClick={() => setSelectedEntity(null)} className="flex items-center gap-1.5 text-[11px] text-[#888] hover:text-[#00C853] font-semibold mb-4 transition"><ArrowLeft size={12} /> Back to entities</button>
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                      <div className="space-y-4">
                        <div className="card p-6">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-[#00C85308] border-2 border-[#00C85320] flex items-center justify-center text-2xl">
                              {selectedEntity.logo || '🏦'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-[#0a0a0a]">{selectedEntity.name}</h2>
                                {selectedEntity.verificationLevel === 'FULLY_CERTIFIED' && <span className="text-[9px] text-[#00C853] font-bold flex items-center gap-1 bg-[#00C85308] px-2 py-0.5 rounded-full"><BadgeCheck size={11} /> CERTIFIED</span>}
                              </div>
                              <p className="text-[11px] text-[#999] font-mono mt-1">{selectedEntity.legalName} · {selectedEntity.type} · {selectedEntity.country}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4 mb-6">
                            {[
                              { label: 'Monthly Volume', value: fmt(selectedEntity.monthlyVolume), color: '#00C853' },
                              { label: 'Transactions', value: selectedEntity.totalTransactions.toLocaleString(), color: '#1D4ED8' },
                              { label: 'Compliance', value: `${selectedEntity.complianceScore}/100`, color: '#D97706' },
                              { label: 'Daily Limit', value: fmt(selectedEntity.dailyLimit), color: '#0a0a0a' },
                            ].map(m => (
                              <div key={m.label} className="bg-[#FAFAFA] border border-[#e8e8e8] rounded-xl p-4">
                                <span className="text-[9px] text-[#aaa] uppercase tracking-widest font-bold">{m.label}</span>
                                <p className="text-lg font-extrabold font-mono mt-1" style={{ color: m.color }}>{m.value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-[11px]">
                            {[
                              { l: 'SWIFT BIC', v: selectedEntity.swiftBIC, accent: true },
                              { l: 'LEI', v: selectedEntity.lei },
                              { l: 'Jurisdiction', v: selectedEntity.jurisdiction },
                              { l: 'Regulator', v: selectedEntity.regulatoryBody },
                              { l: 'AML Rating', v: selectedEntity.amlRating },
                              { l: 'Wallet', v: shortAddr(selectedEntity.walletAddress) },
                            ].map(x => (
                              <div key={x.l} className="flex justify-between p-3 bg-[#FAFAFA] rounded-lg border border-[#e8e8e8]">
                                <span className="text-[#999]">{x.l}</span>
                                <span className={`font-mono font-semibold ${x.accent ? 'text-[#00C853]' : 'text-[#0a0a0a]'}`}>{x.v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Supported Rails */}
                        <div className="card p-5">
                          <h3 className="text-sm font-bold mb-3">Supported Payment Rails</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedEntity.supportedRails.map(r => (
                              <span key={r} className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg bg-[#00C85308] text-[#00C853] border border-[#00C85318]">{r}</span>
                            ))}
                          </div>
                        </div>
                        {/* Correspondent Banks */}
                        <div className="card p-5">
                          <h3 className="text-sm font-bold mb-3">Correspondent Banks</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedEntity.correspondentBanks.map(b => (
                              <span key={b} className="text-[10px] font-mono px-3 py-1.5 rounded-lg bg-[#f3f3f3] text-[#555] border border-[#e8e8e8]">{b}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Right: Currencies & API Keys */}
                      <div className="space-y-4">
                        <div className="card p-5 sticky top-6">
                          <h3 className="text-sm font-bold mb-3">Authorized Currencies</h3>
                          <div className="flex flex-wrap gap-1">
                            {selectedEntity.allowedCurrencies.map(c => {
                              const cur = currencies.find(x => x.iso4217 === c);
                              return (
                                <span key={c} className="text-[10px] font-mono px-2 py-1 rounded bg-[#f3f3f3] text-[#555] border border-[#e8e8e8] flex items-center gap-1">
                                  {cur?.logo} {c}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="card p-5">
                          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Key size={13} className="text-[#00C853]" /> API Keys</h3>
                          <div className="space-y-2">
                            {selectedEntity.apiKeys.map(k => (
                              <div key={k.id} className="bg-[#FAFAFA] border border-[#e8e8e8] rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] font-bold text-[#0a0a0a]">{k.label}</span>
                                  <span className={`text-[8px] font-bold ${k.isActive ? 'text-[#00C853]' : 'text-[#999]'}`}>{k.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {k.permissions.map(p => (
                                    <span key={p} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#0a0a0a08] text-[#555]">{p}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Entity List ── */
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-[#0a0a0a] flex items-center gap-2"><Building2 size={15} className="text-[#00C853]" /> Certified Banking Entities <span className="text-[10px] text-[#999] font-mono ml-2">{entities.length} entities</span></h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {entities.map((e, i) => {
                        const EIcon = ENTITY_ICONS[e.type] || Building2;
                        return (
                          <button key={e.id} onClick={() => setSelectedEntity(e)} className="card p-5 text-left hover:border-[#ccc] transition group fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 rounded-xl bg-[#FAFAFA] border border-[#e8e8e8] flex items-center justify-center text-xl">{e.logo || '🏦'}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-[14px] text-[#0a0a0a]">{e.name}</p>
                                  {e.verificationLevel === 'FULLY_CERTIFIED' && <BadgeCheck size={14} className="text-[#00C853]" />}
                                </div>
                                <p className="text-[10px] text-[#aaa] font-mono">{e.type} · {e.country} · {e.swiftBIC}</p>
                              </div>
                              <EIcon size={18} className="text-[#ccc] group-hover:text-[#00C853] transition" />
                            </div>
                            <div className="grid grid-cols-4 gap-3 text-[10px] mb-3">
                              <div><span className="text-[#bbb]">Monthly Vol</span><p className="font-mono font-semibold text-[#0a0a0a] mt-0.5">{fmt(e.monthlyVolume)}</p></div>
                              <div><span className="text-[#bbb]">Transactions</span><p className="font-mono text-[#555] mt-0.5">{e.totalTransactions.toLocaleString()}</p></div>
                              <div><span className="text-[#bbb]">Compliance</span><p className="font-mono font-semibold mt-0.5" style={{ color: e.complianceScore >= 90 ? '#00C853' : '#D97706' }}>{e.complianceScore}%</p></div>
                              <div><span className="text-[#bbb]">API Keys</span><p className="font-mono text-[#555] mt-0.5">{e.apiKeys.filter(k => k.isActive).length} active</p></div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {e.allowedCurrencies.slice(0, 6).map(c => <span key={c} className="text-[8px] px-1.5 py-0.5 rounded bg-[#f3f3f3] text-[#888] font-mono">{c}</span>)}
                              {e.allowedCurrencies.length > 6 && <span className="text-[8px] text-[#ccc]">+{e.allowedCurrencies.length - 6}</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════ PAYMENTS ═══════════════════════════════ */}
            {tab === 'payments' && (
              <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="card overflow-hidden">
                  <div className="h-14 px-6 border-b border-[#e8e8e8] flex items-center justify-between">
                    <div className="flex items-center gap-3"><Send size={15} className="text-[#00C853]" /><span className="text-sm font-bold">Payment Transactions</span><span className="text-[10px] text-[#999] font-mono">{payments.length} total</span></div>
                    <button onClick={fetchData} className="h-8 px-3 rounded-lg border border-[#e8e8e8] text-[10px] font-bold hover:bg-[#f3f3f3] transition flex items-center gap-1.5 text-[#555]"><RefreshCw size={11} /> Refresh</button>
                  </div>
                  <div className="grid grid-cols-[180px_1fr_90px_110px_110px_90px_120px] gap-3 px-6 py-2.5 text-[9px] font-bold text-[#aaa] uppercase tracking-widest border-b border-[#e8e8e8] bg-[#FAFAFA]">
                    <span>UETR</span><span>Route</span><span>Type</span><span className="text-right">Amount</span><span className="text-center">Status</span><span className="text-center">Priority</span><span className="text-right">Time</span>
                  </div>
                  {payments.map((p, i) => {
                    const sc = STATUS_CFG[p.status] || STATUS_CFG.INITIATED;
                    const Ic = sc.icon;
                    return (
                      <div key={p.id} className="grid grid-cols-[180px_1fr_90px_110px_110px_90px_120px] gap-3 px-6 py-3.5 items-center border-b border-[#f3f3f3] hover:bg-[#FAFAFA] transition fade-up" style={{ animationDelay: `${i * 15}ms` }}>
                        <button onClick={() => cpy(p.id)} className="flex items-center gap-1 text-[10px] font-mono text-[#555] hover:text-[#00C853] transition truncate">
                          {p.id.slice(0, 8)}...{p.id.slice(-4)} {copied === p.id ? <Check size={10} className="text-[#00C853]" /> : <Copy size={10} className="text-[#ccc]" />}
                        </button>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="font-bold text-[#0a0a0a]">{p.senderBIC}</span>
                          <ArrowRight size={10} className="text-[#ccc]" />
                          <span className="font-bold text-[#0a0a0a]">{p.receiverBIC}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#00C853] font-semibold">{p.messageType}</span>
                        <span className="text-[12px] font-bold font-mono text-[#0a0a0a] text-right">{p.amount >= 1e6 ? `${(p.amount / 1e6).toFixed(1)}M` : p.amount.toLocaleString()} <span className="text-[9px] text-[#999]">{p.currency}</span></span>
                        <div className="flex justify-center">
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase px-2 py-1 rounded" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.color}18` }}>
                            <Ic size={10} /> {p.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex justify-center">
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${p.priority === 'URGENT' ? 'text-[#DC2626] bg-[#DC262608]' : p.priority === 'HIGH' ? 'text-[#D97706] bg-[#D9770608]' : 'text-[#888] bg-[#88888808]'}`}>{p.priority}</span>
                        </div>
                        <span className="text-[10px] text-[#999] text-right">{new Date(p.createdAt).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════ API DOCS ═══════════════════════════════ */}
            {tab === 'api' && (
              <motion.div key="api" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] flex items-center justify-center"><Terminal size={18} className="text-white" /></div>
                    <div>
                      <h2 className="text-lg font-bold text-[#0a0a0a]">20022Chain Gpay3 API</h2>
                      <p className="text-[11px] text-[#999] font-mono">v1 · REST · ISO 20022 Compliant</p>
                    </div>
                  </div>

                  {/* Auth */}
                  <div className="bg-[#0a0a0a] rounded-xl p-5 mb-6">
                    <div className="flex items-center gap-2 mb-3"><Lock size={14} className="text-[#00C853]" /><span className="text-[12px] font-bold text-white">Authentication</span></div>
                    <p className="text-[11px] text-[#999] mb-3">All write endpoints require a valid API key. Include it in the request body or as a Bearer token.</p>
                    <div className="bg-[#1a1a1a] rounded-lg p-3 font-mono text-[11px]">
                      <span className="text-[#999]">// Header</span><br />
                      <span className="text-[#00C853]">Authorization</span><span className="text-white">: Bearer </span><span className="text-[#D97706]">api_20022_your_key_here</span><br /><br />
                      <span className="text-[#999]">// Or in request body</span><br />
                      <span className="text-white">{'{'}</span> <span className="text-[#00C853]">&quot;apiKey&quot;</span><span className="text-white">: </span><span className="text-[#D97706]">&quot;api_20022_your_key_here&quot;</span> <span className="text-white">{'}'}</span>
                    </div>
                  </div>

                  {/* Endpoints */}
                  <h3 className="text-sm font-bold mb-4">Endpoints</h3>
                  <div className="space-y-3">
                    {[
                      { method: 'GET', path: '/api/swift?action=overview', desc: 'Network stats overview', auth: false },
                      { method: 'GET', path: '/api/swift?action=currencies', desc: 'List all tokenized currencies', auth: false },
                      { method: 'GET', path: '/api/swift?action=rates', desc: 'Real-time FX rates', auth: false },
                      { method: 'GET', path: '/api/swift?action=entities', desc: 'List certified entities', auth: false },
                      { method: 'GET', path: '/api/swift?action=entity&bic=CHASUS33', desc: 'Get entity by SWIFT BIC', auth: false },
                      { method: 'GET', path: '/api/swift?action=payments&limit=50', desc: 'Recent payment history', auth: false },
                      { method: 'GET', path: '/api/swift?action=track&uetr=xxx', desc: 'Track payment by UETR', auth: false },
                      { method: 'POST', path: '/api/swift { action: "transfer" }', desc: 'Initiate SWIFT/IBAN transfer', auth: true },
                      { method: 'POST', path: '/api/swift { action: "register" }', desc: 'Register new banking entity', auth: false },
                      { method: 'POST', path: '/api/swift { action: "generate-key" }', desc: 'Generate API key', auth: true },
                    ].map((ep, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border border-[#e8e8e8] rounded-xl hover:border-[#ccc] transition bg-white">
                        <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded ${ep.method === 'GET' ? 'bg-[#00C85310] text-[#00C853]' : 'bg-[#D9770610] text-[#D97706]'}`}>{ep.method}</span>
                        <code className="text-[11px] font-mono text-[#0a0a0a] flex-1">{ep.path}</code>
                        <span className="text-[10px] text-[#888]">{ep.desc}</span>
                        {ep.auth && <Lock size={11} className="text-[#D97706]" />}
                      </div>
                    ))}
                  </div>

                  {/* Sample Transfer */}
                  <h3 className="text-sm font-bold mt-6 mb-4">Sample Transfer Request</h3>
                  <div className="bg-[#0a0a0a] rounded-xl p-5 font-mono text-[11px] overflow-x-auto">
                    <pre className="text-[#e8e8e8]">{`POST /api/swift

{
  "action": "transfer",
  "apiKey": "api_20022_your_key_here",
  "receiverBIC": "DEUTDEFF",
  "receiverName": "Deutsche Bank AG",
  "receiverIBAN": "DE89370400440532013000",
  "currency": "EUR",
  "amount": 50000,
  "messageType": "pacs.008",
  "remittanceInfo": "Invoice #12345 — Trade settlement",
  "priority": "NORMAL",
  "chargeType": "SHA"
}`}</pre>
                  </div>

                  {/* Sample Response */}
                  <h3 className="text-sm font-bold mt-6 mb-4">Sample Response</h3>
                  <div className="bg-[#0a0a0a] rounded-xl p-5 font-mono text-[11px] overflow-x-auto">
                    <pre className="text-[#e8e8e8]">{`{
  "success": true,
  "payment": {
    "uetr": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
    "status": "INITIATED",
    "messageType": "pacs.008",
    "currency": "EUR",
    "amount": 50000,
    "fee": 25,
    "senderBIC": "CHASUS33",
    "receiverBIC": "DEUTDEFF",
    "priority": "NORMAL",
    "valueDate": "2026-02-10",
    "trackUrl": "/api/swift?action=track&uetr=a1b2c3d4..."
  }
}`}</pre>
                  </div>

                  {/* Flow */}
                  <h3 className="text-sm font-bold mt-6 mb-4">Payment Flow</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['INITIATED', 'COMPLIANCE_CHECK', 'AML_SCREENING', 'PROCESSING', 'SETTLED', 'COMPLETED'].map((s, i) => {
                      const sc = STATUS_CFG[s] || STATUS_CFG.INITIATED;
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border" style={{ borderColor: `${sc.color}25`, background: sc.bg }}>
                            <sc.icon size={12} style={{ color: sc.color }} />
                            <span className="text-[10px] font-bold" style={{ color: sc.color }}>{s.replace('_', ' ')}</span>
                          </div>
                          {i < 5 && <ChevronRight size={14} className="text-[#ccc]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="h-9 border-t border-[#e8e8e8] bg-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3 text-[10px] text-[#aaa] font-mono">
          <span className="font-bold text-[#0a0a0a] tracking-wider">20022CHAIN</span>
          <span>Gpay3 Payment Network</span>
          <div className="w-px h-3 bg-[#e8e8e8]" />
          <span>ISO 20022 Compliant</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00C853] live-dot" />
          <span className="text-[#00C853] font-bold font-mono">LIVE</span>
        </div>
      </footer>
    </div>
  );
}
