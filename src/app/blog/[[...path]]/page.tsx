import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BlogBar } from "@/components/blog-bar";
import { BlogShadow } from "@/components/blog-shadow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getBlogDocument } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

// O WordPress (Bricks) gera o conteúdo; o cabeçalho, o rodapé e a tab bar são os do site.
// Rewrites em next.config.ts cuidam do que não é página: wp-json, feed e sitemaps.

async function resolve(params: PageProps<"/blog/[[...path]]">["params"], searchParams: PageProps<"/blog/[[...path]]">["searchParams"]) {
  const { path = [] } = await params;
  const { s } = await searchParams;
  const search = (typeof s === "string" ? s : "").trim().slice(0, 100);
  return { segments: path, search };
}

export async function generateMetadata({ params, searchParams }: PageProps<"/blog/[[...path]]">): Promise<Metadata> {
  const { segments, search } = await resolve(params, searchParams);
  const doc = await getBlogDocument(segments, search);
  if (doc.kind !== "ok") return {};

  const { meta } = doc;
  // O Rank Math aponta o canonical para o endereço público; o das buscas fica sem indexar.
  const canonical = doc.canonical ?? `${SITE_URL}/blog/${segments.length ? `${segments.join("/")}/` : ""}`;
  const image = meta["og:image"];
  return {
    title: { absolute: doc.title ? `${doc.title} | Subleasy` : "Blog | Subleasy" },
    description: meta.description,
    alternates: { canonical },
    robots: search ? { index: false, follow: true } : meta.robots,
    openGraph: {
      title: meta["og:title"] ?? doc.title,
      description: meta["og:description"] ?? meta.description,
      url: canonical,
      siteName: "Subleasy",
      locale: "pt_BR",
      type: meta["og:type"] === "article" ? "article" : "website",
      ...(image && { images: [{ url: image }] }),
    },
    twitter: { card: "summary_large_image", title: meta["twitter:title"] ?? doc.title, ...(image && { images: [image] }) },
  };
}

export default function BlogPage({ params, searchParams }: PageProps<"/blog/[[...path]]">) {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<BlogFallback />}>
        <BlogContent params={params} searchParams={searchParams} />
      </Suspense>
      <SiteFooter />
    </>
  );
}

async function BlogContent({ params, searchParams }: PageProps<"/blog/[[...path]]">) {
  const { segments, search } = await resolve(params, searchParams);
  const doc = await getBlogDocument(segments, search);

  if (doc.kind === "notfound") notFound();
  if (doc.kind === "redirect") redirect(doc.to);

  const sheets = doc.sheets.map((href) => `<link rel="stylesheet" href="/blog-css?u=${encodeURIComponent(href)}">`).join("");
  const styles = doc.styles.map((css) => `<style>${css}</style>`).join("");
  const shadow = `${sheets}${styles}<style>:host{display:block}</style><div class="wp-body ${doc.bodyClass}">${doc.html}</div>`;

  return (
    <>
      {!doc.hasSearch && <BlogBar query={search} />}
      <BlogShadow html={shadow} />
      {doc.jsonLd.map((json, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      ))}
    </>
  );
}

function BlogFallback() {
  return <div className="min-h-[60vh]" aria-busy="true" />;
}
