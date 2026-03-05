import type { Metadata } from "next";
import "./globals.css";
import { ChainAuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "20022Chain — ISO 20022 RWA Blockchain",
  description: "The world's first ISO 20022-native blockchain for Real World Asset tokenization. Block explorer, wallets, smart contracts, and cross-chain bridges.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="antialiased bg-white text-[#0A0A0A] min-h-screen">
        <I18nProvider>
          <ChainAuthProvider>
            {children}
          </ChainAuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
