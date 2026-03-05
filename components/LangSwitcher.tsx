"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check } from "lucide-react";
import { useI18n, LOCALES, LANG_META } from "@/lib/i18n";

export function LangSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANG_META[locale];

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[11px] font-semibold border border-[#e8e8ec] text-[#6b6b74] hover:text-[#0A0A0A] hover:border-[#d4d4d8] transition-all" aria-label="Change language">
        <Globe size={12} />
        <span className="hidden sm:inline">{current.flag} {locale.toUpperCase()}</span>
        <span className="sm:hidden">{current.flag}</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute top-full right-0 mt-2 w-44 bg-white border border-[#e8e8ec] rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-1.5">
                {LOCALES.map(l => (
                  <button key={l} onClick={() => { setLocale(l); setOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${l === locale ? "text-[#0A0A0A] bg-[#f5f5f7] font-semibold" : "text-[#6b6b74] hover:bg-[#fafafa]"}`}>
                    <span className="text-sm">{LANG_META[l].flag}</span>
                    <span className="flex-1 text-left">{LANG_META[l].label}</span>
                    {l === locale && <Check size={12} className="text-[#0A0A0A]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
