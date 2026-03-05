"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FlaskConical, Wallet, Plus, Copy, Check, Send, Droplets, RefreshCw,
  ArrowLeft, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Link2,
  Code, ExternalLink, X, Banknote, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const ISO_TYPES = ['pacs.008', 'setr.012', 'semt.002', 'sese.023', 'seev.031', 'camt.053'];
const RWA_TYPES = ['MINE', 'REAL', 'BOND', 'COMM', 'GEM'];

function genSandboxAddress(): string {
  const hash = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `archt:wallet:sandbox-${Date.now().toString(36)}:${hash}`;
}

interface SandboxWallet {
  id: string;
  address: string;
  name: string;
  createdAt: number;
}

function Cp({ t }: { t: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(t);
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-black/5 transition-colors"
      aria-label="Copiar"
    >
      {ok ? <Check size={12} className="text-[#00C853]" /> : <Copy size={12} className="text-[#888]" />}
    </button>
  );
}

export default function SandboxPage() {
  const [wallets, setWallets] = useState<SandboxWallet[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fauceting, setFauceting] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [rustOnline, setRustOnline] = useState<boolean | null>(null);

  // Send form
  const [fromAddr, setFromAddr] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [msgType, setMsgType] = useState("pacs.008");
  const [rwaType, setRwaType] = useState("MINE");
  const [expanded, setExpanded] = useState(false);

  // Last tx for verification
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Smart contracts
  const [templates, setTemplates] = useState<any[]>([]);
  const [deployedContracts, setDeployedContracts] = useState<any[]>([]);
  const [contractExpanded, setContractExpanded] = useState(false);
  const [contractName, setContractName] = useState("");
  const [contractTemplate, setContractTemplate] = useState("");
  const [contractOwnerWallet, setContractOwnerWallet] = useState("");
  const [deploying, setDeploying] = useState(false);

  const fetchBalance = useCallback(async (address: string): Promise<number> => {
    try {
      const res = await fetch(`/api/balance?address=${encodeURIComponent(address)}`);
      const d = await res.json();
      return d.balance ?? 0;
    } catch {
      return 0;
    }
  }, []);

  const fetchAll = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const [chainRes, txRes, ...balanceRes] = await Promise.all([
        fetch('/api/chain'),
        fetch('/api/transactions?count=30'),
        ...wallets.map(w => fetch(`/api/balance?address=${encodeURIComponent(w.address)}`)),
      ]);
      if (!chainRes.ok) throw new Error('Chain API unavailable');
      setRustOnline(true);

      const txData = await txRes.json();
      setRecentTxs(txData.transactions || []);

      const newBalances: Record<string, number> = {};
      const balanceData = await Promise.all(balanceRes.map(r => r.json()));
      wallets.forEach((w, i) => {
        newBalances[w.address] = balanceData[i]?.balance ?? 0;
      });
      setBalances(prev => ({ ...prev, ...newBalances }));
    } catch (e: any) {
      setRustOnline(false);
      setError(e.message || 'Rust backend no disponible. Inicia: cargo run --release en 20022chain-rust');
    }
    setLoading(false);
  }, [wallets]);

  useEffect(() => {
    fetchAll(true);
    const id = setInterval(() => fetchAll(false), 12000);
    return () => clearInterval(id);
  }, [fetchAll]);

  useEffect(() => {
    fetch('/api/contracts').then(r => r.json()).then(d => {
      setTemplates(d.templates || []);
      setDeployedContracts(d.contracts || []);
      if ((d.templates || []).length > 0) {
        setContractTemplate(prev => prev || d.templates[0]?.id || '');
      }
    }).catch(() => {});
  }, []);

  const deployContract = async () => {
    if (!contractName.trim()) { setError('Nombre del contrato requerido'); return; }
    if (!contractOwnerWallet) { setError('Selecciona la wallet propietaria del contrato'); return; }
    const tmpl = templates.find((t: any) => t.id === contractTemplate);
    if (!tmpl?.code) { setError('Selecciona una plantilla'); return; }
    setDeploying(true);
    setError(null);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deploy',
          sourceCode: tmpl.code,
          name: contractName.trim(),
          description: tmpl.description || '',
          type: tmpl.type || 'custom',
          owner: contractOwnerWallet,
        }),
      });
      const d = await res.json();
      if (d.address) {
        setDeployedContracts(prev => [...prev, { ...d, name: contractName, address: d.address, owner: contractOwnerWallet }]);
        setContractName('');
        fetch('/api/contracts').then(r => r.json()).then(data => setDeployedContracts(data.contracts || []));
      } else {
        setError(d.error || 'Error al desplegar');
      }
    } catch (e: any) {
      setError(e.message || 'Error al desplegar');
    }
    setDeploying(false);
  };

  const createWallet = () => {
    const addr = genSandboxAddress();
    const w: SandboxWallet = {
      id: addr,
      address: addr,
      name: `Sandbox ${wallets.length + 1}`,
      createdAt: Date.now(),
    };
    setWallets([...wallets, w]);
    setBalances(prev => ({ ...prev, [addr]: 0 }));
  };

  const requestFaucet = async (address: string) => {
    setFauceting(address);
    setError(null);
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, amount: 10000 }),
      });
      const d = await res.json();
      if (d.success) {
        const bal = await fetchBalance(address);
        setBalances(prev => ({ ...prev, [address]: bal }));
      } else {
        setError(d.error || 'Faucet failed');
      }
    } catch (e: any) {
      setError(e.message || 'Error al solicitar faucet');
    }
    setFauceting(null);
  };

  const sendTransaction = async () => {
    if (!fromAddr || !toAddr || !amount || parseFloat(amount) <= 0) {
      setError('Completa From, To y Amount');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromAddr,
          to: toAddr,
          amount: parseFloat(amount),
          fee: 0.001,
          messageType: msgType,
          rwaType,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setLastTxHash(d.hash || null);
        setAmount('');
        fetchAll();
      } else {
        setError(d.error || 'Transacción rechazada');
      }
    } catch (e: any) {
      setError(e.message || 'Error al enviar');
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#e8e8e8] bg-white shrink-0 z-50">
        <div className="h-14 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl border-2 border-[#F59E0B] bg-[#F59E0B]/10 flex items-center justify-center">
                <FlaskConical size={20} className="text-[#F59E0B]" />
              </div>
              <div>
                <h1 className="text-[15px] font-extrabold tracking-[.15em] uppercase leading-none">20022Chain Sandbox</h1>
                <p className="text-[9px] text-[#888] font-mono mt-0.5">Prueba wallets y transacciones en la blockchain</p>
              </div>
            </a>
            <div className="w-px h-6 bg-[#e8e8e8]" />
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                rustOnline === true ? "bg-[#00C853] animate-pulse" : rustOnline === false ? "bg-[#EF4444]" : "bg-[#F59E0B]"
              )} />
              <span className="text-[11px] font-bold">
                {rustOnline === true ? "Rust conectado" : rustOnline === false ? "Rust desconectado" : "Comprobando..."}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="h-9 px-4 rounded-lg border border-[#e8e8e8] text-[11px] font-bold text-[#555] hover:bg-[#f3f3f3] flex items-center gap-2">
              <ArrowLeft size={12} /> Explorer
            </a>
            <button onClick={() => { void fetchAll(false); }} disabled={loading} className="h-9 px-4 rounded-lg border border-[#e8e8e8] text-[11px] font-bold text-[#555] hover:bg-[#f3f3f3] flex items-center gap-2 disabled:opacity-50">
              <RefreshCw size={12} className={cn(loading && "animate-spin")} /> Actualizar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Flujo guiado */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5">
            <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-4">Flujo de prueba</div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a0a0a] text-white text-[10px] font-bold">
                <Wallet size={12} /> 1. Crear wallet
              </span>
              <ArrowRight size={14} className="text-[#ccc]" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a0a0a]/10 text-[#0a0a0a] text-[10px] font-bold">
                <Banknote size={12} /> 2. Ver saldo (ARCHT)
              </span>
              <ArrowRight size={14} className="text-[#ccc]" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a0a0a]/10 text-[#0a0a0a] text-[10px] font-bold">
                <Code size={12} /> 3. Crear contrato (wallet = dueña)
              </span>
              <ArrowRight size={14} className="text-[#ccc]" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a0a0a]/10 text-[#0a0a0a] text-[10px] font-bold">
                <Send size={12} /> 4. Transferir
              </span>
              <ArrowRight size={14} className="text-[#ccc]" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00C853]/10 text-[#00C853] text-[10px] font-bold">
                <Link2 size={12} /> 5. Verificar hash en Explorer
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C]">
              <XCircle size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {lastTxHash && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#166534]">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CheckCircle size={20} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold">Transacción enviada</div>
                  <div className="text-[11px] font-mono text-[#15803d] truncate max-w-[280px]">{lastTxHash}</div>
                </div>
                <Cp t={lastTxHash} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/tx/${encodeURIComponent(lastTxHash)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-4 rounded-xl bg-[#166534] text-white text-[11px] font-bold hover:bg-[#14532d] flex items-center gap-2"
                >
                  Verificar en Explorer <ExternalLink size={12} />
                </a>
                <button onClick={() => setLastTxHash(null)} className="h-9 w-9 rounded-xl border border-[#86EFAC] hover:bg-[#86EFAC]/20 flex items-center justify-center text-[#166534]" aria-label="Cerrar">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Create wallet + Wallets list */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e8e8e8] flex items-center justify-between">
              <h2 className="text-[14px] font-extrabold uppercase tracking-wider flex items-center gap-2">
                <Wallet size={16} /> Wallets de prueba
              </h2>
              <button
                onClick={createWallet}
                className="h-9 px-4 rounded-xl bg-[#0a0a0a] text-white text-[11px] font-bold hover:bg-[#222] flex items-center gap-2"
              >
                <Plus size={14} /> Crear wallet
              </button>
            </div>
            <div className="divide-y divide-[#f3f3f3]">
              {wallets.length === 0 ? (
                <div className="py-16 text-center text-[#999] text-[13px]">
                  No hay wallets. Crea una para empezar.
                </div>
              ) : (
                wallets.map((w) => (
                  <div key={w.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#FAFAFA]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold truncate">{w.name}</span>
                        <Cp t={w.address} />
                      </div>
                      <div className="text-[10px] font-mono text-[#888] truncate mt-0.5">{w.address}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a0a0a]/5 border border-[#e8e8e8]">
                        <Banknote size={14} className="text-[#0a0a0a]" />
                        <span className="text-[15px] font-extrabold font-mono tabular-nums text-[#0a0a0a]">
                          {typeof balances[w.address] === 'number' ? balances[w.address].toLocaleString() : '0'}
                        </span>
                        <span className="text-[11px] font-bold text-[#555]">ARCHT</span>
                      </div>
                      <button
                        onClick={() => requestFaucet(w.address)}
                        disabled={fauceting !== null || !rustOnline}
                        className="h-8 px-3 rounded-lg bg-[#0a0a0a]/5 border border-[#e8e8e8] text-[10px] font-bold hover:bg-[#0a0a0a]/10 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {fauceting === w.address ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Droplets size={12} />
                        )}
                        Faucet +10K
                      </button>
                      <button
                        onClick={() => setFromAddr(w.address)}
                        className="h-8 px-3 rounded-lg border border-[#00C853]/50 text-[#00C853] text-[10px] font-bold hover:bg-[#00C853]/5"
                      >
                        From
                      </button>
                      <button
                        onClick={() => setToAddr(w.address)}
                        className="h-8 px-3 rounded-lg border border-[#1D4ED8]/50 text-[#1D4ED8] text-[10px] font-bold hover:bg-[#1D4ED8]/5"
                      >
                        To
                      </button>
                      <button
                        onClick={() => { setContractOwnerWallet(w.address); setContractExpanded(true); }}
                        className={cn(
                          "h-8 px-3 rounded-lg border text-[10px] font-bold",
                          contractOwnerWallet === w.address
                            ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]"
                            : "border-[#7C3AED]/50 text-[#7C3AED] hover:bg-[#7C3AED]/5"
                        )}
                        title="Usar como dueña del contrato"
                      >
                        Dueña
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Send transaction */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
            >
              <h2 className="text-[14px] font-extrabold uppercase tracking-wider flex items-center gap-2">
                <Send size={16} /> Enviar transacción
              </h2>
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expanded && (
              <div className="px-6 pb-6 pt-0 border-t border-[#e8e8e8]">
                <div className="grid gap-4 max-w-xl">
                  <div>
                    <label className="text-[9px] font-bold text-[#888] uppercase block mb-1">From (remitente)</label>
                    <input
                      value={fromAddr}
                      onChange={(e) => setFromAddr(e.target.value)}
                      placeholder="archt:wallet:sandbox-xxx:..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e8e8e8] text-[12px] font-mono focus:border-[#0a0a0a] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#888] uppercase block mb-1">To (destinatario)</label>
                    <input
                      value={toAddr}
                      onChange={(e) => setToAddr(e.target.value)}
                      placeholder="archt:wallet:sandbox-xxx:..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e8e8e8] text-[12px] font-mono focus:border-[#0a0a0a] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#888] uppercase block mb-1">Amount (ARCHT)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="1000"
                      min="0"
                      step="0.001"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e8e8e8] text-[12px] focus:border-[#0a0a0a] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-[#888] uppercase block mb-1">ISO Message Type</label>
                      <select
                        value={msgType}
                        onChange={(e) => setMsgType(e.target.value)}
                        aria-label="Tipo de mensaje ISO 20022"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#e8e8e8] text-[12px] focus:border-[#0a0a0a] outline-none bg-white"
                      >
                        {ISO_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[#888] uppercase block mb-1">RWA Type</label>
                      <select
                        value={rwaType}
                        onChange={(e) => setRwaType(e.target.value)}
                        aria-label="Tipo de activo RWA"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#e8e8e8] text-[12px] focus:border-[#0a0a0a] outline-none bg-white"
                      >
                        {RWA_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={sendTransaction}
                    disabled={sending || !rustOnline}
                    className="h-11 px-6 rounded-xl bg-[#0a0a0a] text-white text-[12px] font-bold hover:bg-[#222] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Smart Contracts */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
            <button
              onClick={() => setContractExpanded(!contractExpanded)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
            >
              <h2 className="text-[14px] font-extrabold uppercase tracking-wider flex items-center gap-2">
                <Code size={16} /> Smart Contracts
              </h2>
              {contractExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {contractExpanded && (
              <div className="px-6 pb-6 pt-0 border-t border-[#e8e8e8]">
                <div className="grid gap-4 max-w-xl">
                  <div>
                    <label className="text-[9px] font-bold text-[#888] uppercase block mb-1">Wallet propietaria (dueña del contrato)</label>
                    <select
                      value={contractOwnerWallet}
                      onChange={(e) => setContractOwnerWallet(e.target.value)}
                      aria-label="Wallet propietaria"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e8e8e8] text-[12px] focus:border-[#0a0a0a] outline-none bg-white"
                    >
                      <option value="">— Selecciona una wallet —</option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.address}>
                          {w.name} — {balances[w.address]?.toLocaleString() ?? '0'} ARCHT
                        </option>
                      ))}
                    </select>
                    {wallets.length === 0 && (
                      <p className="text-[11px] text-[#F59E0B] mt-1">Crea una wallet primero para ser la dueña del contrato.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#888] uppercase block mb-1">Plantilla</label>
                    <select
                      value={contractTemplate}
                      onChange={(e) => setContractTemplate(e.target.value)}
                      aria-label="Plantilla de contrato"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e8e8e8] text-[12px] focus:border-[#0a0a0a] outline-none bg-white"
                    >
                      {templates.length === 0 && <option value="">Cargando plantillas...</option>}
                      {templates.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name} — {(t.description || '').slice(0, 40)}...</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#888] uppercase block mb-1">Nombre del contrato</label>
                    <input
                      value={contractName}
                      onChange={(e) => setContractName(e.target.value)}
                      placeholder="Mi RWA Token"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e8e8e8] text-[12px] focus:border-[#0a0a0a] outline-none"
                    />
                  </div>
                  <button
                    onClick={deployContract}
                    disabled={deploying || !contractName.trim() || !contractOwnerWallet}
                    className="h-11 px-6 rounded-xl bg-[#0a0a0a] text-white text-[12px] font-bold hover:bg-[#222] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {deploying ? <Loader2 size={16} className="animate-spin" /> : <Code size={16} />}
                    Desplegar contrato
                  </button>
                </div>
                {deployedContracts.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-[#e8e8e8]">
                    <div className="text-[10px] font-bold text-[#888] uppercase mb-3">Contratos desplegados</div>
                    <div className="space-y-2">
                      {deployedContracts.slice(0, 5).map((c: any) => (
                        <div key={c.address || c.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#f7f7f7] border border-[#e8e8e8]">
                          <div className="min-w-0">
                            <div className="text-[12px] font-bold truncate">{c.name}</div>
                            <div className="text-[10px] font-mono text-[#888] truncate">{c.address}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Cp t={c.address || ''} />
                            <a href={`/contracts/view/${encodeURIComponent(c.address)}`} target="_blank" rel="noopener noreferrer" className="h-7 px-2 rounded-lg border border-[#0a0a0a]/20 text-[9px] font-bold hover:bg-[#0a0a0a]/5 flex items-center gap-1">
                              Ver <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent transactions */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e8e8e8]">
              <h2 className="text-[14px] font-extrabold uppercase tracking-wider flex items-center gap-2">
                <Link2 size={16} /> Últimas transacciones
              </h2>
            </div>
            <div className="divide-y divide-[#f3f3f3] max-h-[320px] overflow-y-auto">
              {recentTxs.length === 0 ? (
                <div className="py-12 text-center text-[#999] text-[13px]">
                  No hay transacciones recientes.
                </div>
              ) : (
                recentTxs.slice(0, 20).map((tx: any) => (
                  <div key={tx.hash} className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-[#FAFAFA]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                          tx.status === 'confirmed' ? "bg-[#00C853]/10 text-[#00C853]" :
                          tx.status === 'pending' ? "bg-[#F59E0B]/10 text-[#F59E0B]" : "bg-[#EF4444]/10 text-[#EF4444]"
                        )}>
                          {tx.status || 'pending'}
                        </span>
                        <span className="text-[10px] font-mono text-[#888] truncate">{tx.hash?.slice(0, 16)}...</span>
                        <Cp t={tx.hash || ''} />
                        <a href={`/tx/${encodeURIComponent(tx.hash)}`} target="_blank" rel="noopener noreferrer" className="h-6 px-2 rounded-lg border border-[#0a0a0a]/20 text-[9px] font-bold hover:bg-[#0a0a0a]/5 flex items-center gap-1" title="Verificar en Explorer">
                          Verificar <ExternalLink size={10} />
                        </a>
                      </div>
                      <div className="text-[11px] text-[#555] mt-0.5">
                        {tx.from?.slice(0, 30)}... → {tx.to?.slice(0, 30)}...
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-extrabold font-mono">{Number(tx.amount || 0).toLocaleString()}</div>
                      <div className="text-[9px] text-[#888]">{tx.iso20022?.messageType || tx.iso20022?.message_type || '—'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="h-10 border-t border-[#e8e8e8] bg-white flex items-center justify-center text-[10px] text-[#888] font-mono">
        20022Chain Sandbox · ISO 20022 · Ambiente de pruebas temporal
      </footer>
    </div>
  );
}
