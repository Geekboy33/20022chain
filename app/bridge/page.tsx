"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeftRight, ArrowRight, ArrowLeft, Shield, Zap, Globe, Activity,
  CheckCircle2, Clock, AlertTriangle, ExternalLink, Copy, Check,
  RefreshCw, Loader2, Hash, Layers, Link2, Lock, Wallet, Code, Banknote
} from "lucide-react";

interface Chain { id: string; name: string; symbol: string; color: string; nativeToken: string; type: string; status: string; tvlBridged: number; avgBridgeTime: string; fees: { fixed: number; percent: number }; supported_tokens: string[]; }
interface BridgeTx { id: string; sourceChain: string; destChain: string; protocol: string; token: string; amount: number; sender: string; receiver: string; status: string; sourceHash: string; destHash?: string; fee: number; createdAt: number; completedAt?: number; confirmations: number; requiredConfirmations: number; }
interface Protocol { name: string; color: string; description: string; securityModel: string }
interface Stats { totalBridged: number; totalTransactions: number; activeChains: number; last24hVolume: number; avgBridgeTime: number; protocols: Record<string, number> }

const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(2)}`;
const shortAddr = (a: string) => a.length > 20 ? `${a.slice(0, 10)}...${a.slice(-6)}` : a;

const CHAIN_COLORS: Record<string, string> = {
  '20022chain': '#00C853', ethereum: '#627EEA', solana: '#9945FF', bnb: '#F0B90B',
  polygon: '#8247E5', arbitrum: '#28A0F0', optimism: '#FF0420', avalanche: '#E84142',
  mantra: '#FF6B35', base: '#0052FF', cosmos: '#2E3148',
};

const STATUS_CFG: Record<string, { color: string; bg: string; icon: any }> = {
  PENDING:          { color: '#D97706', bg: '#D9770608', icon: Clock },
  SOURCE_CONFIRMED: { color: '#1D4ED8', bg: '#1D4ED808', icon: CheckCircle2 },
  RELAYING:         { color: '#7C3AED', bg: '#7C3AED08', icon: Loader2 },
  DEST_CONFIRMED:   { color: '#059669', bg: '#05966908', icon: CheckCircle2 },
  COMPLETED:        { color: '#00C853', bg: '#00C85308', icon: CheckCircle2 },
  FAILED:           { color: '#EF4444', bg: '#EF444408', icon: AlertTriangle },
};

export default function BridgePage() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [protocols, setProtocols] = useState<Record<string, Protocol>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [txHistory, setTxHistory] = useState<BridgeTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [srcChain, setSrcChain] = useState('ethereum');
  const [dstChain, setDstChain] = useState('20022chain');
  const [token, setToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [bridging, setBridging] = useState(false);
  const [bridgeResult, setBridgeResult] = useState<BridgeTx | null>(null);
  const [tab, setTab] = useState<'bridge' | 'history' | 'networks'>('bridge');
  const [copied, setCopied] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/bridge?action=overview');
      const d = await res.json();
      if (d.success) { setChains(d.chains); setProtocols(d.protocols); setStats(d.stats); setTxHistory(d.recentTx); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 15000); return () => clearInterval(t); }, [fetchData]);

  const srcChainObj = chains.find(c => c.id === srcChain);
  const dstChainObj = chains.find(c => c.id === dstChain);
  const availableTokens = srcChainObj?.supported_tokens.filter(t => dstChainObj?.supported_tokens.includes(t)) || [];
  const swap = () => { const tmp = srcChain; setSrcChain(dstChain); setDstChain(tmp); };

  const handleBridge = async () => {
    if (!amount || !sender || !receiver) return;
    setBridging(true);
    try {
      const res = await fetch('/api/bridge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'bridge', sourceChain: srcChain, destChain: dstChain, token, amount: parseFloat(amount), sender, receiver }) });
      const d = await res.json();
      if (d.success) { setBridgeResult(d.transaction); fetchData(); }
    } catch (e) { console.error(e); }
    setBridging(false);
  };

  const cpy = (t: string) => { navigator.clipboard.writeText(t); setCopied(t); setTimeout(() => setCopied(''), 1500); };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 rounded-2xl border-2 border-[#0a0a0a] flex items-center justify-center mb-6"><ArrowLeftRight size={24} className="text-[#0a0a0a]" /></div>
      <div className="w-40 h-1 bg-[#eee] rounded-full overflow-hidden"><div className="h-full w-3/4 bg-[#00C853] rounded-full scan-line" /></div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* ══════ HEADER — same system as main explorer ══════ */}
      <header className="border-b border-[#e8e8e8] bg-white shrink-0 z-50">
        <div className="h-14 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-xl border-[1.5px] border-[#0a0a0a] flex items-center justify-center relative">
                <Link2 size={14} className="text-[#0a0a0a]" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00C853] border-[1.5px] border-white live-dot" />
              </div>
              <div>
                <h1 className="text-[13px] font-extrabold text-[#0a0a0a] tracking-[.15em] uppercase leading-none">20022Chain</h1>
                <p className="text-[8px] text-[#aaa] font-mono mt-0.5 tracking-widest">CROSS-CHAIN BRIDGE</p>
              </div>
            </Link>
            <div className="w-px h-6 bg-[#e8e8e8]" />
            <nav className="flex items-center gap-1">
              {(['bridge', 'history', 'networks'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${tab === t ? 'bg-[#0a0a0a] text-white' : 'text-[#888] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]'}`}>
                  {t === 'bridge' ? 'Bridge' : t === 'history' ? 'History' : 'Networks'}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="btn-outline"><ArrowLeft size={12} /> Explorer</a>
            <a href="/wallets" className="btn-outline"><Wallet size={12} /> Wallets</a>
            <a href="/payments" className="btn-outline"><Banknote size={12} /> Gpay3</a>
            <a href="/reserves" className="btn-outline"><Shield size={12} /> PoR</a>
            <a href="/contracts" className="btn-outline"><Code size={12} /> Contracts</a>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-[#FAFAFA]">
        <div className="max-w-[1440px] mx-auto px-8 py-6">
          {/* STATS */}
          {stats && (
            <div className="grid grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Total Bridged', value: fmt(stats.totalBridged), icon: Layers, accent: false },
                { label: 'Transactions', value: stats.totalTransactions.toLocaleString(), icon: Hash, accent: false },
                { label: 'Active Chains', value: stats.activeChains.toString(), icon: Globe, accent: true },
                { label: '24h Volume', value: fmt(stats.last24hVolume), icon: Activity, accent: false },
                { label: 'Avg Time', value: `${Math.round(stats.avgBridgeTime)}s`, icon: Clock, accent: false },
              ].map((s, i) => (
                <div key={s.label} className="card p-5 fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center justify-between mb-3">
                    <s.icon size={15} className="text-[#bbb]" />
                    <span className="text-[8px] font-bold text-[#bbb] uppercase tracking-widest">{s.label}</span>
                  </div>
                  <div className={`text-2xl font-extrabold font-mono tracking-tight ${s.accent ? 'text-[#00C853]' : 'text-[#0a0a0a]'}`}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ═══ BRIDGE TAB ═══ */}
            {tab === 'bridge' && (
              <motion.div key="bridge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
                <div className="space-y-6">
                  {/* Connected Chains */}
                  <div className="card p-6">
                    <h2 className="text-sm font-bold text-[#0a0a0a] mb-5 flex items-center gap-2"><Globe size={15} className="text-[#00C853]" /> Connected Blockchains</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {chains.filter(c => c.id !== '20022chain').map(c => (
                        <div key={c.id} className="border border-[#e8e8e8] rounded-xl p-4 hover:border-[#ccc] transition group bg-white">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[11px]" style={{ background: `${c.color}10`, color: c.color, border: `1.5px solid ${c.color}20` }}>
                              {c.symbol.slice(0, 3)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[13px] text-[#0a0a0a]">{c.name}</p>
                              <p className="text-[9px] text-[#aaa] font-mono">{c.type}</p>
                            </div>
                            <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: c.status === 'ACTIVE' ? '#00C853' : '#D97706', background: c.status === 'ACTIVE' ? '#00C85308' : '#D9770608' }}>{c.status}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div><span className="text-[#bbb]">TVL</span><p className="font-mono font-semibold text-[#0a0a0a]">{fmt(c.tvlBridged)}</p></div>
                            <div><span className="text-[#bbb]">Time</span><p className="font-mono text-[#555]">{c.avgBridgeTime}</p></div>
                            <div><span className="text-[#bbb]">Fee</span><p className="font-mono text-[#555]">{c.fees.percent}%</p></div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-3">
                            {c.supported_tokens.slice(0, 5).map(t => (
                              <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-[#f3f3f3] text-[#888] font-mono">{t}</span>
                            ))}
                            {c.supported_tokens.length > 5 && <span className="text-[8px] text-[#ccc]">+{c.supported_tokens.length - 5}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Protocols */}
                  <div className="card p-6">
                    <h2 className="text-sm font-bold text-[#0a0a0a] mb-5 flex items-center gap-2"><Shield size={15} className="text-[#00C853]" /> Bridge Protocols</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(protocols).filter(([k]) => k !== 'NATIVE').map(([k, p]) => (
                        <div key={k} className="border border-[#e8e8e8] rounded-xl p-4 bg-white hover:border-[#ccc] transition">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                            <span className="font-bold text-[13px] text-[#0a0a0a]">{p.name}</span>
                          </div>
                          <p className="text-[10px] text-[#888] mb-2 leading-relaxed">{p.description}</p>
                          <div className="flex items-center gap-1 text-[9px] text-[#aaa]"><Lock size={10} /><span>{p.securityModel}</span></div>
                          {stats && <p className="text-[10px] mt-2 font-mono text-[#0a0a0a] font-semibold">{(stats.protocols[k] || 0).toLocaleString()} txns</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bridge Form */}
                <div>
                  <div className="card-elevated p-6 sticky top-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-9 h-9 rounded-xl bg-[#00C853] flex items-center justify-center"><ArrowLeftRight size={16} className="text-white" /></div>
                      <div><h2 className="font-bold text-[15px]">Bridge Assets</h2><p className="text-[9px] text-[#aaa] font-mono">CROSS-CHAIN TRANSFER</p></div>
                    </div>

                    <label className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest">From</label>
                    <select value={srcChain} onChange={e => setSrcChain(e.target.value)} aria-label="Source chain"
                      className="input-field mt-1 mb-3 font-medium">
                      {chains.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
                    </select>

                    <div className="flex justify-center -my-1 relative z-10">
                      <button onClick={swap} className="w-9 h-9 rounded-xl bg-[#f3f3f3] border border-[#e8e8e8] flex items-center justify-center hover:bg-[#00C853] hover:text-white hover:border-[#00C853] transition-all group">
                        <ArrowLeftRight size={14} className="text-[#888] group-hover:text-white" />
                      </button>
                    </div>

                    <label className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest">To</label>
                    <select value={dstChain} onChange={e => setDstChain(e.target.value)} aria-label="Destination chain"
                      className="input-field mt-1 mb-3 font-medium">
                      {chains.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
                    </select>

                    <label className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest">Token</label>
                    <select value={token} onChange={e => setToken(e.target.value)} aria-label="Token"
                      className="input-field mt-1 mb-3 font-mono">
                      {availableTokens.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <label className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest">Amount</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                      className="input-field mt-1 mb-3 font-mono" />

                    <label className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest">Sender Address</label>
                    <input value={sender} onChange={e => setSender(e.target.value)} placeholder="0x... or archt:..."
                      className="input-field mt-1 mb-3 font-mono text-[11px]" />

                    <label className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest">Receiver Address</label>
                    <input value={receiver} onChange={e => setReceiver(e.target.value)} placeholder="archt:... or 0x..."
                      className="input-field mt-1 mb-3 font-mono text-[11px]" />

                    {srcChainObj && amount && (
                      <div className="bg-[#FAFAFA] border border-[#e8e8e8] rounded-xl p-3 mb-4 text-[10px] space-y-1.5">
                        <div className="flex justify-between"><span className="text-[#999]">Protocol</span><span className="font-mono font-semibold text-[#0a0a0a]">{srcChain === '20022chain' ? 'Wormhole' : protocols[srcChainObj.id === 'mantra' || srcChainObj.id === 'cosmos' ? 'IBC' : 'WORMHOLE']?.name || 'Wormhole'}</span></div>
                        <div className="flex justify-between"><span className="text-[#999]">Est. Fee</span><span className="font-mono font-semibold text-[#D97706]">{(parseFloat(amount) * srcChainObj.fees.percent / 100 + srcChainObj.fees.fixed).toFixed(6)} {token}</span></div>
                        <div className="flex justify-between"><span className="text-[#999]">Est. Time</span><span className="font-mono text-[#555]">{srcChainObj.avgBridgeTime}</span></div>
                      </div>
                    )}

                    <button onClick={handleBridge} disabled={bridging || !amount || !sender || !receiver}
                      className="btn-green w-full h-12 text-[13px] rounded-xl">
                      {bridging ? <><Loader2 size={16} className="animate-spin" /> Bridging...</> : <><ArrowLeftRight size={16} /> Bridge Now</>}
                    </button>

                    {bridgeResult && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-4 bg-[#00C85308] border border-[#00C85320] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 size={14} className="text-[#00C853]" />
                          <span className="text-[12px] font-bold text-[#00C853]">Bridge Initiated</span>
                        </div>
                        <p className="text-[10px] text-[#888] font-mono">TX: {shortAddr(bridgeResult.id)}</p>
                        <p className="text-[10px] text-[#888]">Status: {bridgeResult.status}</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ HISTORY TAB ═══ */}
            {tab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="card overflow-hidden">
                  <div className="h-14 px-6 border-b border-[#e8e8e8] flex items-center justify-between">
                    <div className="flex items-center gap-3"><Activity size={15} className="text-[#00C853]" /><span className="text-sm font-bold">Bridge Transaction History</span><span className="text-[10px] text-[#999] font-mono">{txHistory.length} transactions</span></div>
                    <button onClick={fetchData} className="btn-outline h-8 px-3 text-[10px]"><RefreshCw size={11} /> Refresh</button>
                  </div>
                  <div className="table-header grid grid-cols-[200px_1fr_100px_120px_130px_140px] gap-3 px-6 py-2.5">
                    <span>TX ID</span><span>Route</span><span>Protocol</span><span className="text-right">Amount</span><span className="text-center">Status</span><span className="text-right">Time</span>
                  </div>
                  {txHistory.map(tx => {
                    const sc = STATUS_CFG[tx.status] || STATUS_CFG.PENDING;
                    const Ic = sc.icon;
                    return (
                      <div key={tx.id} className="table-row grid grid-cols-[200px_1fr_100px_120px_130px_140px] gap-3 px-6 py-3.5 items-center">
                        <button onClick={() => cpy(tx.id)} className="flex items-center gap-1 text-[11px] font-mono text-[#555] hover:text-[#00C853] transition">
                          {shortAddr(tx.id)} {copied === tx.id ? <Check size={11} className="text-[#00C853]" /> : <Copy size={11} className="text-[#ccc]" />}
                        </button>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CHAIN_COLORS[tx.sourceChain] || '#555' }} />
                          <span className="font-medium text-[#0a0a0a]">{tx.sourceChain}</span>
                          <ArrowRight size={11} className="text-[#ccc]" />
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CHAIN_COLORS[tx.destChain] || '#555' }} />
                          <span className="font-medium text-[#0a0a0a]">{tx.destChain}</span>
                        </div>
                        <span className="text-[11px] font-mono text-[#888]">{tx.protocol}</span>
                        <span className="text-[12px] font-bold font-mono text-[#0a0a0a] text-right">{tx.amount.toLocaleString()} <span className="text-[10px] font-normal text-[#999]">{tx.token}</span></span>
                        <div className="flex justify-center">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-1 rounded" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.color}18` }}>
                            <Ic size={10} /> {tx.status.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#999] text-right">{new Date(tx.createdAt).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ═══ NETWORKS TAB ═══ */}
            {tab === 'networks' && (
              <motion.div key="networks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Network Topology */}
                <div className="card p-8 relative overflow-hidden" style={{ minHeight: 420 }}>
                  <h2 className="text-sm font-bold text-[#0a0a0a] mb-2">Network Topology</h2>
                  <p className="text-[10px] text-[#999] mb-0">20022Chain at center, connected to {chains.length - 1} blockchains</p>
                  {/* Center */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-20 h-20 rounded-2xl bg-[#00C85310] border-2 border-[#00C853] flex items-center justify-center glow-green">
                      <div className="text-center">
                        <p className="text-[11px] font-extrabold text-[#00C853] tracking-wider">20022</p>
                        <p className="text-[7px] text-[#00C853] font-bold tracking-[.2em]">CHAIN</p>
                      </div>
                    </div>
                  </div>
                  {/* Orbiting */}
                  {chains.filter(c => c.id !== '20022chain').map((c, i) => {
                    const total = chains.length - 1;
                    const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
                    const x = 50 + 38 * Math.cos(angle);
                    const y = 50 + 35 * Math.sin(angle);
                    return (
                      <div key={c.id} className="absolute z-10" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}>
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center border bg-white shadow-sm" style={{ borderColor: `${c.color}30` }}>
                          <div className="text-center">
                            <p className="text-[10px] font-bold" style={{ color: c.color }}>{c.symbol}</p>
                            <p className="text-[7px] text-[#aaa]">{c.type}</p>
                          </div>
                        </div>
                        <p className="text-[9px] text-[#888] text-center mt-1 font-medium">{c.name}</p>
                      </div>
                    );
                  })}
                  <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                    {chains.filter(c => c.id !== '20022chain').map((c, i) => {
                      const total = chains.length - 1;
                      const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
                      const x = 50 + 38 * Math.cos(angle);
                      const y = 50 + 35 * Math.sin(angle);
                      return <line key={c.id} x1="50%" y1="50%" x2={`${x}%`} y2={`${y}%`} stroke={c.color} strokeWidth="1.5" strokeOpacity="0.12" strokeDasharray="6 4" />;
                    })}
                  </svg>
                </div>

                {/* Chain Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {chains.map(c => (
                    <div key={c.id} className="card p-5 hover:border-[#ccc] transition">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[11px]" style={{ background: `${c.color}10`, color: c.color, border: `1.5px solid ${c.color}20` }}>{c.symbol}</div>
                        <div className="flex-1">
                          <p className="font-bold text-[13px] text-[#0a0a0a]">{c.name}</p>
                          <p className="text-[9px] text-[#aaa] font-mono">{c.type} · {c.nativeToken}</p>
                        </div>
                        <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: c.status === 'ACTIVE' ? '#00C853' : '#D97706', background: c.status === 'ACTIVE' ? '#00C85308' : '#D9770608' }}>{c.status}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-[10px]">
                        <div><span className="text-[#bbb]">TVL</span><p className="font-mono font-semibold text-[#0a0a0a] mt-0.5">{fmt(c.tvlBridged)}</p></div>
                        <div><span className="text-[#bbb]">Time</span><p className="font-mono text-[#555] mt-0.5">{c.avgBridgeTime}</p></div>
                        <div><span className="text-[#bbb]">Fee</span><p className="font-mono text-[#555] mt-0.5">{c.fees.percent}%</p></div>
                        <div><span className="text-[#bbb]">Token</span><p className="font-mono text-[#555] mt-0.5">{c.nativeToken}</p></div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {c.supported_tokens.map(t => <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-[#f3f3f3] text-[#888] font-mono">{t}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="h-9 border-t border-[#e8e8e8] bg-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3 text-[10px] text-[#aaa] font-mono">
          <span className="font-bold text-[#0a0a0a] tracking-wider">20022CHAIN</span><span>Bridge</span><div className="w-px h-3 bg-[#e8e8e8]" /><span>{chains.filter(c => c.status === 'ACTIVE').length} chains active</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-[#00C853] live-dot" /><span className="text-[#00C853] font-bold font-mono">ONLINE</span></div>
      </footer>
    </div>
  );
}
