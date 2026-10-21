import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Area Normal vem do mesmo kit do Adobe Fonts usado em subleasy.com.br.
// A licença do Adobe Fonts não permite hospedar os arquivos no projeto.
const ADOBE_FONTS_KIT = "https://use.typekit.net/neq4bmy.css";

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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href={ADOBE_FONTS_KIT} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
