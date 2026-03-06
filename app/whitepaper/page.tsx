"use client";

import { useRef } from "react";
import { Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { LangSwitcher } from "@/components/LangSwitcher";
import { WP_20022_I18N, type WpBlock, type WpContent } from "@/lib/data/wp-20022-i18n";

export default function ChainWhitepaper() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { locale } = useI18n();
  const wp: WpContent = WP_20022_I18N[locale] || WP_20022_I18N.en;
  const handleDownload = () => { window.print(); };

  function renderBlock(block: WpBlock, i: number) {
    switch (block.type) {
      case "p":
        return <p key={i}>{block.text}</p>;
      case "h3":
        return <h3 key={i} className="text-base font-bold mt-6 mb-2">{block.text}</h3>;
      case "box":
        return (
          <div key={i} className="p-5 bg-[#fafafa] border border-[#e8e8ec] rounded-xl my-4">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3">{block.title}</h4>
            <ul className="space-y-1 text-xs text-[#4a4a5a] leading-relaxed">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          </div>
        );
      case "table":
        return (
          <div key={i} className="overflow-x-auto rounded-xl border border-[#e8e8ec] my-4">
            <table className="w-full text-xs">
              <thead className="bg-[#fafafa]">
                <tr>
                  {block.headers.map((h) => (
                    <th key={h} className="text-left p-3 font-bold uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f2]">
                {block.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((c, ci) => (
                      <td key={ci} className={`p-3 ${ci === 0 ? "font-semibold text-[#0A0A0A]" : "text-[#4a4a5a]"}`}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "code":
        return (
          <pre key={i} className="p-4 bg-[#0A0A0A] text-[#10B981] rounded-xl font-mono text-[10px] sm:text-[11px] overflow-x-auto my-4 leading-relaxed whitespace-pre-wrap">
            {block.text}
          </pre>
        );
      case "grid":
        return (
          <div key={i} className="space-y-3 my-4">
            {block.cells.map((cell, j) => (
              <div key={j} className="flex gap-4 py-2 border-b border-[#f0f0f2]">
                <span className="font-mono font-bold text-[#d4a855] w-20 shrink-0 text-xs">{cell.label}</span>
                <span className="text-xs">{cell.value}</span>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <>
      <div className="print:hidden sticky top-0 z-50 h-14 bg-white/95 backdrop-blur-xl border-b border-[#e8e8ec] flex items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-[#8b8b94] hover:text-[#0A0A0A] transition-colors">
          <ArrowLeft size={16} /> {wp.toolbar.back}
        </Link>
        <div className="flex items-center gap-3">
          <LangSwitcher />
          <button onClick={handleDownload} className="h-8 px-4 bg-[#0A0A0A] text-white text-[11px] font-bold tracking-wider rounded-lg hover:bg-[#1a1a2e] transition-all flex items-center gap-2">
            <Download size={12} /> {wp.toolbar.download}
          </button>
        </div>
      </div>

      <div ref={contentRef} className="bg-white min-h-screen print:bg-white">
        <div className="max-w-[850px] mx-auto px-4 sm:px-8 lg:px-16 py-8 sm:py-12">

          {/* Cover */}
          <section className="min-h-[85vh] print:min-h-0 print:pb-12 flex flex-col items-center justify-center text-center mb-20 print:break-after-page">
            <div className="w-24 h-24 rounded-2xl bg-[#0A0A0A] flex items-center justify-center mb-8 shadow-xl"><span className="font-black text-white text-2xl tracking-tighter">20022</span></div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-3">20022Chain</h1>
            <div className="w-20 h-1 bg-[#0A0A0A] rounded-full mb-5" />
            <h2 className="text-xl font-semibold text-[#4a4a5a] mb-2">{wp.cover.title}</h2>
            <p className="text-base text-[#6b6b74] max-w-md whitespace-pre-line">{wp.cover.subtitle}</p>
            <p className="text-sm text-[#8b8b94] mt-8">{wp.cover.version}</p>
            <div className="mt-6 text-sm font-bold text-[#0A0A0A] tracking-wide">20022chain.com</div>
            <div className="mt-8 grid grid-cols-3 gap-6 text-xs text-[#6b6b74]">
              <div><span className="font-bold text-[#0A0A0A]">Chain ID:</span> 20022</div>
              <div><span className="font-bold text-[#0A0A0A]">Core:</span> Rust</div>
              <div><span className="font-bold text-[#0A0A0A]">TPS:</span> 50,000+</div>
            </div>
          </section>

          {/* TOC */}
          <Sec num="" title={wp.tocTitle} noBar>
            <div className="space-y-2 border-b-2 border-[#0A0A0A] pb-6 mb-6">
              {wp.tocItems.map((t, i) => (
                <div key={i} className="text-sm py-1.5 border-b border-[#f0f0f2]">
                  <span className="font-mono font-bold text-[#d4a855] mr-3">{String(i + 1).padStart(2, "0")}</span>
                  {t.replace(/^\d{2} — /, "")}
                </div>
              ))}
            </div>
          </Sec>

          {/* Sections from data */}
          {wp.sections.map((sec) => (
            <Sec key={sec.num} num={sec.num} title={sec.title} pb={sec.pb}>
              {sec.blocks.map((block, i) => renderBlock(block, i))}
            </Sec>
          ))}

          {/* Back Cover */}
          <section className="mt-16 py-12 text-center border-t-2 border-[#0A0A0A] print:break-before-page">
            <div className="w-14 h-14 rounded-xl bg-[#0A0A0A] flex items-center justify-center mx-auto mb-4"><span className="font-black text-white text-[11px]">20022</span></div>
            <h3 className="text-xl font-black">{wp.backCover.title}</h3>
            <p className="text-xs text-[#8b8b94] mt-1">{wp.backCover.subtitle}</p>
            <p className="text-xs text-[#8b8b94] mt-1">{wp.backCover.part}</p>
            <p className="text-sm font-bold text-[#0A0A0A] mt-4 tracking-wide">20022chain.com</p>
            <p className="text-[10px] text-[#c4c4c4] mt-4">{wp.backCover.rights}</p>
          </section>
        </div>
      </div>

      <style jsx global>{`@media print { body { background: white !important; } nav, .print\\:hidden { display: none !important; } @page { margin: 1.5cm; size: A4; } }`}</style>
    </>
  );
}

function Sec({ num, title, children, pb, noBar }: { num: string; title: string; children: React.ReactNode; pb?: boolean; noBar?: boolean }) {
  return (
    <section className={`mb-14 ${pb ? "print:break-after-page" : ""}`}>
      {num && (
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-mono font-bold text-[#d4a855] bg-[#d4a855]/10 px-2 py-1 rounded">{num}</span>
          <h2 className="text-xl font-black">{title}</h2>
        </div>
      )}
      {!num && !noBar && <h2 className="text-xl font-black mb-5">{title}</h2>}
      <div className="text-sm text-[#4a4a5a] leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
