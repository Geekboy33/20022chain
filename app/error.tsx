"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[20022Chain] Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] flex items-center justify-center mx-auto mb-6">
          <span className="font-black text-white text-xl tracking-tighter">20022</span>
        </div>
        <h1 className="text-xl font-bold text-[#0A0A0A] mb-2">Algo salió mal</h1>
        <p className="text-sm text-[#6b6b74] mb-6">
          Ha ocurrido un error al cargar la aplicación. Por favor, inténtalo de nuevo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="h-11 px-6 bg-[#0A0A0A] text-white text-sm font-bold rounded-xl hover:bg-[#1a1a2e] transition-all"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="h-11 px-6 border border-[#e8e8e8] text-[#0A0A0A] text-sm font-semibold rounded-xl hover:bg-[#f5f5f5] transition-all flex items-center justify-center"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
