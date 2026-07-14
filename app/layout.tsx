import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Eén canoniek domein voor metadata en favicon-URL’s (Google volgt absolute href’s betrouwbaarder dan relatief, esp. bij www/apex-mix in SERP). */
const SITE_URL = "https://saldeerscan.nl" as const;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "SaldeerScan.nl — Gratis 2027 saldeercheck voor uw woning",
  description: "Ontdek in 3 minuten wat de afschaffing van salderen op 1 januari 2027 voor uw woning betekent. Gratis AI-scan, BAG-data en persoonlijk investeringsrapport.",
  icons: {
    icon: [
      { url: `${SITE_URL}/favicon.ico`, sizes: "any" },
      { url: `${SITE_URL}/icon`, type: "image/png", sizes: "32x32" },
    ],
    shortcut: `${SITE_URL}/favicon.ico`,
    apple: [{ url: `${SITE_URL}/apple-icon`, type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: "SaldeerScan.nl — Gratis 2027 saldeercheck",
    description: "Hoeveel bespaart u vóór 2027? Gratis AI-scan met BAG-data en persoonlijk investeringsrapport.",
    locale: "nl_NL",
    type: "website",
    siteName: "SaldeerScan.nl",
  },
  twitter: {
    card: "summary_large_image",
    title: "SaldeerScan.nl — Gratis 2027 saldeercheck",
    description: "Hoeveel bespaart u vóór 2027? Gratis AI-scan met BAG-data.",
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://saldeerscan.nl/#organization',
      name: 'SaldeerScan.nl',
      url: 'https://saldeerscan.nl',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon`,
        width: 32,
        height: 32,
      },
      description: 'Gratis AI-scan voor de 2027 salderingsafschaffing — ROI berekening en investeringsrapport voor Nederlandse woningeigenaren.',
      areaServed: 'NL',
      contactPoint: { '@type': 'ContactPoint', email: 'info@saldeerscan.nl', contactType: 'customer support', availableLanguage: 'Dutch' },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://saldeerscan.nl/#website',
      url: 'https://saldeerscan.nl',
      name: 'SaldeerScan.nl',
      image: [`${SITE_URL}/icon`, `${SITE_URL}/apple-icon`],
      inLanguage: 'nl-NL',
      publisher: { '@id': 'https://saldeerscan.nl/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://saldeerscan.nl/check?adres={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${bricolage.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden max-w-full">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-action px-4 py-3 font-bold text-evergreen-950 shadow-lg transition-transform focus:translate-y-0"
        >
          Naar hoofdinhoud
        </a>
        <Analytics />
        {children}
      </body>
    </html>
  );
}
