"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useChainAuth } from "@/lib/auth-context";

export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login, isLoading } = useChainAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Enter email and password"); return; }
    const r = await login(email, password);
    if (r.success) { onClose(); setEmail(""); setPassword(""); }
    else setError(r.error || "Login failed");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[200] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div className="relative w-full max-w-md mx-4 bg-white border border-[#e8e8ec] rounded-2xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
            <div className="p-6 pb-0 relative">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 text-[#8b8b94] hover:text-[#0A0A0A] rounded-lg" aria-label="Close"><X size={16} /></button>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-lg bg-[#0A0A0A] flex items-center justify-center"><span className="font-black text-white text-[9px]">20022</span></div>
                <div>
                  <h2 className="text-base font-bold">20022Chain Explorer</h2>
                  <p className="text-[11px] text-[#8b8b94]">Sign in to access the blockchain</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs">
                  <AlertCircle size={14} />{error}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-[#8b8b94] uppercase tracking-wider mb-1">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c4c4c4]" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="w-full h-10 pl-9 pr-3 bg-[#fafafa] border border-[#e8e8ec] rounded-lg text-sm focus:outline-none focus:border-[#0A0A0A]/30" autoComplete="email" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#8b8b94] uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c4c4c4]" />
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="w-full h-10 pl-9 pr-10 bg-[#fafafa] border border-[#e8e8ec] rounded-lg text-sm focus:outline-none focus:border-[#0A0A0A]/30" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c4c4c4]" aria-label="Toggle password">{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full h-11 bg-[#0A0A0A] text-white text-sm font-bold rounded-lg hover:bg-[#1a1a2e] transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>SIGN IN <ArrowRight size={14} /></>}
              </button>
              <div className="pt-3 border-t border-[#f0f0f2] text-center">
                <p className="text-[11px] text-[#8b8b94]">Don&apos;t have credentials? <a href="#access" onClick={onClose} className="text-[#0A0A0A] font-semibold hover:underline">Request access</a></p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
