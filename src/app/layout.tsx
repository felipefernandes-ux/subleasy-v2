import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TabBarGate } from "@/components/mobile-tab-bar";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Mesma família do Attio: Inter para a interface e o InterDisplay para títulos. O InterDisplay é o
// eixo óptico (opsz) da Inter, então uma só fonte variável cobre as duas. Hospedada pelo next/font.
const inter = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-inter",
  display: "swap",
});

const title = "Sublocação de Consultórios por Turno ou Hora | Subleasy";
const description =
  "Subloque seu consultório nos horários vagos ou encontre sala para atender por turno. Anúncio grátis, pronto em 3 minutos, com contato direto pelo WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: "%s | Subleasy",
  },
  description,
  applicationName: "Subleasy",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Subleasy",
    title,
    description,
    images: [
      {
        url: "/og-subleasy.jpg",
        width: 1170,
        height: 600,
        alt: "Subleasy: sublocação de consultórios e salas de saúde por turno",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-subleasy.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#3818d9",
  // Deixa a página ocupar a área do entalhe; a tab bar compensa com env(safe-area-inset-bottom).
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <TabBarGate />
      </body>
    </html>
  );
}
