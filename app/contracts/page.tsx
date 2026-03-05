"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Code, Play, Upload, Sparkles, FileText, Check, X, Copy, ChevronDown,
  ChevronRight, Link2, ExternalLink, Box, Shield, Zap, AlertTriangle,
  Loader2, ArrowRight, ArrowLeftRight, Terminal, Eye, Braces, Cpu, Hash, RefreshCw,
  Activity, ArrowUpRight, BarChart3, ShieldCheck, ShieldAlert, ShieldX,
  AlertCircle, Info, Lock, Fuel, BadgeCheck, Fingerprint, Award, Building2, Mountain, Music,
  Wallet, Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// SEAL SYSTEM (shared config)
const SEAL_CFG: Record<string, { color: string; icon: any; gradient: string; label: string }> = {
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

type View = 'editor' | 'deployed' | 'templates';
type EditorTab = 'code' | 'abi' | 'output' | 'audit';

function Cp({ t }: { t: string }) {
  const [ok, setOk] = useState(false);
  return <button onClick={() => { navigator.clipboard.writeText(t); setOk(true); setTimeout(() => setOk(false), 1200); }} className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-black/5 transition-colors" aria-label="Copy">{ok ? <Check size={11} className="text-[#00C853]" /> : <Copy size={11} className="text-[#ccc]" />}</button>;
}
function fNum(n: number) { if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`; return n.toLocaleString(); }

/** Native address renderer for contract addresses */
function AddrC({ a, full = false }: { a: string; full?: boolean }) {
  if (!a) return <span className="text-[#ccc]">—</span>;
  if (a.startsWith('0x')) return <span className="text-[11px] font-mono text-[#888]">{full ? a : `${a.slice(0, 14)}...`}</span>;
  const parts = a.split(':');
  if (parts[0] === 'archt' && parts.length >= 3) {
    const addrType = parts[1];
    const context = parts.length === 4 ? parts[2] : null;
    const hash = parts[parts.length - 1];
    const colors: Record<string, string> = { 'contract': '#00C853', 'owner': '#7C3AED', 'account': '#555' };
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-mono">
        <span className="text-[#bbb]">archt:</span>
        <span className="font-semibold" style={{ color: colors[addrType] || '#059669' }}>{addrType}</span>
        {context && <><span className="text-[#ccc]">:</span><span className="text-[#0a0a0a] font-semibold">{full ? context : context.slice(0, 14)}</span></>}
        <span className="text-[#ccc]">:</span>
        <span className="text-[#999]">{full ? hash : hash.slice(0, 8)}...</span>
      </span>
    );
  }
  if (a.startsWith('tx:')) return <span className="text-[11px] font-mono"><span className="text-[#F59E0B] font-semibold">tx</span><span className="text-[#ccc]">:</span><span className="text-[#888]">{full ? a.slice(3) : `${a.slice(3, 15)}...`}</span></span>;
  return <span className="text-[11px] font-mono text-[#888]">{full ? a : a.length > 25 ? `${a.slice(0, 20)}...` : a}</span>;
}

export default function ContractsPage() {
  const [view, setView] = useState<View>('editor');
  const [code, setCode] = useState('');
  const [contractName, setContractName] = useState('');
  const [contractDesc, setContractDesc] = useState('');
  const [contractType, setContractType] = useState('rwa');
  const [aiPrompt, setAiPrompt] = useState('');
  const [editorTab, setEditorTab] = useState<EditorTab>('code');

  const [regFilter, setRegFilter] = useState('ALL');
  const [compileResult, setCompileResult] = useState<any>(null);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [aiPrompts, setAiPrompts] = useState<any[]>([]);
  const [selContract, setSelContract] = useState<any>(null);

  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditing, setAuditing] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts');
      const data = await res.json();
      setContracts(data.contracts || []);
      setTemplates(data.templates || []);
      setAiPrompts(data.aiPrompts || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const handleAudit = async () => {
    if (!code.trim()) return;
    setAuditing(true); setAuditResult(null);
    try {
      const res = await fetch('/api/contracts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'audit', sourceCode: code }) });
      const data = await res.json();
      setAuditResult(data);
      setEditorTab('audit');
    } catch (e) { setAuditResult(null); }
    setAuditing(false);
  };

  const handleCompile = async () => {
    if (!code.trim()) return;
    setCompiling(true); setCompileResult(null);
    // Auto-audit when compiling
    try {
      const [compileRes, auditRes] = await Promise.all([
        fetch('/api/contracts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'compile', sourceCode: code }) }).then(r => r.json()),
        fetch('/api/contracts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'audit', sourceCode: code }) }).then(r => r.json()),
      ]);
      setCompileResult(compileRes);
      setAuditResult(auditRes);
      setEditorTab('audit');
    } catch (e) { setCompileResult({ success: false, errors: ['Network error'] }); }
    setCompiling(false);
  };

  const handleDeploy = async () => {
    if (!code.trim() || !contractName.trim()) return;
    // Block deploy if audit score < 60 or critical found
    if (auditResult && (!auditResult.deployable)) {
      setDeployResult({ success: false, error: `Deploy blocked: Audit score ${auditResult.score}/100 (Grade ${auditResult.grade}). ${auditResult.stats?.criticalCount || 0} critical issue(s). Fix all critical vulnerabilities and reach score >= 60 to deploy.` });
      setEditorTab('output');
      return;
    }
    setDeploying(true); setDeployResult(null);
    try {
      // Run audit first if not done
      if (!auditResult) {
        const auditRes = await fetch('/api/contracts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'audit', sourceCode: code }) }).then(r => r.json());
        setAuditResult(auditRes);
        if (!auditRes.deployable) {
          setDeployResult({ success: false, error: `Deploy blocked: Audit score ${auditRes.score}/100 (Grade ${auditRes.grade}). Fix critical vulnerabilities first.` });
          setEditorTab('audit');
          setDeploying(false);
          return;
        }
      }
      const res = await fetch('/api/contracts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deploy', sourceCode: code, name: contractName, description: contractDesc, type: contractType }) });
      const data = await res.json();
      setDeployResult(data);
      if (data.success) fetchContracts();
      setEditorTab('output');
    } catch (e) { setDeployResult({ success: false, error: 'Network error' }); }
    setDeploying(false);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/contracts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate', prompt: aiPrompt }) });
      const data = await res.json();
      if (data.success) { setCode(data.code); setShowAI(false); setEditorTab('code'); }
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const loadTemplate = (tmpl: any) => {
    setCode(tmpl.code);
    setContractName(tmpl.name);
    setContractDesc(tmpl.description);
    setContractType(tmpl.type);
    setView('editor');
    setEditorTab('code');
    setCompileResult(null);
    setDeployResult(null);
    setAuditResult(null);
  };

  const VIEWS = [
    { id: 'editor' as View, label: 'Contract IDE', icon: Code },
    { id: 'deployed' as View, label: 'Deployed', icon: Box },
    { id: 'templates' as View, label: 'Templates', icon: FileText },
  ];

  const EXPLORER_TABS = [
    { id: 'home', label: 'Home', icon: Activity, href: '/' },
    { id: 'blocks', label: 'Blocks', icon: Box, href: '/?tab=blocks' },
    { id: 'transactions', label: 'Transactions', icon: ArrowUpRight, href: '/?tab=transactions' },
    { id: 'isin', label: 'Instruments', icon: Hash, href: '/?tab=isin' },
    { id: 'validators', label: 'Validators', icon: Shield, href: '/?tab=validators' },
    { id: 'stats', label: 'Data', icon: BarChart3, href: '/?tab=stats' },
  ];

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* ══════ HEADER ═══════════════════════════════════════════ */}
      <header className="border-b border-[#e8e8e8] bg-white shrink-0 z-50">
        <div className="h-14 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl border-[1.5px] border-[#0a0a0a] flex items-center justify-center relative">
                <Code size={14} className="text-[#0a0a0a]" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00C853] border-[1.5px] border-white live-dot" />
              </div>
              <div>
                <h1 className="text-[13px] font-extrabold text-[#0a0a0a] tracking-[.15em] uppercase leading-none">20022Chain</h1>
                <p className="text-[8px] text-[#aaa] font-mono mt-0.5 tracking-widest">SMART CONTRACT IDE</p>
              </div>
            </a>
            <div className="w-px h-6 bg-[#e8e8e8]" />
            <nav className="flex items-center gap-1">
              {EXPLORER_TABS.map(t => {
                const Icon = t.icon;
                return (
                  <a key={t.id} href={t.href} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all text-[#888] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]">
                    <Icon size={13} />
                    {t.label}
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="btn-outline"><ArrowRight size={12} /> Explorer</a>
            <a href="/wallets" className="btn-outline"><Wallet size={12} /> Wallets</a>
            <a href="/bridge" className="btn-outline"><ArrowLeftRight size={12} /> Bridge</a>
            <a href="/payments" className="btn-outline"><Banknote size={12} /> Gpay3</a>
            <a href="/reserves" className="btn-outline"><Shield size={12} /> PoR</a>
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="btn-outline">
              ARCHT <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </header>

      {/* ══════ CONTRACTS SUB-HEADER ════════════════════════════ */}
      <div className="h-11 px-8 border-b border-[#e8e8e8] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          {VIEWS.map(v => { const Icon = v.icon; return (
            <button key={v.id} onClick={() => setView(v.id)} className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all", view === v.id ? "bg-[#0a0a0a] text-white" : "text-[#888] hover:text-[#0a0a0a] hover:bg-white")}>
              <Icon size={13} />{v.label}
            </button>
          ); })}
        </div>
        <button onClick={() => setShowAI(true)} className="flex items-center gap-2 h-7 px-4 rounded-lg bg-[#00C853] text-white text-[10px] font-bold hover:bg-[#00B048] transition-colors">
          <Sparkles size={12} /> AI Generate
        </button>
      </div>

      {/* MAIN */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={view} className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>

{/* ═══════ EDITOR ═══════════════════════════════════════ */}
{view === 'editor' && (
  <div className="h-full flex">
    {/* Left sidebar — Contract config */}
    <div className="w-72 border-r border-[#e8e8e8] bg-[#FAFAFA] p-4 space-y-4 shrink-0 overflow-y-auto">
      <div>
        <label className="text-[9px] font-bold text-[#999] uppercase tracking-widest block mb-1.5">Contract Name</label>
        <input type="text" value={contractName} onChange={e => setContractName(e.target.value)} placeholder="My Token" className="w-full bg-white border border-[#e8e8e8] rounded-lg px-3 py-2 text-sm focus:border-[#0a0a0a] outline-none" />
      </div>
      <div>
        <label className="text-[9px] font-bold text-[#999] uppercase tracking-widest block mb-1.5">Description</label>
        <textarea value={contractDesc} onChange={e => setContractDesc(e.target.value)} placeholder="What does this contract do?" className="w-full bg-white border border-[#e8e8e8] rounded-lg px-3 py-2 text-sm focus:border-[#0a0a0a] outline-none resize-none h-16" />
      </div>
      <div>
        <label className="text-[9px] font-bold text-[#999] uppercase tracking-widest block mb-1.5">Type</label>
        <select value={contractType} onChange={e => setContractType(e.target.value)} aria-label="Contract type" className="w-full bg-white border border-[#e8e8e8] rounded-lg px-3 py-2 text-sm focus:border-[#0a0a0a] outline-none">
          <option value="rwa">RWA Token</option><option value="token">Standard Token</option><option value="nft">NFT</option><option value="defi">DeFi</option><option value="governance">Governance</option><option value="oracle">Oracle</option><option value="custom">Custom</option>
        </select>
      </div>

      <div className="pt-2 space-y-2">
        <button onClick={handleAudit} disabled={auditing || !code.trim()} className={cn("w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold transition-all border-2", auditing ? "border-[#e8e8e8] text-[#999] bg-white" : "border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/5 hover:bg-[#F59E0B]/10")}>
          {auditing ? <><Loader2 size={14} className="animate-spin" /> Scanning...</> : <><ShieldCheck size={14} /> AI Security Audit</>}
        </button>
        <button onClick={handleCompile} disabled={compiling || !code.trim()} className={cn("w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold transition-all", compiling ? "bg-[#e8e8e8] text-[#999]" : "bg-[#0a0a0a] text-white hover:bg-[#222]")}>
          {compiling ? <><Loader2 size={14} className="animate-spin" /> Compiling...</> : <><Terminal size={14} /> Compile + Audit</>}
        </button>
        <button onClick={handleDeploy} disabled={deploying || !code.trim() || !contractName.trim()} className={cn("w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold transition-all", auditResult && !auditResult.deployable ? "bg-red-500/10 text-red-500 border-2 border-red-300 cursor-not-allowed" : deploying ? "bg-[#00C853]/50 text-white" : "bg-[#00C853] text-white hover:bg-[#00B048]")}>
          {auditResult && !auditResult.deployable ? <><ShieldX size={14} /> Deploy Blocked</> : deploying ? <><Loader2 size={14} className="animate-spin" /> Deploying...</> : <><Upload size={14} /> Deploy to Chain</>}
        </button>
        {auditResult && (
          <div className={cn("rounded-lg p-2.5 text-[10px] font-semibold flex items-center gap-2", auditResult.score >= 85 ? "bg-[#00C853]/10 text-[#00C853]" : auditResult.score >= 60 ? "bg-[#F59E0B]/10 text-[#F59E0B]" : "bg-red-500/10 text-red-500")}>
            <span className="text-lg font-extrabold font-mono">{auditResult.score}</span>
            <div><div>Grade {auditResult.grade}</div><div className="font-normal text-[9px] opacity-70">{auditResult.deployable ? 'Deployable' : 'BLOCKED'}</div></div>
          </div>
        )}
      </div>

      {/* Compile / Deploy Results */}
      {compileResult && (
        <div className={cn("rounded-lg p-3 text-xs", compileResult.success ? "bg-[#00C853]/5 border border-[#00C853]/20" : "bg-red-50 border border-red-200")}>
          <div className="flex items-center gap-1.5 mb-1.5 font-bold">{compileResult.success ? <><Check size={12} className="text-[#00C853]" /> Compiled</> : <><X size={12} className="text-red-500" /> Failed</>}</div>
          {compileResult.success && (
            <div className="space-y-1 text-[#555]">
              <div>Gas: <span className="font-mono font-bold">{compileResult.gasEstimate?.toLocaleString()}</span></div>
              <div>Audit: <span className={cn("font-bold", (compileResult.auditScore || 0) >= 90 ? "text-[#00C853]" : "text-[#F59E0B]")}>{compileResult.auditScore}/100</span></div>
              {compileResult.auditNotes?.map((n: string, i: number) => <div key={i} className="text-[10px] text-[#888]">· {n}</div>)}
            </div>
          )}
          {compileResult.errors?.map((e: string, i: number) => <div key={i} className="text-red-600">{e}</div>)}
        </div>
      )}
      {deployResult && (
        <div className={cn("rounded-lg p-3 text-xs", deployResult.success ? "bg-[#00C853]/5 border border-[#00C853]/20" : "bg-red-50 border border-red-200")}>
          <div className="flex items-center gap-1.5 mb-1.5 font-bold">{deployResult.success ? <><Check size={12} className="text-[#00C853]" /> Deployed!</> : <><X size={12} className="text-red-500" /> Deploy Failed</>}</div>
          {deployResult.success && (
            <div className="space-y-1 text-[#555]">
              <div className="flex items-center gap-1">Addr: <AddrC a={deployResult.address} /><Cp t={deployResult.address || ''} /></div>
              <div>Block: <span className="font-mono font-bold">#{deployResult.blockNumber}</span></div>
              <div>Gas: <span className="font-mono">{deployResult.gasUsed?.toLocaleString()}</span></div>
            </div>
          )}
          {deployResult.error && <div className="text-red-600">{deployResult.error}</div>}
        </div>
      )}

      {/* Quick templates */}
      <div className="pt-2">
        <div className="text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Quick Load</div>
        {templates.slice(0, 4).map((t: any) => (
          <button key={t.id} onClick={() => loadTemplate(t)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-[#e8e8e8] transition-all mb-1">
            <div className="text-[11px] font-semibold flex items-center gap-1.5"><span>{t.icon}</span>{t.name}</div>
          </button>
        ))}
      </div>
    </div>

    {/* Main editor area */}
    <div className="flex-1 flex flex-col">
      {/* Editor tabs */}
      <div className="h-10 px-4 border-b border-[#e8e8e8] flex items-center gap-4 bg-[#FAFAFA]">
        {(['code', 'audit', 'abi', 'output'] as EditorTab[]).map(t => (
          <button key={t} onClick={() => setEditorTab(t)} className={cn("flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider pb-2.5 border-b-2 transition-all", editorTab === t ? (t === 'audit' ? "border-[#F59E0B] text-[#F59E0B]" : "border-[#0a0a0a] text-[#0a0a0a]") : "border-transparent text-[#999]")}>
            {t === 'audit' && <ShieldCheck size={12} />}
            {t === 'code' ? 'Source Code' : t === 'abi' ? 'ABI' : t === 'audit' ? 'AI Audit' : 'Output'}
            {t === 'audit' && auditResult && <span className={cn("ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold", auditResult.score >= 85 ? "bg-[#00C853]/15 text-[#00C853]" : auditResult.score >= 60 ? "bg-[#F59E0B]/15 text-[#F59E0B]" : "bg-red-500/15 text-red-500")}>{auditResult.score}</span>}
          </button>
        ))}
        <div className="ml-auto text-[10px] text-[#bbb] font-mono">{code.split('\n').length} lines · {code.length} chars</div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-hidden">
        {editorTab === 'code' && (
          <div className="h-full relative">
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={`// Write your 20022Chain smart contract here...\n// Or use AI Generate / Templates to get started\n\ncontract MyContract {\n    string public name;\n    \n    function transfer(address _to, uint256 _amount) public returns (bool) {\n        // your logic\n        return true;\n    }\n}`}
              className="w-full h-full bg-[#0a0a0a] text-[#e0e0e0] font-mono text-[13px] leading-relaxed p-6 resize-none outline-none placeholder:text-[#333]"
              spellCheck={false}
            />
          </div>
        )}
        {editorTab === 'audit' && (
          <div className="h-full overflow-y-auto bg-[#FAFAFA]">
            {auditResult ? (
              <div className="p-6 space-y-5">
                {/* Score Header */}
                <div className={cn("rounded-xl p-5 border-2", auditResult.score >= 85 ? "bg-[#00C853]/5 border-[#00C853]/20" : auditResult.score >= 60 ? "bg-[#F59E0B]/5 border-[#F59E0B]/20" : "bg-red-50 border-red-200")}>
                  <div className="flex items-center gap-5">
                    <div className="text-center">
                      <div className={cn("text-5xl font-extrabold font-mono", auditResult.score >= 85 ? "text-[#00C853]" : auditResult.score >= 60 ? "text-[#F59E0B]" : "text-red-500")}>{auditResult.score}</div>
                      <div className={cn("text-lg font-bold mt-1", auditResult.score >= 85 ? "text-[#00C853]" : auditResult.score >= 60 ? "text-[#F59E0B]" : "text-red-500")}>Grade {auditResult.grade}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {auditResult.deployable ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[#00C853]/15 text-[#00C853]"><BadgeCheck size={12} /> DEPLOYABLE</span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-red-500/15 text-red-500"><ShieldX size={12} /> DEPLOY BLOCKED</span>
                        )}
                        {auditResult.requiresReview && auditResult.deployable && (
                          <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B]"><AlertCircle size={12} /> REVIEW REQUIRED</span>
                        )}
                        {auditResult.isoCompliance?.compliant && (
                          <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[#1D4ED8]/10 text-[#1D4ED8]"><Shield size={12} /> ISO 20022</span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#555] leading-relaxed">{auditResult.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { l: 'Critical', v: auditResult.stats?.criticalCount || 0, c: '#EF4444', icon: ShieldX },
                    { l: 'High', v: auditResult.stats?.highCount || 0, c: '#F97316', icon: ShieldAlert },
                    { l: 'Medium', v: auditResult.stats?.mediumCount || 0, c: '#F59E0B', icon: AlertTriangle },
                    { l: 'Low', v: auditResult.stats?.lowCount || 0, c: '#3B82F6', icon: Info },
                    { l: 'Info', v: auditResult.stats?.infoCount || 0, c: '#888', icon: Info },
                  ].map(s => { const Icon = s.icon; return (
                    <div key={s.l} className="bg-white border border-[#e8e8e8] rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Icon size={12} style={{ color: s.c }} />
                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: s.c }}>{s.l}</span>
                      </div>
                      <div className="text-2xl font-extrabold font-mono" style={{ color: s.v > 0 ? s.c : '#ddd' }}>{s.v}</div>
                    </div>
                  ); })}
                </div>

                {/* Contract Stats */}
                <div className="bg-white border border-[#e8e8e8] rounded-xl p-4">
                  <div className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest mb-3">Contract Statistics</div>
                  <div className="grid grid-cols-5 gap-4 text-center">
                    {[
                      { l: 'Lines', v: auditResult.stats?.totalLines || 0 },
                      { l: 'Functions', v: auditResult.stats?.functions || 0 },
                      { l: 'Events', v: auditResult.stats?.events || 0 },
                      { l: 'Modifiers', v: auditResult.stats?.modifiers || 0 },
                      { l: 'State Vars', v: auditResult.stats?.stateVariables || 0 },
                    ].map(s => (
                      <div key={s.l}><div className="text-lg font-bold font-mono">{s.v}</div><div className="text-[9px] text-[#999] uppercase">{s.l}</div></div>
                    ))}
                  </div>
                </div>

                {/* Findings */}
                {auditResult.findings?.length > 0 && (
                  <div>
                    <div className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest mb-3">Security Findings</div>
                    <div className="space-y-3">
                      {auditResult.findings.map((f: any) => {
                        const riskColors: Record<string, { bg: string; border: string; text: string; icon: any }> = {
                          critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', icon: ShieldX },
                          high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', icon: ShieldAlert },
                          medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: AlertTriangle },
                          low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', icon: Info },
                          info: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', icon: Info },
                        };
                        const rc = riskColors[f.risk] || riskColors.info;
                        const Icon = rc.icon;
                        return (
                          <div key={f.id} className={cn("rounded-xl border p-4", rc.bg, rc.border)}>
                            <div className="flex items-start gap-3">
                              <Icon size={18} className={cn("shrink-0 mt-0.5", rc.text)} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn("text-[13px] font-bold", rc.text)}>{f.title}</span>
                                  <span className={cn("text-[8px] font-bold uppercase px-2 py-0.5 rounded-full", rc.text, `${rc.bg}`)} style={{ border: `1px solid currentColor`, opacity: 0.8 }}>{f.risk}</span>
                                  <span className="text-[9px] text-[#aaa] font-mono">{f.id}</span>
                                </div>
                                <p className="text-[12px] text-[#555] leading-relaxed mb-2">{f.description}</p>
                                {f.line && (
                                  <div className="bg-[#0a0a0a] rounded-lg px-3 py-2 mb-2">
                                    <code className="text-[11px] font-mono text-red-400">{f.line}</code>
                                  </div>
                                )}
                                <div className="bg-white/50 rounded-lg px-3 py-2 mb-1.5 border border-[#e8e8e8]">
                                  <div className="text-[9px] font-bold text-[#00C853] uppercase tracking-wider mb-0.5">Recommendation</div>
                                  <p className="text-[11px] text-[#555]">{f.recommendation}</p>
                                </div>
                                <div className="text-[10px] text-[#999]"><span className="font-semibold">Impact:</span> {f.impact}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ISO Compliance */}
                {auditResult.isoCompliance?.notes?.length > 0 && (
                  <div className="bg-white border border-[#e8e8e8] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield size={14} className="text-[#1D4ED8]" />
                      <span className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest">ISO 20022 Compliance</span>
                      {auditResult.isoCompliance.compliant && <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#1D4ED8]/10 text-[#1D4ED8] font-bold">COMPLIANT</span>}
                    </div>
                    <div className="space-y-1.5">
                      {auditResult.isoCompliance.notes.map((n: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[12px] text-[#555]"><Check size={11} className="text-[#00C853] shrink-0" />{n}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gas Optimization */}
                {auditResult.gasOptimization?.length > 0 && (
                  <div className="bg-white border border-[#e8e8e8] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Fuel size={14} className="text-[#F59E0B]" />
                      <span className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest">Gas Optimization</span>
                    </div>
                    <div className="space-y-1.5">
                      {auditResult.gasOptimization.map((tip: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-[12px] text-[#555]"><Zap size={11} className="text-[#F59E0B] shrink-0 mt-0.5" />{tip}</div>
                      ))}
                    </div>
                  </div>
                )}

                {auditResult.findings?.length === 0 && (
                  <div className="text-center py-8">
                    <ShieldCheck size={40} className="text-[#00C853] mx-auto mb-3" />
                    <div className="text-lg font-bold text-[#00C853]">No vulnerabilities found</div>
                    <p className="text-sm text-[#888] mt-1">This contract passed all security checks</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShieldCheck size={48} className="text-[#e0e0e0] mb-4" />
                <div className="text-sm font-bold text-[#999]">No audit yet</div>
                <p className="text-xs text-[#ccc] mt-1 max-w-xs">Click "AI Security Audit" or "Compile + Audit" to scan your contract for vulnerabilities, risks, and compliance</p>
              </div>
            )}
          </div>
        )}
        {editorTab === 'abi' && (
          <div className="h-full overflow-y-auto bg-[#FAFAFA] p-6">
            {compileResult?.abi ? (
              <pre className="text-[12px] font-mono text-[#555] leading-relaxed whitespace-pre-wrap">{JSON.stringify(compileResult.abi, null, 2)}</pre>
            ) : (
              <div className="text-sm text-[#999] text-center mt-20">Compile the contract to see the ABI</div>
            )}
          </div>
        )}
        {editorTab === 'output' && (
          <div className="h-full overflow-y-auto bg-[#0a0a0a] p-6 font-mono text-[12px] leading-relaxed">
            {compileResult && (
              <div className="space-y-1">
                <div className={compileResult.success ? "text-[#00C853]" : "text-[#EF4444]"}>{compileResult.success ? '✓ Compilation successful' : '✗ Compilation failed'}</div>
                {compileResult.success && <div className="text-[#888]">Gas estimate: {compileResult.gasEstimate?.toLocaleString()}</div>}
                {compileResult.success && <div className="text-[#888]">Audit score: {compileResult.auditScore}/100</div>}
                {compileResult.success && <div className="text-[#888]">ABI functions: {compileResult.abi?.length}</div>}
                {compileResult.auditNotes?.map((n: string, i: number) => <div key={i} className="text-[#F59E0B]">⚠ {n}</div>)}
                {compileResult.errors?.map((e: string, i: number) => <div key={i} className="text-[#EF4444]">✗ {e}</div>)}
                {compileResult.warnings?.map((w: string, i: number) => <div key={i} className="text-[#F59E0B]">⚠ {w}</div>)}
                {compileResult.success && compileResult.bytecode && (
                  <>
                    <div className="text-[#888] mt-3">Bytecode ({compileResult.bytecode.length} bytes):</div>
                    <div className="text-[#555] break-all text-[10px] mt-1">{compileResult.bytecode.slice(0, 200)}...</div>
                  </>
                )}
              </div>
            )}
            {deployResult && (
              <div className="space-y-1 mt-4 pt-4 border-t border-[#222]">
                <div className={deployResult.success ? "text-[#00C853]" : "text-[#EF4444]"}>{deployResult.success ? '✓ Contract deployed successfully!' : `✗ Deploy failed: ${deployResult.error}`}</div>
                {deployResult.success && (
                  <>
                    <div className="text-[#888]">Address: <span className="text-[#e0e0e0]"><AddrC a={deployResult.address} full /></span></div>
                    <div className="text-[#888]">Tx Hash: <span className="text-[#e0e0e0]">{deployResult.txHash}</span></div>
                    <div className="text-[#888]">Block: #{deployResult.blockNumber}</div>
                    <div className="text-[#888]">Gas used: {deployResult.gasUsed?.toLocaleString()}</div>
                  </>
                )}
              </div>
            )}
            {!compileResult && !deployResult && <div className="text-[#555]">// Compile or deploy to see output</div>}
          </div>
        )}
      </div>
    </div>
  </div>
)}

{/* ═══════ DEPLOYED ═════════════════════════════════════ */}
{view === 'deployed' && (() => {
  const REG_FILTERS = [
    { id: 'ALL', label: 'All', color: '#0a0a0a' },
    { id: 'CONTRACT', label: 'Contracts', color: '#00C853' },
    { id: 'ISIN', label: 'ISIN', color: '#1D4ED8' },
    { id: 'VIEWSRIGHT', label: 'ViewsRight', color: '#7C3AED' },
  ];
  const filtered = regFilter === 'ALL' ? contracts : contracts.filter((c: any) => c.registryType === regFilter);
  return (
  <div className="h-full overflow-y-auto p-8 max-w-[1440px] mx-auto bg-[#FAFAFA] space-y-5">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold">Registry</h2>
        <p className="text-sm text-[#888]">{contracts.length} entries on 20022Chain</p>
      </div>
      <button onClick={fetchContracts} className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#0a0a0a]"><RefreshCw size={12} /> Refresh</button>
    </div>

    {/* REGISTRY TYPE FILTERS */}
    <div className="flex items-center gap-2">
      {REG_FILTERS.map(f => (
        <button key={f.id} onClick={() => setRegFilter(f.id)} className={cn("flex items-center gap-1.5 h-9 px-4 rounded-xl text-[11px] font-bold transition-all border", regFilter === f.id ? "text-white" : "text-[#888] border-[#e8e8e8] bg-white hover:bg-[#f5f5f5]")} style={regFilter === f.id ? { backgroundColor: f.color, borderColor: f.color } : undefined}>
          {f.label}
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-extrabold", regFilter === f.id ? "bg-white/20 text-white" : "bg-[#f3f3f3] text-[#aaa]")}>
            {f.id === 'ALL' ? contracts.length : contracts.filter((c: any) => c.registryType === f.id).length}
          </span>
        </button>
      ))}
    </div>

    <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
      <div className="grid grid-cols-[1fr_200px_90px_80px_80px_80px] gap-3 px-6 py-2.5 bg-[#f7f7f7] text-[9px] font-bold text-[#aaa] uppercase tracking-widest border-b border-[#e8e8e8]">
        <span>Name</span><span>Address</span><span>Registry</span><span>Audit</span><span>Interactions</span><span>ISO</span>
      </div>
      <div className="divide-y divide-[#f5f5f5]">
        {filtered.map((c: any) => {
          const regColor = c.registryType === 'ISIN' ? '#1D4ED8' : c.registryType === 'VIEWSRIGHT' ? '#7C3AED' : '#00C853';
          const regLabel = c.registryType === 'ISIN' ? 'ISIN' : c.registryType === 'VIEWSRIGHT' ? 'ViewsRight' : 'Contract';
          return (
          <div key={c.id} onClick={() => setSelContract(selContract?.id === c.id ? null : c)} className="cursor-pointer hover:bg-[#FAFAFA] transition-colors">
            <div className="grid grid-cols-[1fr_200px_90px_80px_80px_80px] gap-3 px-6 py-3.5 items-center">
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-extrabold" style={{ backgroundColor: `${regColor}10`, border: `1.5px solid ${regColor}20`, color: regColor }}>
                    {c.registryType === 'VIEWSRIGHT' ? 'VR' : c.registryType === 'ISIN' ? 'IS' : c.name.charAt(0)}
                  </div>
                  {c.verification?.verified && <div className="absolute -bottom-1 -right-1 border-[1.5px] border-white rounded-full"><MiniSeal seal={c.verification?.seal} size={14} /></div>}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <a href={`/contracts/view/${encodeURIComponent(c.address)}`} onClick={(e) => e.stopPropagation()} className="text-[13px] font-bold hover:text-[#00C853] transition-colors">{c.name}</a>
                    {c.verification?.verified && <MiniSeal seal={c.verification?.seal} />}
                  </div>
                  <div className="text-[10px] text-[#999] mt-0.5 truncate">{c.description?.slice(0, 50)}...</div>
                </div>
              </div>
              <div className="flex items-center gap-1"><AddrC a={c.address} /><Cp t={c.address || ''} /></div>
              <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-lg text-center" style={{ color: regColor, backgroundColor: `${regColor}10`, border: `1px solid ${regColor}20` }}>{regLabel}</span>
              <span className={cn("text-[13px] font-bold font-mono text-center", c.auditScore >= 90 ? "text-[#00C853]" : c.auditScore >= 70 ? "text-[#F59E0B]" : "text-[#EF4444]")}>{c.auditScore}</span>
              <span className="text-[13px] font-mono text-center">{fNum(c.interactions)}</span>
              <div className="flex justify-center">{c.isoCompliant ? <Check size={14} className="text-[#00C853]" /> : <X size={14} className="text-[#ccc]" />}</div>
            </div>
            <AnimatePresence>
              {selContract?.id === c.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-6 pb-5 pt-1 bg-[#f7f7f7] border-t border-[#e8e8e8]">
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[
                        { l: 'Registry', v: regLabel },
                        { l: 'Block', v: `#${c.deployBlock}` },
                        { l: 'Gas Used', v: c.gasUsed?.toLocaleString() },
                        { l: 'Balance', v: `${fNum(c.balance)} ARCHT` },
                      ].map(x => (
                        <div key={x.l} className="bg-white border border-[#e8e8e8] rounded-xl p-3">
                          <div className="text-[8px] text-[#aaa] uppercase tracking-widest font-bold">{x.l}</div>
                          <div className="text-[14px] font-bold font-mono mt-1">{x.v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5 text-[12px]">
                      <div className="flex items-center gap-2"><span className="text-[#999] w-20">Tx Hash</span><AddrC a={c.deployTxHash} /><Cp t={c.deployTxHash || ''} /></div>
                      <div className="flex items-center gap-2"><span className="text-[#999] w-20">Owner</span><AddrC a={c.owner} /><Cp t={c.owner || ''} /></div>
                      <div className="flex items-center gap-2"><span className="text-[#999] w-20">ABI</span><span className="text-[#555]">{c.abi?.length} functions/events</span></div>
                      <div className="flex items-center gap-2"><span className="text-[#999] w-20">Deployed</span><span className="text-[#555]">{new Date(c.deployedAt).toUTCString()}</span></div>
                      {c.isinContract && <div className="flex items-center gap-2"><span className="text-[#999] w-20">ISIN</span><span className="text-[#1D4ED8] font-bold">{c.isinContract.isin}</span></div>}
                      {c.viewsRight && <div className="flex items-center gap-2"><span className="text-[#999] w-20">VR #</span><span className="text-[#7C3AED] font-bold">{c.viewsRight.registrationNumber}</span></div>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <a href={`/contracts/view/${encodeURIComponent(c.address)}`} className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-white text-[11px] font-bold hover:opacity-90 transition-all" style={{ backgroundColor: regColor }}><ArrowRight size={12} /> View Full Page</a>
                      <button onClick={() => { setCode(c.sourceCode); setContractName(c.name); setView('editor'); setEditorTab('code'); }} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e8e8e8] text-[11px] font-semibold hover:bg-white transition-colors"><Eye size={12} /> Source</button>
                      <button onClick={() => { setCode(c.sourceCode); setContractName(c.name + ' v2'); setView('editor'); setEditorTab('code'); }} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e8e8e8] text-[11px] font-semibold hover:bg-white transition-colors"><Code size={12} /> Fork</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          );
        })}
      </div>
    </div>
  </div>
  );
})()}

{/* ═══════ TEMPLATES ════════════════════════════════════ */}
{view === 'templates' && (
  <div className="h-full overflow-y-auto p-8 max-w-[1440px] mx-auto bg-[#FAFAFA] space-y-5">
    <div>
      <h2 className="text-lg font-bold">Contract Templates</h2>
      <p className="text-sm text-[#888]">Pre-built ISO 20022 compliant templates ready to customize and deploy</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {templates.map((t: any) => (
        <div key={t.id} className="bg-white border border-[#e8e8e8] rounded-2xl p-6 hover:border-[#ccc] hover:shadow-sm transition-all group">
          <div className="flex items-start gap-4">
            <div className="text-3xl">{t.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[15px] font-bold">{t.name}</h3>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[#f3f3f3] text-[#555]">{t.type}</span>
              </div>
              <p className="text-sm text-[#888] mb-4 leading-relaxed">{t.description}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => loadTemplate(t)} className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#0a0a0a] text-white text-[11px] font-bold hover:bg-[#222] transition-colors"><Code size={12} /> Use Template</button>
                <span className="text-[10px] text-[#bbb] font-mono">{t.code?.split('\n').length} lines</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* AI Prompts */}
    <div className="mt-8">
      <h3 className="text-base font-bold mb-3">AI Quick Prompts</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {aiPrompts.map((p: any) => (
          <button key={p.id} onClick={() => { setAiPrompt(p.prompt); setShowAI(true); }} className="text-left bg-white border border-[#e8e8e8] rounded-xl p-4 hover:border-[#ccc] hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-1.5"><Sparkles size={13} className="text-[#00C853]" /><span className="text-[12px] font-bold">{p.label}</span></div>
            <p className="text-[11px] text-[#888] leading-relaxed">{p.prompt}</p>
          </button>
        ))}
      </div>
    </div>
  </div>
)}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══════ AI MODAL ═══════════════════════════════════ */}
      <AnimatePresence>
        {showAI && (
          <motion.div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/10 backdrop-blur-sm p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAI(false)}>
            <motion.div className="w-full max-w-xl bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden shadow-2xl" initial={{ scale: .96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .96, y: 8 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="h-14 px-6 border-b border-[#e8e8e8] flex items-center justify-between bg-[#f7f7f7]">
                <div className="flex items-center gap-3"><Sparkles size={16} className="text-[#00C853]" /><span className="text-sm font-bold">AI Contract Generator</span></div>
                <button onClick={() => setShowAI(false)} className="w-8 h-8 rounded-lg hover:bg-[#eee] flex items-center justify-center" aria-label="Close"><X size={16} className="text-[#999]" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-[#999] uppercase tracking-widest block mb-2">Describe what you want to build</label>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Example: Create a smart contract to tokenize a gold mining reserve with ISIN registration, NI 43-101 verification, and quarterly yield distribution to token holders..."
                    className="w-full bg-[#FAFAFA] border border-[#e8e8e8] rounded-xl px-4 py-3 text-sm resize-none h-28 focus:border-[#0a0a0a] outline-none" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiPrompts.slice(0, 4).map((p: any) => (
                    <button key={p.id} onClick={() => setAiPrompt(p.prompt)} className="text-[10px] px-3 py-1 rounded-full border border-[#e8e8e8] text-[#555] hover:bg-[#f5f5f5] transition-colors">{p.label}</button>
                  ))}
                </div>
                <button onClick={handleAIGenerate} disabled={generating || !aiPrompt.trim()} className={cn("w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-all", generating ? "bg-[#e8e8e8] text-[#999]" : "bg-[#0a0a0a] text-white hover:bg-[#222]")}>
                  {generating ? <><Loader2 size={16} className="animate-spin" /> Generating contract...</> : <><Sparkles size={16} /> Generate Smart Contract</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="h-9 border-t border-[#e8e8e8] bg-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3 text-[10px] text-[#aaa] font-mono">
          <span className="font-bold text-[#0a0a0a] tracking-wider">20022CHAIN</span>
          <span>Smart Contract IDE</span>
          <div className="w-px h-3 bg-[#e8e8e8]" />
          <span>AI Auditor</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00C853] live-dot" />
          <span className="text-[#00C853] font-bold font-mono">LIVE</span>
        </div>
      </footer>
    </div>
  );
}
