import type { Metadata } from "next";
import "./globals.css";
import { ChainAuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n";

const SITE = "https://20022chain.com";
const TITLE = "20022Chain — The RWA Settlement Blockchain";
const DESC = "The world's first blockchain built for institutional Real World Asset tokenization and settlement. 50K+ TPS, instant finality, 128 validators, cross-chain bridges.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s | 20022Chain" },
  description: DESC,
  keywords: ["20022Chain","blockchain","RWA","Real World Assets","tokenization","settlement","institutional","mining","ISIN","ViewsRight","smart contracts","cross-chain","DeFi","ARCHT","cryptocurrency","web3"],
  authors: [{ name: "20022Chain", url: SITE }],
  creator: "20022Chain",
  robots: { index: true, follow: true },
  openGraph: { type: "website", locale: "en_US", url: SITE, siteName: "20022Chain", title: TITLE, description: DESC, images: [{ url: `${SITE}/og.svg`, width: 1200, height: 630, alt: "20022Chain" }] },
  twitter: { card: "summary_large_image", site: "@20022chain", creator: "@20022chain", title: TITLE, description: DESC, images: [`${SITE}/og.svg`] },
  alternates: { canonical: SITE },
  category: "technology",
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
