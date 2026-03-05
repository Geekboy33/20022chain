"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowUpRight, Copy, Check, ExternalLink, FileText, ArrowLeft,
  XCircle, RefreshCw, Loader2, Box, Hash, Send, Clock, Shield,
  Building2, TrendingUp, Scale, Globe, Layers, Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";

const ISO_NAMES: Record<string, string> = {
  'setr.012': 'Asset Tokenization', 'pacs.008': 'Token Transfer', 'semt.002': 'Holdings Report',
  'sese.023': 'Settlement', 'seev.031': 'Corporate Action', 'camt.053': 'Account Statement',
  'colr.003': 'Collateral Mgmt', 'reda.041': 'Reference Data',
};
const RWA_NAMES: Record<string, string> = { 'MINE': 'Mining', 'REAL': 'Real Estate', 'BOND': 'Fixed Income', 'COMM': 'Commodity', 'GEM': 'Gemstone' };
const RWA_C: Record<string, string> = { 'MINE': '#92700a', 'REAL': '#1D4ED8', 'BOND': '#7C3AED', 'COMM': '#059669', 'GEM': '#DB2777' };

function Cp({ t }: { t: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(t); setOk(true); setTimeout(() => setOk(false), 1200); }}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-black/5 transition-colors" aria-label="Copiar">
      {ok ? <Check size={14} className="text-[#00C853]" /> : <Copy size={14} className="text-[#888]" />}
    </button>
  );
}

function Addr({ a, full = false }: { a: string; full?: boolean }) {
  if (!a) return <span className="text-[#ccc]">—</span>;
  const parts = a.split(':');
  if (parts[0] === 'archt' && parts.length >= 3) {
    const addrType = parts[1];
    const context = parts.length === 4 ? parts[2] : null;
    const hash = parts[parts.length - 1];
    const typeColors: Record<string, string> = {
      'contract': '#00C853', 'val': '#1D4ED8', 'account': '#555', 'wallet': '#555',
      'user': '#555', 'owner': '#7C3AED', 'system': '#F59E0B', 'genesis': '#F59E0B',
    };
    const typeColor = typeColors[addrType] || '#059669';
    return (
      <span className="inline-flex items-center gap-0.5 text-[12px] font-mono">
        <span className="text-[#bbb]">archt:</span>
        <span className="font-semibold" style={{ color: typeColor }}>{addrType}</span>
        {context && <><span className="text-[#ccc]">:</span><span className="text-[#0a0a0a] font-semibold">{full ? context : context.slice(0, 20)}</span></>}
        <span className="text-[#ccc]">:</span>
        <span className="text-[#999]">{full ? hash : `${hash.slice(0, 10)}...`}</span>
      </span>
    );
  }
  return <span className="text-[12px] font-mono text-[#888]">{a.length > 40 ? `${a.slice(0, 20)}...${a.slice(-8)}` : a}</span>;
}

function tAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'hace un momento';
  if (s < 60) return `hace ${s}s`;
  if (s < 3600) return `hace ${Math.floor(s / 60)}m`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)}h`;
  return `hace ${Math.floor(s / 86400)}d`;
}

export default function TxVerifyPage() {
  const params = useParams();
  const hash = decodeURIComponent((params.hash as string) || '');
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/transactions?hash=${encodeURIComponent(hash)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setTx(null);
        } else {
          setTx(data);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Error al cargar');
        setTx(null);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl border-2 border-[#0a0a0a] flex items-center justify-center mb-6 animate-pulse">
            <Hash size={28} className="text-[#0a0a0a]" />
          </div>
          <Loader2 size={28} className="animate-spin text-[#00C853] mb-4" />
          <p className="text-sm font-bold text-[#0a0a0a]">Verificando transacción...</p>
          <p className="text-xs text-[#888] mt-1 font-mono">{hash.slice(0, 20)}...</p>
        </div>
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-8 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative z-10 max-w-md w-full">
          <div className="bg-white border border-[#e8e8e8] rounded-3xl p-8 text-center shadow-xl">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FEE2E2] to-[#FECACA] flex items-center justify-center mx-auto mb-6">
              <XCircle size={36} className="text-[#EF4444]" />
            </div>
            <h1 className="text-xl font-extrabold text-[#0a0a0a] mb-2 tracking-tight">Transacción no encontrada</h1>
            <p className="text-sm text-[#666] mb-2">{error || 'El hash no existe en la blockchain.'}</p>
            <p className="text-xs text-[#999] mb-6">Si acabas de enviar la transacción, espera ~6 segundos y reintenta.</p>
            <div className="flex flex-wrap items-center gap-3 justify-center">
              <a href={`/tx/${encodeURIComponent(hash)}`} className="h-11 px-5 rounded-xl border-2 border-[#0a0a0a] text-sm font-bold hover:bg-[#0a0a0a] hover:text-white transition-all flex items-center gap-2">
                <RefreshCw size={14} /> Reintentar
              </a>
              <a href="/" className="h-11 px-5 rounded-xl border border-[#e8e8e8] text-sm font-bold hover:bg-[#f3f3f3] flex items-center gap-2">
                <ArrowLeft size={14} /> Explorer
              </a>
              <a href="/sandbox" className="h-11 px-5 rounded-xl bg-[#F59E0B] text-white text-sm font-bold hover:bg-[#D97706] flex items-center gap-2">
                Sandbox
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = tx.status || 'pending';
  const statusConfig = {
    confirmed: { color: '#00C853', bg: '#00C853', label: 'Confirmada', icon: Check },
    pending: { color: '#F59E0B', bg: '#F59E0B', label: 'Pendiente', icon: Clock },
    failed: { color: '#EF4444', bg: '#EF4444', label: 'Fallida', icon: XCircle },
  };
  const sc = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = sc.icon;
  const isoType = tx.iso20022?.messageType || tx.iso20022?.message_type || '—';
  const rwaType = tx.iso20022?.rwaType || tx.iso20022?.rwa_type || '—';
  const rwaColor = RWA_C[rwaType] || '#555';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
      <header className="relative z-10 border-b border-[#e8e8e8] bg-white/95 backdrop-blur-sm shrink-0">
        <div className="h-16 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl border-2 border-[#0a0a0a] flex items-center justify-center">
                <Hash size={18} className="text-[#0a0a0a]" />
              </div>
              <div>
                <h1 className="text-[15px] font-extrabold tracking-[.2em] uppercase">20022Chain</h1>
                <p className="text-[9px] text-[#888] font-mono">Verificación de transacción</p>
              </div>
            </a>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ backgroundColor: `${sc.color}12`, border: `1px solid ${sc.color}30` }}>
              <StatusIcon size={14} style={{ color: sc.color }} />
              <span className="text-[11px] font-bold capitalize" style={{ color: sc.color }}>{sc.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="h-10 px-4 rounded-xl border border-[#e8e8e8] text-[12px] font-bold hover:bg-[#f3f3f3] flex items-center gap-2">
              <ArrowLeft size={14} /> Explorer
            </a>
            <a href="/sandbox" className="h-10 px-4 rounded-xl bg-[#0a0a0a] text-white text-[12px] font-bold hover:bg-[#222] flex items-center gap-2">
              Sandbox
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Hero — Amount & Status */}
          <div className="bg-white border border-[#e8e8e8] rounded-3xl overflow-hidden shadow-lg">
            <div className="p-8 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Banknote size={24} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-white/60">Monto transferido</div>
                    <div className="text-4xl font-extrabold font-mono tracking-tight num-pop">
                      {Number(tx.amount || 0).toLocaleString()}
                    </div>
                    <div className="text-[13px] font-bold text-white/80 mt-0.5">ARCHT</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Fee</div>
                  <div className="text-lg font-bold font-mono">{Number(tx.fee || 0).toFixed(6)}</div>
                  <div className="text-[11px] text-white/70">ARCHT</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-white/10">
                  {ISO_NAMES[isoType] || isoType}
                </span>
                <span className="px-3 py-1 rounded-lg text-[10px] font-bold" style={{ backgroundColor: `${rwaColor}30`, color: rwaColor }}>
                  {RWA_NAMES[rwaType] || rwaType}
                </span>
              </div>
            </div>
          </div>

          {/* Transfer Flow — From → To */}
          <div className="bg-white border border-[#e8e8e8] rounded-3xl p-6 shadow-sm">
            <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Send size={14} /> Flujo de transferencia
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 p-4 rounded-2xl bg-[#f7f7f7] border border-[#e8e8e8]">
                <div className="text-[10px] font-bold text-[#888] uppercase mb-2">Remitente (From)</div>
                <div className="flex items-center justify-between gap-2">
                  <Addr a={tx.from} full />
                  <Cp t={tx.from || ''} />
                </div>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] flex items-center justify-center">
                  <ArrowUpRight size={18} className="text-white rotate-[-45deg]" />
                </div>
                <div className="text-[9px] font-bold text-[#888] mt-1">→</div>
              </div>
              <div className="flex-1 p-4 rounded-2xl bg-[#f7f7f7] border border-[#e8e8e8]">
                <div className="text-[10px] font-bold text-[#888] uppercase mb-2">Destinatario (To)</div>
                <div className="flex items-center justify-between gap-2">
                  <Addr a={tx.to} full />
                  <Cp t={tx.to || ''} />
                </div>
              </div>
            </div>
          </div>

          {/* ISO 20022 & Compliance */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#e8e8e8] rounded-3xl p-6 shadow-sm">
              <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers size={14} /> ISO 20022
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                  <span className="text-[12px] text-[#666]">Tipo de mensaje</span>
                  <span className="text-[12px] font-bold font-mono">{isoType}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                  <span className="text-[12px] text-[#666]">Tipo RWA</span>
                  <span className="text-[12px] font-bold" style={{ color: rwaColor }}>{RWA_NAMES[rwaType] || rwaType}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                  <span className="text-[12px] text-[#666]">ISIN</span>
                  <span className="text-[12px] font-mono text-[#0a0a0a]">{tx.iso20022?.isin || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[12px] text-[#666]">LEI</span>
                  <span className="text-[12px] font-mono text-[#0a0a0a] truncate max-w-[180px]">{tx.iso20022?.lei || '—'}</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#e8e8e8] rounded-3xl p-6 shadow-sm">
              <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield size={14} /> Detalles técnicos
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                  <span className="text-[12px] text-[#666]">Nonce</span>
                  <span className="text-[12px] font-bold font-mono">{tx.nonce ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                  <span className="text-[12px] text-[#666]">Jurisdicción</span>
                  <span className="text-[12px] font-bold">{tx.iso20022?.jurisdiction || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[12px] text-[#666]">Fecha</span>
                  <span className="text-[12px] font-mono">{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '—'}</span>
                </div>
                {tx.timestamp && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#888] mt-1">
                    <Clock size={12} />
                    {tAgo(tx.timestamp)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tx Hash Card */}
          <div className="bg-white border border-[#e8e8e8] rounded-3xl p-6 shadow-sm">
            <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={14} /> Hash de transacción
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#f7f7f7] border border-[#e8e8e8]">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono text-[#0a0a0a] break-all">{tx.hash}</div>
              </div>
              <Cp t={tx.hash || ''} />
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="h-10 px-4 rounded-xl border border-[#e8e8e8] text-[11px] font-bold hover:bg-[#f3f3f3] flex items-center gap-2"
              >
                <Copy size={12} /> Copiar enlace
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a href="/" className="h-12 px-6 rounded-2xl border-2 border-[#e8e8e8] text-sm font-bold hover:border-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white transition-all flex items-center gap-2">
              <Box size={16} /> Ver bloques
            </a>
            <a href="/" className="h-12 px-6 rounded-2xl border-2 border-[#e8e8e8] text-sm font-bold hover:border-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white transition-all flex items-center gap-2">
              <ArrowUpRight size={16} /> Todas las transacciones
            </a>
            <a href="/sandbox" className="h-12 px-6 rounded-2xl bg-[#F59E0B] text-white text-sm font-bold hover:bg-[#D97706] flex items-center gap-2">
              Sandbox <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
