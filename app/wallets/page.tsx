"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet, Shield, Lock, BadgeCheck, Search, Users, Building2, Mountain,
  Music, Film, Cpu, Zap, Scale, PenTool, Fingerprint, Hash, Eye, EyeOff,
  ChevronRight, Copy, Check, ExternalLink, Plus, Award, Globe, Banknote,
  ArrowLeft, ArrowLeftRight, RefreshCw, Flag, MapPin, Heart, Wrench, Brain, Trophy,
  TrendingUp, Newspaper, GraduationCap, ChefHat, Plane, Swords, HandHeart,
  Pill, Fuel, Radio, Gamepad2, Palette, Code, FlaskConical
} from "lucide-react";
import { cn } from "@/lib/utils";

// ISO → flag emoji
function countryFlag(code?: string) {
  if (!code) return '';
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65));
}

// Top countries for quick selector
const COUNTRY_LIST = [
  { code: 'MX', name: 'Mexico' }, { code: 'US', name: 'United States' }, { code: 'CO', name: 'Colombia' },
  { code: 'BR', name: 'Brazil' }, { code: 'AR', name: 'Argentina' }, { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' }, { code: 'SV', name: 'El Salvador' }, { code: 'PA', name: 'Panama' },
  { code: 'CA', name: 'Canada' }, { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'ES', name: 'Spain' }, { code: 'IT', name: 'Italy' },
  { code: 'CH', name: 'Switzerland' }, { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' }, { code: 'IN', name: 'India' }, { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'UAE' }, { code: 'AU', name: 'Australia' }, { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' }, { code: 'RU', name: 'Russia' }, { code: 'TR', name: 'Turkey' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'IL', name: 'Israel' }, { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' }, { code: 'UY', name: 'Uruguay' }, { code: 'DO', name: 'Dominican Rep.' },
  { code: 'GT', name: 'Guatemala' }, { code: 'CR', name: 'Costa Rica' }, { code: 'HN', name: 'Honduras' },
  { code: 'BO', name: 'Bolivia' }, { code: 'PY', name: 'Paraguay' }, { code: 'NI', name: 'Nicaragua' },
  { code: 'CU', name: 'Cuba' }, { code: 'JM', name: 'Jamaica' }, { code: 'TT', name: 'Trinidad' },
  { code: 'PR', name: 'Puerto Rico' }, { code: 'NL', name: 'Netherlands' }, { code: 'SE', name: 'Sweden' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'IE', name: 'Ireland' },
  { code: 'GR', name: 'Greece' }, { code: 'TH', name: 'Thailand' }, { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' }, { code: 'ID', name: 'Indonesia' }, { code: 'VN', name: 'Vietnam' },
  { code: 'HK', name: 'Hong Kong' }, { code: 'TW', name: 'Taiwan' }, { code: 'KE', name: 'Kenya' },
  { code: 'EG', name: 'Egypt' }, { code: 'GH', name: 'Ghana' },
];

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

const TYPE_CFG: Record<string, { label: string; icon: any; color: string }> = {
  PERSONAL:      { label: 'Personal',       icon: Users,        color: '#555' },
  BUSINESS:      { label: 'Business',       icon: Building2,    color: '#1D4ED8' },
  INSTITUTIONAL: { label: 'Institution',    icon: Banknote,     color: '#6B7280' },
  GOVERNMENT:    { label: 'Government',     icon: Shield,       color: '#D4A017' },
  DEVELOPER:     { label: 'Developer',      icon: Cpu,          color: '#059669' },
  MUSICIAN:      { label: 'Musician',       icon: Music,        color: '#DB2777' },
  INFLUENCER:    { label: 'Influencer',     icon: Zap,          color: '#F59E0B' },
  FILMMAKER:     { label: 'Filmmaker',      icon: Film,         color: '#EF4444' },
  ATTORNEY:      { label: 'Legal',          icon: Scale,        color: '#6B7280' },
  AUDITOR:       { label: 'Auditor',        icon: Shield,       color: '#059669' },
  MINER:         { label: 'Mining',         icon: Mountain,     color: '#92700a' },
  REALTOR:       { label: 'Real Estate',    icon: Building2,    color: '#1D4ED8' },
  DOCTOR:        { label: 'Doctor',         icon: Heart,        color: '#EF4444' },
  ENGINEER:      { label: 'Engineer',       icon: Wrench,       color: '#0369A1' },
  AI_RESEARCHER: { label: 'AI / ML',        icon: Brain,        color: '#7C3AED' },
  ATHLETE:       { label: 'Sports',         icon: Trophy,       color: '#D97706' },
  TRADER:        { label: 'Trader',         icon: TrendingUp,   color: '#059669' },
  JOURNALIST:    { label: 'Journalist',     icon: Newspaper,    color: '#555' },
  PROFESSOR:     { label: 'Academic',       icon: GraduationCap,color: '#1D4ED8' },
  CHEF:          { label: 'Chef',           icon: ChefHat,      color: '#DC2626' },
  PILOT:         { label: 'Aviation',       icon: Plane,        color: '#0284C7' },
  MILITARY:      { label: 'Military',       icon: Swords,       color: '#365314' },
  NGO:           { label: 'NGO',            icon: HandHeart,    color: '#0891B2' },
  PHARMA:        { label: 'Pharma',         icon: Pill,         color: '#059669' },
  ENERGY:        { label: 'Energy',         icon: Fuel,         color: '#D97706' },
  TELECOM:       { label: 'Telecom',        icon: Radio,        color: '#4F46E5' },
  ESPORTS:       { label: 'Esports',        icon: Gamepad2,     color: '#9333EA' },
  DESIGNER:      { label: 'Designer',       icon: Palette,      color: '#DB2777' },
};

function Cp({ t }: { t: string }) {
  const [ok, setOk] = useState(false);
  return <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t); setOk(true); setTimeout(() => setOk(false), 1200); }} className="inline-flex items-center justify-center w-6 h-6 rounded-lg hover:bg-black/5 transition-colors" aria-label="Copy">{ok ? <Check size={11} className="text-[#00C853]" /> : <Copy size={11} className="text-[#ccc]" />}</button>;
}

function SealBadge({ seal, size = 20 }: { seal?: string; size?: number }) {
  const cfg = seal ? SEAL_CFG[seal] : null;
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <div className={`rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg`} title={cfg.label}
      style={{ width: size, height: size, boxShadow: `0 2px 6px ${cfg.color}40` }}>
      <Icon size={size * 0.55} className="text-white" />
    </div>
  );
}

function fBal(n: number) {
  if (n < 0) return '●●●●●●';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterVis, setFilterVis] = useState<string>('');
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [filterCountry, setFilterCountry] = useState<string>('');

  // Create form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('PERSONAL');
  const [newVis, setNewVis] = useState('PUBLIC');
  const [newCategory, setNewCategory] = useState('');
  const [newNationality, setNewNationality] = useState('');
  const [newBalancePublic, setNewBalancePublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterVis) params.set('visibility', filterVis);
      if (filterCountry) params.set('country', filterCountry);
      const r = await fetch(`/api/wallets?${params}`);
      const d = await r.json();
      setWallets(d.wallets || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchWallets(); }, [filterType, filterVis, filterCountry]);

  const filtered = wallets.filter(w =>
    w.displayName.toLowerCase().includes(search.toLowerCase()) ||
    w.address.toLowerCase().includes(search.toLowerCase()) ||
    w.walletType.toLowerCase().includes(search.toLowerCase()) ||
    (w.entityCategory || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.nationality || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.countryName || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    setCreating(true);
    try {
      const r = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name: newName, walletType: newType, visibility: newVis, entityCategory: newCategory, nationality: newNationality || undefined, balancePublic: newBalancePublic }),
      });
      const d = await r.json();
      if (d.success) {
        setShowCreate(false);
        setNewName(''); setNewCategory(''); setNewNationality('');
        fetchWallets();
      }
    } catch (e) { console.error(e); }
    setCreating(false);
  };

  return (
    <div className="h-screen flex flex-col bg-white text-[#0a0a0a] overflow-hidden">
      {/* HEADER */}
      <header className="border-b border-[#e8e8e8] bg-white shrink-0 z-50">
        <div className="h-14 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl border-[1.5px] border-[#0a0a0a] flex items-center justify-center relative">
                <Wallet size={14} className="text-[#0a0a0a]" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00C853] border-[1.5px] border-white live-dot" />
              </div>
              <div>
                <h1 className="text-[13px] font-extrabold text-[#0a0a0a] tracking-[.15em] uppercase leading-none">20022Chain</h1>
                <p className="text-[8px] text-[#aaa] font-mono mt-0.5 tracking-widest">VERIFIED WALLETS</p>
              </div>
            </a>
            <div className="w-px h-6 bg-[#e8e8e8]" />
            <span className="text-[11px] font-bold text-[#0a0a0a]">{wallets.length} Wallets</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="btn-outline"><ArrowLeft size={12} /> Explorer</a>
            <a href="/bridge" className="btn-outline"><ArrowLeftRight size={12} /> Bridge</a>
            <a href="/payments" className="btn-outline"><Banknote size={12} /> Gpay3</a>
            <a href="/reserves" className="btn-outline"><Shield size={12} /> PoR</a>
            <a href="/contracts" className="btn-outline"><Code size={12} /> Contracts</a>
            <a href="/sandbox" className="h-9 px-4 rounded-lg border-2 border-[#F59E0B] text-[#F59E0B] text-[10px] font-bold hover:bg-[#F59E0B]/10 flex items-center gap-1.5">
              <FlaskConical size={12} /> Sandbox
            </a>
            <button onClick={() => setShowCreate(true)} className="btn-primary h-9 px-4 text-[10px]">
              <Plus size={12} /> Create Wallet
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-[#FAFAFA]">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* FILTERS */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ccc]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search wallets by name, address, type..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e8e8] bg-white text-[13px] focus:border-[#0a0a0a] outline-none" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} aria-label="Filter by type"
            className="px-3 py-2.5 rounded-xl border border-[#e8e8e8] bg-white text-[12px] font-bold text-[#666] outline-none">
            <option value="">All Types</option>
            {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterVis} onChange={e => setFilterVis(e.target.value)} aria-label="Filter by visibility"
            className="px-3 py-2.5 rounded-xl border border-[#e8e8e8] bg-white text-[12px] font-bold text-[#666] outline-none">
            <option value="">All Visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="ANONYMOUS">Anonymous</option>
          </select>
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} aria-label="Filter by country"
            className="px-3 py-2.5 rounded-xl border border-[#e8e8e8] bg-white text-[12px] font-bold text-[#666] outline-none">
            <option value="">{countryFlag('')} All Countries</option>
            {COUNTRY_LIST.map(c => <option key={c.code} value={c.code}>{countryFlag(c.code)} {c.code} — {c.name}</option>)}
          </select>
          <button onClick={fetchWallets} className="p-2.5 rounded-xl border border-[#e8e8e8] hover:bg-[#f3f3f3] transition-colors" aria-label="Refresh">
            <RefreshCw size={14} className={cn("text-[#888]", loading && "animate-spin")} />
          </button>
        </div>

        {/* WALLET TYPE STATS */}
        <div className="grid grid-cols-7 gap-2 mb-8">
          {[
            { type: 'GOVERNMENT', label: 'Government', icon: Shield, color: '#D4A017' },
            { type: 'INSTITUTIONAL', label: 'Institutional', icon: Building2, color: '#6B7280' },
            { type: 'DOCTOR', label: 'Medical', icon: Heart, color: '#EF4444' },
            { type: 'AI_RESEARCHER', label: 'AI / ML', icon: Brain, color: '#7C3AED' },
            { type: 'ATHLETE', label: 'Sports', icon: Trophy, color: '#D97706' },
            { type: 'DEVELOPER', label: 'Developers', icon: Cpu, color: '#059669' },
            { type: 'MUSICIAN', label: 'Musicians', icon: Music, color: '#DB2777' },
          ].map(s => {
            const count = wallets.filter(w => w.walletType === s.type).length;
            return (
              <div key={s.type} onClick={() => setFilterType(filterType === s.type ? '' : s.type)}
                className={cn("bg-white border rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md", filterType === s.type ? "border-[#0a0a0a] shadow-md" : "border-[#e8e8e8]")}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}10` }}>
                    <s.icon size={14} style={{ color: s.color }} />
                  </div>
                </div>
                <div className="text-[20px] font-extrabold">{count}</div>
                <div className="text-[9px] text-[#aaa] font-bold uppercase tracking-wider">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* WALLET LIST */}
        <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_180px_120px_120px_120px_100px] gap-3 px-6 py-3 border-b border-[#e8e8e8] bg-[#FAFAFA]">
            <span className="text-[9px] font-extrabold text-[#aaa] uppercase tracking-wider">Identity</span>
            <span className="text-[9px] font-extrabold text-[#aaa] uppercase tracking-wider">Address</span>
            <span className="text-[9px] font-extrabold text-[#aaa] uppercase tracking-wider text-center">Type</span>
            <span className="text-[9px] font-extrabold text-[#aaa] uppercase tracking-wider text-center">Visibility</span>
            <span className="text-[9px] font-extrabold text-[#aaa] uppercase tracking-wider text-right">Balance</span>
            <span className="text-[9px] font-extrabold text-[#aaa] uppercase tracking-wider text-center">Status</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={20} className="animate-spin text-[#ccc]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-[#ccc] text-[13px]">No wallets found</div>
          ) : (
            <div className="divide-y divide-[#f3f3f3]">
              {filtered.map((w: any) => {
                const tc = TYPE_CFG[w.walletType] || TYPE_CFG.PERSONAL;
                const TIcon = tc.icon;
                return (
                  <div key={w.address} onClick={() => setSelected(selected?.address === w.address ? null : w)}
                    className={cn("grid grid-cols-[1fr_180px_120px_120px_120px_100px] gap-3 px-6 py-4 items-center cursor-pointer transition-all hover:bg-[#FAFAFA]", selected?.address === w.address && "bg-[#f8fff8]")}>
                    {/* Identity */}
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[14px] font-extrabold" style={{ backgroundColor: `${tc.color}10`, border: `2px solid ${tc.color}25`, color: tc.color }}>
                          {w.displayName.includes('████') ? <Lock size={14} /> : w.displayName.charAt(0)}
                        </div>
                        {w.verified && (
                          <div className="absolute -bottom-1 -right-1 border-[1.5px] border-white rounded-full">
                            <SealBadge seal={w.seal} size={16} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold truncate">{w.displayName}</span>
                          {w.verified && <SealBadge seal={w.seal} size={13} />}
                          {w.nationality && w.nationalityVerified && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#f0f7ff] border border-[#d0e3ff] text-[#1D4ED8]" title={w.countryName || w.nationality}>
                              <span className="text-[11px] leading-none">{countryFlag(w.nationality)}</span> {w.nationality}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {w.entityCategory && (
                            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: tc.color, backgroundColor: `${tc.color}10` }}>
                              {w.entityCategory}
                            </span>
                          )}
                          {w.privacyShield && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#0a0a0a] text-white flex items-center gap-0.5"><Lock size={7} /> PRIVATE</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-[#888] truncate">{w.address.slice(0, 24)}...</span>
                      <Cp t={w.address} />
                    </div>

                    {/* Type */}
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-1 rounded-lg" style={{ color: tc.color, backgroundColor: `${tc.color}10`, border: `1px solid ${tc.color}20` }}>
                        <TIcon size={9} /> {tc.label}
                      </span>
                    </div>

                    {/* Visibility */}
                    <div className="flex justify-center">
                      <span className={cn("inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg",
                        w.visibility === 'PUBLIC' ? "text-[#00C853] bg-[#00C853]/10" :
                        w.visibility === 'PRIVATE' ? "text-[#555] bg-[#555]/10" :
                        "text-[#0a0a0a] bg-[#0a0a0a]/10"
                      )}>
                        {w.visibility === 'PUBLIC' ? <Eye size={9} /> : <EyeOff size={9} />}
                        {w.visibility}
                      </span>
                    </div>

                    {/* Balance */}
                    <div className="text-right">
                      {w.nativeBalance < 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <Lock size={10} className="text-[#ccc]" />
                          <span className="text-[13px] font-extrabold font-mono text-[#ccc]">●●●●●●</span>
                        </div>
                      ) : (
                        <div className="text-[13px] font-extrabold font-mono">{fBal(w.nativeBalance)}</div>
                      )}
                      <div className="text-[9px] text-[#aaa] flex items-center justify-end gap-1">
                        ARCHT
                        {w.nativeBalance < 0 && <span className="text-[7px] text-[#bbb] uppercase">private</span>}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex justify-center">
                      {w.verified ? (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-1 rounded-lg text-[#00C853] bg-[#00C853]/10 border border-[#00C853]/20">
                          {w.verificationLevel}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-1 rounded-lg text-[#ccc] bg-[#f3f3f3]">
                          UNVERIFIED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SELECTED WALLET DETAIL */}
        {selected && (
          <div className="mt-6 bg-white border border-[#e8e8e8] rounded-2xl p-8">
            {(() => {
              const w = selected;
              const tc = TYPE_CFG[w.walletType] || TYPE_CFG.PERSONAL;
              const sc = w.seal ? SEAL_CFG[w.seal] : SEAL_CFG.VERIFIED;
              return (
                <>
                  <div className="flex items-center gap-5 mb-8">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[24px] font-extrabold" style={{ backgroundColor: `${tc.color}10`, border: `2px solid ${tc.color}25`, color: tc.color }}>
                        {w.displayName.includes('████') ? <Lock size={24} /> : w.displayName.charAt(0)}
                      </div>
                      {w.verified && sc && (
                        <div className="absolute -bottom-2 -right-2 border-2 border-white rounded-full">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${sc.gradient} flex items-center justify-center shadow-xl`} style={{ boxShadow: `0 4px 12px ${sc.color}40` }}>
                            <sc.icon size={16} className="text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[22px] font-extrabold">{w.displayName}</h2>
                        {w.verified && sc && (
                          <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ color: sc.color, backgroundColor: `${sc.color}10`, border: `1px solid ${sc.color}20` }}>
                            <sc.icon size={10} /> {sc.label}
                          </span>
                        )}
                        {w.nationality && w.nationalityVerified && (
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5 bg-[#f0f7ff] border border-[#d0e3ff] text-[#1D4ED8]">
                            <span className="text-[14px] leading-none">{countryFlag(w.nationality)}</span> {w.nationality} <span className="text-[#888] font-normal">·</span> <span className="text-[#555]">{w.countryName}</span>
                          </span>
                        )}
                        {w.privacyShield && <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-[#0a0a0a] text-white flex items-center gap-1"><Lock size={8} /> PRIVACY SHIELD</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] font-mono text-[#888]">{w.address}</span>
                        <Cp t={w.address} />
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-5 gap-4 mb-6">
                    <div className="bg-[#FAFAFA] border border-[#e8e8e8] rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-[#aaa] font-bold uppercase">Balance</span>
                        <span className={cn("text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5",
                          w.nativeBalance >= 0 ? "text-[#00C853] bg-[#00C853]/10" : "text-[#888] bg-[#888]/10"
                        )}>
                          {w.nativeBalance >= 0 ? <><Eye size={7} /> Public</> : <><EyeOff size={7} /> Private</>}
                        </span>
                      </div>
                      {w.nativeBalance < 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Lock size={16} className="text-[#ccc]" />
                          <span className="text-[20px] font-extrabold font-mono text-[#ccc]">●●●●●●</span>
                        </div>
                      ) : (
                        <div className="text-[20px] font-extrabold font-mono">{fBal(w.nativeBalance)}</div>
                      )}
                      <div className="text-[10px] text-[#888]">ARCHT</div>
                    </div>
                    <div className="bg-[#FAFAFA] border border-[#e8e8e8] rounded-2xl p-4">
                      <div className="text-[9px] text-[#aaa] font-bold uppercase mb-1">Type</div>
                      <div className="flex items-center gap-1.5">
                        <tc.icon size={16} style={{ color: tc.color }} />
                        <span className="text-[14px] font-extrabold">{tc.label}</span>
                      </div>
                      {w.entityCategory && <div className="text-[10px] text-[#888] mt-0.5">{w.entityCategory}</div>}
                    </div>
                    <div className="bg-[#FAFAFA] border border-[#e8e8e8] rounded-2xl p-4">
                      <div className="text-[9px] text-[#aaa] font-bold uppercase mb-1">Verification</div>
                      <div className="text-[14px] font-extrabold" style={{ color: w.verified ? '#00C853' : '#EF4444' }}>{w.verificationLevel}</div>
                      {w.verifiedAt && <div className="text-[10px] text-[#888] mt-0.5">{new Date(w.verifiedAt).toLocaleDateString()}</div>}
                    </div>
                    <div className="bg-[#FAFAFA] border border-[#e8e8e8] rounded-2xl p-4">
                      <div className="text-[9px] text-[#aaa] font-bold uppercase mb-1">Nationality</div>
                      {w.nationality ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[22px] leading-none">{countryFlag(w.nationality)}</span>
                            <span className="text-[18px] font-extrabold">{w.nationality}</span>
                          </div>
                          <div className="text-[10px] text-[#888] mt-0.5 flex items-center gap-1">
                            {w.countryName}
                            {w.nationalityVerified && <BadgeCheck size={10} className="text-[#00C853]" />}
                          </div>
                        </>
                      ) : (
                        <div className="text-[14px] text-[#ccc] font-bold">—</div>
                      )}
                    </div>
                    <div className="bg-[#FAFAFA] border border-[#e8e8e8] rounded-2xl p-4">
                      <div className="text-[9px] text-[#aaa] font-bold uppercase mb-1">Visibility</div>
                      <div className="flex items-center gap-1.5">
                        {w.visibility === 'PUBLIC' ? <Eye size={14} className="text-[#00C853]" /> : <EyeOff size={14} className="text-[#555]" />}
                        <span className="text-[14px] font-extrabold">{w.visibility}</span>
                      </div>
                      {w.hiddenFields?.length > 0 && <div className="text-[10px] text-[#888] mt-0.5">Hidden: {w.hiddenFields.join(', ')}</div>}
                    </div>
                  </div>

                  {/* Badges */}
                  {w.badges?.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] text-[#aaa] font-bold uppercase">Badges:</span>
                      {w.badges.map((b: string) => (
                        <span key={b} className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#f3f3f3] text-[#555] border border-[#e8e8e8]">{b}</span>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* CREATE WALLET MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-3xl border border-[#e8e8e8] p-8 w-[520px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[18px] font-extrabold mb-6">Create New Wallet</h3>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-[#aaa] uppercase tracking-wider block mb-1.5">Display Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Your name or alias"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e8e8e8] text-[13px] focus:border-[#0a0a0a] outline-none" />
              </div>

              <div>
                <label className="text-[9px] font-bold text-[#aaa] uppercase tracking-wider block mb-1.5">Wallet Type</label>
                <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-1">
                  {Object.entries(TYPE_CFG).map(([k, v]) => {
                    const I = v.icon;
                    return (
                      <button key={k} onClick={() => setNewType(k)}
                        className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all", newType === k ? "border-[#0a0a0a] bg-[#0a0a0a]/5 shadow-md" : "border-[#e8e8e8] hover:border-[#ccc]")}>
                        <I size={16} style={{ color: v.color }} />
                        <span className="text-[8px] font-bold uppercase">{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-[#aaa] uppercase tracking-wider block mb-1.5">Visibility</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'PUBLIC', label: 'Public', desc: 'All info visible', icon: Eye, color: '#00C853' },
                    { val: 'PRIVATE', label: 'Private', desc: 'Identity verified but hidden', icon: EyeOff, color: '#555' },
                    { val: 'ANONYMOUS', label: 'Anonymous', desc: 'Maximum privacy', icon: Lock, color: '#0a0a0a' },
                  ].map(v => (
                    <button key={v.val} onClick={() => setNewVis(v.val)}
                      className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all", newVis === v.val ? "border-[#0a0a0a] bg-[#0a0a0a]/5 shadow-md" : "border-[#e8e8e8] hover:border-[#ccc]")}>
                      <v.icon size={16} style={{ color: v.color }} />
                      <span className="text-[9px] font-bold">{v.label}</span>
                      <span className="text-[7px] text-[#aaa]">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-[#aaa] uppercase tracking-wider block mb-1.5">Balance Visibility</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setNewBalancePublic(true)}
                    className={cn("flex items-center justify-center gap-2 p-3 rounded-xl border text-center transition-all", newBalancePublic ? "border-[#00C853] bg-[#00C853]/5 shadow-md" : "border-[#e8e8e8] hover:border-[#ccc]")}>
                    <Eye size={16} className={newBalancePublic ? "text-[#00C853]" : "text-[#ccc]"} />
                    <div>
                      <span className={cn("text-[10px] font-bold block", newBalancePublic ? "text-[#00C853]" : "text-[#888]")}>Public Balance</span>
                      <span className="text-[7px] text-[#aaa]">Everyone can see</span>
                    </div>
                  </button>
                  <button onClick={() => setNewBalancePublic(false)}
                    className={cn("flex items-center justify-center gap-2 p-3 rounded-xl border text-center transition-all", !newBalancePublic ? "border-[#0a0a0a] bg-[#0a0a0a]/5 shadow-md" : "border-[#e8e8e8] hover:border-[#ccc]")}>
                    <EyeOff size={16} className={!newBalancePublic ? "text-[#0a0a0a]" : "text-[#ccc]"} />
                    <div>
                      <span className={cn("text-[10px] font-bold block", !newBalancePublic ? "text-[#0a0a0a]" : "text-[#888]")}>Private Balance</span>
                      <span className="text-[7px] text-[#aaa]">Only you can see</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-[#aaa] uppercase tracking-wider block mb-1.5">Nationality</label>
                <select value={newNationality} onChange={e => setNewNationality(e.target.value)} aria-label="Select nationality"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e8e8e8] text-[13px] focus:border-[#0a0a0a] outline-none bg-white">
                  <option value="">No nationality / Skip</option>
                  {COUNTRY_LIST.map(c => <option key={c.code} value={c.code}>{countryFlag(c.code)} {c.code} — {c.name}</option>)}
                </select>
                {newNationality && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-[#f0f7ff] border border-[#d0e3ff]">
                    <span className="text-[20px]">{countryFlag(newNationality)}</span>
                    <span className="text-[13px] font-extrabold text-[#1D4ED8]">{newNationality}</span>
                    <span className="text-[11px] text-[#888]">{COUNTRY_LIST.find(c => c.code === newNationality)?.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[9px] font-bold text-[#aaa] uppercase tracking-wider block mb-1.5">Category (optional)</label>
                <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Hip-Hop, Mining, AI Research..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e8e8e8] text-[13px] focus:border-[#0a0a0a] outline-none" />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-[#e8e8e8] text-[12px] font-bold text-[#888] hover:bg-[#f3f3f3]">Cancel</button>
              <button onClick={handleCreate} disabled={!newName || creating}
                className="flex-1 py-2.5 rounded-xl bg-[#0a0a0a] text-white text-[12px] font-bold hover:bg-[#222] disabled:opacity-40 transition-colors">
                {creating ? 'Creating...' : 'Create Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}
      </main>

      {/* FOOTER */}
      <footer className="h-9 border-t border-[#e8e8e8] bg-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3 text-[10px] text-[#aaa] font-mono">
          <span className="font-bold text-[#0a0a0a] tracking-wider">20022CHAIN</span>
          <span>Verified Wallets</span>
          <div className="w-px h-3 bg-[#e8e8e8]" />
          <span>{wallets.length} wallets</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00C853] live-dot" />
          <span className="text-[#00C853] font-bold font-mono">ONLINE</span>
        </div>
      </footer>
    </div>
  );
}
