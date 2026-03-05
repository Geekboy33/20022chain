"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Shield, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, Loader2,
  Activity, Lock, Eye, Hash, Layers, Clock, Wallet, Code, Banknote,
  BadgeCheck, ChevronRight, Globe, Database, Link2, ArrowLeftRight, ArrowRight, X
} from "lucide-react";

interface Feed { id: string; name: string; asset: string; category: string; chainlinkFeedAddress: string; chainlinkNetwork: string; oracleNodes: number; heartbeat: number; deviation: number; totalReserve: number; totalTokensMinted: number; collateralRatio: number; currency: string; lastPrice: number; lastUpdate: number; proofHash: string; auditor: string; auditDate: number; auditResult: string; status: string; isinCodes: string[]; contractAddresses: string[]; custodians: string[]; jurisdiction: string; history?: { timestamp: number; reserve: number; ratio: number; price: number }[]; }
interface Attestation { id: string; feedId: string; timestamp: number; reserveAmount: number; tokenSupply: number; collateralRatio: number; proofHash: string; oracleSignatures: number; requiredSignatures: number; valid: boolean; blockNumber: number; txHash: string; }
interface Stats { totalReserveValueUSD: number; totalFeeds: number; healthyFeeds: number; averageCollateralRatio: number; lastGlobalAudit: number; totalAttestations: number; oracleNetworks: string[]; }

const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(2)}`;
const shortHash = (h: string) => h.length > 16 ? `${h.slice(0, 10)}...${h.slice(-6)}` : h;

const CAT_COLORS: Record<string, string> = {
  PRECIOUS_METAL: '#D97706', COMMODITY: '#EA580C', REAL_ESTATE: '#1D4ED8', TREASURY: '#059669',
  BOND: '#4F46E5', STABLECOIN: '#00C853', MINERAL: '#92700a', CURRENCY: '#7C3AED',
  CRYPTO: '#9333EA', EQUITY: '#0891B2',
};

const STATUS_CFG: Record<string, { icon: any; color: string }> = {
  HEALTHY:  { icon: CheckCircle2, color: '#00C853' },
  WARNING:  { icon: AlertTriangle, color: '#D97706' },
  CRITICAL: { icon: AlertTriangle, color: '#EF4444' },
  STALE:    { icon: Clock, color: '#999' },
};

export default function ReservesPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [feedAttestations, setFeedAttestations] = useState<Attestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; ratio: number; proofHash: string } | null>(null);
  const [tab, setTab] = useState<'overview' | 'feeds' | 'attestations'>('overview');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/por?action=overview');
      const d = await res.json();
      if (d.success) { setStats(d.stats); setFeeds(d.feeds); setAttestations(d.recentAttestations); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, [fetchData]);

  const selectFeed = async (id: string) => {
    try {
      const res = await fetch(`/api/por?action=feed&id=${id}`);
      const d = await res.json();
      if (d.success) { setSelectedFeed(d.feed); setFeedAttestations(d.attestations); setVerifyResult(null); }
    } catch (e) { console.error(e); }
  };

  const verifyReserve = async (feedId: string) => {
    setVerifying(feedId); setVerifyResult(null);
    try {
      const res = await fetch(`/api/por?action=verify&feedId=${feedId}`);
      const d = await res.json();
      if (d.success) setVerifyResult(d.verification);
    } catch (e) { console.error(e); }
    setVerifying(null);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 rounded-2xl border-2 border-[#0a0a0a] flex items-center justify-center mb-6"><Shield size={24} className="text-[#0a0a0a]" /></div>
      <div className="w-40 h-1 bg-[#eee] rounded-full overflow-hidden"><div className="h-full w-3/4 bg-[#00C853] rounded-full scan-line" /></div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* HEADER */}
      <header className="border-b border-[#e8e8e8] bg-white shrink-0 z-50">
        <div className="h-14 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl border-[1.5px] border-[#0a0a0a] flex items-center justify-center relative">
                <Link2 size={14} className="text-[#0a0a0a]" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00C853] border-[1.5px] border-white live-dot" />
              </div>
              <div>
                <h1 className="text-[13px] font-extrabold text-[#0a0a0a] tracking-[.15em] uppercase leading-none">20022Chain</h1>
                <p className="text-[8px] text-[#aaa] font-mono mt-0.5 tracking-widest">PROOF OF RESERVE</p>
              </div>
            </Link>
            <div className="w-px h-6 bg-[#e8e8e8]" />
            <nav className="flex items-center gap-1">
              {(['overview', 'feeds', 'attestations'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setSelectedFeed(null); }}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${tab === t ? 'bg-[#0a0a0a] text-white' : 'text-[#888] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="btn-outline"><ArrowLeft size={12} /> Explorer</a>
            <a href="/wallets" className="btn-outline"><Wallet size={12} /> Wallets</a>
            <a href="/bridge" className="btn-outline"><ArrowLeftRight size={12} /> Bridge</a>
            <a href="/payments" className="btn-outline"><Banknote size={12} /> Gpay3</a>
            <a href="/contracts" className="btn-outline"><Code size={12} /> Contracts</a>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-[#FAFAFA]">
        <div className="max-w-[1440px] mx-auto px-8 py-6">
          {/* STATS */}
          {stats && (
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[
                { label: 'Total Reserves', value: fmt(stats.totalReserveValueUSD), icon: Database, accent: true },
                { label: 'Active Feeds', value: `${stats.healthyFeeds}/${stats.totalFeeds}`, icon: Activity },
                { label: 'Avg Collateral', value: `${(stats.averageCollateralRatio * 100).toFixed(1)}%`, icon: Shield },
                { label: 'Attestations', value: stats.totalAttestations.toLocaleString(), icon: BadgeCheck },
                { label: 'Oracle Networks', value: stats.oracleNetworks.length.toString(), icon: Globe },
                { label: 'Last Audit', value: new Date(stats.lastGlobalAudit).toLocaleDateString(), icon: Clock },
              ].map((s, i) => (
                <div key={s.label} className="card p-5 fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center justify-between mb-3">
                    <s.icon size={15} className="text-[#bbb]" />
                    <span className="text-[8px] font-bold text-[#bbb] uppercase tracking-widest">{s.label}</span>
                  </div>
                  <div className={`text-xl font-extrabold font-mono ${s.accent ? 'text-[#00C853]' : 'text-[#0a0a0a]'}`}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* FEED DETAIL */}
            {selectedFeed ? (
              <motion.div key="detail" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <button onClick={() => setSelectedFeed(null)} className="flex items-center gap-1.5 text-[11px] text-[#888] hover:text-[#00C853] font-semibold mb-4 transition"><ArrowLeft size={12} /> Back to feeds</button>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                  <div className="space-y-4">
                    {/* Header Card */}
                    <div className="card p-6">
                      <div className="flex items-center gap-4 mb-6">
                        {(() => { const si = STATUS_CFG[selectedFeed.status] || STATUS_CFG.HEALTHY; const Ic = si.icon; return <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${si.color}10`, border: `2px solid ${si.color}25` }}><Ic size={24} style={{ color: si.color }} /></div>; })()}
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-[#0a0a0a]">{selectedFeed.name}</h2>
                          <p className="text-[11px] text-[#999] font-mono">{selectedFeed.asset} · {selectedFeed.category.replace('_', ' ')} · {selectedFeed.jurisdiction}</p>
                        </div>
                        <button onClick={() => verifyReserve(selectedFeed.id)} disabled={!!verifying}
                          className="btn-green h-10 px-5 text-[11px]">
                          {verifying === selectedFeed.id ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                          Verify Now
                        </button>
                      </div>

                      {verifyResult && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-xl mb-6 border ${verifyResult.verified ? 'bg-[#00C85308] border-[#00C85320]' : 'bg-[#EF444408] border-[#EF444420]'}`}>
                          <div className="flex items-center gap-2">
                            {verifyResult.verified ? <CheckCircle2 size={18} className="text-[#00C853]" /> : <AlertTriangle size={18} className="text-[#EF4444]" />}
                            <span className={`font-bold text-[13px] ${verifyResult.verified ? 'text-[#00C853]' : 'text-[#EF4444]'}`}>
                              {verifyResult.verified ? 'RESERVE VERIFIED — Fully Collateralized' : 'WARNING — Under-Collateralized'}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#888] mt-1 font-mono">Ratio: {(verifyResult.ratio * 100).toFixed(2)}% · Proof: {shortHash(verifyResult.proofHash)}</p>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { label: 'Total Reserve', value: fmt(selectedFeed.totalReserve), color: '#00C853' },
                          { label: 'Tokens Minted', value: fmt(selectedFeed.totalTokensMinted), color: '#1D4ED8' },
                          { label: 'Collateral Ratio', value: `${(selectedFeed.collateralRatio * 100).toFixed(2)}%`, color: selectedFeed.collateralRatio >= 1 ? '#00C853' : '#EF4444' },
                          { label: 'Last Price', value: `$${selectedFeed.lastPrice.toLocaleString()}`, color: '#D97706' },
                        ].map(m => (
                          <div key={m.label} className="bg-[#FAFAFA] border border-[#e8e8e8] rounded-xl p-4">
                            <span className="text-[9px] text-[#aaa] uppercase tracking-widest font-bold">{m.label}</span>
                            <p className="text-lg font-extrabold font-mono mt-1" style={{ color: m.color }}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Oracle Config */}
                    <div className="card p-5">
                      <h3 className="text-sm font-bold mb-4">Chainlink Oracle Configuration</h3>
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        {[
                          { l: 'Feed Address', v: shortHash(selectedFeed.chainlinkFeedAddress), accent: true },
                          { l: 'Network', v: selectedFeed.chainlinkNetwork },
                          { l: 'Oracle Nodes', v: selectedFeed.oracleNodes.toString() },
                          { l: 'Heartbeat', v: `${selectedFeed.heartbeat}s` },
                          { l: 'Deviation', v: `${selectedFeed.deviation}%` },
                          { l: 'Auditor', v: selectedFeed.auditor },
                        ].map(x => (
                          <div key={x.l} className="flex justify-between p-3 bg-[#FAFAFA] rounded-lg border border-[#e8e8e8]">
                            <span className="text-[#999]">{x.l}</span>
                            <span className={`font-mono font-semibold ${x.accent ? 'text-[#00C853]' : 'text-[#0a0a0a]'}`}>{x.v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <span className="text-[9px] text-[#aaa] uppercase tracking-widest font-bold">Custodians</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedFeed.custodians.map(c => <span key={c} className="text-[9px] px-2 py-0.5 rounded bg-[#f3f3f3] text-[#555] border border-[#e8e8e8]">{c}</span>)}
                        </div>
                      </div>
                    </div>

                    {/* History */}
                    {selectedFeed.history && selectedFeed.history.length > 0 && (
                      <div className="card p-5">
                        <h3 className="text-sm font-bold mb-4">Reserve History (30d)</h3>
                        <div className="flex items-end gap-[2px] h-32">
                          {selectedFeed.history.slice(-30).map((h, i) => {
                            const maxR = Math.max(...selectedFeed.history!.map(x => x.reserve));
                            const pct = (h.reserve / maxR) * 100;
                            return (
                              <div key={i} className="flex-1 rounded-t bar-grow" style={{
                                height: `${pct}%`, background: h.ratio >= 1 ? '#00C85325' : '#EF444425',
                                border: `1px solid ${h.ratio >= 1 ? '#00C85315' : '#EF444415'}`, borderBottom: 'none', minWidth: 2,
                                animationDelay: `${i * 20}ms`,
                              }} title={`${new Date(h.timestamp).toLocaleDateString()} — $${(h.reserve / 1e6).toFixed(0)}M — Ratio: ${(h.ratio * 100).toFixed(1)}%`} />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Attestations sidebar */}
                  <div>
                    <div className="card p-5 sticky top-6">
                      <h3 className="text-sm font-bold mb-4">Recent Attestations</h3>
                      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {feedAttestations.map(a => (
                          <div key={a.id} className="bg-[#FAFAFA] border border-[#e8e8e8] rounded-lg p-3 text-[10px]">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`flex items-center gap-1 font-semibold ${a.valid ? 'text-[#00C853]' : 'text-[#EF4444]'}`}>
                                {a.valid ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                                {a.valid ? 'Valid' : 'Invalid'}
                              </span>
                              <span className="text-[#bbb]">{new Date(a.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[#888]">
                              <span>Reserve: {fmt(a.reserveAmount)}</span>
                              <span>Ratio: {(a.collateralRatio * 100).toFixed(2)}%</span>
                              <span>Sigs: {a.oracleSignatures}/{a.requiredSignatures}</span>
                              <span>Block: #{a.blockNumber}</span>
                            </div>
                            <p className="font-mono text-[#ccc] mt-1 truncate text-[9px]">Proof: {a.proofHash}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Feeds Grid */}
                {(tab === 'overview' || tab === 'feeds') && (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-[#0a0a0a] flex items-center gap-2"><Shield size={15} className="text-[#00C853]" /> Chainlink Proof of Reserve Feeds</h2>
                      <button onClick={fetchData} className="btn-outline h-8 px-3 text-[10px]"><RefreshCw size={11} /> Refresh</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {feeds.map(f => {
                        const catColor = CAT_COLORS[f.category] || '#888';
                        const si = STATUS_CFG[f.status] || STATUS_CFG.HEALTHY;
                        const SIcon = si.icon;
                        return (
                          <button key={f.id} onClick={() => selectFeed(f.id)}
                            className="card p-5 text-left hover:border-[#ccc] transition group">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${si.color}10`, border: `1.5px solid ${si.color}20` }}>
                                <SIcon size={18} style={{ color: si.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[13px] text-[#0a0a0a] truncate">{f.name}</p>
                                <p className="text-[9px] text-[#aaa] font-mono">{f.asset} · {f.jurisdiction}</p>
                              </div>
                              <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: catColor, background: `${catColor}08`, border: `1px solid ${catColor}18` }}>{f.category.replace('_', ' ')}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-3 text-[10px]">
                              <div><span className="text-[#bbb]">Reserve</span><p className="font-mono font-semibold text-[#0a0a0a] mt-0.5">{fmt(f.totalReserve)}</p></div>
                              <div><span className="text-[#bbb]">Minted</span><p className="font-mono text-[#555] mt-0.5">{fmt(f.totalTokensMinted)}</p></div>
                              <div><span className="text-[#bbb]">Ratio</span><p className="font-mono font-semibold mt-0.5" style={{ color: f.collateralRatio >= 1 ? '#00C853' : '#EF4444' }}>{(f.collateralRatio * 100).toFixed(1)}%</p></div>
                              <div><span className="text-[#bbb]">Price</span><p className="font-mono text-[#555] mt-0.5">${f.lastPrice.toLocaleString()}</p></div>
                            </div>
                            <div className="flex items-center gap-2 mt-3 text-[9px] text-[#aaa]">
                              <span>Auditor: {f.auditor}</span><span>·</span><span>Nodes: {f.oracleNodes}</span>
                              <ArrowRight size={10} className="ml-auto opacity-0 group-hover:opacity-100 text-[#00C853] transition" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Attestations Table */}
                {(tab === 'overview' || tab === 'attestations') && (
                  <div className="card overflow-hidden">
                    <div className="h-14 px-6 border-b border-[#e8e8e8] flex items-center justify-between">
                      <div className="flex items-center gap-3"><BadgeCheck size={15} className="text-[#00C853]" /><span className="text-sm font-bold">Recent Global Attestations</span></div>
                    </div>
                    <div className="table-header grid grid-cols-[1fr_100px_90px_100px_60px_80px_120px] gap-3 px-6 py-2.5">
                      <span>Feed</span><span className="text-right">Reserve</span><span className="text-right">Ratio</span><span className="text-center">Signatures</span><span className="text-center">Valid</span><span className="text-right">Block</span><span className="text-right">Time</span>
                    </div>
                    {attestations.map(a => {
                      const feed = feeds.find(f => f.id === a.feedId);
                      return (
                        <div key={a.id} className="table-row grid grid-cols-[1fr_100px_90px_100px_60px_80px_120px] gap-3 px-6 py-3 items-center">
                          <span className="text-[12px] font-medium text-[#0a0a0a]">{feed?.name || a.feedId}</span>
                          <span className="text-[11px] font-mono text-[#555] text-right">{fmt(a.reserveAmount)}</span>
                          <span className="text-[11px] font-mono font-semibold text-right" style={{ color: a.collateralRatio >= 1 ? '#00C853' : '#EF4444' }}>{(a.collateralRatio * 100).toFixed(2)}%</span>
                          <span className="text-[11px] font-mono text-[#555] text-center">{a.oracleSignatures}/{a.requiredSignatures}</span>
                          <div className="flex justify-center">{a.valid ? <CheckCircle2 size={14} className="text-[#00C853]" /> : <AlertTriangle size={14} className="text-[#EF4444]" />}</div>
                          <span className="text-[10px] font-mono text-[#999] text-right">#{a.blockNumber}</span>
                          <span className="text-[10px] text-[#999] text-right">{new Date(a.timestamp).toLocaleTimeString()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="h-9 border-t border-[#e8e8e8] bg-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3 text-[10px] text-[#aaa] font-mono">
          <span className="font-bold text-[#0a0a0a] tracking-wider">20022CHAIN</span><span>Proof of Reserve</span><div className="w-px h-3 bg-[#e8e8e8]" /><span>Chainlink PoR</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-[#00C853] live-dot" /><span className="text-[#00C853] font-bold font-mono">VERIFIED</span></div>
      </footer>
    </div>
  );
}
