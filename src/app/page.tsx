import { FAQ_ITEMS, Faq } from "@/components/faq";
import { FeaturedClinics } from "@/components/featured-clinics";
import { HeroSection } from "@/components/hero-section";
import { HostDashboard, HowItWorks } from "@/components/host-sections";
import { SiteHeader } from "@/components/site-header";
import { FinalCta, SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/lib/site";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Subleasy",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Subleasy",
      inLanguage: "pt-BR",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
        <FeaturedClinics />
        <HostDashboard />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
