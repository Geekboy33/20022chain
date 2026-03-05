"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Link2, ExternalLink, Copy, Check, ArrowLeft, Box, Shield, Code, FileText,
  MapPin, Mountain, Building2, Banknote, Gem, Truck, Clock, Users, BarChart3,
  BadgeCheck, AlertTriangle, Globe, Lock, Fuel, Hash, Eye, Layers, Activity,
  ArrowUpRight, ChevronDown, ChevronRight, Fingerprint, Scale, Music, Film,
  Cpu, Palette, BookOpen, Camera, PenTool, Award, DollarSign, Percent,
  Calendar, ShieldCheck, FileCheck, Zap, CircleDot, TrendingUp, Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════════

function Cp({ t }: { t: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(t); setOk(true); setTimeout(() => setOk(false), 1500); }}
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-black/5 transition-all" aria-label="Copy">
      {ok ? <Check size={12} className="text-[#00C853]" /> : <Copy size={12} className="text-[#ccc] hover:text-[#888]" />}
    </button>
  );
}

function fNum(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}
function fP(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function Addr({ a, full = false }: { a: string; full?: boolean }) {
  if (!a) return <span className="text-[#ccc]">--</span>;
  const parts = a.split(':');
  if (parts[0] === 'archt' && parts.length >= 3) {
    const addrType = parts[1];
    const context = parts.length === 4 ? parts[2] : null;
    const hash = parts[parts.length - 1];
    const tc: Record<string, string> = { contract: '#00C853', val: '#1D4ED8', owner: '#7C3AED', account: '#555', system: '#F59E0B', creator: '#DB2777' };
    return (
      <span className="inline-flex items-center gap-0.5 text-[12px] font-mono">
        <span className="text-[#bbb]">archt:</span>
        <span className="font-bold" style={{ color: tc[addrType] || '#059669' }}>{addrType}</span>
        {context && <><span className="text-[#ccc]">:</span><span className="text-[#0a0a0a] font-bold">{full ? context : context.slice(0, 18)}</span></>}
        <span className="text-[#ccc]">:</span>
        <span className="text-[#999]">{full ? hash : hash.slice(0, 10)}...</span>
      </span>
    );
  }
  if (a.startsWith('tx:')) return <span className="text-[12px] font-mono"><span className="text-[#F59E0B] font-bold">tx</span><span className="text-[#ccc]">:</span><span className="text-[#888]">{full ? a.slice(3) : `${a.slice(3, 18)}...`}</span></span>;
  return <span className="text-[12px] font-mono text-[#888]">{full ? a : a.length > 30 ? `${a.slice(0, 22)}...` : a}</span>;
}

// ── METRIC CARD ──────────────────────────────────────────────
function Metric({ label, value, sub, accent, icon: Icon, large }: { label: string; value: string; sub?: string; accent?: boolean; icon?: any; large?: boolean }) {
  return (
    <div className={cn("bg-white border border-[#e8e8e8] rounded-2xl p-5 group hover:border-[#00C853]/30 transition-all", large && "col-span-2")}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={13} className="text-[#bbb]" />}
        <span className="text-[9px] font-extrabold text-[#aaa] uppercase tracking-[0.15em]">{label}</span>
      </div>
      <div className={cn("font-extrabold font-mono", large ? "text-3xl" : "text-xl", accent ? "text-[#00C853]" : "text-[#0a0a0a]")}>{value}</div>
      {sub && <div className="text-[10px] text-[#999] mt-1 font-medium">{sub}</div>}
    </div>
  );
}

// ── INFO ROW ─────────────────────────────────────────────────
function InfoRow({ label, value, copy, full }: { label: string; value: string | React.ReactNode; copy?: string; full?: boolean }) {
  return (
    <div className={cn("flex items-center py-3.5 border-b border-[#f3f3f3] last:border-0", full ? "flex-col items-start gap-1" : "justify-between")}>
      <span className="text-[10px] text-[#aaa] font-extrabold uppercase tracking-[0.15em] w-52 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 text-[13px] text-[#0a0a0a]">
        {value}
        {copy && <Cp t={copy} />}
      </div>
    </div>
  );
}

// ── SECTION PANEL ────────────────────────────────────────────
function Panel({ title, icon: Icon, badge, children, color = '#00C853' }: { title: string; icon: any; badge?: string; children: React.ReactNode; color?: string }) {
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
      <div className="h-14 px-7 border-b border-[#e8e8e8] flex items-center justify-between bg-gradient-to-r from-white to-[#f9f9f9]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}10`, border: `1.5px solid ${color}25` }}>
            <Icon size={15} style={{ color }} />
          </div>
          <span className="text-[14px] font-extrabold tracking-tight">{title}</span>
        </div>
        {badge && <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-[#f3f3f3] text-[#666]">{badge}</span>}
      </div>
      <div className="p-7">{children}</div>
    </div>
  );
}

// ── STATUS BADGES ────────────────────────────────────────────
function StatusBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border", ok ? "border-[#00C853]/20 bg-[#00C853]/5" : "border-[#EF4444]/20 bg-[#EF4444]/5")}>
      {ok ? <BadgeCheck size={14} className="text-[#00C853]" /> : <AlertTriangle size={14} className="text-[#EF4444]" />}
      <span className={cn("text-[11px] font-bold", ok ? "text-[#00C853]" : "text-[#EF4444]")}>{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REGISTRY TYPE CONFIG
// ═══════════════════════════════════════════════════════════════

const REGISTRY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  CONTRACT: { label: 'Smart Contract', color: '#00C853', bg: '#00C853', icon: Code },
  ISIN: { label: 'ISIN Instrument', color: '#1D4ED8', bg: '#1D4ED8', icon: Hash },
  VIEWSRIGHT: { label: 'ViewsRight', color: '#7C3AED', bg: '#7C3AED', icon: Fingerprint },
};

const RWA_META: Record<string, { icon: any; label: string; color: string }> = {
  MINE: { icon: Mountain, label: 'Mining Asset', color: '#92700a' },
  REAL: { icon: Building2, label: 'Real Estate', color: '#1D4ED8' },
  BOND: { icon: Banknote, label: 'Fixed Income', color: '#7C3AED' },
  GEM: { icon: Gem, label: 'Gemstone', color: '#DB2777' },
  COMM: { icon: Truck, label: 'Commodity', color: '#059669' },
};

const VR_ICONS: Record<string, any> = { MUSIC: Music, FILM: Film, SOFTWARE: Cpu, PATENT: Scale, ART: Palette, LITERATURE: BookOpen, PHOTOGRAPHY: Camera, DESIGN: PenTool, ARCHITECTURE: Building2 };

// ═══════════════════════════════════════════════════════════════
// SEAL SYSTEM — Visual identity for each verification type
// ═══════════════════════════════════════════════════════════════

const SEAL_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; gradient: string }> = {
  VERIFIED:        { label: 'Verified',           color: '#00C853', bg: '#00C853', icon: BadgeCheck,  gradient: 'from-[#00C853] to-[#00E676]' },
  VR_VERIFIED:     { label: 'ViewsRight',         color: '#7C3AED', bg: '#7C3AED', icon: Fingerprint, gradient: 'from-[#7C3AED] to-[#A855F7]' },
  IS_VERIFIED:     { label: 'ISIN Verified',      color: '#1D4ED8', bg: '#1D4ED8', icon: Hash,        gradient: 'from-[#1D4ED8] to-[#3B82F6]' },
  GOV_VERIFIED:    { label: 'Government',         color: '#D4A017', bg: '#D4A017', icon: Shield,      gradient: 'from-[#D4A017] to-[#F59E0B]' },
  INST_VERIFIED:   { label: 'Institutional',      color: '#6B7280', bg: '#6B7280', icon: Building2,   gradient: 'from-[#6B7280] to-[#9CA3AF]' },
  PRO_VERIFIED:    { label: 'Professional',       color: '#059669', bg: '#059669', icon: Award,       gradient: 'from-[#059669] to-[#10B981]' },
  PRIVACY_SHIELD:  { label: 'Privacy Shield',     color: '#0A0A0A', bg: '#0A0A0A', icon: Lock,        gradient: 'from-[#0A0A0A] to-[#333]' },
};

const ENTITY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  PERSON:      { label: 'Individual',       icon: Users,     color: '#555' },
  COMPANY:     { label: 'Company',          icon: Building2, color: '#1D4ED8' },
  INSTITUTION: { label: 'Institution',      icon: Banknote,  color: '#6B7280' },
  GOVERNMENT:  { label: 'Government',       icon: Shield,    color: '#D4A017' },
  DAO:         { label: 'DAO',              icon: Globe,     color: '#7C3AED' },
  MUSICIAN:    { label: 'Musician',         icon: Music,     color: '#DB2777' },
  FILMMAKER:   { label: 'Filmmaker',        icon: Film,      color: '#EF4444' },
  DEVELOPER:   { label: 'Developer',        icon: Cpu,       color: '#059669' },
  INFLUENCER:  { label: 'Influencer',       icon: Zap,       color: '#F59E0B' },
  ARCHITECT:   { label: 'Architect',        icon: PenTool,   color: '#7C3AED' },
  SCIENTIST:   { label: 'Scientist',        icon: Layers,    color: '#1D4ED8' },
  ATTORNEY:    { label: 'Legal',            icon: Scale,     color: '#6B7280' },
  AUDITOR:     { label: 'Auditor',          icon: FileCheck, color: '#059669' },
  MINER:       { label: 'Mining Operator',  icon: Mountain,  color: '#92700a' },
  REALTOR:     { label: 'Real Estate',      icon: Building2, color: '#1D4ED8' },
};

// Seal Badge Component (premium design)
function SealBadge({ seal, size = 'md' }: { seal: string; size?: 'sm' | 'md' | 'lg' }) {
  const conf = SEAL_CONFIG[seal] || SEAL_CONFIG.VERIFIED;
  const Icon = conf.icon;
  const sz = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const icSz = size === 'lg' ? 15 : size === 'sm' ? 8 : 11;
  return (
    <div className={cn(sz, `rounded-full bg-gradient-to-br ${conf.gradient} flex items-center justify-center shadow-lg`)} title={conf.label}
      style={{ boxShadow: `0 2px 8px ${conf.color}40` }}>
      <Icon size={icSz} className="text-white" />
    </div>
  );
}

// Entity Type Badge
function EntityBadge({ entityType, category }: { entityType: string; category?: string }) {
  const conf = ENTITY_CONFIG[entityType] || ENTITY_CONFIG.PERSON;
  const Icon = conf.icon;
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border" style={{ borderColor: `${conf.color}20`, backgroundColor: `${conf.color}08` }}>
      <Icon size={10} style={{ color: conf.color }} />
      <span className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: conf.color }}>{category || conf.label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════

type DetailTab = 'overview' | 'code' | 'abi' | 'transactions' | 'events';

export default function ContractDetailPage() {
  const params = useParams();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>('overview');

  useEffect(() => {
    const addr = decodeURIComponent(params.address as string);
    fetch(`/api/contracts/${encodeURIComponent(addr)}`).then(r => r.json()).then(d => { if (!d.error) setContract(d); setLoading(false); }).catch(() => setLoading(false));
  }, [params.address]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl border-2 border-[#0a0a0a] flex items-center justify-center mx-auto mb-5 animate-pulse"><Link2 size={24} /></div>
        <p className="text-sm text-[#999] font-mono tracking-wider">LOADING CONTRACT...</p>
      </div>
    </div>
  );

  if (!contract) return (
    <div className="h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="text-center">
        <AlertTriangle size={40} className="text-[#F59E0B] mx-auto mb-4" />
        <h2 className="text-xl font-extrabold mb-2">Contract Not Found</h2>
        <p className="text-sm text-[#999] mb-4">The contract address does not exist on 20022Chain</p>
        <a href="/contracts" className="text-sm text-[#00C853] font-bold hover:underline">Back to Contracts</a>
      </div>
    </div>
  );

  const regType = contract.registryType || 'CONTRACT';
  const regConf = REGISTRY_CONFIG[regType] || REGISTRY_CONFIG.CONTRACT;
  const RegIcon = regConf.icon;
  const rwa = contract.rwaDetail;
  const isin = contract.isinContract;
  const vr = contract.viewsRight;
  const rwaM = rwa ? RWA_META[rwa.rwaSubType] : null;
  const verif = contract.verification;
  const isVerified = verif?.verified;

  const TABS: { id: DetailTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'code', label: 'Source Code', icon: Code },
    { id: 'abi', label: 'ABI', icon: Layers },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'events', label: 'Events', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HEADER                                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <header className="border-b border-[#e8e8e8] bg-white sticky top-0 z-50">
        <div className="max-w-[1480px] mx-auto">
          {/* TOP BAR */}
          <div className="h-16 px-8 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <a href="/contracts" className="flex items-center gap-2 text-[11px] text-[#888] hover:text-[#0a0a0a] font-bold transition-colors">
                <ArrowLeft size={14} /> Back
              </a>
              <div className="w-px h-6 bg-[#e8e8e8]" />

              {/* IDENTITY */}
              <div className="flex items-center gap-3">
                {/* Logo / Icon with Seal */}
                <div className="relative">
                  {contract.logoUrl ? (
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 bg-white flex items-center justify-center" style={{ borderColor: isVerified ? (SEAL_CONFIG[verif?.seal]?.color || '#00C853') + '40' : '#e8e8e8' }}>
                      <img src={contract.logoUrl} alt={contract.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-[18px] font-extrabold" style="color:${regConf.color}">${contract.name.charAt(0)}</div>`; }} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[20px] font-extrabold" style={{ backgroundColor: `${regConf.color}10`, border: `2px solid ${regConf.color}30`, color: regConf.color }}>
                      {regType === 'VIEWSRIGHT' ? 'VR' : regType === 'ISIN' ? 'IS' : contract.name.charAt(0)}
                    </div>
                  )}
                  {/* SEAL OVERLAY */}
                  {isVerified && verif?.seal && (
                    <div className="absolute -bottom-1.5 -right-1.5 border-2 border-white rounded-full">
                      <SealBadge seal={verif.seal} size="md" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-[16px] font-extrabold tracking-tight">{contract.name}</h1>
                    {/* ALL SEALS */}
                    {verif?.seals?.map((s: string) => {
                      const sc = SEAL_CONFIG[s];
                      if (!sc) return null;
                      return (
                        <span key={s} className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1"
                          style={{ color: sc.color, backgroundColor: `${sc.color}10`, border: `1px solid ${sc.color}20` }}>
                          <sc.icon size={8} /> {sc.label}
                        </span>
                      );
                    })}
                    <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider" style={{ color: regConf.color, backgroundColor: `${regConf.color}12`, border: `1px solid ${regConf.color}20` }}>{regConf.label}</span>
                    {rwaM && <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-md" style={{ color: rwaM.color, backgroundColor: `${rwaM.color}10` }}>{rwaM.label}</span>}
                    {verif?.entityType && <EntityBadge entityType={verif.entityType} category={verif.entityCategory} />}
                    {verif?.privacyShield && <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-[#0A0A0A] text-white flex items-center gap-1"><Lock size={8} /> PRIVATE</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Addr a={contract.address} />
                    <Cp t={contract.address} />
                    {isin && <span className="text-[10px] font-bold font-mono text-[#555] bg-[#f3f3f3] px-2 py-0.5 rounded">{isin.isin}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3">
              <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl", contract.auditScore >= 85 ? "bg-[#00C853]/8 border border-[#00C853]/20" : "bg-[#F59E0B]/8 border border-[#F59E0B]/20")}>
                <Shield size={12} className={contract.auditScore >= 85 ? "text-[#00C853]" : "text-[#F59E0B]"} />
                <span className={cn("text-[11px] font-extrabold", contract.auditScore >= 85 ? "text-[#00C853]" : "text-[#F59E0B]")}>{contract.auditScore}/100</span>
              </div>
              <span className="text-[10px] font-bold text-[#00C853] bg-[#00C853]/8 px-3 py-1.5 rounded-xl border border-[#00C853]/20 uppercase tracking-wider">{contract.status}</span>
              <a href="/" className="h-9 px-4 rounded-xl border border-[#e8e8e8] text-[11px] font-bold text-[#888] flex items-center gap-1.5 hover:bg-[#f5f5f5] transition-colors">
                Explorer <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* TAB NAV */}
          <div className="h-11 px-8 flex items-center gap-1 border-t border-[#f3f3f3]">
            {TABS.map(t => {
              const TIcon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold transition-all", tab === t.id ? "bg-[#0a0a0a] text-white" : "text-[#999] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]")}>
                  <TIcon size={13} />{t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CONTENT                                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <main className="max-w-[1480px] mx-auto p-8 space-y-6">

        {tab === 'overview' && (
          <>
            {/* ── CONTRACT OVERVIEW ─────────────────────────── */}
            <div className="grid grid-cols-5 gap-4">
              <Metric label="Balance" value={`${fP(contract.balance)} ARCHT`} icon={Wallet} accent />
              <Metric label="Interactions" value={fP(contract.interactions)} icon={Activity} />
              <Metric label="Gas Used" value={contract.gasUsed?.toLocaleString()} icon={Fuel} />
              <Metric label="Deploy Block" value={`#${contract.deployBlock}`} icon={Box} />
              <Metric label="Version" value={contract.version} icon={CircleDot} />
            </div>

            {/* ── CONTRACT INFO ────────────────────────────── */}
            <Panel title="Contract Information" icon={FileText} badge={regConf.label}>
              <p className="text-[14px] text-[#555] leading-relaxed mb-6">{contract.description}</p>
              <div className="grid grid-cols-2 gap-x-12">
                <div>
                  <InfoRow label="Contract Address" value={<Addr a={contract.address} full />} copy={contract.address} />
                  <InfoRow label="Owner" value={<Addr a={contract.owner} full />} copy={contract.owner} />
                  <InfoRow label="Deploy Transaction" value={<Addr a={contract.deployTxHash} />} copy={contract.deployTxHash} />
                  <InfoRow label="Registry Type" value={<span className="font-bold" style={{ color: regConf.color }}>{regConf.label}</span>} />
                </div>
                <div>
                  <InfoRow label="Created" value={new Date(contract.createdAt).toLocaleString()} />
                  <InfoRow label="Deployed" value={new Date(contract.deployedAt).toLocaleString()} />
                  <InfoRow label="ISO 20022" value={contract.isoCompliant ? <StatusBadge label="COMPLIANT" ok /> : <StatusBadge label="NOT VERIFIED" ok={false} />} />
                  <InfoRow label="Audit Score" value={<span className={cn("text-[16px] font-extrabold", contract.auditScore >= 85 ? "text-[#00C853]" : "text-[#F59E0B]")}>{contract.auditScore}/100</span>} />
                  {rwa?.location && (
                    <InfoRow label="ARCHT Map" value={
                      <a
                        href={`http://localhost:3000?archtmap=1&contract=${encodeURIComponent(contract.address)}&lat=${rwa.location.lat}&lng=${rwa.location.lng}&name=${encodeURIComponent(contract.name)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#00C853] hover:underline"
                      >
                        <MapPin size={12} /> View on Map <ExternalLink size={10} />
                      </a>
                    } />
                  )}
                </div>
              </div>
            </Panel>

            {/* ══════════════════════════════════════════════ */}
            {/* VERIFICATION STATUS                            */}
            {/* ══════════════════════════════════════════════ */}
            {verif && (
              <Panel title={isVerified ? "Verified Contract" : "Verification Status"} icon={ShieldCheck} color={isVerified ? (SEAL_CONFIG[verif.seal]?.color || '#00C853') : '#F59E0B'} badge={verif.level}>
                {/* MAIN STATUS with PRIMARY SEAL */}
                {(() => {
                  const sealConf = SEAL_CONFIG[verif.seal] || SEAL_CONFIG.VERIFIED;
                  const entityConf = ENTITY_CONFIG[verif.entityType] || ENTITY_CONFIG.PERSON;
                  return (
                    <div className={cn("rounded-2xl p-6 mb-6 flex items-center gap-5 border", isVerified ? `border-[${sealConf.color}]/15` : "border-[#F59E0B]/15")}
                      style={isVerified ? { backgroundColor: `${sealConf.color}08`, borderColor: `${sealConf.color}20` } : { backgroundColor: '#FEF3C7' }}>
                      {/* PRIMARY SEAL (large) */}
                      <div className="shrink-0 flex flex-col items-center gap-2">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${sealConf.gradient} flex items-center justify-center shadow-xl`}
                          style={{ boxShadow: `0 8px 24px ${sealConf.color}30` }}>
                          {isVerified ? <sealConf.icon size={36} className="text-white" /> : <AlertTriangle size={36} className="text-white" />}
                        </div>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: sealConf.color }}>{sealConf.label}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[18px] font-extrabold" style={{ color: isVerified ? sealConf.color : '#F59E0B' }}>
                            {isVerified ? sealConf.label + ' Verified' : verif.level === 'STANDARD' ? 'Partially Verified' : verif.level === 'BASIC' ? 'Basic Verification' : 'Not Verified'}
                          </h3>
                          {verif.entityType && <EntityBadge entityType={verif.entityType} category={verif.entityCategory} />}
                          {verif.privacyShield && <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-[#0A0A0A] text-white flex items-center gap-1"><Lock size={7} /> PRIVATE ENTITY</span>}
                        </div>
                        <p className="text-[13px] text-[#888] mt-1">
                          {isVerified
                            ? `This ${entityConf.label.toLowerCase()} has passed full verification including KYC, KYB, security audit, and ISO 20022 compliance${verif.verifiedBy ? ` by ${verif.verifiedBy}` : ''}.`
                            : `This contract has not completed all verification requirements. ${verif.badges?.length || 0} of 6 checks passed.`}
                        </p>
                        {verif.verifiedAt && <p className="text-[10px] text-[#aaa] mt-1 font-mono">Verified: {new Date(verif.verifiedAt).toLocaleDateString()}{verif.expiresAt ? ` · Expires: ${new Date(verif.expiresAt).toLocaleDateString()}` : ''}</p>}
                        {verif.professionalLicense && <p className="text-[10px] text-[#666] mt-1 font-mono">License: {verif.professionalLicense}</p>}
                        {/* ALL EARNED SEALS */}
                        {verif.seals?.length > 0 && (
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-[9px] text-[#aaa] font-bold">SEALS:</span>
                            {verif.seals.map((s: string) => <SealBadge key={s} seal={s} size="sm" />)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* VERIFICATION CHECKS GRID */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { key: 'KYC', label: 'KYC', sub: 'Know Your Customer', ok: verif.kycCompleted },
                    { key: 'KYB', label: 'KYB', sub: 'Know Your Business', ok: verif.kybCompleted },
                    { key: 'ISIN', label: 'ISIN', sub: 'Registered Instrument', ok: verif.isinRegistered },
                    { key: 'AUDIT', label: 'Audit', sub: 'Security Audit ≥85', ok: verif.auditPassed },
                    { key: 'LEI', label: 'LEI', sub: 'Legal Entity ID', ok: verif.legalEntity },
                    { key: 'ISO', label: 'ISO 20022', sub: 'Compliance', ok: verif.complianceApproved },
                    { key: 'GOV', label: 'Government', sub: 'Sovereign Backing', ok: verif.governmentBacked },
                    { key: 'INST', label: 'Institutional', sub: 'Institutional Grade', ok: verif.institutionalGrade },
                  ].map(b => (
                    <div key={b.key} className={cn("rounded-2xl border p-4 text-center transition-all", b.ok ? "border-[#00C853]/20 bg-[#00C853]/5" : "border-[#e8e8e8] bg-[#f9f9f9] opacity-40")}>
                      <div className={cn("w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center", b.ok ? "bg-[#00C853]/10" : "bg-[#e8e8e8]")}>
                        {b.ok ? <BadgeCheck size={18} className="text-[#00C853]" /> : <Lock size={18} className="text-[#ccc]" />}
                      </div>
                      <div className={cn("text-[11px] font-extrabold", b.ok ? "text-[#00C853]" : "text-[#ccc]")}>{b.label}</div>
                      <div className="text-[9px] text-[#aaa] mt-0.5">{b.sub}</div>
                    </div>
                  ))}
                </div>

                {verif.verifiedBy && (
                  <InfoRow label="Verified By" value={<span className="font-bold text-[#00C853]">{verif.verifiedBy}</span>} />
                )}
              </Panel>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* ISIN INSTRUMENT (for CONTRACT + ISIN types)   */}
            {/* ══════════════════════════════════════════════ */}
            {isin && (
              <Panel title="ISIN Digital Financial Instrument" icon={Hash} color="#1D4ED8" badge={isin.isin}>
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <Metric label="ISIN Code" value={isin.isin} icon={Hash} large />
                  <Metric label="Token Symbol" value={isin.tokenSymbol} sub={isin.tokenName} icon={CircleDot} />
                  <Metric label="Price" value={`$${isin.price}`} accent icon={DollarSign} />
                  <Metric label="Market Cap" value={fNum(isin.marketCap)} icon={TrendingUp} />
                </div>
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <Metric label="Total Supply" value={fP(isin.totalSupply)} icon={Layers} />
                  <Metric label="Circulating" value={fP(isin.circulatingSupply)} icon={Activity} />
                  <Metric label="Holders" value={fP(isin.holders)} icon={Users} accent />
                  <Metric label="Compliance" value={`${isin.complianceScore}/100`} icon={ShieldCheck} accent />
                  <Metric label="Created Block" value={`#${isin.createdBlock}`} icon={Box} />
                </div>
                <div className="grid grid-cols-2 gap-x-12">
                  <InfoRow label="LEI" value={<span className="font-mono text-[12px]">{isin.lei}</span>} copy={isin.lei} />
                  <InfoRow label="Jurisdiction" value={isin.jurisdiction} />
                  <InfoRow label="ISIN Contract Address" value={<Addr a={isin.isinContractAddress} full />} copy={isin.isinContractAddress} />
                  <InfoRow label="Parent Contract" value={<Addr a={isin.parentContractAddress} />} copy={isin.parentContractAddress} />
                </div>
              </Panel>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* VIEWSRIGHT (Copyright & IP)                    */}
            {/* ══════════════════════════════════════════════ */}
            {vr && (
              <>
                {/* VR HERO */}
                <Panel title="ViewsRight — Intellectual Property Registry" icon={Fingerprint} color="#7C3AED" badge={vr.registrationNumber}>
                  <div className="grid grid-cols-5 gap-4 mb-6">
                    <Metric label="Work Title" value={vr.title} icon={FileText} large />
                    <Metric label="Work Type" value={vr.workType} icon={VR_ICONS[vr.workType] || Award} />
                    <Metric label="Category" value={vr.category} icon={Layers} />
                    <Metric label="Estimated Value" value={fNum(vr.estimatedValue)} accent icon={DollarSign} />
                  </div>

                  {/* CREATOR INFO */}
                  <div className="bg-[#f7f5ff] border border-[#7C3AED]/15 rounded-2xl p-6 mb-6">
                    <div className="text-[9px] font-extrabold text-[#7C3AED] uppercase tracking-[0.2em] mb-4">Creator & Co-Creators</div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
                        <Users size={16} className="text-[#7C3AED]" />
                      </div>
                      <div>
                        <div className="text-[14px] font-extrabold">{vr.creatorName}</div>
                        <Addr a={vr.creatorAddress} />
                      </div>
                      <span className="text-[9px] font-bold bg-[#7C3AED]/10 text-[#7C3AED] px-2.5 py-1 rounded-lg">PRIMARY CREATOR</span>
                    </div>
                    {vr.coCreators?.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {vr.coCreators.map((cc: any, i: number) => (
                          <div key={i} className="bg-white border border-[#e8e8e8] rounded-xl p-3 flex items-center justify-between">
                            <div>
                              <div className="text-[12px] font-bold">{cc.name}</div>
                              <Addr a={cc.address} />
                            </div>
                            <span className="text-[14px] font-extrabold text-[#7C3AED]">{cc.share}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-12">
                    <InfoRow label="Registration #" value={<span className="font-mono font-bold">{vr.registrationNumber}</span>} copy={vr.registrationNumber} />
                    <InfoRow label="Registration Date" value={vr.registrationDate} />
                    <InfoRow label="Expiration Date" value={vr.expirationDate} />
                    <InfoRow label="Jurisdiction" value={vr.jurisdiction} />
                    <InfoRow label="Copyright Office" value={vr.copyrightOffice} />
                    <InfoRow label="Rights Type" value={<span className="font-bold text-[#7C3AED]">{vr.rightsType?.replace(/_/g, ' ')}</span>} />
                    <InfoRow label="Territorial Scope" value={vr.territorialScope} />
                    <InfoRow label="Licensing Terms" value={vr.licensingTerms} />
                  </div>
                </Panel>

                {/* VR RIGHTS & USES */}
                <div className="grid grid-cols-2 gap-6">
                  <Panel title="Allowed Uses" icon={BadgeCheck} color="#00C853">
                    <div className="flex flex-wrap gap-2">
                      {vr.allowedUses?.map((u: string) => (
                        <span key={u} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[#00C853]/8 text-[#00C853] border border-[#00C853]/15">{u.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </Panel>
                  <Panel title="Restricted Uses" icon={Lock} color="#EF4444">
                    <div className="flex flex-wrap gap-2">
                      {vr.restrictedUses?.map((u: string) => (
                        <span key={u} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[#EF4444]/8 text-[#EF4444] border border-[#EF4444]/15">{u.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </Panel>
                </div>

                {/* VR ROYALTIES */}
                <Panel title="Royalty Distribution" icon={DollarSign} color="#F59E0B" badge={`${vr.royaltyRate}% ${vr.royaltyFrequency?.replace(/_/g, ' ')}`}>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <Metric label="Royalty Rate" value={`${vr.royaltyRate}%`} accent icon={Percent} />
                    <Metric label="Total Earned" value={fNum(vr.totalRoyaltiesEarned)} icon={DollarSign} />
                    <Metric label="Distributions" value={String(vr.totalDistributions)} icon={Activity} />
                    <Metric label="Licensing Revenue" value={fNum(vr.licensingRevenue)} sub="Annual" icon={TrendingUp} />
                  </div>
                  <div className="bg-[#FFF8E1] border border-[#F59E0B]/15 rounded-2xl p-5">
                    <div className="text-[9px] font-extrabold text-[#F59E0B] uppercase tracking-[0.2em] mb-3">Recipients</div>
                    <div className="space-y-2">
                      {vr.royaltyRecipients?.map((r: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-white border border-[#e8e8e8] rounded-xl px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center text-[10px] font-extrabold text-[#F59E0B]">{i + 1}</div>
                            <div>
                              <div className="text-[13px] font-bold">{r.name}</div>
                              <Addr a={r.address} />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[18px] font-extrabold text-[#F59E0B]">{r.share}%</div>
                            <div className="text-[10px] text-[#999]">{fNum(vr.totalRoyaltiesEarned * r.share / 100)} earned</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>

                {/* VR VERIFICATION */}
                <Panel title="Digital Verification & Proof" icon={ShieldCheck} color="#059669">
                  <div className="grid grid-cols-2 gap-x-12 mb-6">
                    <InfoRow label="Digital Fingerprint" value={<span className="font-mono text-[11px] text-[#555] break-all">{vr.fingerprint}</span>} copy={vr.fingerprint} />
                    <InfoRow label="IPFS Hash" value={<span className="font-mono text-[11px] text-[#555]">{vr.ipfsHash}</span>} copy={vr.ipfsHash} />
                    <InfoRow label="Timestamp Proof" value={<span className="font-mono text-[11px]">{vr.timestampProof}</span>} />
                    <InfoRow label="Active Contracts" value={<span className="font-bold">{vr.activeContracts} licensing contracts</span>} />
                    <InfoRow label="Last Valuation" value={vr.lastValuationDate} />
                    <InfoRow label="Description" value={vr.description} />
                  </div>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <StatusBadge label="WIPO Registered" ok={vr.wipo} />
                    <StatusBadge label="DMCA Protected" ok={vr.dmcaProtected} />
                  </div>
                  {vr.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {vr.tags.map((t: string) => (
                        <span key={t} className="text-[9px] font-bold px-2 py-1 rounded bg-[#f3f3f3] text-[#666]">#{t}</span>
                      ))}
                    </div>
                  )}
                </Panel>
              </>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* RWA DETAILS (MINE, REAL, BOND, GEM, COMM)     */}
            {/* ══════════════════════════════════════════════ */}
            {rwa?.rwaSubType === 'MINE' && (
              <>
                <Panel title="Mining Reserve — NI 43-101 Technical Report" icon={Mountain} color="#92700a" badge={`${rwa.mineralType} · ${rwa.mineType.replace('_', ' ')}`}>
                  <div className="grid grid-cols-5 gap-4 mb-6">
                    <Metric label="Mine Name" value={rwa.mineName} icon={MapPin} large />
                    <Metric label="Mineral" value={rwa.mineralType} icon={Gem} />
                    <Metric label="Mine Life" value={`${rwa.mineLifeYears} years`} icon={Clock} />
                    <Metric label="NPV" value={fNum(rwa.netPresentValue)} accent icon={TrendingUp} />
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <Metric label="Measured Reserve" value={`${fP(rwa.measuredReserve)} t`} sub="Highest confidence" accent icon={BadgeCheck} />
                    <Metric label="Indicated Reserve" value={`${fP(rwa.indicatedReserve)} t`} sub="Reasonable confidence" icon={BarChart3} />
                    <Metric label="Inferred Reserve" value={`${fP(rwa.inferredReserve)} t`} sub="Low confidence" icon={BarChart3} />
                    <Metric label="Total Reserves" value={`${fP(rwa.measuredReserve + rwa.indicatedReserve + rwa.inferredReserve)} t`} icon={Layers} />
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <Metric label="Grade" value={`${rwa.gradeGramsPerTon} g/t`} sub={`Cutoff: ${rwa.cutoffGrade} g/t`} icon={BarChart3} />
                    <Metric label="Recovery Rate" value={`${rwa.recoveryRate}%`} accent icon={Percent} />
                    <Metric label="Annual Production" value={`${fP(rwa.annualProduction)} t/yr`} icon={Activity} />
                    <Metric label="AISC" value={`$${rwa.allInSustainingCost}/oz`} sub="All-In Sustaining Cost" icon={DollarSign} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-12 mb-6">
                    <InfoRow label="Operator" value={rwa.operator} />
                    <InfoRow label="Location" value={`${rwa.location.region}, ${rwa.location.country}`} />
                    <InfoRow label="Coordinates" value={`${rwa.location.lat}, ${rwa.location.lng}`} />
                    <InfoRow label="IRR" value={`${rwa.internalRateOfReturn}%`} />
                  </div>

                  {/* ARCHT MAP LINK */}
                  <a
                    href={`http://localhost:3000?archtmap=1&contract=${encodeURIComponent(contract.address)}&lat=${rwa.location.lat}&lng=${rwa.location.lng}&name=${encodeURIComponent(contract.name)}&mineral=${encodeURIComponent(rwa.mineralType || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] hover:from-[#00C853]/90 hover:to-[#00C853] text-white rounded-2xl px-6 py-4 mb-6 transition-all group border border-[#333] hover:border-[#00C853]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#00C853]/15 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                      <MapPin size={18} className="text-[#00C853] group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-extrabold tracking-tight">Open in ARCHT Map</div>
                      <div className="text-[10px] text-white/60 group-hover:text-white/80 mt-0.5 font-mono">
                        {rwa.location.lat}, {rwa.location.lng} — {rwa.location.region}, {rwa.location.country}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold bg-[#00C853]/20 text-[#00C853] group-hover:bg-white/20 group-hover:text-white px-2.5 py-1 rounded-lg tracking-wider">ARCHT MAP</span>
                      <ExternalLink size={14} className="text-white/40 group-hover:text-white" />
                    </div>
                  </a>

                  <div className="flex flex-wrap gap-3">
                    <StatusBadge label={`NI 43-101 — ${rwa.ni43101Author}`} ok={rwa.ni43101Certified} />
                    <StatusBadge label={`Environmental: ${rwa.environmentalPermit}`} ok={!!rwa.environmentalPermit} />
                    <StatusBadge label="Social License" ok={rwa.socialLicense} />
                  </div>
                </Panel>
              </>
            )}

            {rwa?.rwaSubType === 'REAL' && (
              <Panel title="Property Details — Real Estate Asset" icon={Building2} color="#1D4ED8" badge={rwa.propertyType}>
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <Metric label="Property" value={rwa.propertyName} icon={Building2} large />
                  <Metric label="Appraised Value" value={fNum(rwa.appraisedValue)} accent icon={DollarSign} />
                  <Metric label="Cap Rate" value={`${rwa.capRate}%`} icon={Percent} />
                  <Metric label="Occupancy" value={`${rwa.occupancyRate}%`} accent icon={Users} />
                </div>
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <Metric label="Total Area" value={`${fP(rwa.totalArea)} m²`} icon={MapPin} />
                  <Metric label="Floors" value={String(rwa.floors)} icon={Layers} />
                  <Metric label="Units" value={String(rwa.units)} icon={Box} />
                  <Metric label="Annual Rental" value={fNum(rwa.annualRentalIncome)} icon={DollarSign} />
                  <Metric label="NOI" value={fNum(rwa.netOperatingIncome)} accent icon={TrendingUp} />
                </div>
                <div className="grid grid-cols-2 gap-x-12 mb-6">
                  <InfoRow label="Address" value={rwa.location.address} />
                  <InfoRow label="City" value={`${rwa.location.city}, ${rwa.location.country}`} />
                  <InfoRow label="Developer" value={rwa.developer} />
                  <InfoRow label="Appraiser" value={`${rwa.appraiser} (${rwa.lastAppraisalDate})`} />
                  <InfoRow label="Zoning" value={rwa.zoning} />
                  <InfoRow label="Insurance" value={fNum(rwa.insuranceValue)} />
                </div>

                {/* ARCHT MAP LINK */}
                {rwa.location?.lat && rwa.location?.lng && (
                  <a
                    href={`http://localhost:3000?archtmap=1&contract=${encodeURIComponent(contract.address)}&lat=${rwa.location.lat}&lng=${rwa.location.lng}&name=${encodeURIComponent(contract.name)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] hover:from-[#00C853]/90 hover:to-[#00C853] text-white rounded-2xl px-6 py-4 mb-6 transition-all group border border-[#333] hover:border-[#00C853]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#00C853]/15 group-hover:bg-white/20 flex items-center justify-center transition-colors"><MapPin size={18} className="text-[#00C853] group-hover:text-white" /></div>
                    <div className="flex-1">
                      <div className="text-[13px] font-extrabold tracking-tight">Open in ARCHT Map</div>
                      <div className="text-[10px] text-white/60 group-hover:text-white/80 mt-0.5 font-mono">{rwa.location.lat}, {rwa.location.lng} — {rwa.location.city}, {rwa.location.country}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold bg-[#00C853]/20 text-[#00C853] group-hover:bg-white/20 group-hover:text-white px-2.5 py-1 rounded-lg tracking-wider">ARCHT MAP</span>
                      <ExternalLink size={14} className="text-white/40 group-hover:text-white" />
                    </div>
                  </a>
                )}

                <div className="flex flex-wrap gap-3">
                  <StatusBadge label="SEC Reg D Compliant" ok={rwa.secRegD} />
                  <StatusBadge label={rwa.accreditedOnly ? "Accredited Only" : "Open to All"} ok={true} />
                </div>
              </Panel>
            )}

            {rwa?.rwaSubType === 'BOND' && (
              <Panel title="Bond Terms — Fixed Income Instrument" icon={Banknote} color="#7C3AED" badge={`${rwa.creditRating} · ${rwa.bondType}`}>
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <Metric label="Bond Name" value={rwa.bondName} icon={FileText} large />
                  <Metric label="Credit Rating" value={rwa.creditRating} accent icon={Award} />
                  <Metric label="ESG Rating" value={rwa.esgRating} icon={Globe} />
                  <Metric label="Coupon Rate" value={`${rwa.couponRate}%`} accent icon={Percent} />
                </div>
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <Metric label="Face Value" value={`$${rwa.faceValue}`} icon={DollarSign} />
                  <Metric label="Yield to Maturity" value={`${rwa.yieldToMaturity}%`} icon={TrendingUp} />
                  <Metric label="Duration" value={`${rwa.duration} yrs`} icon={Clock} />
                  <Metric label="Carbon Offset" value={`${fP(rwa.carbonOffset)} t CO2`} icon={Globe} />
                  <Metric label="Maturity" value={rwa.maturityDate} icon={Calendar} />
                </div>
                <div className="grid grid-cols-2 gap-x-12">
                  <InfoRow label="Issuer" value={rwa.issuerEntity} />
                  <InfoRow label="Rating Agency" value={rwa.ratingAgency} />
                  <InfoRow label="Issue Date" value={rwa.issueDate} />
                  <InfoRow label="Regulatory" value={rwa.regulatoryFramework} />
                  <InfoRow label="Green Cert." value={rwa.greenCertification} />
                  <InfoRow label="Frequency" value={rwa.couponFrequency?.replace(/_/g, ' ')} />
                </div>
              </Panel>
            )}

            {rwa?.rwaSubType === 'GEM' && (
              <Panel title="Gemstone Certificate — Physical Asset" icon={Gem} color="#DB2777" badge={rwa.gemType}>
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <Metric label="Collection" value={rwa.gemName} icon={Gem} large />
                  <Metric label="Gem Type" value={rwa.gemType} icon={CircleDot} />
                  <Metric label="Total Carats" value={`${fP(rwa.totalCarats)} ct`} accent icon={Scale} />
                  <Metric label="Total Value" value={fNum(rwa.totalAppraisedValue)} accent icon={DollarSign} />
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <Metric label="Color" value={rwa.color} icon={Palette} />
                  <Metric label="Clarity" value={rwa.clarity} icon={Eye} />
                  <Metric label="Cut" value={rwa.cut} icon={PenTool} />
                  <Metric label="Treatment" value={rwa.treatment?.replace(/_/g, ' ')} icon={FileCheck} />
                </div>
                <div className="grid grid-cols-2 gap-x-12 mb-6">
                  <InfoRow label="Origin" value={`${rwa.origin.mine}, ${rwa.origin.region}, ${rwa.origin.country}`} />
                  <InfoRow label="Value/Carat" value={`$${rwa.appraisedValuePerCarat?.toLocaleString()}`} />
                  <InfoRow label="Appreciation" value={`${rwa.historicalAppreciation}%/yr`} />
                  <InfoRow label="Insurance" value={fNum(rwa.insuranceValue)} />
                  <InfoRow label="Custodian" value={`${rwa.custodian} — ${rwa.vaultLocation}`} />
                  <InfoRow label="Cert. #" value={rwa.certificationNumber} copy={rwa.certificationNumber} />
                </div>
                <div className="flex flex-wrap gap-3">
                  <StatusBadge label={`GIA Certified — ${rwa.certificationBody}`} ok={rwa.giaCertified} />
                  <StatusBadge label={rwa.insured ? "Insured" : "Not Insured"} ok={rwa.insured} />
                </div>
              </Panel>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* SOURCE CODE TAB                                    */}
        {/* ══════════════════════════════════════════════════ */}
        {tab === 'code' && (
          <Panel title="Verified Source Code" icon={Code} badge={`${contract.sourceCode?.split('\n').length || 0} lines`}>
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge label="Source Verified" ok />
              <StatusBadge label={`Audit: ${contract.auditScore}/100`} ok={contract.auditScore >= 70} />
              <StatusBadge label="ISO 20022" ok={contract.isoCompliant} />
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#e8e8e8]">
              <div className="bg-[#1a1a1a] flex items-center justify-between px-5 py-3 border-b border-[#333]">
                <span className="text-[11px] text-[#888] font-mono">{contract.name}.sol</span>
                <Cp t={contract.sourceCode || ''} />
              </div>
              <pre className="bg-[#0a0a0a] text-[#d4d4d4] p-6 text-[13px] font-mono leading-7 overflow-x-auto max-h-[700px] overflow-y-auto">
                {contract.sourceCode?.split('\n').map((line: string, i: number) => (
                  <div key={i} className="flex">
                    <span className="text-[#555] w-12 text-right mr-6 select-none shrink-0">{i + 1}</span>
                    <span>{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </Panel>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ABI TAB                                            */}
        {/* ══════════════════════════════════════════════════ */}
        {tab === 'abi' && (
          <Panel title="Contract ABI" icon={Layers} badge={`${contract.abi?.length || 0} entries`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contract.abi?.map((fn: any, i: number) => (
                <div key={i} className={cn("border rounded-2xl p-5 transition-all hover:shadow-sm", fn.type === 'event' ? "border-[#F59E0B]/25 bg-[#F59E0B]/3" : fn.stateMutability === 'view' ? "border-[#1D4ED8]/25 bg-[#1D4ED8]/3" : "border-[#e8e8e8] bg-white")}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className={cn("text-[8px] font-extrabold uppercase px-2.5 py-1 rounded-lg tracking-wider", fn.type === 'event' ? "bg-[#F59E0B]/12 text-[#F59E0B]" : fn.stateMutability === 'view' ? "bg-[#1D4ED8]/12 text-[#1D4ED8]" : "bg-[#0a0a0a]/8 text-[#0a0a0a]")}>
                      {fn.type === 'event' ? 'EVENT' : fn.stateMutability === 'view' ? 'READ' : 'WRITE'}
                    </span>
                    <span className="text-[13px] font-extrabold font-mono">{fn.name}</span>
                  </div>
                  <div className="text-[11px] text-[#888] font-mono bg-[#f7f7f7] rounded-lg px-3 py-2">
                    ({fn.inputs?.map((p: any) => `${p.type} ${p.name}`).join(', ')})
                  </div>
                  {fn.outputs?.length > 0 && (
                    <div className="text-[10px] text-[#aaa] font-mono mt-2">returns ({fn.outputs.map((o: any) => o.type).join(', ')})</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 bg-[#f7f7f7] rounded-2xl p-5 border border-[#e8e8e8]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#555]">Raw ABI JSON</span>
                <Cp t={JSON.stringify(contract.abi, null, 2)} />
              </div>
              <pre className="text-[11px] font-mono text-[#888] max-h-[200px] overflow-y-auto">{JSON.stringify(contract.abi, null, 2)}</pre>
            </div>
          </Panel>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* TRANSACTIONS TAB                                   */}
        {/* ══════════════════════════════════════════════════ */}
        {tab === 'transactions' && (
          <Panel title="Contract Transactions" icon={Activity} badge={`${contract.interactions} total`}>
            <div className="text-center py-16">
              <Activity size={40} className="text-[#ccc] mx-auto mb-4" />
              <h3 className="text-[16px] font-extrabold mb-2">Transaction History</h3>
              <p className="text-[13px] text-[#999]">{contract.interactions?.toLocaleString()} interactions recorded on 20022Chain</p>
              <p className="text-[11px] text-[#bbb] mt-2">Full transaction indexing coming in next release</p>
            </div>
          </Panel>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* EVENTS TAB                                         */}
        {/* ══════════════════════════════════════════════════ */}
        {tab === 'events' && (
          <Panel title="Contract Events" icon={Zap} badge={`${contract.abi?.filter((a: any) => a.type === 'event').length || 0} event types`}>
            <div className="space-y-3">
              {contract.abi?.filter((a: any) => a.type === 'event').map((ev: any, i: number) => (
                <div key={i} className="border border-[#F59E0B]/20 bg-[#F59E0B]/3 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-[#F59E0B]" />
                    <span className="text-[14px] font-extrabold font-mono">{ev.name}</span>
                  </div>
                  <div className="text-[12px] font-mono text-[#888]">
                    ({ev.inputs?.map((p: any) => `${p.type} ${p.name}`).join(', ')})
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </main>
    </div>
  );
}
